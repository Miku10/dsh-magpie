# dsh-magpie

[English](README.md) · [简体中文](README.zh-CN.md)

A DeepSeek Harness plugin for one local model gateway: providers, phone and browser sign-in, daily check-in, routing, a usage board, and a routing board.

Open **Settings → Magpie**. The same operations are the `magpie` tool and `/magpie`.

## Boards

- **Usage** shows calls, spend, input and output tokens, and the latest requests.
- **Routing** shows each decision: which group, which member, and why.

## Accounts

Each provider is a card. Phone sign-in sends a code to that provider and does not keep the code. Browser sign-in opens the provider's own page. Daily check-in can run for every signed-in account, or for one account from its card.

## Gateway

Default address: `http://127.0.0.1:3425/v1`

```sh
export OPENAI_BASE_URL=http://127.0.0.1:3425/v1
export OPENAI_API_KEY=magpie
```

State stays in `$DSH_HOME/magpie/state.json`. Keys are not written into the profile patch.

## License

MIT.
