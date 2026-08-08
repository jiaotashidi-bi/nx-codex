# 测试收口边界

当前真实基线是 NX 12.0.2.9：

- `nxOpenAssemblyVersion=12.0.2.9`
- adapter `nx12.0.2.9`
- contract `nx12.0.2.9-required-api-v1`
- `compatibilityStatus=verified`

2026-08-04 的只读健康/能力/会话检查显示该基线已连接就绪，但当前没有工作零件；本轮没有创建、打开、修改、保存或导出真实零件。

## 确定性故障注入

严格 Fake 通过 `MockBridgeOptions.faults` 接受按序、一次性消费的规则。规则只能引用协议已有的 `BridgeOperation`；阶段不匹配时不会跳过规则，命中事件可由 `faultEvents` 断言。当前覆盖：

- 模态对话框：在执行前保持管道无响应，客户端只能得到超时；
- NX 断连：关闭当前管道但保持 Fake 可接受下一次请求；
- NX 崩溃：在提交后关闭桥和会话描述；
- 提交后的超时：状态已改变但无响应，用后续只读状态检查证明结果未知，禁止自动重试；
- Named Pipe 重连：桥替换后客户端重新发现新的 pipe；
- 重复 `requestId`：返回 `REPLAY_DETECTED`，不会重复变更；
- 不存在的 API：在严格协议边界返回 `INVALID_REQUEST`，不会落入隐式 Fake API。

测试入口：

```powershell
cd plugins\nx-codex\mcp
npm.cmd run test:faults
npm.cmd run verify
```

测试 Fake 不使用动态伪造对象；协议、状态、事务、Named Pipe 和文件策略都通过真实类型与实际本地管道执行。

## 文件安全测试

路径策略继续拒绝路径穿越、兄弟目录前缀逃逸、junction/reparse point、UNC、`\\.\` / `\\?\` / `\\??\` device path、ADS、保留设备名、错误扩展名、已存在目标和覆盖写入。`.prt`、STEP、PNG 均要求目标不存在；任何拒绝都不会通过规范化、缩短或换根重试来绕过。

## 多版本矩阵

矩阵文件为 `plugins/nx-codex/bridge/api-index/version-matrix.json`。只有 NX 12 行具备真实程序集 API index、严格 required-API contract、typed runtime adapter、live handshake 和版本冒烟证据：

| release | matrix status | runtime policy |
| --- | --- | --- |
| 12.0.2.9 | verified | 可按已验证能力测试 |
| 2306 | unverified | `unsupported`，仅保留只读失败闭合策略 |
| 2312 | unverified | `unsupported`，仅保留只读失败闭合策略 |
| 2412 | unverified | `unsupported`，仅保留只读失败闭合策略 |
| 2512 | unverified | `unsupported`，仅保留只读失败闭合策略 |

未来版本在没有真实 `NXOpen.dll` / `NXOpen.UF.dll` / `NXOpen.Utilities.dll` index、精确 contract、唯一 adapter、严格 Fake 协议测试、真实只读握手和版本冒烟全部通过前，不得改成 `verified`，也不得复用 NX 12 adapter ID。

运行矩阵：

```powershell
cd plugins\nx-codex\mcp
npm.cmd run verify:matrix
```

## 真实 NX 测试护栏

真实 NX 只允许使用 `NXFiles` 下可丢弃的测试零件或其新建副本。测试开始前必须通过 `nx_health`、`nx_get_capabilities` 和 `nx_get_session_state`；不得修改用户当前零件，不得覆盖已有文件，不得触发 CAM 后处理、生产输出、制造导出或发布流程。任何建模写入必须在可丢弃副本上完成，并保留事务 ID 以便 Undo；超时后先读取状态，不能自动重试写入。
