// Clone repo to a folder
// Build image
// Query host for free port
// Run image on the free port

import { $ } from "bun";

const GIT_REPO_URL = "https://github.com/railwayapp-templates/nextjs-basic.git";

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

await fetch("http://caddy:2019/config/apps", requestOptions)
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
              `${image}.localhost`
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
    console.log(`Access image at http://${image}.localhost`);
    return output;
}
interface DeploymentPayload {
  project_id: string, 
  repo_url: string,
  container_port: number
}
async function main(payload: DeploymentPayload) {
    console.log("Cloning repo...",payload.repo_url);
    const folder = await clone_repo(payload);
    console.log("Building image in...",folder);
    const image = await build_image(folder, payload);
    console.log("Getting free port...");
    const hostPort = await get_free_port();
    console.log("Running image...",image,"on port",hostPort);
    await run_image(image, hostPort, payload.container_port);
    console.log(`Image running on port ${hostPort}`);
}

const payload = {
  project_id: crypto.randomUUID(),
  repo_url: GIT_REPO_URL,
  container_port: 3000
}
main(payload).catch(console.error);