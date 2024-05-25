const BASE_URL = 'https://studio-api.suno.ai';
const MAX_RETRY_TIMES = 5;

class SenoDeno {
    constructor(sid, cookie) {
        this.sid = sid;
        this.cookie = cookie;
        this.headers = {
            "Accept-Encoding": "gzip, deflate, br",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            "Cookie": cookie
        };
        this.retryTime = 0;
        this.authUpdateTime = null;


    }



    async init() {
        await this.renewAuth();
    }

    async renewAuth() {
        try {
            const response = await fetch(`https://clerk.suno.com/v1/client/sessions/${this.sid}/tokens?_clerk_js_version=4.72.4`, {
                method: 'POST',
                headers: { Cookie: this.cookie }
            });
            if (!response.ok) throw new Error('Failed to renew auth token');
            const data = await response.json();
            const token = data?.jwt;
            this.headers.Authorization = `Bearer ${token}`;
            this.authUpdateTime = Date.now();
        } catch (error) {
            console.error('Error renewing auth token:', error);
            throw error;
        }
    }

    async getLimitLeft() {
        const response = await fetch(`${BASE_URL}/api/billing/info/`, {
            headers: this.headers
        });
        const data = await response.json();
        return Math.floor(data.total_credits_left / 10);
    }

    async getRequestIds(payload) {
        if (!payload) throw new Error('Payload is required');
        const response = await fetch(`${BASE_URL}/api/generate/v2/`, {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Error response ${response.status}`);
        const data = await response.json();
        return data.clips.map(clip => clip.id);
    }

    async getMetadata(ids = []) {
        const params = ids.length ? `?ids=${ids.join(',')}` : '';
        let retryTimes = 0;

        while (retryTimes <= MAX_RETRY_TIMES) {
            const response = await fetch(`${BASE_URL}/api/feed/${params}`, {
                headers: this.headers
            });
            const data = await response.json();

            if (data.some(item => item.audio_url)) {
                return data;
            }

            retryTimes += 1;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        throw new Error('Failed to retrieve song metadata');
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

    async generateLyrics(prompt) {
        const response = await fetch(`${BASE_URL}/api/generate/lyrics/`, {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        const id = data?.id;

        while (true) {
            const response = await fetch(`${BASE_URL}/api/generate/lyrics/${id}`, {
                headers: this.headers
            });
            const result = await response.json();
            if (result.status === 'complete') return result;
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
}

export default SenoDeno;
