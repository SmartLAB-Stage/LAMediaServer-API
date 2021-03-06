/**
 * Suppression d'un message
 */

import {APIRequest} from "helper/APIRequest";
import {APIResponse} from "helper/APIResponse";
import {Language} from "helper/language";
import {RequestMethod} from "helper/requestMethod";
import {RocketChatRequest} from "helper/rocketChatRequest";
import {Validation} from "helper/validation";

const schema = Validation.object({
    channelId: Validation.id().required().messages({
        "any.required": Language.get("validation.id.required"),
    }),
    messageId: Validation.id().required().messages({
        "any.required": Language.get("validation.id.required"),
    }),
});

module.exports = APIRequest.delete(schema, true, async (req, res, auth) => {
    await RocketChatRequest.request(RequestMethod.POST, "/chat.delete", auth, res, {
        asUser: true,
        msgId: req.body.messageId,
        roomId: req.body.channelId,
    }, (r, data) => {
        if (data.success === true) {
            return APIResponse.fromSuccess();
        } else {
            return APIResponse.fromFailure(r.statusText, r.status);
        }
    }, (r) => {
        return APIResponse.fromFailure(r.statusText, r.status);
    });
});
