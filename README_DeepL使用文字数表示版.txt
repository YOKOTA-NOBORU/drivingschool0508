DeepL使用文字数表示版 設定方法

Netlifyの Environment variables に以下を登録してください。

Key:
DEEPL_API_KEY

Value:
DeepL APIキー

無料APIは初期設定で https://api-free.deepl.com を使います。
Pro APIの場合は以下も追加してください。

Key:
DEEPL_API_BASE

Value:
https://api.deepl.com

追加機能:
- メニューの「📊使用量」ボタン
- 使用済み文字数
- 上限文字数
- 残り文字数
- 使用率バー

重要:
netlify/functions/translate.js と netlify/functions/deepl-usage.js が必要です。
ZIP内のフォルダ構造を崩さずにNetlifyへアップロードしてください。
