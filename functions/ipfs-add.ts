import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

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

async function handler(req: Request) {
  if (req.method !== "PUT") {
    throw new Error("404");
  }
  const { data } = await req.json();
  const url = await upload(data);
  const body = JSON.stringify({ url }, null, 2);
  console.log(body);
  return new Response(body, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

serve(handler);
