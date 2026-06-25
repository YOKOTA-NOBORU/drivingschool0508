exports.handler = async () => {
  try {
    const authKey = process.env.DEEPL_API_KEY;

    const response = await fetch(
      "https://api-free.deepl.com/v2/usage",
      {
        headers: {
          Authorization: "DeepL-Auth-Key " + authKey,
        },
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
};
