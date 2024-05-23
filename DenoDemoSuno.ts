import SunoAI from './mod.ts';

async function main() {
    try {
        const cookie = 'your_cookie';
        const sid = 'your_sid';
        const suno = new SunoAI(sid, cookie);

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
        const outputDir = './output';
        await suno.saveSongs(songInfo, outputDir);

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
