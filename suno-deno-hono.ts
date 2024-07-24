import { Hono } from "npm:hono";
import SunoDeno from "npm:suno-deno";
const SESS = Deno.env.get("SESS")||"sess_";
const COOKIE = Deno.env.get("COOKIE")||"__client=eg";

let suno = new SunoDeno(SESS, COOKIE);

const app = new Hono();

app.get("/", async (c) => {
  try{
     // await suno.init();
    return c.text(`# Suno-Deno
Suno-Deno is a library designed for interacting with the Suno AI music generation service. 
This library provides a comprehensive set of methods to generate songs, retrieve metadata, 
return song links as buffer data, and more.

https://github.com/Zizwar/suno-deno`);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});



app.get("/limit", async (c) => {
  
suno = new SunoDeno(c.req.query("sess")||SESS ,c.req.query("cookie")|| COOKIE);
await suno.init();
  try {
    const limit = await suno.getLimitLeft();
    return c.json({ limit });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/generate-songs", async (c) => {
  
suno = new SunoDeno(c.req.query("sess")||SESS ,c.req.query("cookie")|| COOKIE);
await suno.init();
  try {
    const payload = await c.req.json();
    const songs = await suno.generateSongs(payload);
    return c.json({ songs });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/metadata", async (c) => {
  
suno = new SunoDeno(c.req.query("sess")||SESS ,c.req.query("cookie")|| COOKIE);
await suno.init();
  try {
    const ids = c.req.query("ids")?.split(",") || [];
    const metadata = await suno.getMetadata(ids);
    return c.json({ metadata });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/all-songs", async (c) => {
  
suno = new SunoDeno(c.req.query("sess")||SESS ,c.req.query("cookie")|| COOKIE);
await suno.init();
  try {
    const songs = await suno.getAllSongs();
    return c.json({ songs });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/song-buffer", async (c) => {
  
suno = new SunoDeno(c.req.query("sess")||SESS ,c.req.query("cookie")|| COOKIE);
await suno.init();
  try {
    const url = c.req.query("url");
    const buffer = await suno.getSongBuffer(url);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/generate-lyrics", async (c) => {
  
suno = new SunoDeno(c.req.query("sess")||SESS ,c.req.query("cookie")|| COOKIE);
await suno.init();
  try {
    const { prompt } = await c.req.json();
    const lyrics = await suno.generateLyrics(prompt);
    return c.json({ lyrics });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

try {
await suno.init();
}catch(e){console.log(e)}
Deno.serve(app.fetch);

