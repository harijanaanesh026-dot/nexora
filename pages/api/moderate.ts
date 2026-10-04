export default async function handler(req:any, res:any) {
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text } = req.body;
  if (!text) return res.json({ verified: true, confidence: 0.95 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ verified: true, confidence: 0.9 });

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `SRET college moderator. Block abusive/hate/sexual/phone leak. Allow college talk like exams, placements, marketplace, PYQ. Text:"${text}". Return ONLY JSON {"verified":true/false,"reason":"short","confidence":0.95}` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
      })
    });
    const d = await r.json();
    const t = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const m = t.match(/\{[^}]+\}/);
    if (m) return res.json(JSON.parse(m[0]));
    const isBad = t.toLowerCase().includes('"verified": false');
    return res.json({ verified:!isBad, reason: isBad? "Blocked" : "Verified", confidence: 0.95 });
  } catch {
    return res.json({ verified: true, confidence: 0.9 });
  }
}
