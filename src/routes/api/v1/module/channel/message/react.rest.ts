import {APIRequest} from "helper/APIRequest";
import {Language} from "helper/language";
import {RequestMethod} from "helper/requestMethod";
import {RocketChatRequest} from "helper/rocketChatRequest";
import {Validation} from "helper/validation";

const schema = Validation.object({
    emojiName: Validation.string().required().messages({
        "any.required": Language.get("validation.emoji.required"),
        "string.empty": Language.get("validation.emoji.required"),
    }),
    messageId: Validation.id().required().messages({
        "any.required": Language.get("validation.id.required"),
    }),
    operation: Validation.string().valid("set", "clear").required().messages({
        "any.only": Language.get("validation.reaction-operation.invalid"),
        "any.required": Language.get("validation.reaction-operation.required"),
    }),
});

module.exports = APIRequest.post(schema, true, async (req, res, auth) => {
    console.debug(req.body.operation);
    await RocketChatRequest.request(RequestMethod.POST, "/chat.react", auth, res, {
        emoji: req.body.emojiName.trim(),
        messageId: req.body.messageId,
        shouldReact: req.body.operation.toLowerCase() === "set",
    });
});
