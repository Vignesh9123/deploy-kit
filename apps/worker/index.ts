// Clone repo to a folder
// Build image
// Query host for free port
// Run image on the free port

import { $ } from "bun";
import { Queue, Worker } from "bullmq";
import {config} from 'dotenv'
import { prisma } from "@deploykit/db";
import { DeploymentStatus } from "@deploykit/db/generated/prisma/enums";

config();

const GIT_REPO_URL = "https://github.com/railwayapp-templates/nextjs-basic.git";
const DEPLOYMENT_SUBDOMAIN = process.env.DEPLOYMENT_SUBDOMAIN;
const DEPLOYMENT_PROTOCOL = process.env.DEPLOYMENT_PROTOCOL;

async function clone_repo(payload: DeploymentPayload) {
  const output = await $`git clone ${payload.repo_url} ./${payload.project_id}`;
  console.log(output);
  return `./${payload.project_id}`;
}

async function build_image(folder: string, payload: DeploymentPayload) {
    const output = await $`railpack build ${folder}`;
    console.log(output);
    return payload.project_id;
}

async function get_free_port() { 
    const response = await fetch("http://host.docker.internal:3030/free-port");
    const data = await response.json() as {port: number};
    console.log("Got free port",data);
    return data.port;
}

async function run_image(image: string, port: number, containerPort: number) {
    const output = await $`docker run -d -p ${port}:${containerPort} ${image}`;
    console.log("Ran image",output);
    const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

const raw = JSON.stringify({
  "http": {
    "servers": {
      "srv0": {
        "listen": [
          ":80"
        ],
        "routes": []
      }
    }
  }
});

const requestOptions = {
  method: "POST",
  headers: myHeaders,
  body: raw,
};

if(process.env.ENVIRONMENT=='dev'){
    await fetch("http://caddy:2019/config/apps", requestOptions)
}
    const body = JSON.stringify({
        "handle": [
          {
            "handler": "subroute",
            "routes": [
              {
                "handle": [
                  {
                    "handler": "reverse_proxy",
                    "upstreams": [
                      {
                        "dial": `host.docker.internal:${port}`
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        "match": [
          {
            "host": [
              `${image}${DEPLOYMENT_SUBDOMAIN}`
            ]
          }
        ],
        "terminal": true
      });
    const res = await fetch(`http://caddy:2019/config/apps/http/servers/srv0/routes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body
    });
    console.log("Response from Caddy",await res.json());
    console.log(`Access image at ${DEPLOYMENT_PROTOCOL}://${image}${DEPLOYMENT_SUBDOMAIN}`);
    return output;
}
interface DeploymentPayload {
  project_id: string, 
  repo_url: string,
  container_port: number,
  deployment_id: string,
}
async function main(payload: DeploymentPayload) {
    try {
        await prisma.deployment.update({
            where: { id: payload.deployment_id },
            data: { status: DeploymentStatus.BUILDING }
        });
        console.log("Cloning repo...",payload.repo_url);
        const folder = await clone_repo(payload);
        console.log("Building image in...",folder);
        const image = await build_image(folder, payload);
        
        console.log("Getting free port...");
        const hostPort = await get_free_port();
        
        await prisma.deployment.update({
            where: { id: payload.deployment_id },
            data: { status: DeploymentStatus.DEPLOYING }
        });
        console.log("Running image...",image,"on port",hostPort);
        await run_image(image, hostPort, payload.container_port);
        console.log(`Image running on port ${hostPort}`);

        await prisma.project.update({
            where: { id: payload.project_id },
            data: { url: `${DEPLOYMENT_PROTOCOL}://${image}${DEPLOYMENT_SUBDOMAIN}` }
        });
        await prisma.deployment.update({
            where: { id: payload.deployment_id },
            data: { status: DeploymentStatus.SUCCESS }
        });
    } catch (error) {
        console.error("Deployment failed:", error);
        await prisma.deployment.update({
            where: { id: payload.deployment_id },
            data: { status: DeploymentStatus.FAILED }
        });
        throw error;
    }
}

// main(payload).catch(console.error);
await new Promise(resolve => setTimeout(resolve, 1000));
const myWorker = new Worker('myqueue', async job => {
  console.log("Running job",job.data);
  await main(job.data);
}, {
  connection: {
    url: process.env.REDIS_URL
  },
});
