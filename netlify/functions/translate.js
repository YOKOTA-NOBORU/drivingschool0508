exports.handler = async (event) => {
  try {
    const { text, target_lang } = JSON.parse(event.body);

    const response = await fetch(
      "https://api-free.deepl.com/v2/translate",
      {
        method: "POST",
        headers: {
          Authorization: "DeepL-Auth-Key " + process.env.DEEPL_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: [text],
          target_lang: target_lang,
        }),
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
