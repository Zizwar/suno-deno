# Suno-Deno

Suno-Deno is a library designed for interacting with the Suno AI music generation service. This library provides a comprehensive set of methods to generate songs, retrieve metadata, return song links as buffer data, and more. The initial code for this library is based on the repository [hissincn/suno-ai](https://github.com/hissincn/suno-ai).

## Features

- Generate songs with AI-generated lyrics or custom lyrics
- Retrieve metadata for generated songs
- Return song links as buffer data
- Retrieve remaining song generation credits
- Generate song lyrics with AI

## Installation

To install the library, you need to have [Node.js](https://nodejs.org/) installed. Run the following command to install the necessary dependencies:

```bash
npm install
```

Alternatively, if you are using Deno, no additional dependencies are required.

## Usage

Here's how you can use Suno-Ma to generate and retrieve song links as buffer data:

### 1. Setup
Create a file named `test-my-ai-music.js` and use the following code as an example:

```javascript
import SenoDeno from './SenoDeno.js';

async function main() {
    try {
        const cookie = 'your_cookie';
        const sid = 'your_sid';
        const suno = new SenoDeno(sid, cookie);

        await suno.init();

        const limit = await suno.getLimitLeft();
        console.log(`${limit} songs left`);

        const payload = {
            gpt_description_prompt: null,
            prompt: null,
            tags: null,
            make_instrumental: false,
            title: null,
            mv: 'chirp-v3-0',
            continue_clip_id: null,
            continue_at: null
        };

        const songInfo = await suno.generateSongs(payload);
        for (const song of songInfo) {
            const buffer = await suno.getSongBuffer(song.audio_url);
            console.log(`Song buffer for ${song.title}:`, buffer);
        }

        const ids = ['79742cdf-86c9-432f-81f2-8c2126de42d9', 'ae5ccb5-f4f8-49c9-8f5c-192e43ed9b0c', '0bba671e-b071-4da8-99e7-361b4c69f8b3'];
        const specificSongs = await suno.getMetadata(ids);

        const allSongs = await suno.getAllSongs();

        const lyrics = await suno.generateLyrics("hissin in the kitchen");
        console.log(lyrics);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
```

### 2. Running the Code

To run the code, use the following command:

```bash
node test-my-ai-music
```

Or if you are using Deno:

```bash
deno run --allow-net test-my-ai-music.js
```

### 3. Methods Overview

#### `init()`

Initializes the SenoDeno instance and renews the authentication token.

#### `getLimitLeft()`

Returns the number of song generation credits left.

#### `generateSongs(payload)`

Generates songs based on the provided payload.

#### `getSongBuffer(url)`

Retrieves the song link as buffer data.

#### `getMetadata(ids)`

Retrieves metadata for the specified song IDs.

#### `getAllSongs()`

Retrieves metadata for all generated songs.

#### `generateLyrics(prompt)`

Generates song lyrics based on the provided prompt.

## Example Payloads

### Generate a song with a prompt

```json
{
  "gpt_description_prompt": "a syncopated blues song about how you're always there for me",
  "mv": "chirp-v3-5",
  "prompt": "",
  "make_instrumental": false
}
```

### Generate a song with custom lyrics

```json
{
  "prompt": "[Intro Clapping]\nسأسافرُ عبرَ الارض\nباحثا في كلِ مكان \n عن بوكيمون اداةِ \nالسلام\nقوةُ لا تهان\nبوكيمون سأجمعها الان\nفلتساندني\nبقوتك ساعدني\nآه لحلمنا الوحيد نحو عالمِ جديد",
  "tags": "dreamy kids music",
  "mv": "chirp-v3-0",
  "title": "Lines",
  "make_instrumental": false,
  "continue_clip_id": null,
  "continue_at": null
}
```

### Continue generating a song from a specific point

```json
{
  "prompt": "",
  "tags": "futuristic jazz",
  "mv": "chirp-v3-0",
  "title": "",
  "continue_clip_id": "d55b5269-6bad-4f61-a8f5-871fb124044d",
  "continue_at": 109
}
```

### Remix and continue a song

```json
{
  "prompt": "[Verse]\nWalking down the street, nobody takes a second glance\nLost in the crowd, I'm just a faceless passerby (oh-oh-oh)\n",
  "tags": "electronic hip hop",
  "mv": "chirp-v3-5",
  "title": "Lost in the Shuffle",
  "continue_clip_id": "62ed33cb-f802-47d3-a233-9a7f3fc804a3",
  "continue_at": 90.36
}
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.