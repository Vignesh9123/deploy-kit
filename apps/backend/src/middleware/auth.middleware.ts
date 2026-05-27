import { jwt } from "hono/jwt"
import { env } from "../config"

export const authMiddleware = jwt({
    secret: env.JWT_SECRET,
    alg: 'HS256',
    cookie: "token"
})
