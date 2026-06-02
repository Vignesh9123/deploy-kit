import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from 'zod'
import { authMiddleware } from "../middleware/auth.middleware";
import type { TokenPayload } from "../types";
import { prisma } from "@deploykit/db";
import { HTTPException } from "hono/http-exception";
import { DeploymentStatus } from "@deploykit/db/generated/prisma/enums";
import { Queue } from "bullmq";

const deployment = new Hono();

deployment.post("/",
    authMiddleware,
    zValidator('json', z.object({
        name: z.string(),
        projectId: z.string(),
        port: z.number()
    })),
    async (c)=>{
        const tokenPayload = c.get("jwtPayload") as TokenPayload;
        const userId = tokenPayload.id;
        const user = await prisma.user.findUnique({where:{id: userId}});
        if(!user) throw new HTTPException(404, {message:"User not found"});
        const {name, projectId, port} = c.req.valid('json');
        if(!name || !projectId) throw new HTTPException(400, {message:"Missing required fields"});
        const project = await prisma.project.findUnique({where:{id: projectId}, include:{gitRepo: true}});
        if(!project) throw new HTTPException(404, {message:"Project not found"});
        if(project.user_id !== user.id) throw new HTTPException(403, {message:"Forbidden"});
        const deployment = await prisma.deployment.create({data:{name, project_id: project.id, status: DeploymentStatus.PENDING}});
        if(!deployment) throw new HTTPException(500, {message:"Something went wrong while creating deployment"});
        const payload = {
            project_id: project.id,
            repo_url: project.gitRepo.url,
            container_port: port,
            deployment_id: deployment.id,

        }
        const queue = new Queue('myqueue', {
            connection: {
              url: process.env.REDIS_URL
            }
          })
        console.log("Adding job",payload);
        await queue.add("sample",payload);
        return c.json({
            message: "Deployment created",
            data: {
                deployment
            }
        })
    }
)

deployment.get("/:id",
    authMiddleware,
    async (c)=>{
        const tokenPayload = c.get("jwtPayload") as TokenPayload;
        const userId = tokenPayload.id;
        const user = await prisma.user.findUnique({where:{id: userId}});
        if(!user) throw new HTTPException(404, {message:"User not found"});
        const {id} = c.req.param();
        if(!id) throw new HTTPException(400, {message:"Missing required fields"});
        const deployment = await prisma.deployment.findUnique({where:{id}, include:{project: true}});
        if(!deployment) throw new HTTPException(404, {message:"Deployment not found"});
        if(deployment.project.user_id !== user.id) throw new HTTPException(403, {message:"Forbidden"});
        return c.json({
            message: "Deployment found",
            data: {
                deployment
            }
        })
    }
)

deployment.delete("/:id",
    authMiddleware,
    async (c)=>{
        const tokenPayload = c.get("jwtPayload") as TokenPayload;
        const userId = tokenPayload.id;
        const user = await prisma.user.findUnique({where:{id: userId}});
        if(!user) throw new HTTPException(404, {message:"User not found"});
        const {id} = c.req.param();
        if(!id) throw new HTTPException(400, {message:"Missing required fields"});
        const deployment = await prisma.deployment.findUnique({where:{id}, include:{project: true}});
        if(!deployment) throw new HTTPException(404, {message:"Deployment not found"});
        if(deployment.project.user_id !== user.id) throw new HTTPException(403, {message:"Forbidden"});
        await prisma.deployment.delete({where:{id}});
        return c.json({
            message: "Deployment deleted",
            data: {
                deployment
            }
        })
    }
)

deployment.get("/:id/logs",(c)=>{return c.text("")}) // TODO: SSE

export {deployment}