/**
 * Module créé
 */

import {Authentication} from "helper/authentication";
import {
    RocketChatWebSocket,
    RocketChatWebSocketMessage,
    TransmitData,
    WebSocketServerEvent,
} from "helper/rocketChatWebSocket";
import {
    GroupType,
    Module,
} from "model/module";

interface WebSocketData {
    _id: string,
    name: string,
    msgs: number,
    usersCount: number,
    u: {
        _id: string,
        username: string,
    },
    teamId?: string,
    ts: {
        "$date": number,
    },
}

module.exports = {
    schema: null,
    callback: async (args: Record<string, string>, auth: Authentication, rcws: RocketChatWebSocket) => {
        rcws.addSubscription(
            "stream-notify-user",
            [
                `${auth?.userId}/rooms-changed`,
                {"useCollection": false, "args": []},
            ], (transmit: (data: TransmitData, evt: WebSocketServerEvent) => void, content: unknown, currentUserId: string | null, message) => {
                if (message.fields.args[0] === RocketChatWebSocketMessage.INSERTED) {
                    const createdModule = content as WebSocketData;
                    if (!createdModule.teamId) {
                        // Cette WebSocket est aussi appelée lors de la création de canaux
                        return;
                    }

                    transmit(Module.fromFullObject({
                        _id: createdModule.teamId,
                        createdAt: new Date(createdModule.ts.$date),
                        createdBy: {
                            _id: createdModule.u._id,
                            username: createdModule.u.username,
                        },
                        name: createdModule.name,
                        roomId: createdModule._id,
                        type: GroupType.UNKNOWN,
                        numberOfUsers: createdModule.usersCount,
                        rooms: 0,
                    }), WebSocketServerEvent.MODULE_CREATED);
                }
            });
    },
};
