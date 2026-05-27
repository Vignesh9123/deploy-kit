import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.middleware";
import type { TokenPayload } from "../types";
import { prisma } from "@deploykit/db";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import * as z from 'zod'

const project = new Hono();

project.get("/",authMiddleware, async (c)=>{
    const tokenPayload = c.get("jwtPayload") as TokenPayload;
    const userId = tokenPayload.id;
    const user = await prisma.user.findUnique({where:{id: userId}});
    if(!user) throw new HTTPException(404, {message:"User not found"});
    const projects = await prisma.project.findMany({where:{user_id: user.id}});
    return c.json({
        message: "Projects found",
        data: {
            projects
        }
    })
})

project.post("/",
    authMiddleware,
    zValidator('json', z.object({
        name: z.string(),
        gitUrl: z.url({
            normalize: true
        }),
    })),
    async(c)=>{
    const tokenPayload = c.get("jwtPayload") as TokenPayload;
    const userId = tokenPayload.id;
    const user = await prisma.user.findUnique({where:{id: userId}});
    if(!user) throw new HTTPException(404, {message:"User not found"});
    const {name, gitUrl} = c.req.valid('json');
    if(!name || !gitUrl) throw new HTTPException(400, {message:"Missing required fields"});
    let gitRepo = await prisma.gitRepository.findFirst({where:{url: gitUrl}});
    if(!gitRepo) {
        gitRepo = await prisma.gitRepository.create({data:{url: gitUrl}});
        if(!gitRepo) throw new HTTPException(500, {message:"Something went wrong while creating git repo"});
    }
    const existingProject = await prisma.project.findFirst({where:{name, user_id: user.id}});
    if(existingProject) throw new HTTPException(400, {message:"Project already exists"});
    const project = await prisma.project.create({data:{name, repo_id: gitRepo.id, user_id: user.id}});
    if(!project) throw new HTTPException(500, {message:"Something went wrong while creating project"});
    return c.json({
        message: "Project created",
        data: {
            project
        }
    })
})

project.get("/:id",authMiddleware,async (c)=>{
    const tokenPayload = c.get("jwtPayload") as TokenPayload;
    const userId = tokenPayload.id;
    const user = await prisma.user.findUnique({where:{id: userId}});
    if(!user) throw new HTTPException(404, {message:"User not found"});
    const {id} = c.req.param();
    if(!id) throw new HTTPException(400, {message:"Missing required fields"});
    const project = await prisma.project.findUnique({where:{id}});
    if(!project) throw new HTTPException(404, {message:"Project not found"});
    if(project.user_id !== user.id) throw new HTTPException(403, {message:"Forbidden"});
    return c.json({
        message: "Project found",
        data: {
            project
        }
    })
})

project.get("/:id/deployments",
    authMiddleware,
    async (c)=>{
        const tokenPayload = c.get("jwtPayload") as TokenPayload;
        const userId = tokenPayload.id;
        const user = await prisma.user.findUnique({where:{id: userId}});
        if(!user) throw new HTTPException(404, {message:"User not found"});
        const {id} = c.req.param();
        if(!id) throw new HTTPException(400, {message:"Missing required fields"});
        const project = await prisma.project.findUnique({where:{id}, include:{deployments: true}});
        if(!project) throw new HTTPException(404, {message:"Project not found"});
        if(project.user_id !== user.id) throw new HTTPException(403, {message:"Forbidden"});
        const deployments = project.deployments;
        return c.json({
            message: "Deployments found",
            data: {
                deployments
            }
        })

    }
)

project.delete("/:id",authMiddleware, async(c)=>{
    const tokenPayload = c.get("jwtPayload") as TokenPayload;
    const userId = tokenPayload.id;
    const user = await prisma.user.findUnique({where:{id: userId}});
    if(!user) throw new HTTPException(404, {message:"User not found"});
    const {id} = c.req.param();
    if(!id) throw new HTTPException(400, {message:"Missing required fields"});
    const project = await prisma.project.findUnique({where:{id}});
    if(!project) throw new HTTPException(404, {message:"Project not found"});
    if(project.user_id !== user.id) throw new HTTPException(403, {message:"Forbidden"});
    await prisma.project.delete({where:{id}});
    return c.json({
        message: "Project deleted",
        data: {
            project
        }
    })
})