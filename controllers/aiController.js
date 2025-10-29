// controllers/aiController.js
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const Report = require('../models/reportModel'); // if you store reports
// init Gemini client (pass apiKey or rely on env var GOOGLE_API_KEY)
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

/**
 * analyzeReport
 * - expects req.body.url (Cloudinary URL) OR req.body.reportId (fetch from DB)
 * - downloads image bytes, converts to base64
 * - calls Gemini generateContent with a multimodal prompt
 */
async function analyzeReport(req, res) {
  try {
    // 1) Get image URL (either from body or DB)
    let imageUrl = req.body.url;
    console.log('analyzeReport called with URL:', imageUrl, 'and reportId:', req.body.reportId);
    if (!imageUrl && req.body.reportId) {
      const report = await Report.findById(req.body.reportId);
      if (!report) return res.status(404).json({ message: 'Report not found' });
      imageUrl = report.filePath || report.url; // store where you keep URL
    }
    if (!imageUrl) return res.status(400).json({ message: 'No image URL provided' });

    // 2) Download image bytes from Cloudinary (or any URL). Use arraybuffer to get raw bytes.
    const imageResp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageResp.data); // Node Buffer

    // Optional: check size before encoding (to avoid >20MB inline)
    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > 18) { // leave margin for prompt and overhead
      return res.status(400).json({ message: 'Image too large for inline upload; use Files API' });
    }

    // 3) Convert to base64
    const base64Image = buffer.toString('base64');
    // determine mime type (axios doesn't always set it). Try to read from headers:
    const mime = imageResp.headers['content-type'] || 'image/jpeg';

    // 4) Build contents for Gemini: first inline image part, then prompt text
    const contents = [
      { inlineData: { mimeType: mime, data: base64Image } },
      // the prompt — adjust to what you want the AI to do
      { text: `You are a medical report analysis assistant. The user will upload a lab report, X-ray result, or ultrasound image.

Your task is to carefully read the uploaded report or image (text extracted from it) and then provide a complete, bilingual explanation (English + Roman Urdu).

Follow these instructions strictly:

Summarize the Report: Explain the overall result of the lab report or image in simple, easy-to-understand language.

Example: “The report shows that your WBC count is slightly higher than normal, which may indicate mild infection.”

(Roman Urdu version below it)

Highlight Abnormal Values: Identify all abnormal or concerning readings (like WBC high, Hb low, cholesterol high, etc.) and explain what they mean in simple terms.

Bilingual Summary: Give every explanation first in English and then immediately in Roman Urdu.
Example:

English: "Your WBC is high, which can be a sign of infection."

Roman Urdu: "Aapka WBC zyada hai, jo kisi infection ki nishani ho sakta hai."

Doctor Questions: Suggest 3–5 questions the user can ask their doctor about this report.
Example: “Should I take antibiotics?”, “Is this condition temporary?”

Food & Lifestyle Advice: Suggest which foods to avoid and which to eat more often based on the report results.

(Keep the advice generic and safe — not medical prescription level.)

Home Remedies: Give 2–3 simple and safe home remedies related to the condition (e.g., “Drink warm water with honey,” “Take rest,” etc.)

Final Note: Always end with this reminder:

“⚠️ Always consult your doctor before making any medical decision.”
Roman Urdu: “⚠️ Hamesha apne doctor se mashwara karein kisi bhi faislay se pehle.”
` }
    ];

    // 5) Call Gemini (choose a model; adjust to the model available in your account)
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // or 'gemini-2.5-flash-vision' / model your account supports
      contents: contents,
    });
console.log('Gemini response:', result);
    // 6) result.text contains generated text (SDK response exposes .text)
    const analysisText = result.text || (result?.output?.[0] && result.output[0].content);

    // 7) Optionally save analysis into DB against the report
    if (req.body.reportId) {
      await Report.findByIdAndUpdate(req.body.reportId, { analysis: analysisText });
    }

    // 8) Return analysis
    // after AI analysis success:
await Report.findByIdAndUpdate(req.body.reportId, {
  analysis: analysisText,
  status: "analyzed",
});

    res.json({ message: 'Analysis complete', analysis: analysisText, raw: result });
  } catch (err) {
    console.error('AI analyze error:', err);
    // If SDK returned an error object, include essential message
    const errMsg = err?.message || 'AI request failed';
    res.status(500).json({ message: errMsg, details: err?.response?.data || null });
  }
}

module.exports = { analyzeReport };
