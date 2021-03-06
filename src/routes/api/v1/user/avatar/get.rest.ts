/**
 * Récupère l'avatar de l'utilisateur
 */

import {APIRequest} from "helper/APIRequest";
import {
    APIResponse,
    ResponseType,
} from "helper/APIResponse";
import {Language} from "helper/language";
import {
    HTTPStatus,
    RequestMethod,
} from "helper/requestMethod";
import {RocketChat} from "helper/rocketChat";
import {RocketChatRequest} from "helper/rocketChatRequest";
import {Validation} from "helper/validation";

const schema = Validation.object({
    username: Validation.string().messages({
        "any.required": Language.get("validation.username.required"),
        "string.empty": Language.get("validation.username.empty"),
    }),
});

module.exports = APIRequest.get(schema, false, async (req, res) => {
    const route = RocketChat.getWebEndpoint("/avatar/" + req.body.username);

    await RocketChatRequest.request(RequestMethod.GET, route, null, res, null, (r, data) => {
        return APIResponse.fromRaw(data, HTTPStatus.OK, ResponseType.SVG);
    }, null, false);
});
