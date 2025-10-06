---
author: gaazeon
pubDatetime: 2025-06-20T20:00:00.000+08:00
modDatetime: 2025-06-20T20:00:00.000+08:00
title: "Is IBKR’s DRIP really zero‑commission? The truth behind the rounding"
featured: false
draft: false
tags:
  - US Stocks
  - IBKR
  - Investing
  - Dividends
  - DRIP
description: "Is Interactive Brokers’ dividend reinvestment plan (DRIP) truly ‘zero‑commission’? A real NVDA DRIP example reveals how fees are computed at full precision then rounded for display, why you often see $0.00, and how DRIP compares to manual fractional trades."
locale: en
originalTitle: IBKR 股息再投资 (DRIP) 是零佣金吗？美股盈透证券佣金小数点后的收费规则
---

## Table of contents

## TL;DR

IBKR’s DRIP isn’t literally fee‑free — the commission is so small that it’s rounded to $0.00 in reports.

- Real rule: DRIP commission = `min(1% × trade value, $0.35 / $1)` — typically lower than manual trade minimums
- “Invisible” fee handling: fees are computed at full precision (e.g., $0.000031) then rounded to cents for display; day‑end aggregation applies rounding once more
- Example: 0.0003 share of $NVDA, trade value $0.031 → actual fee $0.000031 → shown as $0.00
- Should you enable DRIP? For long‑term investors, yes — the advantage is automated compounding at extremely low cost, not literal zero fees
- Manual vs DRIP: pure fractional orders have a $0.01 minimum; mixed/whole‑share orders $0.35 (tiered) / $1 (fixed); DRIP is usually cheaper

## A “mysterious” $NVDA dividend reinvestment

On 2025‑04‑03 I noticed my $NVDA position increased by 0.0003 share — clearly from IBKR’s DRIP[^1]. The execution price was about $104.28 and the total value only $0.031. Yet the web HTML report showed the commission as **$0.00**.

![IBKR HTML Report DRIP Transaction](https://img.gaazeon.com/2025/06/IBKR-HTML-Report-DRIP-Transaction.avif)

It looked like IBKR waived the fee — but that felt unlikely. Exporting the detailed CSV (which shows 4 decimal places) revealed the actual numbers underneath:

```csv
Trade Data Order Stock USD NVDA 2025-04-03, 09:31:11 0.0003 104.28 101.8 -0.031284 -0.000031381 0.031315381 0 -0.0007 O;R
```

So the fee wasn’t zero — it was **$0.000031381**. Tiny, but enough to expose how DRIP commissions really work.

## DRIP vs manual trades: different minimums

Based on IBKR docs[^2], these are the key rules:

| Scenario                       | Commission formula                  | Notes                                                                | Display rounding            |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------------------- | --------------------------- |
| Manual whole/mixed share order | `max(1% × trade value, $0.35 / $1)` | If the order contains ≥1 whole share; tiered min $0.35, fixed min $1 | Per‑order rounded to $0.01  |
| Manual pure fractional order   | `max(1% × trade value, $0.01)`      | All fractional shares → min $0.01                                    | Same as above               |
| DRIP (auto reinvest)           | `min(1% × trade value, $0.35 / $1)` | Preferential to ensure it won’t exceed whole‑share minimums          | Often $0.00; day‑end adjust |

With the $NVDA example:

- Trade value: ~$0.0313
- 1% fee: $0.0313 × 1% = $0.000313
- DRIP rule: `min($0.000313, $0.35)` (tiered) or `min($0.000313, $1)` (fixed) → $0.000313

The recorded precise fee was `-0.000031381`. When shown in reports limited to two decimals, it becomes $0.00.

## How does IBKR handle sub‑cent fees?

USD’s smallest display unit is a cent ($0.01). How can a broker account for fees much smaller than one cent? IBKR’s back‑office explains this[^3]:

Each fee is first computed at full precision, then immediately rounded to the currency’s minimal display unit for presentation:

- If original < $0.005, display $0.00
- If ≥ $0.005, display $0.01

Additionally, at the end of the day, IBKR sums the unrounded fees again and performs another rounding pass. This may cause the “total commission” in your cash ledger to differ by up to ±$0.01 from the sum of per‑order displayed values (IBKR calls this _fractional fee rounding_).

In other words, “$0.00” does not mean IBKR waived the fee — it’s simply a display rounding effect. The true fee is accounted for precisely in the ledger.

## So… is DRIP worth enabling?

For most long‑term investors, **yes**.

- The real win is automation and very low effective costs — not literal zero commissions.
- If you prefer manual timing, you can turn DRIP off and place your own orders. Keep in mind:
  - Pure fractional orders: `max(1% × value, $0.01)`[^4]
  - Orders containing whole shares: min becomes $0.35 (tiered) or $1 (fixed)
  - DRIP: `min(1% × value, $0.35 / $1)` and frequently displays as $0.00 after rounding[^5]

- Taxes still apply: dividends are subject to withholding. If you’re a non‑US resident, default is 30% unless reduced by treaty via W‑8BEN (often 10%–15%). DRIP doesn’t reduce taxes — it simply automates reinvestment.

When you see that tempting “$0.00 commission” next time, take it for what it is: a rounding artifact on a fee that’s small enough to be effectively negligible.

### FAQ: If I only have one tiny DRIP that day, will $0.01 be “charged later”?

No. _Fractional fee rounding_ is settled daily; nothing is carried over. If the day’s aggregate is < $0.005, it remains $0.00.

### footnote

<!-- markdownlint-disable MD053 -->

[^1]: Overview of Our Dividend Reinvestment Program (DRIP): https://ibkrguides.com/kb/en-us/overview-of-drip.htm

[^2]: Commissions — Stocks (fixed / tiered): https://www.interactivebrokers.com/en/index.php?f=49637

[^3]: Handling Procedures for Fractional Fees: https://www.ibkrguides.com/kb/en-us/article-1241.htm

[^4]: Fractional Share Trading — fee notes: https://www.ibkrguides.com/kb/fractional-share-trading.htm

[^5]: Dividend Election — DRIP settings and notes: https://ibkrguides.com/clientportal/dividendreinvestment.htm

<!-- markdownlint-enable MD053 -->
