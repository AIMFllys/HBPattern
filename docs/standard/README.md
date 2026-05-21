# HBPattern 项目规范文档

> **版本**: 1.0 | **更新日期**: 2026-05-15 | **适用范围**: 全栈代码库

---

## 目录

1. [项目架构总览](./01-architecture.md)
2. [API 接口规范](./02-api-specification.md)
3. [命名与编码规范](./03-naming-conventions.md)
4. [安全规范](./04-security.md)
5. [测试规范](./05-testing.md)

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
