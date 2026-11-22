# 沙漏停摆

移动端竖屏的杭州刑侦互动文字游戏。平行改编自《空相沙漏》（作者：初禾二）。

在线试玩：https://lildanger.github.io/shalou-tingbai/

## 运行

```powershell
npm install
npm run dev
```

浏览器打开 http://localhost:5173 ，建议用开发者工具切换到手机竖屏视口（375–430px 宽）。

## 校验

```powershell
npm run check
```

类型检查 + ESLint + Vitest（引擎单测、三结局可达性模拟、剧情图完整性校验）。

## 文档

- docs/需求文档.md
- docs/改编设计.md
- docs/节奏设计.md
- docs/handoff.md

## 约束

- 代码零注释（agent.md）
- 文档只放 docs/
- 组件全部来自 ReactBits（src/components/reactbits，TS-TW 变体）
- 只做移动端竖屏 UI
