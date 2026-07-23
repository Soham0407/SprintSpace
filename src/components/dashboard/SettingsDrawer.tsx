import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Bell, Palette, LogOut, Pencil } from 'lucide-react';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
      enabled ? 'bg-accent' : 'bg-white/10'
    }`}
    aria-label="Toggle"
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

const SettingsDrawer = ({ open, onClose }: SettingsDrawerProps) => {
  const [notifications, setNotifications] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
              <span className="text-primary text-sm font-medium">Settings</span>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-primary transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
              {/* Profile */}
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <User size={13} /> Profile
                </div>
                <div className="bg-card border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-primary text-sm shrink-0">
                    HE
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-primary text-sm truncate">Heshika</p>
                    <p className="text-gray-500 text-xs truncate">heshika@college.edu</p>
                  </div>
                  <button
                    className="text-gray-500 hover:text-primary transition-colors shrink-0"
                    aria-label="Edit profile"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Bell size={13} /> Notifications
                </div>
                <div className="bg-card border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-sm text-primary/90">Push notifications</span>
                  <Toggle enabled={notifications} onChange={() => setNotifications((v) => !v)} />
                </div>
              </div>

              {/* Theme */}
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Palette size={13} /> Theme
                </div>
                <div className="bg-card border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-sm text-primary/90">Dark mode</span>
                  <Toggle enabled={darkTheme} onChange={() => setDarkTheme((v) => !v)} />
                </div>
              </div>
            </div>

            <div className="px-5 py-5 border-t border-white/10">
              <button className="w-full flex items-center justify-center gap-2 text-sm text-red-400 border border-red-400/20 bg-red-400/10 hover:bg-red-400/15 rounded-full py-3 transition-colors">
                <LogOut size={15} /> Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SettingsDrawer;