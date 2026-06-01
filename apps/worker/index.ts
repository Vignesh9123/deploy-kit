// Clone repo to a folder
// Build image
// Query host for free port
// Run image on the free port

import { $ } from "bun";

const GIT_REPO_URL = "https://github.com/railwayapp-templates/nextjs-basic.git";

async function clone_repo(url: string) {
  const output = await $`git clone ${url} ./sample`;
  console.log(output);
  return './sample';
}

async function build_image(folder: string) {
    const output = await $`railpack build ${folder}`;
    console.log(output);
    return 'sample';
}

async function get_free_port() { // TODO: Implement this
    // const output = await $`lsof -i :0 -t`;
    // console.log(output);
    return 3030;
}

async function run_image(image: string, port: number) {
    const output = await $`docker run -d -p ${port}:3000 ${image}`;
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

async function main() {
    console.log("Cloning repo...",GIT_REPO_URL);
    const folder = await clone_repo(GIT_REPO_URL);
    console.log("Building image in...",folder);
    const image = await build_image(folder);
    console.log("Getting free port...");
    const port = await get_free_port();
    console.log("Running image...",image,"on port",port);
    await run_image(image, port);
    console.log(`Image running on port ${port}`);
}

main().catch(console.error);