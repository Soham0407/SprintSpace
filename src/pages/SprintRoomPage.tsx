import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pin, Paperclip, Send, MessageCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

import PageShell from '../components/layout/PageShell';
import { useAuth } from '../context/AuthContext';

import {
  getMessages,
  sendMessage,
  subscribeToMessages,
  getPins,
  getOnlineMembers,
} from '../api/sprintroom';

import type {
  SprintRoomMessage,
  SprintRoomPin,
  SprintRoomMember,
} from '../api/types';

const SprintRoomPage = () => {
  const { workspaceId } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState<SprintRoomMessage[]>([]);
  const [pins, setPins] = useState<SprintRoomPin[]>([]);
  const [members, setMembers] = useState<SprintRoomMember[]>([]);
  const [draft, setDraft] = useState('');

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    getMessages(workspaceId).then(setMessages);
    getPins(workspaceId).then(setPins);
    getOnlineMembers(workspaceId).then(setMembers);

    const unsubscribe = subscribeToMessages(workspaceId, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return unsubscribe;
  }, [workspaceId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleSend = async () => {
  if (!draft.trim() || !workspaceId) return;

  const text = draft.trim();
  setDraft('');

  try {
    await sendMessage(workspaceId, text);

    // Refresh messages after sending
    const updatedMessages = await getMessages(workspaceId);
    setMessages(updatedMessages);
  } catch (error) {
    console.error('Failed to send message:', error);
    setDraft(text);
  }
};

  return (
    <PageShell>
      {/* Online status line */}
      <div className="text-sm text-gray-500 mb-4">
        {members.length} Members Online
      </div>

      {/* Pinned Updates */}
      <div className="bg-card border border-accent/20 rounded-2xl px-5 py-4 mb-6">
        <div className="flex items-center gap-2 text-xs text-accent mb-2.5">
          <Pin size={13} />
          Pinned Updates
        </div>

        {pins.length === 0 ? (
          <p className="text-sm text-gray-600">
            No pinned updates yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {pins.map((p) => (
              <li
                key={p.id}
                className="flex items-start gap-2 text-sm text-gray-400"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" />
                {p.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Online Members strip */}
      <div className="flex flex-wrap items-center gap-4 bg-card border border-white/5 rounded-2xl px-5 py-3.5 mb-6">
        {members.length === 0 ? (
          <span className="text-xs text-gray-600">
            No members found.
          </span>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Avatar name={m.name} />

              <span className="text-xs text-gray-400">
                {m.name}
                <span className="text-gray-600">
                  {' '}
                  — {m.role}
                </span>
              </span>
            </div>
          ))
        )}
      </div>

      {/* Chat area */}
      <div
        className="bg-card border border-white/5 rounded-2xl flex flex-col"
        style={{ height: 'min(60vh, 520px)' }}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <MessageCircle
              size={28}
              className="text-gray-600 mb-4"
            />

            <p className="text-primary/80 mb-1">
              Welcome to SprintRoom
            </p>

            <p className="text-gray-500 text-sm max-w-xs mb-5">
              Discuss features, share updates and keep all competition
              communication inside SprintSpace.
            </p>

            <button
              onClick={() => {
                document
                  .querySelector<HTMLInputElement>(
                    'input[placeholder="Message SprintRoom..."]'
                  )
                  ?.focus();
              }}
              className="text-xs bg-primary text-ink rounded-full px-5 py-2.5 font-medium hover:bg-white transition-colors"
              type="button"
            >
              Start Conversation
            </button>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4"
          >
            {messages.map((msg, i) => {
              const isOwn = msg.senderId === user?.id;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: i * 0.03,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`flex gap-3 ${
                    isOwn ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar name={msg.senderName} />

                  <div
                    className={`max-w-[75%] ${
                      isOwn ? 'items-end' : 'items-start'
                    } flex flex-col`}
                  >
                    <div
                      className={`flex items-baseline gap-2 mb-1 ${
                        isOwn ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <span className="text-xs text-primary/90">
                        {msg.senderName}
                      </span>

                      <span className="text-[10px] text-gray-600">
                        {new Date(
                          msg.createdAt
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isOwn
                          ? 'bg-accent/15 border border-accent/20 text-primary rounded-tr-sm'
                          : 'bg-surface border border-white/5 text-primary/90 rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
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
            type="button"
          >
            <Paperclip size={16} />
          </button>

          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            placeholder="Message SprintRoom..."
            className="flex-1 bg-surface border border-white/10 rounded-full px-4 py-2.5 text-sm text-primary placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
          />

          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-full bg-primary text-ink flex items-center justify-center hover:bg-white transition-colors shrink-0"
            aria-label="Send message"
            type="button"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </PageShell>
  );
};

const Avatar = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-[10px] text-primary shrink-0">
      {initials || '?'}
    </div>
  );
};

export default SprintRoomPage;