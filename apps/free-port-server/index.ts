import getPort  from "get-port";
const server = Bun.serve({
    // `routes` requires Bun v1.2.3+
    port: 3030,
    routes: {
      // Static routes
      "/free-port": async ()=>{
        const port = await getPort();
        return Response.json({port});
      }
    },
  
    // (optional) fallback for unmatched routes:
    // Required if Bun's version < 1.2.3
    fetch(req) {
      return new Response("Not Found", { status: 404 });
    },
  });
  
  console.log(`Server running at ${server.url}`);