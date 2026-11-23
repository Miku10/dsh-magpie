# Magpie for DeepSeek Harness

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Русский](README.ru.md)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin **developed from [yetone/magpie](https://github.com/yetone/magpie)** by [yetone](https://github.com/yetone): one local gateway, every provider, every agent.

> Developed from [yetone/magpie](https://github.com/yetone/magpie). Upstream license: MIT, Copyright (c) 2026 yetone. See [NOTICE.md](NOTICE.md) and [LICENSE-MAGPIE](LICENSE-MAGPIE). This repository is an independent DSH plugin. It is not a fork of the Go application, does not ship Magpie's source, and does not call the Magpie binary. Magpie is not affiliated with Apache Magpie or the Apache Software Foundation.

Magpie itself is a menu-bar application written in Go. This plugin reimplements that control plane inside a DSH bundle so it installs, configures, and updates with the Harness.

## What it does

- Local gateway on `127.0.0.1:3425` speaking OpenAI Chat, OpenAI Responses, Anthropic Messages, and Gemini, with streaming, tool calls, and reasoning translated between them.
- Provider presets (DeepSeek, Kimi, GLM, MiniMax, StepFun, Qwen, Volcengine, OpenRouter, Ollama, and the rest of the Magpie preset list), custom OpenAI or Anthropic endpoints, and subscription accounts.
- Per-agent model selection, shortlists, hidden models, and named profiles.
- Routing groups: `smart`, `order`, `rotate`, `usage`, `pace`, nested groups, sticky sessions, and intent routing.
- Secret masking before a request leaves the machine, restored in the reply, including streamed text and tool arguments. Originals stay in memory. Fail-closed when masking is on but cannot run.
- Usage, cost, quota, session, and context records.
- Web search (Tavily, Brave, Exa, Firecrawl, You.com, SearXNG, and the other Magpie search providers) and URL fetch, also exposed as an MCP server on `/v1/magpie/mcp`.
- Image and video generation through the selected model.
- Library of instructions, MCP servers, skills, and subagents, rendered per agent and removed without touching user-written lines.
- Gateway middleware (`onRequest`, `onEvent`, `onResponse`); a throwing or timed-out hook lets the request through.
- LAN clients with named keys and token or spend caps, a remote upstream switch, and encrypted backup to a file, WebDAV, or S3.
- The same operations from **Settings → Magpie**, the `magpie` agent tool, and `/magpie`.

## Install

In DeepSeek Harness: **Plugins → Add plugin**, and choose this directory. Or install the bundle with the plugin manager pointed at this folder.

Point any agent at the gateway:

```sh
export OPENAI_BASE_URL=http://127.0.0.1:3425/v1
export OPENAI_API_KEY=magpie
export ANTHROPIC_BASE_URL=http://127.0.0.1:3425
export ANTHROPIC_API_KEY=magpie
```

State is stored in `$DSH_HOME/magpie/state.json` (mode 0600). Keys are not written into the profile patch.

## Limits relative to the Magpie application

The Go application edits other agents' config files in place, ships a desktop window and TUI, and runs community OpenCode login plugins under Bun. A DSH plugin cannot own those processes. This bundle keeps the gateway, catalog, routing, masking, usage, search, media, library, middleware, sharing, and sync, and exposes them to every client that can set a base URL — including DSH itself. Subscription sign-in accepts a token from an account that is already signed in on this computer; it does not launch Claude, Codex, or Copilot binaries.

## Attribution

Developed from [yetone/magpie](https://github.com/yetone/magpie).

| | |
| --- | --- |
| Upstream | [github.com/yetone/magpie](https://github.com/yetone/magpie) |
| Author | [yetone](https://github.com/yetone) |
| Upstream license | MIT, Copyright (c) 2026 yetone ([LICENSE-MAGPIE](LICENSE-MAGPIE)) |
| This plugin | Independent DeepSeek Harness implementation of the same capability set. Not a fork, and not affiliated with Apache Magpie or the Apache Software Foundation. |

## License

MIT. Keep [NOTICE.md](NOTICE.md) and [LICENSE-MAGPIE](LICENSE-MAGPIE) if you redistribute.
