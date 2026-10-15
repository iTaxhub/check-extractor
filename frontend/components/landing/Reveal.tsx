'use client';

/**
 * Scroll reveals for the landing page.
 *
 * The page had none: the only framer-motion on it was the FAQ accordion, so
 * everything below the fold simply existed, fully formed, the moment you got
 * there. `Rise` already handles the hero, but it is a mount-time keyframe —
 * by the time a reader scrolls to the pricing table it finished long ago.
 *
 * WHY CSS AND NOT A JS TWEEN. DESIGN-SYSTEM 4.4, and the reason is written into
 * tailwind.config.js: rAF is frozen in a hidden document, so a JS tween
 * starting from `opacity: 0` can leave content permanently invisible if the tab
 * was backgrounded at mount. An observer that only sets an attribute, with CSS
 * doing the animating, cannot fail that way.
 *
 * IT FAILS VISIBLE, which is the point:
 *   no JS                    -> nothing is ever hidden, the page is static
 *   JS throws before mount   -> same
 *   tab backgrounded         -> activation skipped outright, content shown
 *   no IntersectionObserver  -> everything revealed immediately
 * The hidden state is scoped to [data-reveal-active], set only after JS has
 * proven it is running AND the document is painting, so there is no path where
 * copy sits at opacity 0 waiting for a script that is not coming.
 *
 * ONE OBSERVER, NOT ONE PER ELEMENT. `useScrollReveals()` mounts once and
 * watches every `[data-reveal]` on the page, so marking something up is just
 * the attribute — no wrapper component, no import at each call site. New
 * sections get reveals by adding `data-reveal`, which is the kind of thing that
 * stays done.
 *
 * `prefers-reduced-motion` is handled in globals.css, where the house rule is
 * to retarget to a short fade rather than snap.
 */
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Reveal anything already on screen, so a deep link does not start blank. */
const NEAR_VIEWPORT = 0.92;

export function useScrollReveals() {
  useEffect(() => {
    // The exact case DESIGN-SYSTEM 4.4 warns about: if we cannot be sure the
    // document is painting, hide nothing.
    if (document.visibilityState === 'hidden') return;
    if (!('IntersectionObserver' in window)) return;

    const root = document.documentElement;
    root.setAttribute('data-reveal-active', '');

    const reveal = (el: Element) => {
      el.setAttribute('data-revealed', '');
      io.unobserve(el);   // one way: re-animating on scroll-up reads as cheap
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // Anything now ABOVE the viewport was skipped over rather than
          // scrolled through — an anchor jump (#pricing), a restored scroll
          // position, a flick on a trackpad. It must not be left at opacity 0
          // waiting for an intersection that already happened.
          if (e.isIntersecting || e.boundingClientRect.bottom <= 0) reveal(e.target);
        }
      },
      // Start a little before the edge so the motion lands as the reader
      // arrives, instead of them watching it begin.
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
    );

    const attach = () => {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))) {
        if (el.hasAttribute('data-revealed')) continue;
        if (el.getBoundingClientRect().top < window.innerHeight * NEAR_VIEWPORT) {
          el.setAttribute('data-revealed', '');   // already here on load
          continue;
        }
        io.observe(el);
      }
    };
    attach();

    // Sections can mount later (tab switches, lazy content). Watching the tree
    // is cheaper than re-querying on an interval.
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });

    /**
     * Safety net. IntersectionObserver reports a CHANGE in intersection, so a
     * large enough jump can move an element from "below" to "above" without it
     * ever being observed in between — and a reveal that never fires leaves
     * blank space the reader scrolls back up into. This sweep guarantees that
     * anything at or above the fold is revealed regardless of how it got there.
     * Passive and rAF-coalesced, so it costs one rect read per frame at most
     * while scrolling, and nothing at all once everything has arrived.
     */
    let queued = false;
    const sweep = () => {
      queued = false;
      const pending = document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])');
      if (!pending.length) {
        window.removeEventListener('scroll', onScroll);
        return;
      }
      for (const el of Array.from(pending)) {
        if (el.getBoundingClientRect().top < window.innerHeight) reveal(el);
      }
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sweep);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
}

/** Convenience wrapper for JSX that would otherwise need a bare attribute. */
export function Reveal({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  return (
    <Tag data-reveal="" className={cn(className)}>
      {children}
    </Tag>
  );
}
