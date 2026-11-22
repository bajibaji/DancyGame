# Handoff — 杭州刑侦互动文字游戏

撰写日期：2026-11-22。本文件是跨会话交接的唯一入口，新会话先读本文件再动手。

## 一句话

把小说《空相沙漏[刑侦]》（作者：初禾二）魔改成一款 React 网页文字游戏：悬疑刑侦主题、真实杭州（2015 年地理）、主角江嘉（26 岁女刑警、失忆）、玩家 ABC 三选一、线索/关系/危险三值驱动、好/坏/中立三结局。不接入任何大模型，全部文案与选项预写，纯本地状态机。

## 当前阶段

**MVP 已实现并可玩（2026-11-22）**：React 19 + Vite + TS + Tailwind v4 + motion + Zustand；五屏 UI（标题/叙事/档案库/推理板/结局/设置）全部为移动端竖屏 430px 单列；序章 + 7 章 + 三结局全部预写完成，可从头玩到任一结局。`npm run check`（typecheck + lint + 17 项测试）与 `npm run build` 全绿。

线上地址：https://bajibaji.github.io/DancyGame/ （GitHub Pages，push 到 main 自动部署；仓库 bajibaji/DancyGame，小说原文 book/ 与调研归档 .workflow/ 不入库）。

## 已实现清单

- 引擎：三值（线索/关系/危险）+ 隐藏记忆值、flags、线索卡与记忆碎片、章末推理板（10 组配方）、3-5 秒撤销、localStorage 存档（jiangjia.save.v1）、三结局判定与尾声去留。
- 内容：8 个章节 JSON（74 场景、23 个分支点 × ABC 三选项）、26 张线索卡、10 枚记忆碎片、3 篇结局文本（含旗帜变体与坏结局抵抗段）。
- 组件：22 个 ReactBits 组件（Silk/DarkVeil/Grainient/Lightning/Noise/GradualBlur/TextType/SplitText/BlurText/DecryptedText/GlitchText/CountUp/PixelTransition/StarBorder/SpotlightCard/SpecularButton/HoloCard/FlipCard/ChromaGrid/SquishSwitch/RubberSegment/HoldButton）已从知识库提取并清注释。
- 校验：tests/story-data.test.ts 校验剧情图完整性、选项 ABC、跳转/线索/地点引用、正文长度与禁用词；三结局可达性模拟（安全路线好结局、避险中立、冒进坏结局）。
- 移动端交互（2026-11-22 迭代）：阅读区与选项区上下分离，ABC 选项放在正文末尾的滚动流内，滚到正文底部后淡入并自动滚入视野（不再有独立弹层遮挡正文）；正文中文小说排版（17.5px、1.9 行高、首行缩进 2em、标题竖线强调），角色对白独立成块（换行、左竖线、亮色）；自研 TypedRichText 打字机边打边显示颜色/对白排版（无换轨跳变、逐字不回退）；场景顶部显示「上一步」抉择回执，底部状态栏显示章节进度（如 序章 · 4/8）；推理板改为紧凑线索卡 + 底部固定操作栏（两个选卡槽、推演 n/2、跳过），拇指可达；字号设置同时作用于正文、标题与选项，默认文字速度快、字号小；有存档时主页大按钮为「继续调查」，重新开始需确认弹窗；界面图标统一使用 lucide-react，按钮圆角统一 18px（与开始调查一致）；选项只显示 A/B/C 与文案，不显示倾向/风险/数值；正文人名冷青高亮、点击弹出防剧透人物卡；人物库按出场进度解锁；禁用正文选中与长按菜单；滚动条为 4px 细条、透明轨道、低透明度滑块；全部按钮热区 ≥44px、底部安全区适配、移除键盘提示。
- 运行：`npm run dev` → http://localhost:5173 （建议 375-430px 竖屏视口）。

已知限制：无音频与插画资源；结局抵抗仅为文本展示；坏结局判定的「记忆重置」无独立动画；bundle 约 811KB（gsap + WebGL 组件），未做代码分割。

## 已锁定的用户决策（按时间顺序，后者覆盖前者）

| 决策 | 内容 |
| --- | --- |
| 技术栈 | React；所有 UI 组件使用 ReactBits 标准（本地知识库 G:/AI TOOLS/SHIT/ReactBits知识库）；UI/UX 遵循 .wiki（G:/AI TOOLS/SHIT/.wiki）；要有 motion 动画 |
| 主题 | 悬疑刑侦 |
| 主角 | 江嘉，女性，26 岁，刑警，失忆（早期需求写作「张嘉」，已弃用） |
| 男主 | 战远 |
| 配角 | 原著所有配角名都要更换，不得沿用原著姓名 |
| 地理 | 杭州市真实地理，2015 年数据为准（区划、地铁、机构逻辑按 2015 年） |
| 剧情来源 | 小说《空相沙漏[刑侦]》作者初禾二，照着原著剧情魔改，不是自由创作 |
| 玩法 | 玩家 A/B/C 三选一 → 产生后果 → 改变线索/关系/危险值 → 走向不同结局；至少 3 个结局（好/坏/中立）。选项数量由 ABCD 四选调整为 ABC 三选（2026-11-22 用户确认），不做「破案时刻/推理指认」环节 |
| AI | 取消大模型接入，统一预写文案与选择，减少不可控因素（早期 DeepSeek 研究全部作废） |
| 工程约束 | agent.md 五条：中文思考；代码零注释；文档放 docs/；重复修改固化为 lint；教训固化为确定性检查或框架约束 |

## 已完成的工作与产物

### 1. 知识库侦察（完成）

- ReactBits 知识库：219 个组件的中文蒸馏库，五个分类索引 + 接入指南（React 19 + Tailwind v4 + framer-motion）。
- .wiki：含 HCD、诺曼《日常的设计》、《通用设计法则》、《界面设计模式》（Tidwell）、色彩理论（Dan Scott）、《表单设计体验》、游戏节奏等笔记，以及 pitfall-ui-ux-perf 等踩坑页。

### 2. 通用需求 workflow（完成，结果已归档）

结果 JSON 在 `.workflow/main-*.json`，各部分用途：

| 文件 | 内容 | 状态 |
| --- | --- | --- |
| main-reactbits.json | 24 个 ReactBits 组件推荐清单、安装方式（TS-TW 变体、jsrepo）、依赖画像、注意事项 | 有效 |
| main-wiki.json | UI/UX 设计原则、排版/色彩/布局/交互/动效规范、大鲸鱼专属内容豁免清单 | 有效 |
| main-tech.json | 五屏布局、组件映射、动效方案、视觉定调（暂定名《雨线》）、色彩令牌、里程碑、风险 | 大部分有效；AI 接入相关（Anthropic SDK、Hono 代理、AI 等待态、AI 降级）作废 |
| main-hangzhou.json | 2025 年杭州地理调研 | 仅作参考，最终以 2015 年为准 |
| main-factcheck.json | 地理事实核查 | 参考 |
| main-completeness.json | 需求完整性审查，发现大量跨文档矛盾与通用踩坑 | 通用教训有效（见下），具体叙事矛盾已因改为书籍改编而失效 |
| main-narrative.json | 自由创作的叙事设计（张嘉/林小禾/名册七片等） | 作废，仅供参考 |
| main-llm.json | Claude API 接入方案 | 作废 |

### 3. 原著研读准备（完成）

- 原著文件：`D:\Downloads\《空相沙漏[刑侦]》作者：初禾二.txt`（UTF-8，约 88 万字，139 章）。
- 已切分为 10 个批次：`book/parts/part01.txt` ~ `part10.txt`（每批约 9 万字，保持章节完整）。
- 章节目录：`book/chapters_index.json`（章号、标题、行范围、字符数）。

### 4. 书籍改编 workflow（后台运行中，未完成）

- 脚本：`.claude/workflows` 外的持久路径见下；Run ID `wf_c258f7b1-944`。
- 脚本文件：`C:\Users\dange\.claude\projects\D--Documents-GitHub-jiage\f6a0d4b2-df3d-48c1-915c-6a24b4d836ab\workflows\scripts\novel-to-game-adaptation-wf_c258f7b1-944.js`
- journal（含每个 agent 的完整返回值）：`C:\Users\dange\.claude\projects\D--Documents-GitHub-jiage\f6a0d4b2-df3d-48c1-915c-6a24b4d836ab\subagents\workflows\wf_c258f7b1-944\journal.jsonl`
- 进度：10 个研读 agent 已完成；Synthesize 阶段（novel-synthesis 全书档案 + hangzhou-mapping 2015 地理映射）进行中；之后还有 Adapt（游戏化改编设计）与 Audit（审查）。
- 恢复方式：若会话中断，用 Workflow 工具以 `{scriptPath: "<上面的脚本路径>", resumeFromRunId: "wf_c258f7b1-944"}` 恢复，已完成 agent 走缓存。
- 注意：该 workflow 的改编设计基于旧命名「张嘉」与「接入 AI」的旧需求，取回结果后必须人工修正：主角名 → 江嘉；男主 → 战远；全部配角改名；删除所有 AI 生成边界内容，改为全预写文案。

## 下一步（按序）

1. 用户试玩 MVP，收集可玩性反馈（节奏、难度、文案）。
2. 打磨：音频（雨声/界面音）、记忆插画与结局封面、章节过渡 PixelTransition、代码分割。
3. 平衡性调参：基于模拟结果调整好结局阈值与选项数值。
4. 内容扩写：支线细节、结局变体、二周目快进与章节选择。

## 通用教训（来自 main-completeness 审查与 .wiki，写文档与写代码时必须遵守）

- 数值体系只能有一套：三值 = 线索/关系/危险，全项目唯一，禁止出现第二套（如理智/共情/执念）。
- 选项倾向（三取向）由本地数据固定，不得随机；每个选项必须推进剧情，不设空转选项；不做独立的推理指认环节，全部交互收敛为三选项。
- 三个结局的触发条件必须可编码，并用模拟测试证明三结局都可达、无死锁、无最优解。
- flags 不允许死 flag：写入必须有读取点（结局判定或文本变体）。
- 杭州地名必须与地点白名单完全一致（2015 年区划），场景节点不得引用白名单外地点。
- 真实地名可用，公安机构与人物一律虚构化（合规），显著位置声明纯属虚构。
- 中文排版：正文 18px、行高 1.75–1.9、行宽 640–760px、左对齐、数值 tabular-nums；字体栈必须含中文字体回退。
- ReactBits 中文坑：BlurText 必须 animateBy='letters'（words 按空格分词）；DecryptedText 乱码池要传中文字符集；TextType 无 skip prop，需容器层自建跳过。
- 每屏常驻动效 ≤3 个、每路由 WebGL 主背景 ≤1 个；只动画 transform/opacity；prefers-reduced-motion 全量降级。
- 禁止 transition: all；禁止组件内硬编码色值（用 CSS 变量 token）。
- 2015 杭州事实：临平区、钱塘区 2021 年才设立（2015 年不存在）；2015 年底前地铁仅 1 号线、2 号线东南段、4 号线首通段；富阳 2014 年撤市设区。
- 原著事实：主角原名海姝（28 岁刑侦队长），架空灰涌市/周屏镇；单元剧 + 主线，言情向；游戏需完成年龄差（26 vs 28）、失忆注入、架空地名→杭州映射、单线结局→三结局分支四项改造。

## 路径索引

| 用途 | 路径 |
| --- | --- |
| 工程约束 | `agent.md` |
| 原著全文 | `D:\Downloads\《空相沙漏[刑侦]》作者：初禾二.txt` |
| 原著分批 | `book/parts/part01.txt` ~ `part10.txt` |
| 章节目录 | `book/chapters_index.json` |
| 调研归档 | `.workflow/main-*.json` |
| 文档输出 | `docs/`（本文件、需求文档、改编设计、节奏设计） |
| ReactBits 知识库 | `G:\AI TOOLS\SHIT\ReactBits知识库` |
| .wiki 设计库 | `G:\AI TOOLS\SHIT\.wiki` |
