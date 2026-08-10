import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, Loader2, X, CheckCircle2 } from 'lucide-react';
import { cancelInvite } from '../../api/invites';
import type { WorkspaceInvite } from '../../api/types';

interface Props {
  workspaceId: string;
  competitionName: string;
  currentMembersCount: number;
  team: { id: string; name: string; role: string }[];
  isOwner?: boolean;
  invites: WorkspaceInvite[];
  loadingInvites: boolean;
  refreshInvites: () => void;
  alreadyInvitedIds: string[];
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const InvitesSection = ({
  workspaceId,
  competitionName,
  currentMembersCount,
  team,
  isOwner = false,
  invites,
  loadingInvites,
  refreshInvites,
  alreadyInvitedIds,
}: Props) => {
  const navigate = useNavigate();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const pending = invites.filter((i) => i.status === 'pending');
  const canAddMore = true;

  const handleCancel = async (invite: WorkspaceInvite) => {
    setCancellingId(invite.id);
    setCancelError(null);
    try {
      await cancelInvite(invite.id);
      refreshInvites();
    } catch (e) {
      setCancelError((e as Error).message);
    } finally {
      setCancellingId(null);
    }
  };

  const handleInvite = () => {
    navigate('/teammatch', {
      state: {
        workspaceId,
        competitionName,
        fromWorkspace: true,
        pendingInvitesCount: pending.length,
        alreadyInvitedIds,
      },
    });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <h2 className="text-primary text-lg">Team</h2>
        </div>
        <span className="text-xs text-accent">
          {currentMembersCount + pending.length} members
        </span>
      </div>

      {loadingInvites ? (
        <div className="h-14 bg-white/5 rounded-2xl animate-pulse" />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {team.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-card border border-accent/20 px-4 py-3 min-w-[120px]"
            >
              <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-xs shrink-0">
                {initials(member.name)}
              </div>
              <p className="text-sm text-primary leading-tight truncate max-w-[110px]">
                {member.name}
              </p>
              <span className="text-[11px] text-accent flex items-center gap-1">
                <CheckCircle2 size={10} /> {member.role || 'Member'}
              </span>
            </div>
          ))}

          {pending.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-card border border-white/5 px-4 py-3 min-w-[120px]"
            >
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-primary text-xs shrink-0">
                {initials(invite.name)}
              </div>
              <p className="text-sm text-primary leading-tight truncate max-w-[110px]">
                {invite.name}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-yellow-400 flex items-center gap-1">
                  <Clock size={10} /> pending
                </span>
                {isOwner && (
                  <button
                    onClick={() => handleCancel(invite)}
                    disabled={cancellingId === invite.id}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 shrink-0"
                    title="Cancel invite"
                  >
                    {cancellingId === invite.id ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <X size={12} />
                    )}
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}

          {canAddMore && (
            <button
              onClick={handleInvite}
              className="ml-auto flex items-center gap-2 rounded-2xl border border-accent/30 px-4 py-2 text-accent text-sm font-medium hover:bg-accent/10 transition"
            >
              <UserPlus size={15} />
              New Member
            </button>
          )}
        </div>
      )}

      {cancelError && <p className="text-red-400 text-xs mt-2">{cancelError}</p>}
    </div>
  );
};

export default InvitesSection;
