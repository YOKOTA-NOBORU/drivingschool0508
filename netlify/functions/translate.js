exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const text = body.text || "";
    const targetLang = body.target_lang || "VI";

    const params = new URLSearchParams();
    params.append("auth_key", process.env.DEEPL_API_KEY);
    params.append("text", text);
    params.append("target_lang", targetLang);
    params.append("source_lang", "JA");

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      body: params
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: data.translations[0].text })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
