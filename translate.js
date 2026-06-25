exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const text = body.text, target_lang = body.target_lang, source_lang = body.source_lang || 'JA';
    if (!text || !target_lang) return { statusCode: 400, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ error: 'text and target_lang are required' }) };
    const authKey = process.env.DEEPL_API_KEY;
    if (!authKey) return { statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ error: 'DEEPL_API_KEY is not set' }) };
    const apiBase = process.env.DEEPL_API_BASE || 'https://api-free.deepl.com';
    const deeplRes = await fetch(apiBase + '/v2/translate', {
      method: 'POST',
      headers: { 'Authorization': 'DeepL-Auth-Key ' + authKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: [text], target_lang, source_lang })
    });
    const data = await deeplRes.json().catch(() => ({}));
    if (!deeplRes.ok) return { statusCode: deeplRes.status, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ error: data.message || data.error || 'DeepL API error', detail: data }) };
    return { statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: data.translations?.[0]?.text || '' }) };
  } catch (err) {
    return { statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ error: err.message || 'Server error' }) };
  }
};
