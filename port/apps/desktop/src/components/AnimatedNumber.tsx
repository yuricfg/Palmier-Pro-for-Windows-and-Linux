import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

/** Count-up from 0 to `value`. Honors prefers-reduced-motion (jumps straight to value). */
export function AnimatedNumber({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("pt-BR"));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, reduce, mv]);

  return <motion.span>{text}</motion.span>;
}
