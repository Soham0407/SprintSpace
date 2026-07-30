import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  staggerDelay?: number;
}

/**
 * Splits `text` into words and animates each one sliding up + fading in,
 * staggered, the first time it scrolls into view. Optionally appends a
 * superscript asterisk after the final word (used on the hero wordmark).
 */
const WordsPullUp = ({
  text,
  className = '',
  showAsterisk = false,
  staggerDelay = 0.08,
}: WordsPullUpProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const words = text.split(' ');

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="overflow-hidden pb-[0.1em] mr-[0.25em] last:mr-0">
          <motion.span
            className="inline-block relative"
            initial={{ y: '100%', opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{
              duration: 0.6,
              delay: i * staggerDelay,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
            {showAsterisk && i === words.length - 1 && (
              <span className="absolute top-[0.05em] -right-[0.45em] text-[0.35em]">*</span>
            )}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

export default WordsPullUp;
