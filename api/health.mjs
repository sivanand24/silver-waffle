export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.statusCode=405; res.setHeader('Allow','GET'); res.end(JSON.stringify({error:'Method not allowed'})); return; }
  res.end(JSON.stringify({geminiConfigured:Boolean(process.env.GEMINI_API_KEY?.trim())}));
}
