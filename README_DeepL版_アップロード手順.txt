DeepL版 設定方法

この版は、アップロードしていただいた元のアプリ画面・165フレーズ・発音表示・お気に入り・履歴などをできるだけそのまま残し、
翻訳処理だけを DeepL + Netlify Function に差し替えた版です。

アップロードするファイル:
- index.html
- manifest.json
- service-worker.js
- icon.svg
- netlify.toml
- netlify/functions/translate.js

重要:
1. Netlify の Environment variables に DEEPL_API_KEY を設定してください。
2. GitHubへは netlify/functions/translate.js のフォルダ構造を崩さずアップロードしてください。
3. アップロード後、Netlifyで Retry without cache with latest branch commit を実行してください。
4. 以前の表示が残る場合は、スマホのChromeでページ更新、またはホーム画面のアイコンを一度削除して追加し直してください。
