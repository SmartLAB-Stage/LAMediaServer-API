import {APIRequest} from "helper/APIRequest";
import {APIResponse} from "helper/APIResponse"
import {JWT} from "helper/JWT";
import {Language} from "helper/language";
import {RocketChatRequest} from "helper/RocketChatRequest";
import {Validation} from "helper/validation";

const schema = Validation.object({
    username: Validation.string().alphanum().min(3).max(32).required().messages({
        "any.required": Language.get("validation.username.required"),
        "string.empty": Language.get("validation.username.empty"),
        "string.max": Language.get("validation.username.long"),
        "string.min": Language.get("validation.username.short")
    }),
    password: Validation.string().required().messages({
        "any.required": Language.get("validation.password.required"),
        "string.empty": Language.get("validation.password.empty")
    }),
});

module.exports = APIRequest.post(schema, async (req, res) => {
    await RocketChatRequest.request("POST", "/login", null, res, {
        username: req.body.username,
        password: req.body.password
    }, (r, data) => {
        const token = JWT.createToken(data.data.userId, data.data.authToken, data.data.me.username);
        return APIResponse.fromSuccess({
            token: token
        });
    }, (r, data) => {
        if (r.status === 401) {
            return APIResponse.fromFailure(Language.get("login.unauthorized"), r.status, data);
        } else {
            return APIResponse.fromFailure(r.statusText, r.status, data);
        }
    });
});
