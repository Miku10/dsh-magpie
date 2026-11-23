# Magpie for DeepSeek Harness

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Русский](README.ru.md)

Plugin [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **développé à partir de [yetone/magpie](https://github.com/yetone/magpie)** : une passerelle locale, tous les fournisseurs, tous les agents.

> Développé à partir de [yetone/magpie](https://github.com/yetone/magpie) par [yetone](https://github.com/yetone). Licence amont : MIT, Copyright (c) 2026 yetone. Voir [NOTICE.md](NOTICE.md) et [LICENSE-MAGPIE](LICENSE-MAGPIE). Ce n'est pas un fork de l'application Go.

Magpie est une application de barre de menus écrite en Go. Ce plugin réimplémente ce plan de contrôle dans un bundle DSH et n'appelle pas le binaire Magpie.

## Fonctions

- Passerelle locale sur `127.0.0.1:3425` pour OpenAI Chat, OpenAI Responses, Anthropic Messages et Gemini, avec traduction du flux, des outils et du raisonnement.
- Préréglages (DeepSeek, Kimi, GLM, MiniMax, StepFun, Qwen, Volcengine, OpenRouter, Ollama et le reste de la liste Magpie), points d'accès personnalisés et comptes d'abonnement.
- Modèle par agent, listes courtes, modèles masqués et profils nommés.
- Groupes de routage : `smart`, `order`, `rotate`, `usage`, `pace`, imbriqués, session collante et routage par intention.
- Masquage avant de quitter la machine, rétabli dans la réponse, le flux et les arguments. Les originaux restent en mémoire. Si le masquage est actif mais ne peut pas tourner, la requête ne part pas en clair.
- Usage, coût, quota, sessions et contexte.
- Recherche web (Tavily, Brave, Exa, Firecrawl, You.com, SearXNG et les autres sources Magpie) et lecture d'URL, aussi sur `/v1/magpie/mcp`.
- Image et vidéo avec le modèle choisi.
- Bibliothèque d'instructions, MCP, compétences et sous-agents. La suppression n'enlève que le fragment écrit par Magpie.
- Middleware (`onRequest`, `onEvent`, `onResponse`). Une erreur ou un délai laisse passer la requête.
- Clients du réseau local avec clés nommées et plafonds, amont distant, sauvegarde chiffrée vers un fichier, WebDAV ou S3.
- Les mêmes opérations dans **Réglages → Magpie**, l'outil `magpie` et `/magpie`.

## Installation

Dans DeepSeek Harness : **Plugins → Ajouter un plugin**, puis ce dossier.

```sh
export OPENAI_BASE_URL=http://127.0.0.1:3425/v1
export OPENAI_API_KEY=magpie
export ANTHROPIC_BASE_URL=http://127.0.0.1:3425
export ANTHROPIC_API_KEY=magpie
```

L'état est dans `$DSH_HOME/magpie/state.json` (0600). Les clés ne vont pas dans le correctif du profil.

## Écart avec l'application Magpie

L'application Go modifie les fichiers des autres agents, fournit une fenêtre et un TUI, et lance des plugins de connexion sous Bun. Un plugin DSH ne possède pas ces processus. Ce bundle garde la passerelle, le catalogue, le routage, le masquage, l'usage, la recherche, les médias, la bibliothèque, le middleware, le partage et la synchro. La connexion à un abonnement accepte un jeton déjà présent sur cette machine ; elle ne lance pas Claude, Codex ni Copilot.

## Attribution

Développé à partir de [yetone/magpie](https://github.com/yetone/magpie). Licence amont : MIT, Copyright (c) 2026 yetone. Conserver [NOTICE.md](NOTICE.md) et [LICENSE-MAGPIE](LICENSE-MAGPIE) en cas de redistribution. Aucun lien avec Apache Magpie ni la Apache Software Foundation.

## Licence

MIT.
