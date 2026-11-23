# Magpie for DeepSeek Harness

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Русский](README.ru.md)

基于 [yetone/magpie](https://github.com/yetone/magpie) 开发的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件：一个本地网关，所有服务商，所有 Agent。

> 基于 [yetone/magpie](https://github.com/yetone/magpie) 开发。上游作者 [yetone](https://github.com/yetone)，许可证 MIT，Copyright (c) 2026 yetone。声明见 [NOTICE.md](NOTICE.md)，上游许可证全文见 [LICENSE-MAGPIE](LICENSE-MAGPIE)。本仓库是独立的 DSH 插件，不是 Go 应用的 fork，不包含 Magpie 源码，也不调用 Magpie 可执行文件。Magpie 与 Apache Magpie 及 Apache 软件基金会没有隶属关系。

Magpie 本身是用 Go 写的菜单栏应用。这个插件在 DSH bundle 里重新实现同一套控制面，随 Harness 安装、配置和更新。

## 能做什么

- 本地网关默认 `127.0.0.1:3425`，同时说 OpenAI Chat、OpenAI Responses、Anthropic Messages 和 Gemini。流式输出、工具调用和推理在这四种协议之间互译。
- 服务商预设：DeepSeek、Kimi、智谱 GLM、MiniMax、阶跃星辰、通义千问、火山方舟、OpenRouter、Ollama，以及 Magpie 预设列表里的其余厂商。也支持自定义 OpenAI / Anthropic / Gemini 地址，和订阅账号。
- 每个 Agent 单独选模型、常用短名单、隐藏模型，以及具名方案。
- 路由组：`smart`、`order`、`rotate`、`usage`、`pace`，可嵌套，对话粘在回答过它的账号上，并支持意图路由。
- 隐私脱敏：请求离开这台电脑前把密钥换成占位符，回复、流式文本和工具参数里再换回来。原值只在内存里。脱敏开着却运行不了时，请求会被拦下，不会原样发出。
- 用量、花费、额度、会话和上下文记录。
- 联网搜索（Tavily、Brave、Exa、Firecrawl、You.com、SearXNG，以及 Magpie 的其余搜索源）和按 URL 读取网页。同一套工具也挂在 `/v1/magpie/mcp`。
- 用选定的模型生图、生视频。
- 资料库：指令、MCP、技能和子代理只写一次，按 Agent 渲染；删掉时只删自己写的片段。
- 网关中间件（`onRequest`、`onEvent`、`onResponse`）。钩子抛错或超时，请求原样放行。
- 局域网客户端使用命名密钥，并可设 token 或花费上限；可指向远程上游；加密备份到文件、WebDAV 或 S3。
- **设置 → Magpie**、`magpie` 工具和 `/magpie` 命令做的是同一套操作。

## 安装

在 DeepSeek Harness 里打开 **插件 → 添加插件**，选这个目录。也可以用插件管理器安装这个文件夹。

把任意 Agent 指到网关：

```sh
export OPENAI_BASE_URL=http://127.0.0.1:3425/v1
export OPENAI_API_KEY=magpie
export ANTHROPIC_BASE_URL=http://127.0.0.1:3425
export ANTHROPIC_API_KEY=magpie
```

状态在 `$DSH_HOME/magpie/state.json`（权限 0600）。密钥不会写进 profile 的 patch。

## 和 Magpie 应用的差别

Go 应用会就地改其他 Agent 的配置文件，自带窗口和 TUI，并用 Bun 跑社区 OpenCode 登录插件。DSH 插件拥有不了那些进程。这个 bundle 保留网关、目录、路由、脱敏、用量、搜索、媒体、资料库、中间件、共享和同步，任何能填 base URL 的客户端都能用，包括 DSH 自己。订阅登录接受这台电脑上已经登录过的 token，不会去启动 Claude、Codex 或 Copilot 程序。

## 声明

基于 [yetone/magpie](https://github.com/yetone/magpie) 开发。

| | |
| --- | --- |
| 上游项目 | [github.com/yetone/magpie](https://github.com/yetone/magpie) |
| 作者 | [yetone](https://github.com/yetone) |
| 上游许可证 | MIT，Copyright (c) 2026 yetone（[LICENSE-MAGPIE](LICENSE-MAGPIE)） |
| 本插件 | 面向 DSH 的独立实现，不是 fork，与 Apache Magpie 及 Apache 软件基金会没有隶属关系。 |

## 许可证

MIT。再分发时请保留 [NOTICE.md](NOTICE.md) 和 [LICENSE-MAGPIE](LICENSE-MAGPIE)。
