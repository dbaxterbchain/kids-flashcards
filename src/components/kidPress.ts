import { MouseEvent, PointerEvent } from 'react';

// Small hands rarely make a clean tap. A finger slides a little, presses slowly, lands twice, or
// rests on the card, and browsers count none of those as a tap, since a tap only counts when the
// finger lifts without having moved. So kids' cards and answers act the moment a finger touches
// them instead, once per touch however it ends.

/** A second touch on the same thing this soon after the last is the same wobbly tap. */
export const REPEAT_MS = 450;
/** A touch that scrolled the page at least this far was a grown-up scrolling, not a tap. */
const SCROLLED_PX = 64;
/** How long to wait for the scroll to settle before deciding. */
const SCROLL_SETTLE_MS = 350;
/** A click this long after a touch isn't that touch's (a touch that scrolled never gets one). */
const CLICK_AFTER_TOUCH_MS = 10_000;

type PressState = { lastTouchAt: number; clickPending: boolean };

const presses = new WeakMap<Element, PressState>();

const INTERACTIVE = 'button, a, input, select, textarea, [role="button"]';

/** Whether the press was meant for this element, rather than a button inside it (like the speaker). */
const isOwnPress = (event: { target: EventTarget; currentTarget: Element }) =>
  event.target instanceof Element && event.target.closest(INTERACTIVE) === event.currentTarget;

/** Whether a new touch at `now` is a repeat of the touch at `lastTouchAt`. */
export const isRepeatTouch = (lastTouchAt: number | undefined, now: number) =>
  lastTouchAt !== undefined && now - lastTouchAt < REPEAT_MS;

export type KidPressOptions = {
  /** Takes the press back (like turning a card face down again) when the touch was a scroll. */
  onScrolled?: () => void;
};

/**
 * Props that make `action` happen when a finger (or mouse button) first touches the element.
 * Keyboards and screen readers, which click without touching, still work through the click.
 */
export function kidPress(action: () => void, options: KidPressOptions = {}) {
  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.button !== 0 || !isOwnPress(event)) return;
      const element = event.currentTarget;
      const now = event.timeStamp;
      const previous = presses.get(element);
      // The click that follows this touch is the same press, so it's skipped.
      presses.set(element, { lastTouchAt: now, clickPending: true });
      if (isRepeatTouch(previous?.lastTouchAt, now)) return;
      action();

      const { onScrolled } = options;
      if (!onScrolled) return;
      const startY = window.scrollY;
      const { pointerId } = event;
      const finish = (ended: globalThis.PointerEvent) => {
        if (ended.pointerId !== pointerId) return;
        element.removeEventListener('pointerup', finish);
        element.removeEventListener('pointercancel', finish);
        // The browser takes a touch away from the page (pointercancel) when it starts scrolling.
        if (ended.type !== 'pointercancel') return;
        window.setTimeout(() => {
          if (Math.abs(window.scrollY - startY) >= SCROLLED_PX) onScrolled();
        }, SCROLL_SETTLE_MS);
      };
      element.addEventListener('pointerup', finish);
      element.addEventListener('pointercancel', finish);
    },
    onClick(event: MouseEvent<HTMLElement>) {
      if (!isOwnPress(event)) return;
      const press = presses.get(event.currentTarget);
      if (press?.clickPending && event.timeStamp - press.lastTouchAt < CLICK_AFTER_TOUCH_MS) {
        press.clickPending = false;
        return;
      }
      action();
    },
  };
}
