import {sign, verify} from "hono/jwt";
import { env } from "../config";
import type { TokenPayload } from "../types";

export const generateToken = async(payload: TokenPayload, exp?: number) => {
    const token = await sign({
        ...payload,
        exp
    }, 
    env.JWT_SECRET)
    return token
}

export const verifyToken = async(token: string) => {
    const payload = await verify(token, env.JWT_SECRET, "HS256")
    return payload
}