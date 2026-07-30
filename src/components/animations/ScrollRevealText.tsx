import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

interface AnimatedLetterProps {
  char: string;
  index: number;
  totalChars: number;
  progress: MotionValue<number>;
}

const AnimatedLetter = ({ char, index, totalChars, progress }: AnimatedLetterProps) => {
  const charProgress = index / totalChars;
  const start = Math.max(0, charProgress - 0.1);
  const end = charProgress + 0.05;
  const opacity = useTransform(progress, [start, end], [0.2, 1]);

  return (
    <motion.span style={{ opacity }} className="inline">
      {char}
    </motion.span>
  );
};

interface ScrollRevealTextProps {
  text: string;
  className?: string;
}

/**
 * Wraps every character of `text` in its own opacity-mapped span, driven by
 * scroll position (dim -> full brightness as the paragraph passes through
 * the viewport). Mirrors the "progressive text reveal" pattern.
 */
const ScrollRevealText = ({ text, className = '' }: ScrollRevealTextProps) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  });

  const chars = text.split('');

  return (
    <p ref={ref} className={className}>
      {chars.map((char, i) => (
        <AnimatedLetter
          key={i}
          char={char}
          index={i}
          totalChars={chars.length}
          progress={scrollYProgress}
        />
      ))}
    </p>
  );
};

export default ScrollRevealText;
