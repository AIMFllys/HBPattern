# 3D 文化地图 Demo 验证记录

日期：2026-05-22

## 范围

- `/map` 本地矢量湖北地图 Demo
- 17 个湖北区域与关键地点数据
- 浏览器本地 `hbpattern.mapDemo.v1` 写入
- 画廊纹样绑定、新建 Demo 纹样、基础分析和刷新持久化

## 验证命令

```bash
npm run test
npm run lint
npm run build
```

结果：

- Vitest：15 个测试文件通过，61 个测试通过。
- ESLint + lint guards：通过。
- Next.js build：通过，`/map` 作为动态路由可构建。

## 浏览器冒烟

使用 Playwright Chromium 访问 `http://localhost:6427/map`：

- 页面渲染“湖北纹样地理溯源”和地图应用区域。
- 区域索引可选择，地图缩放按钮可触发。
- 可搜索画廊纹样并写入 Demo 地图绑定。
- 可新建 Demo 纹样草稿并生成基础分析。
- `localStorage.hbpattern.mapDemo.v1` 在刷新后保留绑定与草稿。

备注：使用 `localhost:6427` 验证；`127.0.0.1:6427` 在当前 dev server 上会触发 HMR host mismatch，影响客户端事件判断。
