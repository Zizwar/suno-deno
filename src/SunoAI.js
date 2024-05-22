import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://studio-api.suno.ai';
const MAX_RETRY_TIMES = 5;

class SunoAI {
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

        this.initializeInterceptors();
    }

    initializeInterceptors() {
        axios.interceptors.request.use(async (config) => {
            if (this.retryTime > MAX_RETRY_TIMES) {
                throw new Error('Exceeded maximum retry attempts.');
            }
            if (config.url.startsWith(BASE_URL) && (!this.authUpdateTime || Date.now() - this.authUpdateTime > 45000)) {
                await this.renewAuth();
            }
            config.headers = this.headers;
            return config;
        });

        axios.interceptors.response.use(
            async (response) => {
                if (response.config.url.startsWith(BASE_URL) && response.data?.detail === 'Unauthorized') {
                    this.retryTime += 1;
                    response = await axios.request(response.config);
                } else {
                    this.retryTime = 0;
                }
                return response;
            },
            async (error) => {
                if (error.config.url.startsWith(BASE_URL) && error.response?.status === 401) {
                    this.retryTime += 1;
                    error.response = await axios.request(error.config);
                } else {
                    this.retryTime = 0;
                }
                return Promise.reject(error.response);
            }
        );
    }

    async init() {
        await this.renewAuth();
    }

    async renewAuth() {
        try {
            const response = await axios.post(`https://clerk.suno.com/v1/client/sessions/${this.sid}/tokens?_clerk_js_version=4.72.4`, null, {
                headers: { Cookie: this.cookie }
            });
            const token = response.data?.jwt;
            this.headers.Authorization = `Bearer ${token}`;
            this.authUpdateTime = Date.now();
        } catch (error) {
            console.error('Error renewing auth token:', error);
            throw error;
        }
    }

    async getLimitLeft() {
        const response = await axios.get(`${BASE_URL}/api/billing/info/`);
        return Math.floor(response.data.total_credits_left / 10);
    }

    async getRequestIds(payload) {
        if (!payload) throw new Error('Payload is required');
        const response = await axios.post(`${BASE_URL}/api/generate/v2/`, payload);
        if (response.status !== 200) throw new Error(`Error response ${response.status}`);
        return response.data.clips.map(clip => clip.id);
    }

    async getMetadata(ids = []) {
        const params = ids.length ? { ids: ids.join(',') } : {};
        let retryTimes = 0;

        while (retryTimes <= MAX_RETRY_TIMES) {
            const response = await axios.get(`${BASE_URL}/api/feed/`, { params });
            const data = response.data;

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

    async saveSongs(songsInfo, outputDir) {
        if (!(await fs.access(outputDir).then(() => true).catch(() => false))) {
            await fs.mkdir(outputDir, { recursive: true });
        }

        for (let [i, songInfo] of songsInfo.entries()) {
            const { title, metadata: { prompt }, audio_url, image_large_url } = songInfo;
            const fileName = `${title.replace(/ /g, '_')}_${i}`;

            await this.saveFile(path.join(outputDir, `${fileName}.json`), JSON.stringify(songInfo, null, 2));
            await this.saveFile(path.join(outputDir, `${fileName}.lrc`), `${title}\n\n${prompt.replace(/\[.*?\]/g, '')}`);
            await this.downloadFile(image_large_url, path.join(outputDir, `${fileName}.png`));
            await this.downloadFile(audio_url, path.join(outputDir, `${fileName}.mp3`));
        }
    }

    async saveFile(filePath, data) {
        await fs.writeFile(filePath, data, 'utf-8');
    }

    async downloadFile(url, filePath) {
        const response = await axios.get(url, { responseType: 'stream' });
        if (response.status !== 200) throw new Error(`Failed to download file from ${url}`);

        const writer = response.data.pipe(fs.createWriteStream(filePath));
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }

    async getAllSongs() {
        return await this.getMetadata();
    }

    async generateLyrics(prompt) {
        const requestId = await axios.post(`${BASE_URL}/api/generate/lyrics/`, { prompt });
        const id = requestId.data?.id;

        while (true) {
            const response = await axios.get(`${BASE_URL}/api/generate/lyrics/${id}`);
            if (response.data?.status === 'complete') return response.data;
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
}

export default SunoAI;
