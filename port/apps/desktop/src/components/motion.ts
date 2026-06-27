import type { Transition, Variants } from "framer-motion";

/** Snappy ease-out curve used for entrances. */
export const easeOut: Transition = { duration: 0.32, ease: [0.16, 1, 0.3, 1] };

export const spring: Transition = { type: "spring", stiffness: 420, damping: 32, mass: 0.8 };

/** Fade + rise, with optional stagger index via custom prop. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...easeOut, delay: i * 0.05 },
  }),
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
