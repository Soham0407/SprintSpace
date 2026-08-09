import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';

    import type {
    SprintRoomMessage,
    SprintRoomPin,
    SprintRoomMember,
    } from './types';

    function isSupabaseReady() {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;

    return Boolean(url && !url.includes('placeholder'));
    }

    let mockMessages: SprintRoomMessage[] = [
    {
        id: 'm1',
        workspaceId: 'mock',
        senderId: 'u1',
        senderName: 'Aarav',
        content: 'Pushed the auth routes, ready for review.',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'm2',
        workspaceId: 'mock',
        senderId: 'u2',
        senderName: 'Hazel',
        content: 'On it — checking the PR now.',
        createdAt: new Date().toISOString(),
    },
    ];

    let mockPins: SprintRoomPin[] = [
    {
        id: 'p1',
        workspaceId: 'mock',
        text: 'Backend APIs completed',
        createdAt: new Date().toISOString(),
    },
    ];

    export async function getMessages(
    workspaceId: string
    ): Promise<SprintRoomMessage[]> {
    if (!isSupabaseReady()) {
        return mockDelay(mockMessages);
    }

    const { data, error } = await supabase
        .from('sprintroom_messages')
        .select(
        'id, workspace_id, sender_id, content, created_at, profiles(name)'
        )
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []).map((row: any) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        senderId: row.sender_id,
        senderName: row.profiles?.name ?? 'Unknown',
        content: row.content,
        createdAt: row.created_at,
    }));
    }

    export async function sendMessage(
    workspaceId: string,
    content: string
    ): Promise<void> {
    if (!isSupabaseReady()) {
        mockMessages = [
        ...mockMessages,
        {
            id: `m-${Date.now()}`,
            workspaceId,
            senderId: 'me',
            senderName: 'You',
            content,
            createdAt: new Date().toISOString(),
        },
        ];

        await mockDelay(null);
        return;
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated — please log in first.');
    }

    const { error } = await supabase
        .from('sprintroom_messages')
        .insert({
        workspace_id: workspaceId,
        sender_id: user.id,
        content,
        });

    if (error) {
        throw new Error(error.message);
    }
    }

    export function subscribeToMessages(
    workspaceId: string,
    onInsert: (msg: SprintRoomMessage) => void
    ) {
    if (!isSupabaseReady()) {
        return () => {};
    }

    const channel = supabase
        .channel(`sprintroom-messages-${workspaceId}`)
        .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'sprintroom_messages',
            filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload) => {
            const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', payload.new.sender_id)
            .maybeSingle();

            onInsert({
            id: payload.new.id,
            workspaceId: payload.new.workspace_id,
            senderId: payload.new.sender_id,
            senderName: profile?.name ?? 'Unknown',
            content: payload.new.content,
            createdAt: payload.new.created_at,
            });
        }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
    }

    export async function getPins(
    workspaceId: string
    ): Promise<SprintRoomPin[]> {
    if (!isSupabaseReady()) {
        return mockDelay(mockPins);
    }

    const { data, error } = await supabase
        .from('sprintroom_pins')
        .select('id, workspace_id, text, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
        id: row.id as string,
        workspaceId: row.workspace_id as string,
        text: row.text as string,
        createdAt: row.created_at as string,
    }));
    }

    export async function addPin(
    workspaceId: string,
    text: string
    ): Promise<void> {
    if (!isSupabaseReady()) {
        mockPins = [
        {
            id: `p-${Date.now()}`,
            workspaceId,
            text,
            createdAt: new Date().toISOString(),
        },
        ...mockPins,
        ];

        await mockDelay(null);
        return;
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('sprintroom_pins')
        .insert({
        workspace_id: workspaceId,
        text,
        created_by: user?.id,
        });

    if (error) {
        throw new Error(error.message);
    }
}

    export async function getOnlineMembers(
    workspaceId: string
    ): Promise<SprintRoomMember[]> {
    if (!isSupabaseReady()) {
        return mockDelay([
        {
        id: 'u1',
        name: 'Aarav',
        role: 'Backend',
        },
        {
        id: 'u2',
        name: 'Hazel',
        role: 'Workspace',
    },
    ]);
    }

    const { data, error } = await supabase
    .from('workspace_members')
    .select('profile_id, name, role')
    .eq('workspace_id', workspaceId);

    if (error) {
    throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
    id: row.profile_id as string,
    name: row.name as string,
    role: row.role as string,
    }));
}