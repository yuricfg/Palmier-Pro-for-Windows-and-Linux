import { motion } from "framer-motion";
import type { ComponentProps } from "react";
import { easeOut } from "./motion";

type MotionDivProps = ComponentProps<typeof motion.div>;

interface GlassCardProps extends MotionDivProps {
  /** Adds a hover lift + border glow; use for clickable cards. */
  interactive?: boolean;
}

export function GlassCard({ interactive = false, className = "", children, ...rest }: GlassCardProps) {
  return (
    <motion.div
      className={`pp-glass ${interactive ? "cursor-pointer" : ""} ${className}`}
      whileHover={interactive ? { y: -3, transition: { duration: 0.15 } } : undefined}
      transition={easeOut}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
