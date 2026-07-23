import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pin, Paperclip, Send, MessageCircle } from 'lucide-react';
import PageShell from '../components/layout/PageShell';

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const CURRENT_USER = 'Heshika';

const ONLINE_MEMBERS: { name: string; role: string; status: 'online' | 'busy' | 'offline' }[] = [
  { name: 'Aarav', role: 'Backend', status: 'online' },
  { name: 'Hazel', role: 'Workspace', status: 'online' },
  { name: 'Sid', role: 'AI', status: 'busy' },
  { name: 'Kiara', role: 'Offline', status: 'offline' },
];

const PINNED_UPDATES = [
  'Backend APIs completed',
  'Demo Presentation on Friday',
  'AI Module under testing',
];

const MOCK_MESSAGES = [
  { id: 'm1', name: 'Aarav', role: 'Backend', time: '10:14 AM', text: 'Pushed the auth routes, ready for review.' },
  { id: 'm2', name: 'Hazel', role: 'Workspace', time: '10:16 AM', text: 'On it — checking the PR now.' },
  { id: 'm3', name: 'Sid', role: 'AI', time: '10:22 AM', text: 'Model accuracy is at 91%, still tuning the prompt.' },
  { id: 'm4', name: 'Aarav', role: 'Backend', time: '10:25 AM', text: 'Nice. Let me know when it\u2019s stable, I\u2019ll wire it into the API.' },
  { id: 'm5', name: 'Hazel', role: 'Workspace', time: '10:31 AM', text: 'Kanban board updated with today\u2019s tasks.' },
];

const STATUS_DOT: Record<string, string> = {
  online: 'bg-emerald-500',
  busy: 'bg-yellow-500',
  offline: 'bg-gray-500',
};

const Avatar = ({ name }: { name: string }) => (
  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-primary text-xs shrink-0">
    {name.slice(0, 2).toUpperCase()}
  </div>
);

const SprintRoomPage = () => {
  const [messages] = useState(MOCK_MESSAGES);

  return (
    <PageShell
      eyebrow="SPRINTROOM"
      title="SprintRoom"
      intro="Web Wonders 2026"
    >
      {/* Online status line */}
      <div className="flex items-center gap-2 text-sm text-gray-400 -mt-4 mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        3 Members Online
      </div>

      {/* Pinned Updates */}
      <div className="bg-card border border-accent/20 rounded-2xl px-5 py-4 mb-6">
        <div className="flex items-center gap-2 text-xs text-accent mb-2.5">
          <Pin size={13} /> Pinned Updates
        </div>
        <ul className="space-y-1.5">
          {PINNED_UPDATES.map((u) => (
            <li key={u} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" />
              {u}
            </li>
          ))}
        </ul>
      </div>

      {/* Online Members strip */}
      <div className="flex flex-wrap items-center gap-4 bg-card border border-white/5 rounded-2xl px-5 py-3.5 mb-6">
        {ONLINE_MEMBERS.map((m) => (
          <div key={m.name} className="flex items-center gap-2">
            <div className="relative">
              <Avatar name={m.name} />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${STATUS_DOT[m.status]}`}
              />
            </div>
            <span className="text-xs text-gray-400">
              {m.name} <span className="text-gray-600">— {m.role}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div className="bg-card border border-white/5 rounded-2xl flex flex-col" style={{ height: 'min(60vh, 520px)' }}>
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <MessageCircle size={28} className="text-gray-600 mb-4" />
            <p className="text-primary/80 mb-1">Welcome to SprintRoom</p>
            <p className="text-gray-500 text-sm max-w-xs mb-5">
              Discuss features, share updates and keep all competition communication inside SprintSpace.
            </p>
            <button className="text-xs bg-primary text-ink rounded-full px-5 py-2.5 font-medium hover:bg-white transition-colors">
              Start Conversation
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4">
            {messages.map((msg, i) => {
              const isOwn = msg.name === CURRENT_USER;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar name={msg.name} />
                  <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs text-primary/90">{msg.name}</span>
                      <span className="text-[10px] text-gray-600">{msg.role}</span>
                      <span className="text-[10px] text-gray-600">{msg.time}</span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isOwn
                          ? 'bg-accent/15 border border-accent/20 text-primary rounded-tr-sm'
                          : 'bg-surface border border-white/5 text-primary/90 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Message input */}
        <div className="border-t border-white/5 px-4 sm:px-5 py-3.5 flex items-center gap-2.5">
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white/5 transition-colors shrink-0"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <input
            type="text"
            placeholder="Message SprintRoom..."
            className="flex-1 bg-surface border border-white/10 rounded-full px-4 py-2.5 text-sm text-primary placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
          />
          <button
            className="w-9 h-9 rounded-full bg-primary text-ink flex items-center justify-center hover:bg-white transition-colors shrink-0"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default SprintRoomPage;