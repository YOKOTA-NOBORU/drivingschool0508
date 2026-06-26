GitHubアップロード手順

1. このZIPを解凍します。
2. GitHubのリポジトリを開きます。
3. 既存の古いファイルを削除するか、同名ファイルは上書きします。
4. 解凍後の中身をアップロードします。

正しい構成:
index.html
style.css
script.js
manifest.json
netlify.toml
netlify/functions/translate.js

重要:
translate.js は必ず netlify/functions/ の中に置いてください。
Netlifyの環境変数 DEEPL_API_KEY も必要です。
