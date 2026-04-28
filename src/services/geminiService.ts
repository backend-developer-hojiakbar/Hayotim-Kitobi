import { GoogleGenAI } from "@google/genai";
import { BookContent, Memory, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateBook(memories: Memory[], user: User): Promise<BookContent> {
  const userName = `${user.firstName} ${user.lastName}`;
  const relatedPersonsInfo = user.relatedPersons && user.relatedPersons.length > 0
    ? `\nFoydalanuvchining yaqin insonlari haqida ma'lumot:\n${user.relatedPersons.map(p => `- ${p.relation}: ${p.firstName} ${p.lastName} (${p.birthDate}, ${p.address})`).join("\n")}`
    : "";

  const prompt = `
    Foydalanuvchi ismi: ${userName}${relatedPersonsInfo}
    Foydalanuvchi tomonidan kiritilgan xotiralar to'plami:
    ${memories.map(m => `- ${m.text}`).join("\n")}

    Vazifa: Ushbu xotiralardan foydalanib, chiroyli, hissiy va tartibli avtobiografik kitob yaratib ber. 
    Kitob bir nechta boblardan iborat bo'lishi kerak. Har bir bob sarlavhasi bo'lsin.
    Matn o'quvchini hayajonlantiradigan, samimiy va adabiy tilda bo'lishi lozim (o'zbek tilida).
    
    Quyidagi JSON formatda javob qaytar:
    {
      "title": "Kitob sarlavhasi (masalan: 'Mening Hayot Yo'lim')",
      "author": "${userName}",
      "chapters": [
        {
          "title": "Bob sarlavhasi",
          "content": "Bob matni (kamida 2-3 paragraf)"
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
      return JSON.parse(text);
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

export const AI_ENCOURAGEMENTS = [
  "Bu juda ajoyib xotira, davom eting...",
  "Qanday qiziqarli! Bu voqea hayotingizga qanday ta'sir qilgan?",
  "Hissiyotlaringiz juda samimiy, yana biror narsa eslay olasizmi?",
  "Bu lahzalar kitobingiz uchun juda muhim qism bo'ladi.",
  "Sizning tarixingiz o'ziga xos. Yana nimalar bo'lgan edi?"
];
