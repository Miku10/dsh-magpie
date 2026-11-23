# Magpie for DeepSeek Harness

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Русский](README.ru.md)

Плагин [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), **разработанный на основе [yetone/magpie](https://github.com/yetone/magpie)**: один локальный шлюз, все провайдеры, все агенты.

> Разработан на основе [yetone/magpie](https://github.com/yetone/magpie), автор [yetone](https://github.com/yetone). Лицензия исходного проекта: MIT, Copyright (c) 2026 yetone. См. [NOTICE.md](NOTICE.md) и [LICENSE-MAGPIE](LICENSE-MAGPIE). Это не форк приложения на Go.

Сам Magpie — приложение строки меню на Go. Этот плагин заново реализует ту же плоскость управления как bundle DSH и не вызывает исполняемый файл Magpie.

## Что умеет

- Локальный шлюз на `127.0.0.1:3425` для OpenAI Chat, OpenAI Responses, Anthropic Messages и Gemini. Поток, вызовы инструментов и рассуждение переводятся между протоколами.
- Пресеты (DeepSeek, Kimi, GLM, MiniMax, StepFun, Qwen, Volcengine, OpenRouter, Ollama и остальной список Magpie), свои адреса и аккаунты подписки.
- Модель для каждого агента, короткий список, скрытые модели и именованные профили.
- Группы маршрутизации: `smart`, `order`, `rotate`, `usage`, `pace`, вложенные группы, липкая сессия и маршрутизация по намерению.
- Маскирование до выхода запроса с компьютера и восстановление в ответе, потоке и аргументах. Оригиналы остаются только в памяти. Если маскирование включено, но не работает, запрос не уходит как есть.
- Учёт использования, стоимости, квоты, сессий и контекста.
- Веб-поиск (Tavily, Brave, Exa, Firecrawl, You.com, SearXNG и остальные источники Magpie) и чтение URL, также на `/v1/magpie/mcp`.
- Картинки и видео выбранной моделью.
- Библиотека инструкций, MCP, навыков и субагентов. Удаление снимает только свой фрагмент.
- Промежуточное ПО шлюза (`onRequest`, `onEvent`, `onResponse`). Ошибка или таймаут пропускают запрос без изменений.
- Клиенты локальной сети с именованными ключами и лимитами, удалённый upstream и шифрованная копия в файл, WebDAV или S3.
- Те же действия в **Настройки → Magpie**, инструментом `magpie` и командой `/magpie`.

## Установка

В DeepSeek Harness: **Плагины → Добавить плагин**, затем эта папка.

```sh
export OPENAI_BASE_URL=http://127.0.0.1:3425/v1
export OPENAI_API_KEY=magpie
export ANTHROPIC_BASE_URL=http://127.0.0.1:3425
export ANTHROPIC_API_KEY=magpie
```

Состояние в `$DSH_HOME/magpie/state.json` (0600). Ключи не пишутся в патч профиля.

## Отличие от приложения Magpie

Приложение на Go правит файлы других агентов, имеет окно и TUI и запускает плагины входа под Bun. Плагин DSH не владеет этими процессами. Этот bundle сохраняет шлюз, каталог, маршрутизацию, маскирование, учёт, поиск, медиа, библиотеку, middleware, общий доступ и синхронизацию. Вход в подписку принимает токен, уже имеющийся на этом компьютере, и не запускает Claude, Codex или Copilot.

## Атрибуция

Разработан на основе [yetone/magpie](https://github.com/yetone/magpie). Лицензия исходного проекта: MIT, Copyright (c) 2026 yetone. При распространении сохраните [NOTICE.md](NOTICE.md) и [LICENSE-MAGPIE](LICENSE-MAGPIE). Не связан с Apache Magpie и Apache Software Foundation.

## Лицензия

MIT.
