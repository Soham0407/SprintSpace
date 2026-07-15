import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export interface TextSegment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: TextSegment[];
  containerClassName?: string;
  staggerDelay?: number;
}

/**
 * Same pull-up-on-scroll behaviour as WordsPullUp, but accepts an array of
 * {text, className} segments so a single heading can mix weights/fonts
 * (e.g. plain sans-serif words next to an italic serif accent phrase)
 * while every word still animates in together, in reading order.
 */
const WordsPullUpMultiStyle = ({
  segments,
  containerClassName = '',
  staggerDelay = 0.08,
}: WordsPullUpMultiStyleProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  let wordIndex = 0;

  return (
    <span ref={ref} className={`inline-flex flex-wrap justify-center ${containerClassName}`}>
      {segments.map((segment, sIdx) =>
        segment.text.split(' ').map((word, wIdx) => {
          const delay = wordIndex * staggerDelay;
          wordIndex += 1;
          return (
            <span
              key={`${sIdx}-${wIdx}`}
              className="overflow-hidden pb-[0.15em] mr-[0.25em]"
            >
              <motion.span
                className={`inline-block ${segment.className ?? ''}`}
                initial={{ y: '100%', opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
              >
                {word}
              </motion.span>
            </span>
          );
        })
      )}
    </span>
  );
};

export default WordsPullUpMultiStyle;
