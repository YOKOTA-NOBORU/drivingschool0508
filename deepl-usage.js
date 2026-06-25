exports.handler = async () => {
  try {
    const authKey = process.env.DEEPL_API_KEY;
    if (!authKey) return { statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ error: 'DEEPL_API_KEY is not set' }) };
    const apiBase = process.env.DEEPL_API_BASE || 'https://api-free.deepl.com';
    const usageRes = await fetch(apiBase + '/v2/usage', {
      method: 'GET',
      headers: { 'Authorization': 'DeepL-Auth-Key ' + authKey }
    });
    const data = await usageRes.json().catch(() => ({}));
    if (!usageRes.ok) return { statusCode: usageRes.status, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ error: data.message || data.error || 'DeepL usage API error', detail: data }) };
    return { statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ character_count: data.character_count, character_limit: data.character_limit, products: data.products || null }) };
  } catch (err) {
    return { statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ error: err.message || 'Server error' }) };
  }
};
