# 沙漏停摆

移动端竖屏的杭州刑侦互动文字游戏，平行改编自《空相沙漏》（作者：初禾二）。当前版本 1.5.0。

在线试玩：https://bajibaji.github.io/DancyGame/（线上发布版本可能落后于本地 1.5.0）

## 运行

```powershell
npm install
npm run dev
```

浏览器打开 http://127.0.0.1:5173，建议用开发者工具切到手机竖屏视口（375–430px 宽）。

## 校验

```powershell
npm run check
```

类型检查、ESLint、Vitest（13 个测试文件、105 项测试）、剧本硬约束、版本校验。构建用 `npm run build`。

## 结构

- `src/content/story/`：当前开放序章与第一至第五章，共 438 幕、146 处选择；后段原稿暂时隐藏，第五章结束显示「敬请期待」
- `src/content/`：线索卡、记忆、人物、地点、结局文本
- `src/game/`：状态机、数值、结局判定、推理板
- `src/pages/`、`src/components/`：界面

## 文档

- [试玩说明](docs/试玩说明.md)
- [更新记录](docs/CHANGELOG.md)

## 约束

- 代码零注释
- 文档只放 `docs/`
- 组件来自 ReactBits（`src/components/reactbits`，TS-TW 变体）
- 移动端竖屏优先，桌面端使用工作台布局
