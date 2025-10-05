---
author: gaazeon
pubDatetime: 2025-06-22T20:00:00.000+08:00
title: "OBS live streaming pitfalls: why a 20‑second ‘safe broadcast’ delay blows up your audio — and a dual‑OBS solution"
featured: false
draft: false
tags:
  - OBS
  - Live Streaming
  - Safe Broadcast
  - Delay
description: "Tried to build a 20‑second ‘safe broadcast’ delay in OBS but ran into crackling audio? This post explains the technical trap behind OBS’s Video Delay (Async) filter and offers a dual‑OBS solution (RTMP/SRT) that requires no dedicated delay hardware or extra plugins."
locale: en
originalTitle: OBS 直播踩坑：20秒 安播延迟为何炸音频？双机 OBS 「安全播出」 解决方案
---

<!-- TODO: Translate body content below into English -->
## Table of contents

## Background: why ‘safe broadcast’ is required

On Chinese platforms like Douyin, Kuaishou and Taobao Live, streams are reviewed by both AI and human moderators. A single slip can get a room suspended instantly. To mitigate risk, most teams keep a delay of at least **20 seconds** so operators have time to `DUMP/MUTE`. Top esports broadcasts sometimes go as high as 2 minutes. Viewers may complain about latency, but for businesses, giving the last‑mile moderator enough time to react is far more important than shaving a few seconds off the delay.

## A costly failure: the 20‑second test

I didn’t have a dedicated delay unit, but still wanted a 20‑second delay in OBS. How hard could it be?

### First attempt: assuming a filter could do it all

The plan was to use OBS’s built‑in `Video Delay (Async)` filter:

```text
Filter → Video Delay (Async)
Delay  → 20000 ms
```

![obs-video-delay-filter](https://img.gaazeon.com/2025/06/obs-video-delay-filter.avif)

Important: the Video Delay (Async) filter delays video frames only. Audio is still sent with real‑time timestamps.

> So how should we delay the audio?

### How I tried to delay the audio

Here’s what I tried:

1. In **Mixer → Advanced Audio Properties**, set the **Sync Offset** of all outbound audio sources to `20000 ms` to match the video delay.
2. In Audio Monitoring, enable **Monitor and Output** so local monitoring stays real‑time while the outbound stream is 20 seconds late (matching video).

![obs-audio-sync-offset](https://img.gaazeon.com/2025/06/OBS-audio-sync-offset.avif)

**However, once pushed upstream, the live room soon turned into a disaster: intermittent crackling and unusable audio on the platform side.**

### Root cause: where the distortion comes from

This puzzled me, so I combed through GitHub issues and the OBS forum. Here’s what I found:

**1) Video Delay (Async) is not designed for ‘safe broadcast’**[^1] — its real purpose is correcting lip‑sync differences on the order of 100–200 ms. It was never designed for tens‑of‑seconds broadcast delay — even if you can type a big number in the UI.

**2) OBS audio buffering has a hard cap at ~960 ms**[^2] — in OBS’s code, the maximum audio buffering (`max buffering`) is effectively limited to about `960 ms`. No matter what you type in the filter, audio won’t delay beyond ~1 second.

**3) Mixers/filters can’t ‘fill’ a 20‑second gap** — After noticing video was behind, I tried forcing `20000 ms` in **Advanced Audio Properties → Sync Offset** and delaying monitoring on the mic channel. Still failed, for two reasons:

- **The 960 ms ceiling still applies** — Sync Offset relies on the same buffer and gets clipped.
- **Mixers don’t rewrite timestamps** — even if monitoring sounds “in sync”, RTMP packets keep original timestamps. The server still sees “audio early, video late” and starts resampling/dropping.

In short, _what you hear locally is not what the audience hears_. Mixer sliders and ‘sync offset’ filters are for sub‑second lip‑sync tweaks — not 20‑second broadcast delays.

With `20000 ms` set:

- **Video** really was 20 seconds late.
- **Audio** ignored the offset due to the 960 ms cap and remained close to real time.

That ~20‑second timestamp gap forced the RTMP server (YouTube/Bilibili) to “fix” sync by aggressive resampling/dropping on the audio track — the source of the crackling.

I validated this repeatedly on YouTube: **once Video Delay exceeds ~10 seconds, crackling/distortion almost always appears for viewers.**

---

## Lesson learned: fix the layer, not the knob

My mistake was treating **render‑layer knobs** as if they were **transport‑layer buffers**. Proper broadcast delay must happen at the **stream/packaging layer** (RTMP/SRT), where audio and video packets are delayed together.

### Engineering takeaways

1. **Layering matters** — a small UI slider can hide a very different abstraction underneath. Delay belongs to the transport layer; forcing it in the render layer yields a fragile illusion.
2. **End‑to‑end view** — local monitoring “feels fine” is not the same as CDN ingest being logically in sync. Always inspect the final output stream.

## A pragmatic dual‑OBS ‘safe broadcast’ architecture

If you don’t have a hardware delay box, architecture can still save you:

- **Technique**: keep the delay upstream and monitor locally; your broadcast box consumes an already‑delayed stream.
- **Operations**: bind `DUMP/MUTE` to a Stream Deck (or similar) to give operators a 5–10‑second reaction window.

### Concrete setup

The core idea: **the upstream delay box** handles buffering and emergency actions; **the broadcast box** just listens and forwards.

1) **Delay / upstream box**
   - Use **OBS’s Broadcast Delay**, vMix, or a dedicated delay unit on this box.
   - Buffer ~20 seconds, and map hotkeys for `DUMP` (drop frames) / `MUTE` (silence) in emergencies.

2) **Main broadcast box (your primary OBS)**
   - **Listen** to the delayed stream via **RTMP or SRT**.
   - **Do not** use any delay filters here.
   - Push to platforms as usual.

This way audio and video arrive already in sync, and the broadcast box does not need to buffer 20 seconds of frames — eliminating the root cause of crackling.

### Minimal OBS‑only setup: no plugins, make OBS the server

#### Option 1: RTMP — Media Source + `listen=1`[^3]

This is the most compatible approach.

##### RTMP receiver (broadcast OBS)

1. Add a new **Media Source** to the scene.
2. **Uncheck** “Local File”.
3. Set **Input** to:

   ```text
   rtmp://0.0.0.0:1935/live/app
   ```

4. In **FFmpeg Options**, set the key parameter:

   ```text
   listen=1
   ```

   After this, your broadcast box is listening on port 1935 for the upstream delay box.

##### RTMP sender (delay OBS)

1. Open `Settings` → `Stream`.
2. Service: **Custom**.
3. Server: `rtmp://<broadcast-box IP>:1935/live/app`.
4. Stream key: leave empty or arbitrary.

Then enable **Stream Delay** in `Settings → Advanced` and set **20 s**[^4].

![OBS-Intranet-RTMP-latency](https://img.gaazeon.com/2025/06/OBS-Intranet-RTMP-latency.avif)

Click **Start Streaming**. The delayed picture will appear in the broadcast box media source.


---

#### Option 2: SRT — built into OBS 25+, lower latency

Since OBS 25.0, SRT is built‑in. Setup is simple, and its UDP nature usually performs better than TCP‑based RTMP on shaky networks.

##### SRT receiver (broadcast OBS)[^5]

```text
Media Source → uncheck Local File
Input = srt://0.0.0.0:6000?mode=listener
```

##### SRT sender (delay OBS)

```text
Settings → Stream → Custom
Server = srt://<broadcast-box IP>:6000?mode=caller
```

Enable **Stream Delay** in Settings → Advanced and set **20 s**.

Click **Start Streaming**; the picture arrives with lower end‑to‑end latency than RTMP.

Diagram (dual‑OBS over RTMP)

```mermaid
graph TD
    subgraph A ["Real-time Machine"]
        A1["OBS Studio<br/>Capture live feed"]
        A2["Settings → Advanced → Stream Delay<br/>(20 seconds)"]
        A3["Stream config<br/>rtmp://delay-box-ip:1935/live/app"]
        A1 --> A2
        A2 --> A3
    end

    subgraph B ["Delay Machine"]
        B1["OBS Studio<br/>Control desk"]
        B2["Media Source<br/>listen to RTMP (listen=1)"]
        B3["Mute/Dump<br/>emergency controls"]
        B4["Push output<br/>to platforms"]
        B5["Firewall<br/>open 1935"]

        B1 --> B2
        B1 --> B3
        B1 --> B4
        B2 -.-> B5
    end

    C["Final platforms<br/>YouTube/Bilibili"]

    A3 --> B2
    B4 --> C
```


---

## FAQ

**Q: Can the OBS‑NDI plugin achieve the same effect?**

A: No. NDI is built for real‑time, low‑latency transport. Using it for long LAN delays is the wrong tool for the job.


---

### Extra notes

#### High‑risk words (examples)

- Names/titles of state leaders
- Sensitive political events/slogans
- Minority languages (e.g., Tibetan) — current ASR often misclassifies and flags them

#### High‑risk visuals

- Foreign nationals on camera
- Minors on camera
- National/party flags or emblems

Touching any of the above can get a live room suspended instantly. Hence **safe broadcast (delay + active monitoring for DUMP/MUTE)** is effectively mandatory for commercial streaming in China.

## Footnotes

[^1]: [Render Delay Filter — official docs](https://obsproject.com/kb/render-delay-filter)

[^2]: [MAX_BUFFERING_TICKS — audio sync/offset limit discussion (~960 ms)](https://obsproject.com/forum/threads/max_buffering_ticks-artificial-limit-to-audio-sync_offset.54867/)

[^3]: [OBS forum: media source + RTMP `listen=1` to make OBS act as a server](https://obsproject.com/forum/threads/help-with-media-source-and-rtmp.56959/)

[^4]: [OBS forum: adding a timed delay (enable Broadcast/Stream Delay)](https://obsproject.com/forum/threads/adding-a-timed-delay-to-my-stream.2483/)

[^5]: [OBS KB: SRT Protocol Streaming Guide (mode=listener / mode=caller)](https://obsproject.com/kb/srt-protocol-streaming-guide)
