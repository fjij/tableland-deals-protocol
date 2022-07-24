import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";

const Authorization = Deno.env.get("NFTPORT_API_KEY") || "";

async function upload(data: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([data]));
  const resp = await fetch("https://api.nftport.xyz/v0/files", {
    method: "POST",
    body: form,
    headers: {
      Authorization,
    },
  });
  const result = await resp.json();
  console.log(result);
  return result["ipfs_url"];
}

const router = new Router();
router.put("/", async (context) => {
  const { data } = await context.request.body({ type: "json" }).value;
  const url = await upload(data);
  context.response.body = { url };
});

const app = new Application();
app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());

console.info("CORS-enabled web server listening on port 8000");
await app.listen({ port: 8000 });
