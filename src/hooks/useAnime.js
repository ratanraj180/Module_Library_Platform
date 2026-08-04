/**
 * useAnime — A collection of React hooks that wrap Anime.js for
 * declarative, lifecycle-safe animations in the ModuleLib platform.
 *
 * All hooks respect `prefers-reduced-motion` automatically.
 */
import { useEffect, useRef, useCallback } from "react";

// ─── Utility: check reduced motion preference ─────────────────────────────────
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─── useAnimeOnMount ──────────────────────────────────────────────────────────
/**
 * Runs an Anime.js animation when the component mounts.
 * @param {Function} animationFactory - fn(anime, targets) => anime instance
 * @param {Object} deps - optional dependency array for re-triggering
 */
export function useAnimeOnMount(animationFactory, deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!ref.current) return;

    let animeInstance = null;
    // Dynamic import to keep bundle lean; anime.js is already installed
    import("animejs").then((mod) => {
      const anime = mod.default || mod;
      animeInstance = animationFactory(anime, ref.current);
    });

    return () => {
      if (animeInstance && animeInstance.pause) {
        animeInstance.pause();
      }
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── useAnimeStagger ─────────────────────────────────────────────────────────
/**
 * Staggers children of the ref container on mount.
 * @param {Object} options - { translateY, opacity, delay, duration, easing }
 */
export function useAnimeStagger(options = {}) {
  const {
    translateY = [20, 0],
    opacity = [0, 1],
    delay = 60,
    duration = 600,
    easing = "easeOutExpo",
    selector = null,
  } = options;

  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!ref.current) return;

    let animeInstance = null;
    import("animejs").then((mod) => {
      const anime = mod.default || mod;
      const targets = selector
        ? ref.current.querySelectorAll(selector)
        : ref.current.children;

      if (!targets || targets.length === 0) return;

      animeInstance = anime({
        targets,
        translateY,
        opacity,
        delay: anime.stagger(delay),
        duration,
        easing,
      });
    });

    return () => {
      if (animeInstance && animeInstance.pause) animeInstance.pause();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── useAnimeCounter ─────────────────────────────────────────────────────────
/**
 * Animates a numeric counter from 0 to `target`.
 * @param {number} target - final numeric value
 * @param {Object} opts - { duration, easing, decimals, prefix, suffix }
 * @returns {{ ref, value }} - attach ref to a DOM element; value is a react ref
 */
export function useAnimeCounter(target, opts = {}) {
  const {
    duration = 1200,
    easing = "easeOutExpo",
    decimals = 0,
    prefix = "",
    suffix = "",
  } = opts;

  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      if (ref.current) ref.current.textContent = `${prefix}${target}${suffix}`;
      return;
    }
    if (!ref.current) return;
    if (typeof target !== "number") {
      if (ref.current) ref.current.textContent = `${prefix}${target}${suffix}`;
      return;
    }

    let animeInstance = null;
    import("animejs").then((mod) => {
      const anime = mod.default || mod;
      const obj = { count: 0 };
      animeInstance = anime({
        targets: obj,
        count: [0, target],
        duration,
        easing,
        round: decimals === 0 ? 1 : Math.pow(10, decimals),
        update() {
          if (ref.current) {
            ref.current.textContent = `${prefix}${obj.count.toFixed(decimals)}${suffix}`;
          }
        },
      });
    });

    return () => {
      if (animeInstance && animeInstance.pause) animeInstance.pause();
    };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── useAnimeScrollReveal ─────────────────────────────────────────────────────
/**
 * Triggers a fade-up animation when the element scrolls into view.
 * Uses IntersectionObserver — no scroll event listeners.
 * @param {Object} options - { threshold, translateY, duration, easing }
 */
export function useAnimeScrollReveal(options = {}) {
  const {
    threshold = 0.15,
    translateY = [24, 0],
    opacity = [0, 1],
    duration = 700,
    easing = "easeOutExpo",
    delay = 0,
  } = options;

  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!ref.current) return;

    const el = ref.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            import("animejs").then((mod) => {
              const anime = mod.default || mod;
              anime({
                targets: el,
                translateY,
                opacity,
                duration,
                easing,
                delay,
              });
            });
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── useAnimeFloat ────────────────────────────────────────────────────────────
/**
 * Creates a continuous floating animation (for background orbs, etc.)
 * @param {Object} options - { translateY, duration, easing }
 */
export function useAnimeFloat(options = {}) {
  const {
    translateY = [-12, 12],
    duration = 4000,
    easing = "easeInOutSine",
  } = options;

  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!ref.current) return;

    let animeInstance = null;
    import("animejs").then((mod) => {
      const anime = mod.default || mod;
      animeInstance = anime({
        targets: ref.current,
        translateY,
        duration,
        easing,
        direction: "alternate",
        loop: true,
      });
    });

    return () => {
      if (animeInstance && animeInstance.pause) animeInstance.pause();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── useAnimeHover ────────────────────────────────────────────────────────────
/**
 * Returns mouse event handlers for hover-in / hover-out animations.
 * Returns { ref, onMouseEnter, onMouseLeave }
 */
export function useAnimeHover(enterConfig = {}, leaveConfig = {}) {
  const ref = useRef(null);

  const onMouseEnter = useCallback(() => {
    if (prefersReducedMotion()) return;
    if (!ref.current) return;
    import("animejs").then((mod) => {
      const anime = mod.default || mod;
      anime({
        targets: ref.current,
        duration: 200,
        easing: "easeOutQuad",
        ...enterConfig,
      });
    });
  }, [enterConfig]);

  const onMouseLeave = useCallback(() => {
    if (prefersReducedMotion()) return;
    if (!ref.current) return;
    import("animejs").then((mod) => {
      const anime = mod.default || mod;
      anime({
        targets: ref.current,
        duration: 250,
        easing: "easeOutQuad",
        ...leaveConfig,
      });
    });
  }, [leaveConfig]);

  return { ref, onMouseEnter, onMouseLeave };
}

// ─── useAnimePageTransition ───────────────────────────────────────────────────
/**
 * Fades + slides in the page content on mount (for route transitions).
 */
export function useAnimePageTransition() {
  return useAnimeOnMount((anime, el) =>
    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 450,
      easing: "easeOutExpo",
    })
  );
}
