import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getWorkspaceInvites, cancelInvite } from '../../api/invites';
import { getWorkspaceMaxMembers } from '../../api/workspace';
import type { WorkspaceInvite } from '../../api/types';

interface Props {
  workspaceId: string;
  competitionName: string;
  currentMembersCount: number;
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const InvitesSection = ({ workspaceId, competitionName, currentMembersCount }: Props) => {
  const navigate = useNavigate();
  const { data: invites, loading, error, refresh } = useAsyncData(
    () => getWorkspaceInvites(workspaceId),
    [workspaceId]
  );
  const { data: maxMembers } = useAsyncData(
    () => getWorkspaceMaxMembers(workspaceId),
    [workspaceId]
  );

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const pending = (invites ?? []).filter((i) => i.status === 'pending');
  const active = (invites ?? []).filter((i) => i.status === 'accepted');
  const max = maxMembers ?? 4;
  const remainingSlots = Math.max(0, max - currentMembersCount - pending.length);
  const hasInvites = pending.length + active.length > 0;

  const handleCancel = async (invite: WorkspaceInvite) => {
    setCancellingId(invite.id);
    setCancelError(null);
    try {
      await cancelInvite(invite.id);
      await refresh();
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
        maxMembers: max,
        currentMembersCount,
        remainingSlots,
        alreadyInvitedIds: (invites ?? []).map((i) => i.userId),
      },
    });
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-primary" />
          <h2 className="text-primary text-lg">Invites</h2>
        </div>
        <span className="text-xs text-accent">
          {currentMembersCount + pending.length} / {max}
        </span>
      </div>

      {loading ? (
        <div className="bg-card rounded-2xl border border-white/5 p-4 flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin text-gray-500" />
        </div>
      ) : error ? (
        <div className="bg-card rounded-2xl border border-white/5 p-4 text-red-400 text-sm">
          {error.message}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-white/5 divide-y divide-white/5">
          {!hasInvites ? (
            <div className="p-6 text-center">
              <Users size={22} className="text-gray-600 mx-auto mb-3" />
              <p className="text-primary/80 text-sm mb-1">No members invited yet</p>
              <p className="text-gray-500 text-xs mb-5">
                {remainingSlots > 0
                  ? `You have ${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} to fill.`
                  : 'Your team is full.'}
              </p>
              {remainingSlots > 0 && (
                <button
                  onClick={handleInvite}
                  className="inline-flex items-center gap-2 rounded-2xl border border-accent/30 px-6 py-3 text-accent text-sm font-medium hover:bg-accent/10 transition"
                >
                  <UserPlus size={16} />
                  Invite
                </button>
              )}
            </div>
          ) : (
            <>
              {pending.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-primary text-xs shrink-0">
                      {initials(invite.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-primary truncate">{invite.name}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-yellow-400">
                        <Clock size={10} /> Pending
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(invite)}
                    disabled={cancellingId === invite.id}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {cancellingId === invite.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <X size={12} />
                    )}
                    Cancel
                  </button>
                </div>
              ))}

              {active.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-xs shrink-0">
                      {initials(invite.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-primary truncate">{invite.name}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-accent">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {cancelError && <p className="text-red-400 text-xs mt-2">{cancelError}</p>}

      {hasInvites && remainingSlots > 0 && (
        <button
          onClick={handleInvite}
          className="mt-3 w-full rounded-2xl border border-accent/30 py-3 flex items-center justify-center gap-2 text-accent text-sm font-medium hover:bg-accent/10 transition"
        >
          <UserPlus size={16} />
          Invite Member{remainingSlots > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
};

export default InvitesSection;
