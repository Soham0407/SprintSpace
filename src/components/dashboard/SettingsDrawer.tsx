import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Bell, LogOut, Camera, Trash2, Loader2, Check, Mail, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { getProfile, updateProfile, uploadAvatar, removeAvatar } from '../../api/profile';
import { getMyInvites, acceptInvite, declineInvite } from '../../api/invites';
import type { Profile, Invite } from '../../api/types';

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

const fieldClass =
  'w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-primary placeholder-gray-600 focus:outline-none focus:border-accent transition-colors';

const SettingsDrawer = ({ open, onClose }: SettingsDrawerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [inviteActionId, setInviteActionId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [confirmDeclineId, setConfirmDeclineId] = useState<string | null>(null);
  const [expandedInviteId, setExpandedInviteId] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onClose();
      navigate('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  useEffect(() => {
    if (!open || !user?.id) return;
    setLoadingProfile(true);
    getProfile(user.id)
      .then((p) => {
        setProfile(p);
        setName(p.name ?? '');
        setUsername(p.username ?? '');
        setBio(p.bio ?? '');
        setRole(p.role ?? '');
      })
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  }, [open, user?.id]);

  useEffect(() => {
    if (!open || !user?.id) return;
    setLoadingInvites(true);
    setInviteError(null);
    getMyInvites()
      .then(setInvites)
      .catch((e) => {
        console.error('[getMyInvites]', e);
        setInviteError((e as Error).message);
        setInvites([]);
      })
      .finally(() => setLoadingInvites(false));
  }, [open, user?.id]);

  const isDirty =
    profile &&
    (name !== (profile.name ?? '') ||
      username !== (profile.username ?? '') ||
      bio !== (profile.bio ?? '') ||
      role !== (profile.role ?? ''));

  const handleSaveProfile = async () => {
    if (!user?.id || !profile) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateProfile(user.id, { name, username, bio, role });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!user?.id) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5MB.');
      return;
    }
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const url = await uploadAvatar(user.id, file);
      setProfile((p) => (p ? { ...p, avatarUrl: url } : p));
    } catch (e) {
      setAvatarError((e as Error).message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user?.id) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      await removeAvatar(user.id);
      setProfile((p) => (p ? { ...p, avatarUrl: null } : p));
    } catch (e) {
      setAvatarError((e as Error).message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleNotificationsToggle = async () => {
    if (!user?.id || !profile) return;
    const next = !profile.notificationsEnabled;
    setProfile({ ...profile, notificationsEnabled: next });
    try {
      await updateProfile(user.id, { notificationsEnabled: next });
    } catch {
      setProfile({ ...profile, notificationsEnabled: !next });
    }
  };

  const handleAcceptInvite = async (id: string, competitionName: string, workspaceId: string) => {
    if (!window.confirm(`Join "${competitionName}"? You'll be added as a team member.`)) return;
    setInviteActionId(id);
    setInviteError(null);
    try {
      await acceptInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      onClose();
      navigate(`/workspace/${workspaceId}`);
    } catch (e) {
      setInviteError((e as Error).message);
    } finally {
      setInviteActionId(null);
    }
  };

  const handleDeclineInvite = async (id: string) => {
    setInviteActionId(id);
    setInviteError(null);
    try {
      await declineInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setInviteError((e as Error).message);
    } finally {
      setInviteActionId(null);
      setConfirmDeclineId(null);
    }
  };

  const initials = (profile?.name || user?.email || '?').slice(0, 2).toUpperCase();

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

                {loadingProfile && !profile ? (
                  <div className="bg-card border border-white/5 rounded-2xl p-4 flex items-center justify-center py-8">
                    <Loader2 size={18} className="animate-spin text-gray-500" />
                  </div>
                ) : (
                  <div className="bg-card border border-white/5 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-primary text-sm overflow-hidden">
                          {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <label
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-ink flex items-center justify-center cursor-pointer hover:bg-white transition-colors"
                          aria-label="Change avatar"
                        >
                          {avatarUploading ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Camera size={11} />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={avatarUploading}
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleAvatarChange(e.target.files[0]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-primary text-sm truncate">{profile?.name || 'You'}</p>
                        <p className="text-gray-500 text-xs truncate">{profile?.email ?? user?.email}</p>
                      </div>
                      {profile?.avatarUrl && (
                        <button
                          onClick={handleAvatarRemove}
                          disabled={avatarUploading}
                          className="text-gray-500 hover:text-red-400 transition-colors shrink-0 disabled:opacity-40"
                          aria-label="Remove avatar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {avatarError && <p className="text-red-400 text-xs">{avatarError}</p>}

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Display Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={fieldClass} />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Username</label>
                        <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} placeholder="username" className={fieldClass} />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Role</label>
                        <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={40} placeholder="e.g. Frontend Dev" className={fieldClass} />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Bio</label>
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={2} className={`${fieldClass} resize-none`} />
                      </div>
                    </div>

                    {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

                    {isDirty && (
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-1.5 bg-primary text-ink rounded-lg py-2 text-xs font-medium hover:bg-white transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
                        {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Invites */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail size={13} /> Invites
                  </div>
                  {invites.length > 0 && (
                    <span className="text-[10px] bg-accent/15 text-accent rounded-full px-2 py-0.5">
                      {invites.length}
                    </span>
                  )}
                </div>

                {loadingInvites ? (
                  <div className="bg-card border border-white/5 rounded-2xl p-4 flex items-center justify-center py-6">
                    <Loader2 size={16} className="animate-spin text-gray-500" />
                  </div>
                ) : invites.length === 0 ? (
                  <div className="bg-card border border-white/5 rounded-2xl p-4 text-center py-6">
                    <p className="text-gray-500 text-xs">No pending invites.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {invites.map((invite) => {
                      const isExpanded = expandedInviteId === invite.id;
                      return (
                        <motion.div
                          key={invite.id}
                          layout
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          className="bg-card border border-white/5 rounded-2xl overflow-hidden mb-2"
                        >
                          {/* Header row — always visible, click to expand */}
                          <button
                            onClick={() => setExpandedInviteId(isExpanded ? null : invite.id)}
                            className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0 mt-0.5">
                              <Mail size={13} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-primary text-sm font-medium truncate">{invite.competitionName}</p>
                              <p className="text-gray-500 text-xs mt-0.5">
                                Invited by <span className="text-gray-400">{invite.invitedByName}</span>
                              </p>
                            </div>
                            <span className="text-gray-600 shrink-0 mt-1">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </span>
                          </button>

                          {/* Expandable detail panel */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                key="details"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                                  {/* Project details */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] text-gray-500 uppercase tracking-wider">Project</span>
                                    </div>
                                    <p className="text-primary text-sm font-medium">{invite.competitionName}</p>
                                    <p className="text-gray-500 text-xs">
                                      Owner: <span className="text-gray-400">{invite.invitedByName}</span>
                                    </p>
                                    {invite.description && (
                                      <p className="text-gray-400 text-xs leading-relaxed bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
                                        {invite.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Decline confirmation or action buttons */}
                                  <AnimatePresence mode="wait">
                                    {confirmDeclineId === invite.id ? (
                                      <motion.div
                                        key="confirm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                      >
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                          <p className="text-red-300 text-xs mb-2.5">Decline this invitation? This cannot be undone.</p>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleDeclineInvite(invite.id)}
                                              disabled={inviteActionId === invite.id}
                                              className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg py-1.5 text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                            >
                                              {inviteActionId === invite.id ? (
                                                <Loader2 size={11} className="animate-spin" />
                                              ) : (
                                                <X size={11} />
                                              )}
                                              Yes, decline
                                            </button>
                                            <button
                                              onClick={() => setConfirmDeclineId(null)}
                                              disabled={inviteActionId === invite.id}
                                              className="flex-1 flex items-center justify-center border border-white/10 text-gray-400 rounded-lg py-1.5 text-xs font-medium hover:text-primary hover:border-white/30 transition-colors disabled:opacity-50"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="actions"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex gap-2"
                                      >
                                        <button
                                          onClick={() => handleAcceptInvite(invite.id, invite.competitionName, invite.workspaceId)}
                                          disabled={inviteActionId === invite.id}
                                          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-ink rounded-lg py-2 text-xs font-medium hover:bg-white transition-colors disabled:opacity-50"
                                        >
                                          {inviteActionId === invite.id ? (
                                            <Loader2 size={12} className="animate-spin" />
                                          ) : (
                                            <Check size={12} />
                                          )}
                                          Accept & Open
                                        </button>
                                        <button
                                          onClick={() => setConfirmDeclineId(invite.id)}
                                          disabled={inviteActionId === invite.id}
                                          className="flex-1 flex items-center justify-center gap-1.5 border border-white/10 text-gray-400 rounded-lg py-2 text-xs font-medium hover:text-primary hover:border-white/30 transition-colors disabled:opacity-50"
                                        >
                                          <X size={12} />
                                          Decline
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}

                {inviteError && <p className="text-red-400 text-xs mt-2">{inviteError}</p>}
              </div>

              {/* Notifications */}
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Bell size={13} /> Notifications
                </div>
                <div className="bg-card border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-sm text-primary/90">Push notifications</span>
                  <Toggle enabled={profile?.notificationsEnabled ?? true} onChange={handleNotificationsToggle} />
                </div>
              </div>
            </div>

            <div className="px-5 py-5 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm text-red-400 border border-red-400/20 bg-red-400/10 hover:bg-red-400/15 rounded-full py-3 transition-colors"
              >
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