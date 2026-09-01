/* ============================================================================
   MOTION  ·  two ways in

     <Entrance>  arrives when it mounts, whether or not it is on screen.
                 For something meant to be watched: a card at the top of a
                 page, the contents of a dialog, a row that was just added.

     <Reveal>    arrives when you scroll to it, and does nothing at all if it
                 was already on screen when the page loaded. For content down
                 the page, where animating what the reader is already looking
                 at would be a distraction rather than an entrance.

                 <Reveal eager> is that last clause turned off for one call
                 site: still scroll-triggered below the fold, but plays on
                 arrival when it is already on screen.

   Both come in a group form — <EntranceGroup>, <RevealGroup> — which answers
   "are we there yet" once and shares it, so several parts of one thing arrive
   as a sequence instead of drifting apart.

   Where each answer comes from, in both:

     whether this brand animates at all  ->  theme.animates, a yes or no
     how far, how fast, how far apart    ->  design tokens, retuned per brand
                                             in that brand's brand stylesheet
     which way, and which step of each   ->  the call site
   ========================================================================= */

import { useTheme } from '@mui/material/styles';
import {
  Children, createContext, useContext, useLayoutEffect, useRef, useState,
  type CSSProperties, type ReactNode, type RefObject,
} from 'react';

import styles from './Reveal.module.css';

type Direction = 'up' | 'down' | 'left' | 'right' | 'fade';
type Distance = 'sm' | 'md' | 'lg';
type Speed = 'fast' | 'normal' | 'slow';

/** `idle` is visible with no transition — the state for something that is not
 *  going to animate at all, and the one everything falls back to. */
type State = 'idle' | 'hidden' | 'shown';

/* Every value below is a token. Nothing here is a number, for the same reason
   nothing in Stack is a number: a brand retunes the scale, not the call site. */
const DISTANCE: Record<Distance, string> = {
  sm: 'var(--motion-distance-sm)',
  md: 'var(--motion-distance-md)',
  lg: 'var(--motion-distance-lg)',
};

const SPEED: Record<Speed, string> = {
  fast:   'var(--duration-fast)',
  normal: 'var(--duration-normal)',
  slow:   'var(--duration-slow)',
};

/** Where an element starts, given the way it is meant to travel. */
const offsetFor = (direction: Direction, travel: string) => ({
  up:    { x: '0px', y: travel },
  down:  { x: '0px', y: `calc(-1 * ${travel})` },
  left:  { x: travel, y: '0px' },
  right: { x: `calc(-1 * ${travel})`, y: '0px' },
  fade:  { x: '0px', y: '0px' },
}[direction]);

const prefersLessMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const useAnimates = () => {
  const { animates } = useTheme();
  return animates === true && !prefersLessMotion();
};

/* --- the two triggers ---------------------------------------------------- */

/** Mount. Starts hidden, so the browser paints it hidden and then has
 *  something to animate from. */
const useEntrance = (enabled: boolean): State => {
  const [state, setState] = useState<State>(enabled ? 'hidden' : 'idle');

  useLayoutEffect(() => {
    if (!enabled) return;
    /* Two frames: one for the hidden state to be painted, one to change it.
       Flipping in the same frame gives the browser nothing to animate between
       and the element simply appears. */
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setState('shown')));
    /* requestAnimationFrame does not run in a background tab, so a page opened
       in one would sit hidden until it was looked at. Show it regardless. */
    const timer = window.setTimeout(() => setState('shown'), 400);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [enabled]);

  return state;
};

/**
 * Being scrolled to. Something already on screen is left alone entirely —
 * unless the call site passes `eager`.
 *
 * The default is the important half. Content at the top of the page is where
 * the reader is already looking, and to animate something in you first have to
 * take it away: the honest description of "reveal the hero" is "blank the hero,
 * then put it back". That reads as a page that is still loading, so what is
 * already on screen is left `idle` and never touched.
 *
 * `eager` exists because that is a good default, not a law. A hero or a summary
 * card is sometimes *meant* to be watched arriving — it is the first thing on
 * the page and nothing else is competing for the eye. Saying so is one word at
 * the one call site that wants it, which is cheaper than the alternative every
 * brand reaches for otherwise: a second component that animates.
 */
const useReveal = (
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  eager = false,
): State => {
  /* An eager one starts hidden, in the render, exactly as an Entrance does —
     hiding it from the layout effect below is too late, and measurably so. The
     effect has to read the box to know whether it is on screen, and asking for
     the box resolves the element's style, which hands the browser a "before"
     to transition from. The element then animates *out* of the state it was
     already in for the two frames it takes to flip it, and comes back: sampled
     per frame, a row dipped to opacity 0.88 and returned, which is a flicker
     and not an entrance. Set here, the hidden state is the element's first
     computed style, and a first computed style never transitions.

     `enabled &&` matters as much: without it a brand that does not animate
     would start hidden and the effect would return without ever showing it. */
  const [state, setState] = useState<State>(enabled && eager ? 'hidden' : 'idle');

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !enabled || typeof IntersectionObserver === 'undefined') {
      /* Fails visible. An eager one started hidden, so every way out of this
         effect has to put it back — this is the branch where there is no
         observer to do it. */
      if (enabled && eager) setState('shown');
      return;
    }

    /* A group is `display: contents` so it cannot disturb the layout it sits
       in — which also means it has no box. It cannot be measured, and an
       observer placed on it would never report. So watch what it wraps. */
    const target = node.getBoundingClientRect().height === 0 && node.firstElementChild
      ? node.firstElementChild : node;

    /* Guard on the viewport being *usable*, not merely present. A pane that is
       hidden, a thumbnail, a view that has not been painted: all report a
       height of 0. Every box then measures as off screen, everything hides, and
       the observer's immediate first callback cancels the fallback — so nothing
       ever intersects and the page stays blank. Measured: three rows at opacity
       0 with no recovery. So an unusable viewport means show it, which is the
       same rule as everything else here: it fails visible. Returning early is
       not enough — an eager reveal starts hidden, so bailing leaves it that
       way. This has to say `shown` out loud.

       Arrival guards the same way, for the same reason. */
    const viewport = window.visualViewport?.height || window.innerHeight;
    if (!(viewport > 0)) { setState('shown'); return; }

    const box = target.getBoundingClientRect();
    const onScreen = box.top < viewport && box.bottom > 0;
    if (onScreen && !eager) return;   // already where they are looking

    /* On screen and asked for anyway: there is nothing left to scroll to, so
       it plays now. Two frames, exactly as an Entrance does it — one for the
       hidden state to be painted, one to change it. Flipping both in a single
       frame gives the browser nothing to animate between and the element
       simply appears. The timer is the same backstop for the same reason:
       requestAnimationFrame does not run in a background tab, and this must
       still fail visible. */
    if (onScreen) {
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setState('shown')));
      const backstop = window.setTimeout(() => setState('shown'), 400);
      return () => { cancelAnimationFrame(frame); clearTimeout(backstop); };
    }

    setState('hidden');   // before paint, so it is never seen and then taken away

    let timer: number | undefined;
    const show = () => { clearTimeout(timer); setState('shown'); observer.disconnect(); };

    const observer = new IntersectionObserver(
      (entries) => {
        /* Any callback proves the observer is alive, so the fallback below is
           no longer needed. `observe()` always delivers one straight away, even
           for something far off screen. Cancelling only on an *intersecting*
           entry would reveal the whole page on a timer. */
        clearTimeout(timer);
        if (entries.some((e) => e.isIntersecting)) show();
      },
      { threshold: 0.15 },
    );
    observer.observe(target);

    /* Failing visible: only reached when the observer says nothing whatsoever
       — no support, a background tab, an embedded view that never paints. */
    timer = window.setTimeout(show, 1200);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [ref, enabled, eager]);

  return state;
};

/* --- the shared machinery ------------------------------------------------ */

const GroupState = createContext<State | null>(null);

/* True while an Arrival is carrying the page. Everything that would otherwise
   animate on mount renders finished instead, so the arrival moves one settled
   composition rather than racing a dozen entrances that each start from
   somewhere else. An ordinary reveal needs no such rule: what is on screen is
   already `idle`, and what is below the fold is not being looked at. An
   *eager* one is the exception, and the only one — it is by definition
   something above the fold that wants to move, which is the one thing an
   arrival cannot share the screen with. */
const Arriving = createContext(false);

/**
 * Whether an Arrival was carrying the page at the moment this mounted.
 *
 * Latched rather than watched, and that is the whole point: standing down
 * means this reveal does not play, not that it plays later. Read live, the
 * flag would flip the instant the arrival settled and fire an entrance a
 * second and a half after the page had already arrived — the exact collision
 * the stand-down exists to avoid, just moved. It matches how `Entrance`
 * behaves for the same reason: it goes straight from `idle` to `shown`, which
 * changes nothing on screen.
 */
const useArrivingOnMount = () => {
  const arriving = useContext(Arriving);
  const [onMount] = useState(arriving);
  return onMount;
};

type MoverProps = {
  children: ReactNode;
  /** Which way it *travels* as it arrives, not the edge it comes from — so
   *  `up` rises into place from below, and `left` slides in from the right. */
  direction?: Direction;
  /** How far, as a step on the scale — never a number. */
  distance?: Distance;
  /** How long it takes, as a step on the scale. */
  speed?: Speed;
  /** Inside a group: its turn in the sequence, times the brand's stagger. */
  order?: number;
  /** Bring the children in one after another rather than together. */
  stagger?: boolean;
};

const styleFor = (direction: Direction, distance: Distance, speed: Speed) => {
  const { x, y } = offsetFor(direction, DISTANCE[distance]);
  return { '--reveal-x': x, '--reveal-y': y, '--reveal-duration': SPEED[speed] } as CSSProperties;
};

const Box = ({ children, style, order, state }: {
  children: ReactNode; style: CSSProperties; order?: number; state: State;
}) => (
  <div
    className={styles.reveal}
    data-state={state}
    style={order === undefined ? style : {
      ...style,
      transitionDelay: state === 'shown' ? `calc(${order} * var(--motion-stagger))` : '0ms',
    }}
  >
    {children}
  </div>
);

/** The body of both movers, once the trigger has been decided for them. */
const Moved = ({ state, children, direction = 'fade', distance = 'md', speed = 'normal', order, stagger }:
  MoverProps & { state: State }) => {
  const style = styleFor(direction, distance, speed);
  if (!stagger) return <Box style={style} order={order} state={state}>{children}</Box>;
  return (
    <>
      {Children.map(children, (child, i) => (
        <Box style={style} order={i} state={state}>{child}</Box>
      ))}
    </>
  );
};

/** A box that watches for itself. Used by a standalone Reveal, so that a list
 *  running past the fold reveals the part you scrolled to rather than waiting
 *  on whichever item happens to be first. */
const SelfRevealBox = ({ children, style, order, enabled, eager }: {
  children: ReactNode; style: CSSProperties; order?: number; enabled: boolean; eager?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const state = useReveal(ref, enabled, eager);
  return (
    <div
      ref={ref}
      className={styles.reveal}
      data-state={state}
      style={order === undefined ? style : {
        ...style,
        transitionDelay: state === 'shown' ? `calc(${order} * var(--motion-stagger))` : '0ms',
      }}
    >
      {children}
    </div>
  );
};

/* --- what you actually use ----------------------------------------------- */

/**
 * Play even when this is already on screen, instead of leaving it alone.
 * Off everywhere it is not written, so the default is unchanged.
 *
 * Deliberately *not* on `MoverProps`, which would hand it to `Entrance` and
 * `EntranceGroup` as well. An entrance already arrives on mount whether or not
 * it is on screen — that is the entire difference between the two components —
 * so the prop would be a control that does nothing. The one case where an
 * entrance does not play is an `Arrival` carrying the page, and overriding
 * *that* is not what this is for: it is what the stand-down below refuses,
 * eager reveals included.
 */
type EagerProp = { eager?: boolean };

/** Arrives when it mounts, on screen or not. */
export const Entrance = (props: MoverProps) => {
  const enabled = useAnimates();
  const arriving = useContext(Arriving);
  const shared = useContext(GroupState);
  /* `idle` is "visible, with no transition" — exactly what an entrance should
     be while something larger is carrying it. */
  const own = useEntrance(enabled && shared === null && !arriving);

  if (!enabled) return <>{props.children}</>;
  return <div className={styles.group}><Moved {...props} state={shared ?? own} /></div>;
};

/** Arrives when it is scrolled to; does nothing if already on screen, unless
 *  the call site says `eager`. */
export const Reveal = ({ children, direction = 'fade', distance = 'md', speed = 'normal', order, stagger, eager }: MoverProps & EagerProp) => {
  const enabled = useAnimates();
  const shared = useContext(GroupState);
  /* Eager is the only reason a reveal has to care about an arrival, so it is
     the only thing the arrival takes away from it. Read on its own line: a
     hook cannot sit on the right of a `&&`. */
  const arriving = useArrivingOnMount();
  const playOnScreen = eager === true && !arriving;

  if (!enabled) return <>{children}</>;

  const style = styleFor(direction, distance, speed);

  /* Inside a group the trigger is the group's, so these are plain boxes — and
     `eager` is part of the trigger, so it belongs on the group. One box of a
     sequence deciding for itself that it is on screen is how a sequence stops
     being one. */
  if (shared !== null) {
    return (
      <div className={styles.group}>
        <Moved state={shared} direction={direction} distance={distance} speed={speed} order={order} stagger={stagger}>
          {children}
        </Moved>
      </div>
    );
  }

  /* Standalone: every box watches for itself. */
  return (
    <div className={styles.group}>
      {stagger
        ? Children.map(children, (child, i) => (
            <SelfRevealBox style={style} order={i} enabled={enabled} eager={playOnScreen}>{child}</SelfRevealBox>
          ))
        : <SelfRevealBox style={style} order={order} enabled={enabled} eager={playOnScreen}>{children}</SelfRevealBox>}
    </div>
  );
};

/** Several parts of one thing, arriving as one sequence when it mounts. */
export const EntranceGroup = ({ children }: { children: ReactNode }) => {
  const enabled = useAnimates();
  const arriving = useContext(Arriving);
  const state = useEntrance(enabled && !arriving);
  if (!enabled) return <>{children}</>;
  return (
    <div className={styles.group}>
      <GroupState.Provider value={state}>{children}</GroupState.Provider>
    </div>
  );
};

/**
 * THE ARRIVAL
 * The whole page settling into place, once, after something changed who you
 * are — signing in. It starts slightly enlarged and out of focus and eases
 * back to rest as it fades in, the way a camera settles rather than the way a
 * list of cards appears.
 *
 * One prop, because there is only one way to arrive — and one appearance, for
 * every brand. How far it pulls back, how soft it starts and how long it takes
 * are fixed in this component's own stylesheet, deliberately outside the scale
 * a brand retunes. A brand decides *whether* the app arrives, in
 * `theme.animates`. It does not get to decide that its arrival is brisk.
 *
 * `active` is read once by whoever mounts this — it is a one-shot, not a
 * state to keep in step with anything.
 */
export const Arrival = ({ active, children }: { active: boolean; children: ReactNode }) => {
  const enabled = useAnimates() && active;
  const [state, setState] = useState<'hidden' | 'shown' | 'settled'>(enabled ? 'hidden' : 'settled');
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!enabled) return;

    /* Scale about the middle of what is actually on screen. The stylesheet's
       `50dvh` is right whenever the page is at the top, which an arrival
       normally is — this makes it right regardless, and costs one line.

       `visualViewport` rather than `innerHeight` because they disagree exactly
       when it matters: a phone with its browser chrome showing, or a pinched
       page. Set here, before paint, so the enlarged state is never painted
       around the wrong point. */
    const node = ref.current;
    if (node) {
      /* Guarded on the value being usable, not merely present. `??` is not
         enough: an embedded or not-yet-painted view can report a
         visualViewport height of 0, which is not nullish — and an origin of
         0px is the top of the page, the exact fault this is here to avoid. If
         neither number is sane, leave the stylesheet's 50dvh alone. */
      const measured = window.visualViewport?.height || window.innerHeight;
      if (measured > 0) {
        node.style.transformOrigin = `50% ${window.scrollY + measured / 2}px`;
      }
    }

    /* Same two frames as an Entrance: one to paint the enlarged, blurred
       state, one to change it. Flipping in a single frame gives the browser
       nothing to animate between. */
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setState('shown')));
    const start = window.setTimeout(() => setState('shown'), 400);  // background tabs get no frames

    /* And it settles whether or not the transition ever reports. A page that
       is not being rendered runs no transitions, so `transitionend` is a
       maybe — and the cost of missing it is not a missed animation, it is a
       transform left on an ancestor of the sticky header for the rest of the
       session. Five seconds against a fixed 1200ms arrival — and the duration
       is fixed, so this cannot be outrun by a brand. */
    const settle = window.setTimeout(() => setState('settled'), 5000);

    return () => { cancelAnimationFrame(frame); clearTimeout(start); clearTimeout(settle); };
  }, [enabled]);

  if (!enabled) return <>{children}</>;

  return (
    <div
      ref={ref}
      className={styles.arrival}
      data-state={state}
      /* A transform on this element makes it the containing block for every
         `position: fixed` descendant, and the header above is sticky. Left in
         place it would quietly break both for the rest of the session, so the
         element stops being transformed the moment it has finished arriving.
         An event, not a timer: the transition itself says when it is done. */
      onTransitionEnd={(e) => { if (e.propertyName === 'transform') setState('settled'); }}
    >
      <Arriving.Provider value={state !== 'settled'}>{children}</Arriving.Provider>
    </div>
  );
};

/** Several parts of one thing, arriving as one sequence when scrolled to —
 *  or, with `eager`, as soon as it mounts even if it is already on screen. */
export const RevealGroup = ({ children, eager }: { children: ReactNode } & EagerProp) => {
  const enabled = useAnimates();
  const ref = useRef<HTMLDivElement>(null);
  const arriving = useArrivingOnMount();
  const state = useReveal(ref, enabled, eager === true && !arriving);
  if (!enabled) return <>{children}</>;
  return (
    <div ref={ref} className={styles.group}>
      <GroupState.Provider value={state}>{children}</GroupState.Provider>
    </div>
  );
};

/* ============================================================================
   SWAP  ·  one thing becoming another
   A skeleton becoming results, results becoming a failure panel, a failure
   becoming results after a retry. The hard edge in all three is not the fade —
   it is the height: a skeleton is tall, "no results" is short, and the page
   jumps hundreds of pixels in a single frame.

   So this animates the box and fades the content in. What it deliberately does
   *not* do is keep the outgoing subtree mounted for a true crossfade: the old
   content can contain regions and impression observers, and holding it alive
   for another half second would report things the reader never saw. A fade-in
   over a moving height reads well enough to not be worth lying to analytics
   for.
   ========================================================================= */

export const Swap = ({ name, children }: { name: string; children: ReactNode }) => {
  const enabled = useAnimates();
  const box = useRef<HTMLDivElement>(null);
  const natural = useRef<number | null>(null);
  const shown = useRef(name);
  const pending = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;

    const changed = shown.current !== name;

    if (!changed) {
      /* Keep the natural height current, but never while a swap is in flight —
         `offsetHeight` would report the animating value and the next swap would
         start from a number that was only ever true for one frame. */
      if (!el.style.height) natural.current = el.offsetHeight;
      return;
    }
    shown.current = name;

    /* The effect runs after the DOM has changed, so the box is already the new
       size. The old one is the value recorded on the previous render. */
    const from = natural.current ?? el.offsetHeight;

    /* A swap can land mid-swap. Drop whatever was running and measure what the
       new content actually wants, unclamped. */
    clearTimeout(pending.current);
    el.style.transition = 'none';
    el.style.height = '';
    const to = el.offsetHeight;
    natural.current = to;

    /* Only a collapse is animated. Growing means clipping the new content for
       the whole animation — which is exactly what "the last items are cut off"
       looks like, and no amount of easing fixes it. A collapse is the one that
       needs softening anyway: it yanks the page up under the reader. Growth
       simply appears, and the fade carries it. */
    if (!enabled || to >= from) { el.style.transition = ''; return; }

    /* Clip only while the box is moving. Left on permanently it would cut the
       shadow off every card in the list. */
    el.style.overflow = 'hidden';
    el.style.height = `${from}px`;
    void el.offsetHeight;                       // take the start value before changing it
    el.style.transition = 'height var(--duration-slow) var(--easing-standard)';
    el.style.height = `${to}px`;

    /* Give the height back when it arrives. Deliberately not returned as effect
       cleanup: this effect runs on every render, so a cleanup would cancel the
       release on the very next one — which left the box clamped at a height the
       content had outgrown, clipping it. The next swap cancels this one
       instead, and the timer covers a view that never runs the transition. */
    const release = () => { el.style.height = ''; el.style.transition = ''; el.style.overflow = ''; };
    el.addEventListener('transitionend', release, { once: true });
    pending.current = window.setTimeout(release, 2000);
  });

  if (!enabled) return <>{children}</>;

  return (
    <div ref={box} className={styles.swap}>
      {/* Keyed, so the incoming content is a new element and starts its fade
          from nothing rather than inheriting the outgoing one's opacity. */}
      <div key={name} className={styles.swapIn}>{children}</div>
    </div>
  );
};
