const BASE_URL = "https://studio-api.suno.ai";
const MAX_RETRY_TIMES = 5;

const VERSION_CLERK= "5.15.0";
class SenoDeno {
  constructor(sid, cookie) {
    this.sid = sid;
    this.cookie = cookie;
    this.headers = {
      "Accept-Encoding": "gzip, deflate, br",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      Cookie: cookie,
    };
    this.retryTime = 0;
    this.authUpdateTime = null;
  }

  async init(jwt) {
    await this.renewAuth(jwt);
  }

  async renewAuth(jwt) {
this.authUpdateTime = Date.now();
if(jwt){
 this.headers.Authorization = `Bearer ${jwt}`;
return;
}
      

    try {
      const response = await fetch(
        `https://clerk.suno.com/v1/client/sessions/${this.sid}/tokens?_clerk_js_version=${VERSION_CLERK}`,
        {
          method: "POST",
          headers: { Cookie: this.cookie },
        }
      );
      if (!response.ok) throw new Error("Failed to renew auth token");
      const data = await response.json();
      const token = data?.jwt;
      this.headers.Authorization = `Bearer ${token}`;
      
    } catch (error) {
      console.error("Error renewing auth token:", error);
      throw error;
    }
  }
  async touch() {
    try {
      const response = await fetch(
        `https://clerk.suno.com/v1/client/sessions/${this.sid}/touch?_clerk_js_version=4.73.4`,
        {
          method: "POST",
          headers: { Cookie: this.cookie },
        }
      );
      if (!response.ok) throw new Error("Failed to get touch clerk");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error get touch sessuib:", error);
      throw error;
    }
  }

  async playlist(id, page = 1,show_trashed=false) {
    const response = await fetch(
      `${BASE_URL}/api/playlist/${id}?page=${page}&show_trashed=${show_trashed}`,
      {
        headers: this.headers,
      }
    );
    const data = await response.json();
    return data;
  }
  async getCreatorInfo(id) {
    const response = await fetch(
      `${BASE_URL}/api/user/get-creator-info/${id}`,
      {
        headers: this.headers,
      }
    );
    const data = await response.json();
    return data;
  }
  async getLimitLeft() {
    const response = await fetch(`${BASE_URL}/api/billing/info/`, {
      headers: this.headers,
    });
    const data = await response.json();
    return Math.floor(data.total_credits_left / 10);
  }

  async getRequestIds(payload) {
    if (!payload) throw new Error("Payload is required");
    const response = await fetch(`${BASE_URL}/api/generate/v2/`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Error response ${response.status}`);
    const data = await response.json();
    return data;
  }

  async getMetadata(ids = []) {
    const params = ids.length ? `?ids=${ids.join(",")}` : "";
    let retryTimes = 0;

    while (retryTimes <= MAX_RETRY_TIMES) {
      const response = await fetch(`${BASE_URL}/api/feed/${params}`, {
        headers: this.headers,
      });
      const data = await response.json();
      return data;
      if (data.some((item) => item.id)) {
        return data;
      }

      retryTimes += 1;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error("Failed to retrieve song metadata");
  }

  async generateSongs(payload) {
    const requestIds = await this.getRequestIds(payload);
    return await this.getMetadata(requestIds);
  }

  async getSongBuffer(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file from ${url}`);
    const buffer = await response.arrayBuffer();
    return buffer;
  }

  async getAllSongs() {
    return await this.getMetadata();
  }
  async search(payload) {
    const response = await fetch(`${BASE_URL}/api/search/`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      /*
            const payload = {
           "search_queries": [
            {
            "name": "public_song"+q,
            "search_type": "public_song",
            "term": "folk",
            "from_index": page,
            rank_by
                }
              ]
             }
            */
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  }
  async generateLyrics(prompt) {
    const response = await fetch(`${BASE_URL}/api/generate/lyrics/`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    const id = data?.id;

    while (true) {
      const response = await fetch(`${BASE_URL}/api/generate/lyrics/${id}`, {
        headers: this.headers,
      });
      const result = await response.json();
      if (result.status === "complete") return result;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

export default SenoDeno;
