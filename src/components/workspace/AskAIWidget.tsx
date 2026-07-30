import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

const AskAIWidget = () => {
  const [open, setOpen] = useState(false);

  return createPortal(
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="liquid-glass flex items-center justify-center text-primary/80 hover:text-primary transition-colors"
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '56px',
          height: '56px',
          borderRadius: '9999px',
          zIndex: 9999,
          boxShadow: '0 0 24px 2px rgba(255,91,46,0.35)',
        }}
        aria-label="Ask AI"
      >
        <Sparkles size={20} className="text-accent" />
      </motion.button>

      {/* Right-side panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
              className="bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                height: '100%',
                width: '100%',
                maxWidth: '380px',
                zIndex: 10000,
              }}
              className="bg-ink border-l border-white/10 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" />
                  <span className="text-primary text-sm font-medium">Ask AI</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-500 hover:text-primary transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center px-6 text-center">
                <p className="text-gray-500 text-sm">
                  AI chat will live here. Not wired up yet.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
};

export default AskAIWidget;