DeepL版 設定方法

この版は、スクリーンショットのGoogle翻訳版の見た目・使い方を保ったまま、会話翻訳をDeepLへ変更した版です。

アップロードするファイル:
- index.html
- manifest.json
- service-worker.js
- icon.svg
- netlify/functions/translate.js
- netlify.toml

重要:
NetlifyのEnvironment variablesに DEEPL_API_KEY を設定してください。
設定済みならそのままで大丈夫です。

GitHubに上書き後、Netlifyで Retry without cache with latest branch commit を実行してください。
