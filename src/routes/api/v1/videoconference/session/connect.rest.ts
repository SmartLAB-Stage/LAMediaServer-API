/**
 * Connecte un utilisateur à une vidéoconférence
 */

import express from "express";
import {APIRequest} from "helper/APIRequest";
import {APIResponse} from "helper/APIResponse";
import {Language} from "helper/language";
import {OpenVidu} from "helper/openVidu";
import {
    HTTPStatus,
    isValidStatusCode,
    RequestMethod,
} from "helper/requestMethod";
import {Validation} from "helper/validation";
import * as https from "https";
import {VideoConferenceConnection} from "model/videoConferenceConnection";

const schema = Validation.object({
    sessionId: Validation.id().required().messages({
        "any.required": Language.get("validation.id.required"),
    }),
});

/**
 * Crée une session OpenVidu
 * @param sessionId ID de la session Rocket.chat
 * @param res Réponse Express
 */
function createSession(sessionId: string, res: express.Response): void {
    let data = "";
    const request = https.request(OpenVidu.getOptions(RequestMethod.POST, "/openvidu/api/sessions"), (r) => {
        r.on("data", (chunk) => {
            data += chunk;
        });

        r.on("end", () => {
            if (isValidStatusCode(r.statusCode as number)) {
                const obj = JSON.parse(data);
                connectSession(obj.id, res, false);
            } else {
                console.warn("OpenVidu create error code", r.statusMessage);
                APIResponse.fromFailure(r.statusMessage as string, r.statusCode as number).send(res);
            }
        });
    });

    request.on("error", (err) => {
        console.warn("OpenVidu create error", err);
        APIResponse.fromFailure(err.message, HTTPStatus.BAD_REQUEST).send(res);
    });

    request.write(JSON.stringify({
        customSessionId: sessionId,
    }));

    request.end();
}

/**
 * Connexion à une session existante
 * @param sessionId ID de la session Rocket.chat
 * @param res Réponse Express
 * @param allowCreation Crée la salle si n'existant pas encore
 */
function connectSession(sessionId: string, res: express.Response, allowCreation: boolean): void {
    const path = `/openvidu/api/sessions/${sessionId}/connection`;
    let data = "";

    const request = https.request(OpenVidu.getOptions(RequestMethod.POST, path), (r) => {
        r.on("data", (chunk) => {
            data += chunk;
        });

        r.on("end", () => {
            if (r.statusCode === HTTPStatus.NOT_FOUND) {
                if (allowCreation) {
                    createSession(sessionId, res);
                } else {
                    APIResponse.fromFailure(Language.get("videoconference.not-found"), HTTPStatus.NOT_FOUND).send(res);
                }
            } else if (isValidStatusCode(r.statusCode as number)) {
                APIResponse.fromSuccess(VideoConferenceConnection.fromObject(JSON.parse(data)), r.statusCode).send(res);
            } else {
                console.warn("OpenVidu connect error code", r.statusMessage);
                APIResponse.fromFailure(r.statusMessage as string, r.statusCode as number).send(res);
            }
        });
    });

    request.on("error", (err) => {
        console.warn("OpenVidu connect error", err);
        APIResponse.fromFailure(err.message, HTTPStatus.BAD_REQUEST).send(res);
    });

    request.write(JSON.stringify({
        sessionId,
    }));

    request.end();
}

module.exports = APIRequest.post(schema, true, (req, res) => {
    connectSession(req.query.sessionId as string, res, true);
});
