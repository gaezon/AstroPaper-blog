import { describe, it, expect, vi } from "vitest";
import { createThrottledScrollListener } from "../../src/utils/scroll";

describe("scroll utilities (unit tests)", () => {
  type GlobalWindow = Window & typeof globalThis;
  const globalWithWindow = globalThis as unknown as {
    window?: GlobalWindow;
  };

  describe("createThrottledScrollListener", () => {
    it("should throttle scroll events via requestAnimationFrame", () => {
      const originalWindow = globalWithWindow.window;
      const rafCallbacks: Array<() => void> = [];
      globalWithWindow.window = {
        requestAnimationFrame: (cb: () => void) => {
          rafCallbacks.push(cb);
          return 1;
        },
      } as unknown as GlobalWindow;

      let callCount = 0;
      const handler = () => {
        callCount += 1;
      };

      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();
      const target = {
        addEventListener,
        removeEventListener,
      } as unknown as EventTarget;

      const cleanup = createThrottledScrollListener(target, handler);

      const registeredHandler = addEventListener.mock.calls[0]?.[1] as
        (() => void) | undefined;

      if (!registeredHandler) {
        throw new Error("Expected scroll handler to be registered.");
      }

      registeredHandler();
      registeredHandler();
      expect(callCount).toBe(0);

      rafCallbacks.forEach(cb => cb());
      expect(callCount).toBe(1);

      cleanup();
      expect(removeEventListener).toHaveBeenCalledWith(
        "scroll",
        registeredHandler,
        { passive: true }
      );

      globalWithWindow.window = originalWindow;
    });

    it("should default to passive scroll listeners", () => {
      const originalWindow = globalWithWindow.window;
      globalWithWindow.window = {
        requestAnimationFrame: (cb: FrameRequestCallback) => {
          cb(0);
          return 1;
        },
      } as unknown as GlobalWindow;

      let capturedOptions: AddEventListenerOptions | undefined;
      const target = {
        addEventListener: (
          ...args: Parameters<EventTarget["addEventListener"]>
        ) => {
          capturedOptions = args[2] as AddEventListenerOptions | undefined;
        },
        removeEventListener: vi.fn(),
      } as unknown as EventTarget;

      createThrottledScrollListener(target, () => {});

      expect(capturedOptions).toEqual({ passive: true });

      globalWithWindow.window = originalWindow;
    });
  });
});
