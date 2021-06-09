import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {Response} from "express";
import APIResponse from "helper/APIResponse";
import RocketChat, {RocketChatAuthentication} from "helper/rocketChat";

/**
 * Méthodes de requête
 */
enum RequestMethod {
    /**
     * Récupération, listing. Cacheable
     */
    GET = "GET",

    /**
     * Update, remplace complètement
     */
    PUT = "PUT",

    /**
     * Update, remplace partiellement
     */
    PATCH = "PATCH",

    /**
     * Crée
     */
    POST = "POST",

    /**
     * Supprime
     */
    DELETE = "DELETE",
}

/**
 * Récupère la méthode Axios associée au type de requête associé
 * @param method Méthode, comme GET ou POST
 */
function getMethodFunction(method: RequestMethod) {
    switch (method) {
        case RequestMethod.GET:
            return [axios.get, false];

        case RequestMethod.PUT:
            return [axios.put, true];

        case RequestMethod.PATCH:
            return [axios.patch, true];

        case RequestMethod.POST:
            return [axios.post, true];

        case RequestMethod.DELETE:
            return [axios.delete, false];

        default:
            throw new Error("No such HTTP method");
    }
}

/**
 * Requête à l'API de Rocket.chat
 */
class RocketChatRequest {
    /**
     * Requête
     * @param method Méthode HTTP, comme GET ou POST
     * @param route Route / endpoint
     * @param auth Authentification requise ou non
     * @param res Réponse express
     * @param payload Payload fourni
     * @param onSuccess Fonction appelée en cas de succès HTTP (2XX)
     * @param onFailure Fonction appelée en cas d'échec HTTP
     */
    public static request(method: RequestMethod | string,
                          route: string,
                          auth: RocketChatAuthentication | string | null = null,
                          res: Response,
                          payload: Object | null = {},
                          onSuccess: ((r: AxiosResponse, data: any) => APIResponse) | null = null,
                          onFailure: ((r: AxiosResponse, data: any) => APIResponse) | null = null
    ): void {
        const [methodFunction, usePayload] = getMethodFunction(<RequestMethod>method);

        if (payload === null) {
            payload = {};
        }

        if (<RequestMethod>method === RequestMethod.GET) {
            route = this._setGetPayload(route, payload);
        }

        const requireAuth = auth !== null;

        if (typeof auth === "string") {
            auth = RocketChatAuthentication.fromToken(auth);
        }

        if (requireAuth && auth === null) {
            APIResponse.fromFailure("Invalid token", 401).send(res);
        } else {
            let headers: AxiosRequestConfig = {
                "headers": {
                    "Content-Type": "application/json"
                }
            };

            if (auth !== null) {
                headers.headers["X-User-Id"] = auth.userId;
                headers.headers["X-Auth-Token"] = auth.authToken;
            }

            if (onSuccess === null) {
                onSuccess = (r, data) => {
                    return APIResponse.fromSuccess(null, r.status);
                }
            }

            if (onFailure === null) {
                onFailure = (r, data) => {
                    return APIResponse.fromFailure(r.statusText, r.status);
                }
            }

            let promise;
            if (typeof methodFunction !== "boolean") {
                if (usePayload) {
                    promise = methodFunction(RocketChat.getAPIUrl(route), payload, headers);
                } else {
                    promise = methodFunction(RocketChat.getAPIUrl(route), headers);
                }
            }

            promise.then((r) => {
                if (Math.floor(r.status / 100) === 2) {
                    if (onSuccess === null) {
                        console.error("`onSuccess` shouldn't be null");
                    } else {
                        if (r.data.success !== true && r.data.success !== undefined) {
                            console.log("`r.data.success` is not true. Value:", r.data.success);
                        }

                        onSuccess(r, r.data).send(res);
                    }
                } else {
                    if (onFailure === null) {
                        console.error("`onFailure` shouldn't be null");
                    } else {
                        onFailure(r, r.data).send(res);
                    }
                }
            }).catch((err) => {
                if (err.code && err.code === "ECONNREFUSED") {
                    console.error("Connection refused with Rocket.chat");
                    APIResponse.fromFailure("Connection refused", 500).send(res);
                } else if (err.response) {
                    if (onFailure === null) {
                        console.error("`onFailure` shouldn't be null");
                    } else {
                        onFailure(err.response, err.response.data).send(res);
                    }
                } else {
                    console.debug(err);
                    APIResponse.fromFailure("Unknown error", 500).send(res);
                }
            })
        }
    }

    private static _setGetPayload(route: string, payload: Object): string {
        const keys = Object.keys(payload);
        if (keys.length === 0) {
            return route;
        } else {
            route += "?";

            for (const key of keys) {
                route += `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}&`;
            }

            return route.slice(0, -1);
        }
    }
}

export {RocketChatRequest, RequestMethod}
export default RocketChatRequest;
