# Magpie for DeepSeek Harness

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Русский](README.ru.md)

[yetone/magpie](https://github.com/yetone/magpie) をもとに開発した [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) プラグインです。ローカルゲートウェイひとつで、すべてのプロバイダとエージェントを扱います。

> [yetone/magpie](https://github.com/yetone/magpie) をもとに開発。作者 [yetone](https://github.com/yetone)。上流ライセンスは MIT、Copyright (c) 2026 yetone。[NOTICE.md](NOTICE.md) と [LICENSE-MAGPIE](LICENSE-MAGPIE) を参照。Go アプリの fork ではなく、Magpie のソースも実行ファイルも含みません。

Magpie 本体は Go 製のメニューバーアプリです。このプラグインはその制御面を DSH bundle として再実装し、Harness と一緒に導入・設定・更新します。Magpie の実行ファイルは呼び出しません。

## できること

- 既定のゲートウェイは `127.0.0.1:3425`。OpenAI Chat、OpenAI Responses、Anthropic Messages、Gemini を同時に話し、ストリーム、ツール呼び出し、推論を相互変換します。
- プリセット（DeepSeek、Kimi、GLM、MiniMax、StepFun、Qwen、Volcengine、OpenRouter、Ollama ほか Magpie の一覧）と、任意の OpenAI / Anthropic / Gemini エンドポイント、サブスクリプションアカウント。
- エージェントごとのモデル、ショートリスト、非表示、名前付きプロファイル。
- ルーティンググループ：`smart`、`order`、`rotate`、`usage`、`pace`。入れ子、セッションの固定、意図ルーティング。
- 送信前の秘匿化。応答、ストリーム、ツール引数では元の値に戻します。原文はメモリだけに置きます。秘匿化が有効なのに動けないときは、リクエストをそのまま送りません。
- 使用量、費用、枠、セッション、コンテキストの記録。
- Web 検索（Tavily、Brave、Exa、Firecrawl、You.com、SearXNG ほか）と URL 取得。同じツールを `/v1/magpie/mcp` でも提供します。
- 選んだモデルでの画像生成と動画生成。
- ライブラリ：指示、MCP、スキル、サブエージェントを一度だけ書き、エージェントごとに描画します。削除時は自分の断片だけを消します。
- ゲートウェイミドルウェア（`onRequest`、`onEvent`、`onResponse`）。例外かタイムアウトではリクエストをそのまま通します。
- 名前付きキーと上限を持つ LAN クライアント、リモート上流、ファイル / WebDAV / S3 への暗号化バックアップ。
- **設定 → Magpie**、`magpie` ツール、`/magpie` コマンドは同じ操作です。

## インストール

DeepSeek Harness で **プラグイン → プラグインを追加** を開き、このディレクトリを選びます。

```sh
export OPENAI_BASE_URL=http://127.0.0.1:3425/v1
export OPENAI_API_KEY=magpie
export ANTHROPIC_BASE_URL=http://127.0.0.1:3425
export ANTHROPIC_API_KEY=magpie
```

状態は `$DSH_HOME/magpie/state.json`（0600）です。鍵は profile の patch には書きません。

## Magpie アプリとの違い

Go アプリは他エージェントの設定ファイルを直接編集し、ウィンドウと TUI を持ち、Bun でコミュニティのログインプラグインを動かします。DSH プラグインはそれらのプロセスを所有できません。この bundle はゲートウェイ、カタログ、ルーティング、秘匿化、使用量、検索、メディア、ライブラリ、ミドルウェア、共有、同期を保ち、base URL を設定できるクライアントならどれでも使えます。サブスクリプションは、このコンピュータですでにサインイン済みのトークンを受け取ります。Claude、Codex、Copilot のバイナリは起動しません。

## 表示

[yetone/magpie](https://github.com/yetone/magpie) をもとに開発。上流は MIT、Copyright (c) 2026 yetone。再配布時は [NOTICE.md](NOTICE.md) と [LICENSE-MAGPIE](LICENSE-MAGPIE) を残してください。Apache Magpie および Apache Software Foundation とは関係ありません。

## ライセンス

MIT。
