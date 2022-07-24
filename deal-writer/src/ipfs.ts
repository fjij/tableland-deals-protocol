export async function upload(data: string): Promise<string> {
  const res = await fetch("https://fjij-hackfs2022.deno.dev", {
    method: "PUT",
    body: JSON.stringify({ data }),
    mode: 'cors',
  })
  const { url } = await res.json();
  return url;
}

export async function get(url: string): Promise<string> {
  const res = await fetch(url, { method: "GET", mode: 'cors' });
  return await res.text();
}
