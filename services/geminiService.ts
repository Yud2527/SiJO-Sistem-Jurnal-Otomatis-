import { GoogleGenAI, Type } from "@google/genai";
import { JournalEntry } from "../types";

// Initialize the API client
// CRITICAL: The API key must be available in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBankStatement = async (statementText: string, coaList: string): Promise<JournalEntry[]> => {
  try {
    const modelId = "gemini-2.5-flash"; // Efficient for text processing
    
    const prompt = `
      Anda adalah sistem informasi akuntansi profesional (SiJO). Tugas Anda adalah memproses data mutasi keuangan menjadi Jurnal Umum yang memenuhi Standar Akuntansi Keuangan (SAK/GAAP).
      
      INSTRUKSI KHUSUS (CHART OF ACCOUNTS):
      Gunakan HANYA akun dari daftar di bawah ini. DILARANG membuat nama akun baru.
      
      === MASTER COA ===
      ${coaList}
      ==================
      
      PRINSIP PENJURNALAN (STRICT):
      1. **Double-Entry**: Pastikan setiap transaksi memiliki sisi Debit dan Kredit yang logis (Pasangan Akun).
      2. **Matching Principle**: Cocokkan pendapatan dan beban pada periode yang tepat.
      3. **Kronologis**: Urutkan hasil output berdasarkan TANGGAL transaksi (Terlama ke Terbaru).
      4. **Integritas Data**: Jangan ubah nominal. Nominal harus positif.
      5. **Kelengkapan**: Pastikan field deskripsi jelas dan kategori relevan.

      Data Transaksi Mentah:
      """
      ${statementText}
      """
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Format YYYY-MM-DD" },
              description: { type: Type.STRING, description: "Keterangan transaksi yang jelas dan ringkas" },
              debitAccount: { type: Type.STRING, description: "Akun Debit sesuai COA" },
              creditAccount: { type: Type.STRING, description: "Akun Kredit sesuai COA" },
              amount: { type: Type.NUMBER, description: "Nominal absolut (tanpa tanda negatif)" },
              category: { type: Type.STRING, description: "Kategori: Operasional, Investasi, atau Pendanaan" }
            },
            required: ["date", "description", "debitAccount", "creditAccount", "amount", "category"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Gagal mendapatkan respons dari AI.");
    }

    const parsedData = JSON.parse(jsonText);
    
    // Add IDs to the entries and ensure sorting by date locally as a fallback
    const entriesWithId: JournalEntry[] = parsedData
      .map((item: any, index: number) => ({
        ...item,
        id: `txn-${Date.now()}-${index}`
      }))
      .sort((a: JournalEntry, b: JournalEntry) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return entriesWithId;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Terjadi kesalahan saat menganalisis data. Pastikan API Key valid dan format teks benar.");
  }
};