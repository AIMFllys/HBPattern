# 云端数据迁移日志（脱敏）

日期：2026-05-23

## 目标

- 目标 Supabase 项目：`AIMFllys_share`
- 范围：验证云端 schema、写入 `scripts/hubei-patterns-research-report.md` 对应调研数据、为无图片纹样写入占位图媒体。

## 执行记录

1. MCP 工具 schema 当前会话不可见；改用 Supabase Management API 和项目环境变量执行验证。
2. `npx prisma db push` 因本机 `.env.local` 数据库密码认证失败未执行 schema 变更。
3. Supabase Management API 验证云端 schema 已具备：
   - `hp_*` 表数量：19
   - `postgis`：已启用
   - `vector`：已启用
4. `npx tsx prisma/seed.ts` 执行成功：
   - 地区：17
   - 工艺：4
   - 非遗记录：10
   - 调研纹样：57
5. 云端复核：
   - `hp_patterns` 总量：93
   - 本次调研种子纹样：57
   - 占位媒体：57

## 安全说明

- 日志未记录 Supabase project ref、数据库连接串、URL、密钥或可复原凭据。
- 云端已有历史数据，本次 seed 使用稳定 UUID upsert，不删除既有数据。
