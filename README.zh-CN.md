# NX Codex

[English](README.md) | 简体中文

`1.0.0 RC1` 的发布收口、可复现打包流程、SHA-256 校验流程、支持矩阵、
已知限制和本地验证记录，详见
[`docs/RELEASE_1.0.0_RC1.md`](docs/RELEASE_1.0.0_RC1.md)。

## 1.0.0 RC1 状态

RC1 仅正式支持 NXOpen `12.0.2.9`，对应 Adapter 为 `nx12.0.2.9`，
Contract 为 `nx12.0.2.9-required-api-v1`。NX 2306、2312、2412 和 2512
仍为 `unsupported/unverified`，所有写入操作都会以安全失败方式拒绝执行。

RC1 安装包已作为未签名的 GitHub 预发布公开提供。经过验证的安装包、
SHA-256 和完整发布检查清单可从
[`v1.0.0-rc.1` Release](https://github.com/jiaotashidi-bi/nx-codex/releases/tag/v1.0.0-rc.1)
获取，详细记录见
[`docs/RELEASE_1.0.0_RC1.md`](docs/RELEASE_1.0.0_RC1.md)。

NX Codex 是一个以安全为先的 Codex 插件，通过一组强类型、受策略约束的
MCP 工具控制 Siemens NX。当前仓库提供面向 NXOpen `12.0.2.9`、经过实机
验证的 `1.0.0 RC1`，包含：

- Codex 插件和 `nx-engineering` Skill；
- 本地 stdio MCP Server；
- 按 Windows 用户隔离的命名管道协议；
- 运行在 NX 进程内的 C# Bridge；
- 无需 Siemens NX 即可用于开发的 Mock Bridge；
- 只读健康状态、会话状态和装配/制图/CAE/CAM 已激活许可证查询工具，
  有界装配层级与图纸/视图检查，受策略约束的零件文件生命周期，
  事务化的长方体、矩形草图、拉伸、完整旋转、简单通孔、双实体布尔运算、
  四条竖直边圆角创建，精确实体测量，强类型建模预检，特征树证据，
  禁止覆盖的 PNG 截图，联合建模结果验证、STEP 导出和撤销。

Bridge 从不暴露原始 `NXOpen.Session`、`UI` 或 `UFSession` 对象，也不接受
任意 Python、C#、NX Journal 或序列化的 .NET 对象图。

## 使用方法

正常工作流由两个相互独立的加载部分组成：Codex 插件/MCP，以及运行在
NX 内部的 Bridge。

1. 配置克隆或解压后的插件路径，添加仓库 Marketplace，安装插件，然后
   新建一个 Codex 任务：

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass `
     -File .\plugins\nx-codex\scripts\configure-mcp-path.ps1
   codex.cmd plugin marketplace add (Resolve-Path .)
   codex.cmd plugin add nx-codex@personal
   ```

2. 在 NX 12.0.2.9 中，通过 `File > Execute > NX Open` 加载
   `plugins/nx-codex/bridge/NXCodexBridge/bin/Release/NXCodexBridge.dll`；
   也可以使用 `plugins/nx-codex/bridge/install.ps1` 将其安装到明确指定的
   用户启动目录。替换已经加载的 Bridge DLL 前，必须正常退出 NX。

3. 如需执行文件操作，请配置一个明确的允许根目录：

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass `
     -File .\plugins\nx-codex\scripts\configure-file-policy.ps1 `
     -AllowedRoot "$env:USERPROFILE\Documents\UG\NXFiles"
   ```

4. 在新的 Codex 任务中，先执行只读握手：

   ```text
   使用 NX Engineering 调用 nx_health、nx_get_capabilities 和
   nx_get_session_state。不要修改、保存、导出或截图任何内容。
   ```

5. 如需直接建模，请明确说明单位、尺寸、绝对 WCS 坐标，以及是否允许保存。
   Skill 会执行强类型预检和操作后验证；建模不会自动保存。请保留返回的事务
   ID，以便在用户明确要求时调用 `nx_undo_transaction`。

构建、加载 Bridge、文件生命周期、冒烟测试和示例提示词详见
[`docs/SETUP.md`](docs/SETUP.md)。

## 安全边界与限制

- 健康状态、能力、模块检测、会话状态、预检、特征树和测量均为只读操作。
- 装配、制图、CAE 和 CAM 检查只报告当前 NX 会话中已经激活的许可证。
  Bridge 不会申请或释放许可证，也不会为了探测能力而切换应用模块。
- 建模仅限具有事务和验证边界的强类型、有界操作。不运行任意 Python、C#、
  NX Journal 或 Shell 命令。
- 文件工具仅接受已公布允许根目录下的绝对路径，不覆盖目标，也不会强制关闭
  已修改的零件。
- 超时代表执行状态未知；客户端重试前必须先检查 NX 当前状态。

## 路线图

以下计划内容明确不属于 RC1，需要分别进行版本化验证：

- 为 NX 2306、2312、2412 和 2512 分别建立独立的 API index、Contract、
  Adapter 和实机测试通道；
- 增加强类型基准平面和基准轴选择器，以及有界的孔、倒角和高级圆角特征；
- 增加具有依赖关系感知能力的已有特征修改，以及受控的文件生命周期扩展；
- 建立独立治理的 CAM 输出工作流；
- 使用经过审核并固定哈希的自动化配方，避免任意代码注入。

RC1 插件没有启用这些能力。不得仅根据相似的 NX 版本名称或离线 API index
推断其已经可用。

Siemens NX 和 NXOpen 是 Siemens 的产品。本仓库不包含或再分发 Siemens
NXOpen 程序集、许可证或用户零件文件。

## 仓库结构

```text
.agents/plugins/marketplace.json       本地 Codex Marketplace
plugins/nx-codex/
  .codex-plugin/plugin.json            插件清单
  .mcp.json                            MCP 注册配置
  mcp/                                 TypeScript MCP 和 Mock Bridge
  bridge/NXCodexBridge/                运行在 NX 内的 .NET Framework Bridge
  schemas/protocol-v1.schema.json      通信协议
  skills/nx-engineering/               Codex 工作流 Skill
  scripts/                             运行和构建辅助脚本
docs/                                  架构、安全和安装文档
```

## 不安装 NX 的快速验证

要求：Windows 和 Node.js 20 或更高版本。

```powershell
cd plugins\nx-codex\mcp
npm.cmd ci
npm.cmd run verify
```

启动 Mock Bridge：

```powershell
plugins\nx-codex\scripts\start-mock-bridge.cmd
```

在另一个终端中使用 MCP Inspector，或者让 Codex 根据 `.mcp.json` 启动
随插件提供的 MCP Server。

## 当前验证边界

MCP、通信协议、Mock Bridge 和端到端 stdio 流程均可在不安装 NX 的情况下
测试。第一阶段 Bridge 路径也已通过真实交互式 Siemens NX 12.0.2 冒烟测试，
覆盖符合 DLP 安全约束的发现过程、主线程分派、长方体创建、撤销，以及失败
操作回滚。证据和剩余测试矩阵见
[`docs/VALIDATION.md`](docs/VALIDATION.md)，构建和加载说明见
[`docs/SETUP.md`](docs/SETUP.md)。

第二阶段实现增加了 `nx_new_part`、`nx_open_part`、`nx_save_as` 和
`nx_close_part`。MCP 和 NX 内 Bridge 执行相同的当前用户策略：仅允许 `.prt`
本地路径，拒绝重解析点，禁止覆盖，也禁止强制丢弃修改后关闭。

完整第二阶段路径已在交互式 NX 12.0.2.9 中验证，包括长方体创建、另存为、
覆盖拒绝、安全关闭、重新打开，以及特征/实体持久性。

阶段 2B 也已通过完整 MCP 路径验证：由四条线组成的 70 x 40 XY 草图、
15 mm 新实体拉伸、精确的 70 x 40 x 15 包围盒、8900 mm² 面积、
42000 mm³ 体积、保存/关闭/重开，以及只读重新测量。

阶段 2C 增加了严格有界的 360 度新实体旋转，旋转轴必须是明确指定且与
轮廓共面的绝对 WCS X 轴或 Y 轴。自动化测试覆盖环形圆柱体几何、无效轴输入、
轮廓跨轴拒绝和撤销。实机测试发现 NX 12 的高级 `RevolveBuilder` 存在原生
故障后，NX 12 Adapter 改用强类型 UF 旋转封装。Bridge 0.4.2 已通过完整的
交互式 MCP 路径验证，包括精确测量、跨轴轮廓拒绝、撤销、保存/关闭/重开和
只读重新测量。详见 [`docs/VALIDATION.md`](docs/VALIDATION.md)。

阶段 2D 为当前唯一实体增加语义化简单通孔特征。首个严格 Adapter 选择唯一的
绝对 Z 顶部和底部平面，沿 WCS Z 负方向切削，在写入前拒绝歧义面或边缘余量
不足的情况，保持实体数量不变，并支持完整撤销。Bridge 0.5.0 使用强类型
NX 12 `UFModl.CreateSimpleHole` 封装，而不是任意的圆柱体相减降级方案。

阶段 2E 在两个明确选择的当前实体之间增加强类型 `UNITE`、`SUBTRACT` 和
`INTERSECT` 操作。选择使用精确的特征 Journal 标识符；不会推断目标体与工具体
角色；要求存在正体积重叠；分裂或空结果会回滚；成功操作必须创建一个布尔
特征，并消耗且仅消耗一个工具体。

阶段 2F 增加 `nx_fillet_vertical_edges`，这是一个有意限制范围的等半径圆角。
它根据精确的特征 Journal 标识符解析一个当前实体，要求恰好四条与绝对 WCS Z
平行的全高直线边，拒绝大于或等于实体较小 X/Y 尺寸一半的半径，保持实体数量，
并纳入同一撤销/回滚边界。Bridge `0.7.0` 已通过完整的交互式 NX 12.0.2.9
验证，包括预检拒绝、原生圆角创建、解析测量、撤销恢复和保存/关闭/重开。

阶段 3 增加已安装 NXOpen API 的确定性机器可读 index、精确的必需成员
Contract，以及安全失败的运行时版本 Adapter。NXOpen `12.0.2.9` 是第一个
经过验证的基线。其他版本可以执行只读握手，但在各自真实安装矩阵通道、API
Contract、强类型 Adapter 和冒烟测试通过之前，不能写入 NX。详见
[`docs/API_INDEX.md`](docs/API_INDEX.md)。

阶段 4 增加建模证据闭环。Skill 现在会输出一个明确的强类型计划，在执行前
立即调用 `nx_preflight_modeling`，保留基线特征树指纹，并通过会话状态、精确
包围盒/质量属性、已创建的特征树节点和受策略约束的 PNG 截图验证结果。
Bridge `0.9.0` 保持精确的 `nx12.0.2.9` Adapter，以及之前所有安全失败的
文件、版本、事务和任意执行边界。

阶段 5A 增加四个相互独立的只读模块探测工具：
`nx_get_assembly_capability`、`nx_get_drafting_capability`、
`nx_get_cae_capability` 和 `nx_get_cam_capability`。每个工具返回
`available`、`licensed`、`adapterId` 和 `unsupportedReason`；CAE 工具严格
只返回这些字段以及 `applicationName` 和 `compatibilityStatus`。`licensed`
表示当前 NX 会话中已经激活匹配的模块许可证；Bridge 从不调用 `Reserve` 或
`Release`，不切换应用，不初始化 CAM，不创建制图/装配/CAE 数据，也不启动
求解。Bridge `1.0.0` 已通过无工作零件的真实 NXOpen `12.0.2.9` 只读冒烟测试。

阶段 5B 增加 `nx_get_assembly_structure`，这是精确对应 `nx12.0.2.9`
Adapter 的独立只读装配工具。它返回根组件和有界的广度优先层级，包括实例/
原型标识符、压制状态、加载与表示状态、子组件数量、明确的截断元数据，以及
稳定的有界结构指纹。默认限制为深度 8 和 128 个组件实例。调用任何组件树 API
前，它会检查装配许可证是否已经激活；若未激活，则携带明确的 `adapterId` 和
`unsupportedReason` 安全失败。它从不申请/释放许可证、切换应用、加载组件、
修改装配、保存或导出。

阶段 5C 在同一精确版本边界内增加 `nx_get_drafting_structure`。它返回有界的
图纸和制图视图元数据、明确的图纸/视图完整性与截断标记，以及用于重复读取比较
的稳定指纹。调用任何图纸或视图 API 前，工具会检查制图许可证是否已经激活；
它从不申请/释放许可证、切换应用、打开图纸、更新视图、创建注释、保存或导出。

阶段 5D 针对精确的 NXOpen `12.0.2.9` Adapter 强化
`nx_get_cae_capability`。其结果严格包含 `available`、`licensed`、
`applicationName`、`adapterId`、`compatibilityStatus` 和
`unsupportedReason`。它只读取当前应用名称和已激活许可证快照；从不切换
应用、申请或释放许可证、创建 FEM/SIM 数据、划分网格、求解或保存。实机冒烟
测试会读取两次能力，并比较两次读取前后的完整会话/零件状态。

测试收口增加了确定性的严格 Fake 故障注入，覆盖模态对话框、Bridge 断开/
崩溃、提交后超时导致执行状态未知、重放/幂等、命名管道替换/重连，以及协议/
路径安全拒绝。发布矩阵将 NX 12.0.2.9 标记为 `verified`；2306、2312、2412
和 2512 仍为 `unsupported/unverified`，直到每个版本分别具备真实程序集 index、
必需 API Contract、强类型 Adapter、实机握手和版本专属冒烟测试证据。详见
[`docs/TEST_CLOSEOUT.md`](docs/TEST_CLOSEOUT.md)。
