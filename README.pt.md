# Magpie for DeepSeek Harness

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Русский](README.ru.md)

Plugin do [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **desenvolvido a partir de [yetone/magpie](https://github.com/yetone/magpie)**: um gateway local, todos os provedores, todos os agentes.

> Desenvolvido a partir de [yetone/magpie](https://github.com/yetone/magpie), de [yetone](https://github.com/yetone). Licença original: MIT, Copyright (c) 2026 yetone. Veja [NOTICE.md](NOTICE.md) e [LICENSE-MAGPIE](LICENSE-MAGPIE). Não é um fork do aplicativo em Go.

O Magpie é um aplicativo de barra de menus escrito em Go. Este plugin reimplementa esse plano de controle como bundle do DSH e não chama o executável do Magpie.

## O que faz

- Gateway local em `127.0.0.1:3425` para OpenAI Chat, OpenAI Responses, Anthropic Messages e Gemini, com tradução de streaming, ferramentas e raciocínio.
- Predefinições (DeepSeek, Kimi, GLM, MiniMax, StepFun, Qwen, Volcengine, OpenRouter, Ollama e o resto da lista do Magpie), endpoints próprios e contas de assinatura.
- Modelo por agente, listas curtas, modelos ocultos e perfis nomeados.
- Grupos de roteamento: `smart`, `order`, `rotate`, `usage`, `pace`, aninhados, sessão fixa e roteamento por intenção.
- Mascaramento antes de sair do computador, restaurado na resposta, no fluxo e nos argumentos. Os originais ficam só na memória. Se o mascaramento está ligado e não consegue rodar, o pedido não sai em claro.
- Uso, custo, cota, sessões e contexto.
- Busca na web (Tavily, Brave, Exa, Firecrawl, You.com, SearXNG e as outras fontes do Magpie) e leitura de URL, também em `/v1/magpie/mcp`.
- Imagem e vídeo com o modelo escolhido.
- Biblioteca de instruções, MCP, habilidades e subagentes. A remoção apaga só o trecho escrito pelo Magpie.
- Middleware (`onRequest`, `onEvent`, `onResponse`). Um erro ou tempo esgotado deixa o pedido passar.
- Clientes na rede local com chaves nomeadas e limites, origem remota e cópia cifrada para arquivo, WebDAV ou S3.
- As mesmas operações em **Configurações → Magpie**, na ferramenta `magpie` e em `/magpie`.

## Instalação

No DeepSeek Harness, **Plugins → Adicionar plugin**, e escolha esta pasta.

```sh
export OPENAI_BASE_URL=http://127.0.0.1:3425/v1
export OPENAI_API_KEY=magpie
export ANTHROPIC_BASE_URL=http://127.0.0.1:3425
export ANTHROPIC_API_KEY=magpie
```

O estado fica em `$DSH_HOME/magpie/state.json` (0600). As chaves não entram no patch do perfil.

## Diferença para o aplicativo Magpie

O aplicativo em Go edita a configuração dos outros agentes, traz janela e TUI e executa plugins de login com Bun. Um plugin do DSH não possui esses processos. Este bundle mantém gateway, catálogo, roteamento, mascaramento, uso, busca, mídia, biblioteca, middleware, partilha e sincronização. A assinatura aceita um token que já esteja neste computador; não inicia Claude, Codex nem Copilot.

## Atribuição

Desenvolvido a partir de [yetone/magpie](https://github.com/yetone/magpie). Licença original: MIT, Copyright (c) 2026 yetone. Ao redistribuir, mantenha [NOTICE.md](NOTICE.md) e [LICENSE-MAGPIE](LICENSE-MAGPIE). Sem ligação com o Apache Magpie nem com a Apache Software Foundation.

## Licença

MIT.
