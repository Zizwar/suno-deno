import { Hono } from "hono";
import SunoDeno from "suno-deno";

const suno = new SunoDeno("your_sid", "your_cookie");
await suno.init();

const app = new Hono();

app.get("/init", async (c) => {
  try {
    await suno.init();
    return c.json({ message: "Initialized successfully" });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/limit", async (c) => {
  try {
    const limit = await suno.getLimitLeft();
    return c.json({ limit });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/generate-songs", async (c) => {

  try {
    await suno.init();
    const payload = await c.req.json();
    const songs = await suno.generateSongs(payload);
    return c.json({ songs });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/metadata", async (c) => {
  try {
    await suno.init();
    const ids = c.req.query("ids")?.split(",") || [];
    const metadata = await suno.getMetadata(ids);
    return c.json({ metadata });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/all-songs", async (c) => {
  try {
    const songs = await suno.getAllSongs();
    return c.json({ songs });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/song-buffer", async (c) => {
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
  try {
    const { prompt } = await c.req.json();
    const lyrics = await suno.generateLyrics(prompt);
    return c.json({ lyrics });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
