import {APIRequest} from "helper/APIRequest";
import {APIResponse} from "helper/APIResponse";
import {Language} from "helper/language";
import {RocketChatRequest} from "helper/rocketChatRequest";
import {Validation} from "helper/validation";

const schema = Validation.object({
    groupRoomId: Validation.string().required(),
    name: Validation.string().required().messages({
        "any.required": Language.get("validation.name.required"),
    }),
});

module.exports = APIRequest.post(schema, async (req, res) => {
    await RocketChatRequest.request("POST", "/rooms.createDiscussion", req, res, {
        prid: req.body.groupRoomId,
        t_name: req.body.name,
    }, (_r, data) => {
        console.debug(data);
        // TODO: S'occuper du message de réponse
        return APIResponse.fromString("TODO");
        // return APIResponse.fromSuccess(new Room(data.channel._id, data.channel.name));
    });
});
