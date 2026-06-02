import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { firebaseApp } from "../config/firebase";
import { getAuth } from "firebase-admin/auth";
import { prisma } from "@deploykit/db";
import { generateToken } from "../utils/jwt";
import { deleteCookie, setCookie } from "hono/cookie";
import { authMiddleware } from "../middleware/auth.middleware";
import type { TokenPayload } from "../types";
import { zValidator } from "@hono/zod-validator";
import * as z from 'zod'
const auth = new Hono();
firebaseApp()
auth.post("/login",
    zValidator('json', z.object({
        idToken: z.string()
    })),
    async (c) => {       
    const {idToken} = c.req.valid('json');
    if(!idToken) throw new HTTPException(400, {message:"Missing required fields"});
    const decodedToken = await getAuth().verifyIdToken(idToken)
    const { name, email } = decodedToken
    if(!name || !email) throw new HTTPException(400, {message:"Missing required fields"});
    const existingUser = await prisma.user.findFirst({where:{ email }});
    if(existingUser) {
        const token = await generateToken({
            id: existingUser.id
        });
        setCookie(c,"token", token, { httpOnly: true , sameSite: "none" ,secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        return c.json({
            message: "Login successful",
            data:{
                user: existingUser,
                token
            }
        });
    }
    const user = await prisma.user.create({data:{ name, email }});
    if(!user) throw new HTTPException(500, {message:"Something went wrong while signing up"});
    const token = await generateToken({
        id: user.id
    });
    setCookie(c,"token", token, { httpOnly: true , sameSite: "none", secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return c.json({
        message: "Login successful",
        data:{
            user,
            token
        }
    });
})

auth.post("/logout",authMiddleware, (c)=>{
    deleteCookie(c,"token");
    return c.json({
        message: "Logout successful"
    })
})

auth.get("/me",authMiddleware,(c)=>{
    const tokenPayload = c.get("jwtPayload") as TokenPayload;
    const userId = tokenPayload.id;
    const user = prisma.user.findUnique({where:{id: userId}});
    if(!user) throw new HTTPException(404, {message:"User not found"});
    return c.json({
        message: "User found",
        data: {
            user
        }
    })

})

export {auth}