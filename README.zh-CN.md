# dsh-magpie

[English](README.md) · [简体中文](README.zh-CN.md)

DeepSeek Harness 插件：一个本地模型网关。服务商、手机号或浏览器登录、每日签到、路由、用量看板和调度看板都在同一处。

打开 **设置 → Magpie**。同一套操作也可以用 `magpie` 工具和 `/magpie` 命令。

## 看板

- **用量看板**：调用次数、花费、输入和输出 token，以及最近的请求。
- **调度看板**：每一次路由决定，包括路由组、选中的成员和原因。

## 账号

每个供应商一张卡片。手机号登录把验证码发给该供应商，验证码不保留。浏览器登录打开供应商自己的页面。每日签到可以覆盖已登录账号，也可以在卡片上只签一个账号。

## 网关

默认地址：`http://127.0.0.1:3425/v1`

```sh
export OPENAI_BASE_URL=http://127.0.0.1:3425/v1
export OPENAI_API_KEY=magpie
```

状态在 `$DSH_HOME/magpie/state.json`。密钥不会写进 profile 的 patch。

## 许可证

MIT。
