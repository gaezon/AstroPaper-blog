import { afterAll, beforeAll, describe, it, expect, vi } from "vitest";
import {
  calculateScrollPercent,
  calculateScrollPosition,
  createThrottledScrollListener,
  getScrollInfo,
  smoothScrollTo,
  updateTocActiveState,
  createTocClickHandler,
} from "../../src/utils/scroll";

describe("scroll utilities (unit tests)", () => {
  type GlobalWindow = Window & typeof globalThis;
  const globalWithWindow = globalThis as unknown as {
    window?: GlobalWindow;
  };
  const globalWithDocument = globalThis as unknown as {
    document?: Document;
  };
  const globalWithDomConstructors = globalThis as typeof globalThis & {
    HTMLElement?: typeof HTMLElement;
    HTMLAnchorElement?: typeof HTMLAnchorElement;
  };
  const originalHTMLElementDescriptor = Object.getOwnPropertyDescriptor(
    globalWithDomConstructors,
    "HTMLElement"
  );
  const originalHTMLAnchorElementDescriptor = Object.getOwnPropertyDescriptor(
    globalWithDomConstructors,
    "HTMLAnchorElement"
  );

  beforeAll(() => {
    if (!globalWithDomConstructors.HTMLElement) {
      Object.defineProperty(globalWithDomConstructors, "HTMLElement", {
        value: class MockHTMLElement {},
        configurable: true,
        writable: true,
      });
    }

    const baseHTMLElement = globalWithDomConstructors.HTMLElement!;
    if (!globalWithDomConstructors.HTMLAnchorElement) {
      Object.defineProperty(globalWithDomConstructors, "HTMLAnchorElement", {
        value: class MockHTMLAnchorElement extends baseHTMLElement {},
        configurable: true,
        writable: true,
      });
    }
  });

  afterAll(() => {
    if (originalHTMLElementDescriptor) {
      Object.defineProperty(
        globalWithDomConstructors,
        "HTMLElement",
        originalHTMLElementDescriptor
      );
    } else {
      Reflect.deleteProperty(globalWithDomConstructors, "HTMLElement");
    }

    if (originalHTMLAnchorElementDescriptor) {
      Object.defineProperty(
        globalWithDomConstructors,
        "HTMLAnchorElement",
        originalHTMLAnchorElementDescriptor
      );
    } else {
      Reflect.deleteProperty(globalWithDomConstructors, "HTMLAnchorElement");
    }
  });

  const asHTMLElement = <T extends object>(element: T): T => {
    Object.setPrototypeOf(
      element,
      globalWithDomConstructors.HTMLElement!.prototype
    );
    return element;
  };

  const asHTMLAnchorElement = <T extends object>(element: T): T => {
    Object.setPrototypeOf(
      element,
      globalWithDomConstructors.HTMLAnchorElement!.prototype
    );
    return element;
  };

  const createMockAnchor = (navId: string, href: string, isActive = false) => {
    const classSet = new Set<string>(isActive ? ["active"] : []);
    const attrs: Record<string, string> = { href };

    return asHTMLAnchorElement({
      classList: {
        add: (...classes: string[]) => {
          classes.forEach(className => classSet.add(className));
        },
        remove: (...classes: string[]) => {
          classes.forEach(className => classSet.delete(className));
        },
        contains: (className: string) => classSet.has(className),
      },
      getAttribute: (name: string) =>
        name === "href" ? href : (attrs[name] ?? null),
      setAttribute: (name: string, value: string) => {
        attrs[name] = value;
      },
      removeAttribute: (name: string) => {
        delete attrs[name];
      },
      closest: (selector: string) =>
        selector === `#${navId}`
          ? (asHTMLElement({}) as unknown as HTMLElement)
          : null,
    }) as unknown as HTMLAnchorElement;
  };

  const createDocumentStub = ({
    desktopAnchors,
    mobileAnchors,
    targetElement,
    desktopNavId,
    mobileNavId,
  }: {
    desktopAnchors: HTMLAnchorElement[];
    mobileAnchors: HTMLAnchorElement[];
    targetElement?: HTMLElement;
    desktopNavId: string;
    mobileNavId: string;
  }) =>
    ({
      querySelectorAll: (selector: string) => {
        if (selector.includes("a.active")) {
          return [...desktopAnchors, ...mobileAnchors].filter(anchor =>
            anchor.classList.contains("active")
          ) as unknown as NodeListOf<Element>;
        }
        return [] as unknown as NodeListOf<Element>;
      },
      querySelector: (selector: string) => {
        if (targetElement && selector === `#${targetElement.id}`) {
          return targetElement;
        }

        const hrefToken = ' a[href="';
        if (selector.startsWith("#") && selector.includes(hrefToken)) {
          const stripped = selector.slice(1);
          const [navId, hrefPart] = stripped.split(hrefToken);
          if (navId && hrefPart?.endsWith('"]')) {
            const href = hrefPart.slice(0, -2);
            const anchors =
              navId === desktopNavId
                ? desktopAnchors
                : navId === mobileNavId
                  ? mobileAnchors
                  : [];
            return (
              anchors.find(anchor => anchor.getAttribute("href") === href) ??
              null
            );
          }
        }

        return null;
      },
    }) as Document;

  describe("calculateScrollPercent", () => {
    it("should calculate scroll percentage correctly", () => {
      const mockElement = {
        scrollTop: 500,
        scrollHeight: 2000,
        clientHeight: 800,
      } as HTMLElement;

      expect(calculateScrollPercent(mockElement)).toBe(41);
    });

    it("should return 0 when at the top", () => {
      const mockElement = {
        scrollTop: 0,
        scrollHeight: 2000,
        clientHeight: 800,
      } as HTMLElement;

      expect(calculateScrollPercent(mockElement)).toBe(0);
    });

    it("should return 100 when at the bottom", () => {
      const mockElement = {
        scrollTop: 1200,
        scrollHeight: 2000,
        clientHeight: 800,
      } as HTMLElement;

      expect(calculateScrollPercent(mockElement)).toBe(100);
    });

    it("should handle zero scrollable height", () => {
      const mockElement = {
        scrollTop: 0,
        scrollHeight: 800,
        clientHeight: 800,
      } as HTMLElement;

      expect(calculateScrollPercent(mockElement)).toBe(0);
    });
  });

  describe("calculateScrollPosition", () => {
    it("should calculate scroll position with offset correctly", () => {
      const originalWindow = globalWithWindow.window;
      globalWithWindow.window = { pageYOffset: 100 } as unknown as GlobalWindow;

      const target = {
        getBoundingClientRect: () => ({ top: 200 }),
      } as HTMLElement;

      const expected = 180;
      expect(calculateScrollPosition(target, -120)).toBe(expected);

      globalWithWindow.window = originalWindow;
    });

    it("should use default offset of -120", () => {
      const originalWindow = globalWithWindow.window;
      globalWithWindow.window = { pageYOffset: 100 } as unknown as GlobalWindow;

      const target = {
        getBoundingClientRect: () => ({ top: 200 }),
      } as HTMLElement;

      expect(calculateScrollPosition(target)).toBe(180);

      globalWithWindow.window = originalWindow;
    });

    it("should apply custom offset", () => {
      const originalWindow = globalWithWindow.window;
      globalWithWindow.window = { pageYOffset: 100 } as unknown as GlobalWindow;

      const target = {
        getBoundingClientRect: () => ({ top: 200 }),
      } as HTMLElement;

      expect(calculateScrollPosition(target, -50)).toBe(250);

      globalWithWindow.window = originalWindow;
    });
  });

  describe("getScrollInfo", () => {
    it("should return comprehensive scroll information", () => {
      const mockElement = {
        scrollTop: 500,
        scrollHeight: 2000,
        clientHeight: 800,
      } as HTMLElement;

      expect(getScrollInfo(mockElement)).toEqual({
        scrollTop: 500,
        scrollHeight: 2000,
        clientHeight: 800,
        scrollPercent: 41,
      });
    });
  });

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
        | (() => void)
        | undefined;

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

  describe("smoothScrollTo", () => {
    it("should scroll to an absolute position", () => {
      const originalWindow = globalWithWindow.window;
      const scrollTo = vi.fn();
      globalWithWindow.window = { scrollTo } as unknown as GlobalWindow;

      smoothScrollTo(500);

      expect(scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "smooth" });

      globalWithWindow.window = originalWindow;
    });

    it("should scroll to an element with offset", () => {
      const originalWindow = globalWithWindow.window;
      const scrollTo = vi.fn();
      globalWithWindow.window = {
        pageYOffset: 100,
        scrollTo,
      } as unknown as GlobalWindow;

      const target = {
        getBoundingClientRect: () => ({ top: 200 }),
      } as HTMLElement;

      smoothScrollTo(target, -120);

      expect(scrollTo).toHaveBeenCalledWith({ top: 180, behavior: "smooth" });

      globalWithWindow.window = originalWindow;
    });
  });

  describe("updateTocActiveState", () => {
    it("should synchronize active link state across navs", () => {
      const originalDocument = globalWithDocument.document;
      const desktopNavId = "toc-nav";
      const mobileNavId = "toc-nav-mobile";

      const desktopOld = createMockAnchor(desktopNavId, "#old", true);
      const mobileOld = createMockAnchor(mobileNavId, "#old", true);
      const desktopNew = createMockAnchor(desktopNavId, "#new");
      const mobileNew = createMockAnchor(mobileNavId, "#new");

      globalWithDocument.document = createDocumentStub({
        desktopAnchors: [desktopOld, desktopNew],
        mobileAnchors: [mobileOld, mobileNew],
        desktopNavId,
        mobileNavId,
      });

      updateTocActiveState(desktopNew, { desktopNavId, mobileNavId });

      expect(desktopOld.classList.contains("active")).toBe(false);
      expect(mobileOld.classList.contains("active")).toBe(false);
      expect(desktopNew.classList.contains("active")).toBe(true);
      expect(mobileNew.classList.contains("active")).toBe(true);
      expect(desktopNew.getAttribute("aria-current")).toBe("true");
      expect(mobileNew.getAttribute("aria-current")).toBe("true");

      globalWithDocument.document = originalDocument;
    });
  });

  describe("createTocClickHandler", () => {
    it("should update state, scroll, and reset after timeout", () => {
      const originalWindow = globalWithWindow.window;
      const originalDocument = globalWithDocument.document;

      const scrollTo = vi.fn();
      const clearTimeout = vi.fn();
      const setTimeout = vi.fn((cb: () => void) => {
        void cb;
        return 42;
      });

      globalWithWindow.window = {
        pageYOffset: 100,
        scrollTo,
        setTimeout,
        clearTimeout,
      } as unknown as GlobalWindow;

      const desktopNavId = "toc-nav";
      const mobileNavId = "toc-nav-mobile";

      const desktopOld = createMockAnchor(desktopNavId, "#old", true);
      const mobileOld = createMockAnchor(mobileNavId, "#old", true);
      const desktopNew = createMockAnchor(desktopNavId, "#section-1");
      const mobileNew = createMockAnchor(mobileNavId, "#section-1");

      const target = asHTMLElement({
        id: "section-1",
        getBoundingClientRect: () => ({ top: 200 }),
      }) as HTMLElement;

      globalWithDocument.document = createDocumentStub({
        desktopAnchors: [desktopOld, desktopNew],
        mobileAnchors: [mobileOld, mobileNew],
        targetElement: target,
        desktopNavId,
        mobileNavId,
      });

      const scrollingFlag = { value: false };
      const timeoutRef = { value: null as number | null };
      const onClick = vi.fn();

      const handler = createTocClickHandler({
        desktopNavId,
        mobileNavId,
        offset: -120,
        scrollingFlag,
        timeoutRef,
        onClick,
      });

      const event = { preventDefault: vi.fn() } as unknown as MouseEvent;
      handler(event, desktopNew);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(scrollingFlag.value).toBe(true);
      expect(timeoutRef.value).toBe(42);
      expect(scrollTo).toHaveBeenCalledWith({ top: 180, behavior: "smooth" });
      expect(desktopNew.classList.contains("active")).toBe(true);
      expect(mobileNew.classList.contains("active")).toBe(true);
      expect(onClick).toHaveBeenCalled();

      const scheduledCallback = setTimeout.mock.calls[0]?.[0] as
        | (() => void)
        | undefined;
      if (!scheduledCallback) {
        throw new Error("Expected timeout callback to be scheduled.");
      }

      scheduledCallback();
      expect(scrollingFlag.value).toBe(false);
      expect(timeoutRef.value).toBeNull();

      globalWithWindow.window = originalWindow;
      globalWithDocument.document = originalDocument;
    });
  });
});
