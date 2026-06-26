exports.handler = async function(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "POST only" })
      };
    }

    const input = JSON.parse(event.body || "{}");
    const text = input.text || "";
    const targetLang = input.target_lang || "VI";
    const sourceLang = input.source_lang || "JA";

    if (!process.env.DEEPL_API_KEY) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "DEEPL_API_KEY is not set" })
      };
    }

    if (!text) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "text is required" })
      };
    }

    const params = new URLSearchParams();
    params.append("auth_key", process.env.DEEPL_API_KEY);
    params.append("text", text);
    params.append("target_lang", targetLang);
    params.append("source_lang", sourceLang);

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: data.message || "DeepL API error" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: data.translations && data.translations[0] ? data.translations[0].text : ""
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
