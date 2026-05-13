import { GoogleGenAI, Modality } from "@google/genai";
import { BookContent, Memory, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function textToSpeech(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `O'zbek tilida, muloyim va aniq ovozda so'zlab ber: ${text.substring(0, 5000)}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio ma'lumotlari yaratilmadi");
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
}

export async function generateBook(
  memories: Memory[], 
  user: User, 
  genre: string, 
  genreDescription?: string
): Promise<BookContent> {
  const userName = `${user.firstName} ${user.lastName}`;
  const relatedPersonsInfo = user.relatedPersons && user.relatedPersons.length > 0
    ? `\nFoydalanuvchining yaqin insonlari haqida ma'lumot:\n${user.relatedPersons.map(p => `- ${p.relation}: ${p.firstName} ${p.lastName} (${p.birthDate}, ${p.address})`).join("\n")}`
    : "";

  const genreContext = genre === 'other' 
    ? `Kitob quyidagi maxsus uslubda yozilishi kerak: ${genreDescription}`
    : `Kitob janri: ${genre}. Iltimos, kitobni ushbu janr talablariga mos keladigan til va atmosfera bilan yozing.`;

  const prompt = `
    Foydalanuvchi ismi: ${userName}${relatedPersonsInfo}
    Tanlangan janr uslubi: ${genreContext}
    
    Foydalanuvchi tomonidan kiritilgan xotiralar to'plami:
    ${memories.map((m, i) => `- ${m.text}${m.imageUrl ? ` [RASM_ID: ${i}]` : ""}`).join("\n")}

    Vazifa: Ushbu xotiralardan foydalanib, chiroyli, hissiy va tartibli avtobiografik kitob yaratib ber. 
    MUHIM: Xotiralar orasida ovozli yozuvdan olingan xatoliklar (masalan: ma'nosiz raqamlar, takrorlangan so'zlar yoki ovozli tanish tizimi xatolari) bo'lishi mumkin. Iltimos, matnni tahrirlashda bunday xatoliklarni olib tashlang va mantiqiy, ravon jumlalar quring.
    
    RASMLAR Haqida: Agar xotirada [RASM_ID: X] belgisi bo'lsa, demak o'sha xotira bilan bog'liq rasm mavjud. Kitobning mos keluvchi boblariga ushbu RASM_ID larni "images" massiviga qo'shing.

    Kitob bir nechta boblardan iborat bo'lishi kerak. Har bir bob uchun matn mazmunidan kelib chiqqan holda qisqa, esda qolarli va mazmundor sarlavha yarating. Sarlavhalar '1-bob' kabi umumiy bo'lmasligi, aksincha bobning asosiy mavzusini (masalan: 'Muzqaymoq sarguzashti' yoki 'Ilk maktab yillari') aks ettirishi lozim.
    Matn o'quvchini hayajonlantiradigan, samimiy va adabiy tilda bo'lim bo'lishi lozim (o'zbek tilida).
    
    Quyidagi JSON formatda javob qaytar:
    {
      "title": "Kitob sarlavhasi (mazmundor va adabiy)",
      "author": "${userName}",
      "chapters": [
        {
          "title": "Bobning qisqa va mazmundor sarlavhasi (bob mavzusini ochib beruvchi)",
          "content": "Bob matni (kamida 2-3 paragraf)",
          "images": ["RASM_ID: X", "RASM_ID: Y"]
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (text) {
      const bookData = JSON.parse(text);
      
      // Map RASM_ID back to actual URLs
      bookData.chapters = bookData.chapters.map((chapter: any) => ({
        ...chapter,
        images: chapter.images 
          ? chapter.images.map((id: string) => {
              const indexMatch = id.match(/RASM_ID: (\d+)/);
              if (indexMatch && indexMatch[1]) {
                const index = parseInt(indexMatch[1]);
                return memories[index]?.imageUrl;
              }
              return null;
            }).filter(Boolean)
          : []
      }));

      return bookData;
    }
    throw new Error("Failed to parse AI response");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: "Mening Hayot Yo'lim",
      author: userName,
      chapters: [
        {
          title: "Kirish",
          content: "Kechirasiz, kitobni yaratishda xatolik yuz berdi. Lekin sizning xotiralaringiz doimo qadrli."
        }
      ]
    };
  }
}

export async function generateChapterTitle(content: string): Promise<string> {
  const prompt = `Ushbu matn uchun qisqa (3-5 so'zli), mazmundor va o'quvchini jalb qiladigan sarlavha yarating. Sarlavha matnning asosiy mohiyatini aks ettirsin va adabiy tilda bo'lsin. Faqat sarlavhaning o'zini qaytaring: ${content.substring(0, 2000)}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text.trim().replace(/^"|"$/g, '') || "Yangi Bob";
  } catch (error) {
    console.error("Title Generation Error:", error);
    return "Yangi Bob";
  }
}

export async function generateVideoScene(memoryText: string): Promise<{ prompt: string; mood: string }> {
  try {
    const prompt = `
You are a professional cinematic AI video generator.

Create a 5–10 second cinematic video scene based on the following life story segment.

STORY:
"${memoryText}"

Requirements:
- Style: ultra-realistic, cinematic, emotional storytelling
- Camera: dynamic movement (slow pan, zoom, or tracking shot)
- Lighting: natural, dramatic lighting depending on mood
- Atmosphere: immersive, detailed environment
- Character: realistic human, expressive face, natural motion
- Emotion: clearly reflect the feeling from the story (e.g. happiness, struggle, nostalgia, success)
- Scene composition: visually rich, meaningful details
- Duration: 5–10 seconds
- Quality: 4K, highly detailed, film-like

Add:
- Time of day
- Environment details
- Character appearance (age, clothes, mood)
- Background elements that support the story

Avoid:
- text on screen
- distortions or unrealistic anatomy
- low quality or blurry visuals

Output:
A single, highly detailed cinematic video description prompt.
Analyze the story and detect:
- Emotion (happy, sad, motivational, dark, etc.)
- Location (city, home, street, office, etc.)
- Time (morning, night, past, childhood, etc.)
- Character type

Then generate a cinematic 5–10 second video prompt.

STORY:
"${memoryText}"

Make the scene:
- emotionally powerful
- visually symbolic if possible
- engaging from first second

Use:
- realistic camera motion
- depth of field
- cinematic color grading

Make it look like a scene from a high-budget movie.
- natural human micro-expressions
- realistic physics
- cinematic film grain
- subtle motion blur
- professional movie lighting

Javobni faqat ingliz tilida, quyidagi JSON formatda qaytar (faqat JSON, hech qanday qo'shimcha matnsiz):
{
  "prompt": "detailed cinematic video description prompt",
  "mood": "detected emotion"
}
`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = result.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Video scene generation error:", error);
    return { 
      prompt: `A nostalgic cinematic scene representing: ${memoryText.substring(0, 50)}, vintage film style, warm lighting`, 
      mood: "nostalgic" 
    };
  }
}

export const AI_ENCOURAGEMENTS = [
  "Bu juda ajoyib xotira, davom eting...",
  "Qanday qiziqarli! Bu voqea hayotingizga qanday ta'sir qilgan?",
  "Hissiyotlaringiz juda samimiy, yana biror narsa eslay olasizmi?",
  "Bu lahzalar kitobingiz uchun juda muhim qism bo'ladi.",
  "Sizning tarixingiz o'ziga xos. Yana nimalar bo'lgan edi?"
];
