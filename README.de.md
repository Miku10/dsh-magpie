# Magpie for DeepSeek Harness

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Русский](README.ru.md)

Ein Plugin für [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), **entwickelt auf Basis von [yetone/magpie](https://github.com/yetone/magpie)**: ein lokales Gateway, jeder Anbieter, jeder Agent.

> Entwickelt auf Basis von [yetone/magpie](https://github.com/yetone/magpie) von [yetone](https://github.com/yetone). Upstream-Lizenz: MIT, Copyright (c) 2026 yetone. Siehe [NOTICE.md](NOTICE.md) und [LICENSE-MAGPIE](LICENSE-MAGPIE). Kein Fork der Go-Anwendung.

Magpie selbst ist eine Menüleisten-Anwendung in Go. Dieses Plugin baut dieselbe Steuerung als DSH-Bundle nach. Es ruft die Magpie-Programmdatei nicht auf.

## Funktionen

- Lokales Gateway auf `127.0.0.1:3425` für OpenAI Chat, OpenAI Responses, Anthropic Messages und Gemini. Streaming, Werkzeugaufrufe und Reasoning werden übersetzt.
- Anbieter-Vorlagen (DeepSeek, Kimi, GLM, MiniMax, StepFun, Qwen, Volcengine, OpenRouter, Ollama und der Rest der Magpie-Liste), eigene Endpunkte und Abonnementkonten.
- Modellwahl je Agent, Kurzlisten, ausgeblendete Modelle und benannte Profile.
- Routing-Gruppen: `smart`, `order`, `rotate`, `usage`, `pace`, verschachtelt, mit fester Sitzung und Intent-Routing.
- Maskierung, bevor eine Anfrage den Rechner verlässt; Wiederherstellung in Antwort, Stream und Werkzeugargumenten. Originale bleiben im Speicher. Schlägt die Maskierung fehl, geht die Anfrage nicht im Klartext hinaus.
- Verbrauch, Kosten, Kontingent, Sitzungen und Kontext.
- Websuche (Tavily, Brave, Exa, Firecrawl, You.com, SearXNG und die übrigen Magpie-Quellen) und URL-Abruf, auch als MCP unter `/v1/magpie/mcp`.
- Bild- und Videoerzeugung mit dem gewählten Modell.
- Bibliothek für Anweisungen, MCP, Skills und Subagenten. Entfernt wird nur der eigene Abschnitt.
- Gateway-Middleware (`onRequest`, `onEvent`, `onResponse`). Ein Fehler oder Timeout lässt die Anfrage unverändert durch.
- LAN-Clients mit benannten Schlüsseln und Grenzen, ein entferntes Upstream, verschlüsselte Sicherung in Datei, WebDAV oder S3.
- Dieselben Vorgänge unter **Einstellungen → Magpie**, mit dem Werkzeug `magpie` und mit `/magpie`.

## Installation

In DeepSeek Harness **Plugins → Plugin hinzufügen** öffnen und dieses Verzeichnis wählen.

```sh
export OPENAI_BASE_URL=http://127.0.0.1:3425/v1
export OPENAI_API_KEY=magpie
export ANTHROPIC_BASE_URL=http://127.0.0.1:3425
export ANTHROPIC_API_KEY=magpie
```

Der Zustand liegt in `$DSH_HOME/magpie/state.json` (0600). Schlüssel kommen nicht in den Profile-Patch.

## Unterschied zur Magpie-Anwendung

Die Go-Anwendung schreibt die Konfiguration anderer Agenten, hat Fenster und TUI und startet Community-Login-Plugins unter Bun. Ein DSH-Plugin kann diese Prozesse nicht besitzen. Dieses Bundle behält Gateway, Katalog, Routing, Maskierung, Verbrauch, Suche, Medien, Bibliothek, Middleware, Freigabe und Sync. Die Anmeldung an ein Abonnement nimmt ein Token, das auf diesem Rechner bereits vorhanden ist, und startet Claude, Codex oder Copilot nicht.

## Herkunft

Entwickelt auf Basis von [yetone/magpie](https://github.com/yetone/magpie). Upstream: MIT, Copyright (c) 2026 yetone. Bei Weitergabe [NOTICE.md](NOTICE.md) und [LICENSE-MAGPIE](LICENSE-MAGPIE) behalten. Keine Verbindung zu Apache Magpie oder der Apache Software Foundation.

## Lizenz

MIT.
