# HBPattern 项目规范文档

> **版本**: 1.1 | **更新日期**: 2026-11-16 | **适用范围**: 全栈代码库

规范入口就是本文件。历史计划不是规范。

---

## 目录

0. [文档治理](./00-doc-governance.md)
1. [项目架构总览](./01-architecture.md)
2. [API 接口规范](./02-api-specification.md)
3. [命名与编码规范](./03-naming-conventions.md)
4. [安全规范](./04-security.md)
5. [测试规范](./05-testing.md)
6. [文件体积](./06-file-size.md)
7. [死代码](./07-dead-code.md)
8. [文档同步](./08-doc-sync.md)

---

## 快速参考

| 维度 | 规范 |
|------|------|
| 框架 | Next.js 16 (App Router, Turbopack) |
| 语言 | TypeScript 5 (strict mode) |
| 样式 | Tailwind CSS v4 + 设计 Token |
| 数据库 | Supabase PostgreSQL (PostGIS + pgvector) |
| 认证 | Supabase Auth (Email + OAuth) |
| 状态管理 | Zustand (客户端) + TanStack Query (服务端状态) |
| 动画 | motion/react (统一 variants) |
| 验证 | Zod (所有 API 入参) |
| 测试 | Vitest + Testing Library + fast-check |
| 规范入口 | 本文件。历史计划不是规范 |
