# Cubed

Web 端魔方求解器，支持 2x2 和 3x3 魔方。拍摄或手动输入魔方状态，即可获得还原步骤和 3D 动画演示。

## 功能

- **四种输入方式**
  - 拍照识别：拍摄 6 个面，自动检测颜色
  - 图案识别：拍摄后手动修正颜色，适用于非标准配色魔方
  - 拓扑拼合：拍摄棱/角交界处，通过颜色空间关系推断状态
  - 手动输入：在展开图上逐格涂色
- **求解引擎**：基于 rubik-solver，生成最优还原步骤
- **3D 预览**：Three.js 渲染，拖拽旋转查看魔方状态
- **步骤动画**：逐步播放还原过程，支持暂停/快进/回退
- **打乱功能**：一键生成随机打乱序列并演示

## 技术栈

- React 18 + TypeScript
- Tailwind CSS 4
- Zustand（状态管理）
- Three.js / React Three Fiber（3D 渲染）
- Vitest（单元测试）

## 开发

```bash
npm install
npm run dev        # 启动开发服务器
npm run test       # 运行测试
npm run build      # 生产构建
```

## 部署

Cloudflare Pages 配置：
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
