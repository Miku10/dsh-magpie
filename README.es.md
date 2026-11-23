# Magpie for DeepSeek Harness

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Русский](README.ru.md)

Plugin de [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **desarrollado a partir de [yetone/magpie](https://github.com/yetone/magpie)**: una pasarela local, todos los proveedores, todos los agentes.

> Desarrollado a partir de [yetone/magpie](https://github.com/yetone/magpie) de [yetone](https://github.com/yetone). Licencia original: MIT, Copyright (c) 2026 yetone. Véase [NOTICE.md](NOTICE.md) y [LICENSE-MAGPIE](LICENSE-MAGPIE). No es un fork de la aplicación en Go.

Magpie es una aplicación de barra de menú escrita en Go. Este plugin reimplementa ese plano de control como bundle de DSH y no ejecuta el binario de Magpie.

## Qué hace

- Pasarela local en `127.0.0.1:3425` para OpenAI Chat, OpenAI Responses, Anthropic Messages y Gemini, con traducción de streaming, herramientas y razonamiento.
- Preajustes (DeepSeek, Kimi, GLM, MiniMax, StepFun, Qwen, Volcengine, OpenRouter, Ollama y el resto de la lista de Magpie), extremos propios y cuentas de suscripción.
- Modelo por agente, listas cortas, modelos ocultos y perfiles con nombre.
- Grupos de enrutado: `smart`, `order`, `rotate`, `usage`, `pace`, anidados, sesión fija y enrutado por intención.
- Enmascarado antes de salir del equipo, restaurado en la respuesta, el stream y los argumentos. Los originales solo viven en memoria. Si el enmascarado está activo y no puede ejecutarse, la petición no sale en claro.
- Uso, coste, cuota, sesiones y contexto.
- Búsqueda web (Tavily, Brave, Exa, Firecrawl, You.com, SearXNG y el resto) y lectura por URL, también en `/v1/magpie/mcp`.
- Imagen y vídeo con el modelo elegido.
- Biblioteca de instrucciones, MCP, habilidades y subagentes. Al borrar solo se quita el fragmento propio.
- Middleware (`onRequest`, `onEvent`, `onResponse`). Un error o un tiempo agotado deja pasar la petición.
- Clientes de red local con claves y límites, un origen remoto y copia cifrada a archivo, WebDAV o S3.
- Las mismas operaciones en **Ajustes → Magpie**, la herramienta `magpie` y `/magpie`.

## Instalación

En DeepSeek Harness, **Plugins → Añadir plugin**, y elige este directorio.

```sh
export OPENAI_BASE_URL=http://127.0.0.1:3425/v1
export OPENAI_API_KEY=magpie
export ANTHROPIC_BASE_URL=http://127.0.0.1:3425
export ANTHROPIC_API_KEY=magpie
```

El estado está en `$DSH_HOME/magpie/state.json` (0600). Las claves no se escriben en el parche del perfil.

## Diferencia con la aplicación Magpie

La aplicación en Go edita la configuración de otros agentes, trae ventana y TUI, y ejecuta plugins de inicio de sesión con Bun. Un plugin de DSH no puede poseer esos procesos. Este bundle conserva pasarela, catálogo, enrutado, enmascarado, uso, búsqueda, medios, biblioteca, middleware, uso compartido y sincronización. El inicio de suscripción acepta un token que ya esté en este equipo; no arranca Claude, Codex ni Copilot.

## Atribución

Desarrollado a partir de [yetone/magpie](https://github.com/yetone/magpie). Licencia original: MIT, Copyright (c) 2026 yetone. Al redistribuir, conserva [NOTICE.md](NOTICE.md) y [LICENSE-MAGPIE](LICENSE-MAGPIE). Sin relación con Apache Magpie ni con la Apache Software Foundation.

## Licencia

MIT.
