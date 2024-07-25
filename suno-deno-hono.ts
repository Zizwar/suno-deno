import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import SunoDeno from "https://raw.githubusercontent.com/Zizwar/suno-deno/main/src/SunoDeno.js";

const SESS = Deno.env.get("SESS") || "sess_";
const COOKIE = Deno.env.get("COOKIE") || "__client=eg";

const Suno = async (c) => {
  const sess = c.req.query("sess") || SESS;
  const cookie = c.req.query("cookie") || COOKIE;

  const suno = new SunoDeno(sess, cookie);
  await suno.init();
  return suno;
};

const app = new Hono();

// Add CORS middleware
app.use("*", cors());

app.get("/", async (c) => {
  try {
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
  try {
    const suno = await Suno(c);   
    const limit = await suno.getLimitLeft();
    return c.json({ limit });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/generate-songs", async (c) => {
  try {
    const suno = await Suno(c);
    const payload = await c.req.json();
    const songs = await suno.generateSongs(payload);
    return c.json({ songs });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/generate", async (c) => {
  try {
    const suno = await Suno(c);
    const payload = await c.req.json();
    const songs = await suno.getRequestIds(payload);
    console.log({songs});
    return c.json({ songs });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/search", async (c) => {
  try {
    const suno = await Suno(c);
    //const payload = await c.req.json();
 const q = c.req.query("q") || "gnawa";
 const page = c.req.query("from_index") || 0;
const rank = c.req.query("rank_by") || "trending";
const name = "public_song"+q;
 const payload = {
    "search_queries": [
        {
            name,
            "search_type": "public_song",
            "term": q,
            from_index:page,
            rank_by:rank,
            
        }
    ]
}
const data = await suno.search(payload) || [];
//console.log(data)

const {from_index=0,page_size=20,result:songs=[]} = data?.result[name] || [] 
    //console.log({songs});
    return c.json({from_index,page_size, songs });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/metadata", async (c) => {
  try {
    const suno = await Suno(c);
    const ids = c.req.query("ids")?.split(",") || [];
    const metadata = await suno.getMetadata(ids);
    return c.json({ metadata });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/playlist", async (c) => {
  try {
   // const suno = await Suno(c);
    const id = c.req.query("id") || "1190bf92-10dc-4ce5-968a-7a377f37f984";
    const page = c.req.query("page") || 1;
    //const data = await suno.playlist(id,page);
    const url = 'https://studio-api.suno.ai/api/playlist/'+id+'/?page='+page;
    const response = await fetch(url);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/all-songs", async (c) => {
  try {
    const suno = await Suno(c);
    const songs = await suno.getAllSongs();
    return c.json({ songs });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/song-buffer", async (c) => {
  try {
    const suno = await Suno(c);
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

app.get("/generate-lyrics", async (c) => {
  try {
    const suno = await Suno(c);
    const prompt = await c.req.query("prompt");
    const lyrics = await suno.generateLyrics(prompt);
    return c.json({ lyrics });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);