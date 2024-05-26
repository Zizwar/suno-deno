import SenoDeno from "./src/SenoDeno.js";

async function main(sid, cookie) {
  try {
    const suno = new SenoDeno(sid, cookie);

    await suno.init();

    const limit = await suno.getLimitLeft();
    console.log(`${limit} songs left`);

    const payload = {
      gpt_description_prompt: null,
      prompt: `[Intro Clapping]
            سأسافرُ عبرَ الارض
            باحثا في كلِ مكان 
            عن بوكيمون اداةِ السلام
            قوةُ لا تهان
            
            بوكيمون سأجمعها الان
            فلتساندني
            بقوتك ساعدني
            آه لحلمنا الوحيد نحو عالمِ جديد
            
            بوكيمون سأجمعها الان
            لنصرةِ الخير
            لدحرِ الشرِ عن الغير
            علمني و خذ مني 
            بوكيمون ساجمعها الان ساجمعها الان
            
            Yeah
            Every challenge along the way
            With courage I will face
            I will battle every day
            To claim my rightful place
            
            Come with me the time is right
            There's no better team
            Arm and arm we’ll win the fight
            It's always been our dream
            
            بوكيمون سأجمعها الان
            فلتساندني
            بقوتك ساعدني
            آه لحلمنا الوحيد نحو عالم جديد
            بوكيمون سأجمعها الان
            لنصرة الخير
            لدحر الشر عن الغير
            علمني وخذ مني 
            بوكيمون ساجمعها الان
            ساجمعها الان
            
                        `,
      tags: "gypsy",
      make_instrumental: false,
      title: "بوكيمون-gypsy",
      mv: "chirp-v3-5",
      //continue_clip_id: "370d0f5c-7782-4400-9808-7a0a01d5407b",
      //  continue_at: 3,
    };

    const songInfo = await suno.generateSongs(payload);

    console.log({ songInfo });

    const ids = ["7cfa03c5-56bb-4eaa-b5e8-84cf0592da9b"];
    const specificSongs = await suno.getMetadata(ids);

    //    const allSongs = await suno.getAllSongs();

    //  const lyrics = await suno.generateLyrics("حول مدينة مراكش");
    // console.log(lyrics);
  } catch (error) {
    console.error("Error:", error);
  }
}

const cookie = "__client=eyJhbbEg";
const sid = "sess_2gyfPonaEsXq";

main(sid, cookie);
