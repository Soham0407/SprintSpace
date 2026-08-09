    export type SprintRoomMessage = {
    id: string;
    workspaceId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
    };

    export type SprintRoomPin = {
    id: string;
    workspaceId: string;
    text: string;
    createdAt: string;
    };

    export type SprintRoomMember = {
    id: string;
    name: string;
    role: string;
    };