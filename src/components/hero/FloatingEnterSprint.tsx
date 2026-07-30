import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StarBorder from '../reactbits/StarBorder';
import ClickSpark from '../reactbits/ClickSpark';

const FloatingEnterSprint = () => {
  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      style={{ position: 'fixed', top: '28px', right: '28px', zIndex: 9999 }}
    >
      <ClickSpark sparkColor="#FF5B2E" sparkCount={10} sparkRadius={16}>
        <Link to="/login">
          <StarBorder as="button" color="#FF5B2E" speed="4s" className="group">
            <span
              className="flex items-center gap-2 bg-primary text-ink rounded-full pl-5 pr-1.5 py-1.5 font-medium text-sm transition-all group-hover:gap-3"
              style={{ boxShadow: '0 0 24px 2px rgba(255,91,46,0.35)' }}
            >
              Enter the Sprint
              <span className="bg-ink rounded-full w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                <ArrowRight size={16} className="text-primary" />
              </span>
            </span>
          </StarBorder>
        </Link>
      </ClickSpark>
    </motion.div>,
    document.body
  );
};

export default FloatingEnterSprint;