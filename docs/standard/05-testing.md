# 05 - 测试规范

## 测试框架

| 工具 | 用途 |
|------|------|
| Vitest | 测试运行器。默认环境是 `node` |
| @testing-library/react | 组件测试 |
| fast-check | 属性测试 (Property-based testing) |
| jsdom | 仅当测试文件头部声明 `@vitest-environment jsdom` 时使用 |

## CI

`.github/workflows/ci.yml` 有两个 job。

`quality`（Lint · Typecheck · Test）依次执行：

1. `npm run lint`：先 `eslint . --max-warnings=0`，再 `npm run lint:guards`
2. `npx tsc --noEmit`
3. `npm test`

`npm test` 是 `vitest run`。`vitest.config.ts` 没有 `include` 过滤，跑的是 Vitest 能发现的全量测试，不是烟测。仓库没有 `test:smoke`。

`quality` 不执行 `npm run build`，也不收集覆盖率。

另有 `secret-scan` job，使用 gitleaks 做密钥扫描。

`tsconfig.json` 的 `exclude` 包含 `scripts`，因此 `npx tsc --noEmit` 不覆盖 `scripts/`。

## 测试环境

`vitest.config.ts` 把 `environment` 设为 `node`，并通过 `setupFiles` 加载 `vitest.setup.ts`。jsdom 只在单个测试文件头部声明 `@vitest-environment jsdom` 时使用。目前有两处：

- `src/components/layout/__tests__/SiteFooter.test.tsx`
- `src/hooks/__tests__/useCanvasHistory.test.tsx`

`vitest.setup.ts` 把 `RATE_LIMIT_DISABLED` 设为 `1`。

## 文件组织

```
src/
├── __tests__/                          # 全局/集成测试
│   ├── proxy.test.ts
│   └── research-data-flow.test.ts
├── lib/
│   ├── __tests__/                      # rate-limit.property10.test.ts
│   ├── api/__tests__/                  # API 工具测试
│   │   ├── withApi.test.ts
│   │   └── withApi.property*.test.ts
│   ├── auth/__tests__/
│   ├── validation/__tests__/
│   ├── upload/__tests__/
│   ├── workshop/__tests__/
│   └── map/__tests__/
├── app/(main)/gallery/[id]/__tests__/  # 页面测试
├── components/
│   ├── layout/__tests__/               # 组件测试
│   └── map/__tests__/
├── hooks/__tests__/
├── stores/__tests__/
└── data/map/__tests__/
```

## 命名规则

| 类型 | 文件名 | 示例 |
|------|--------|------|
| 单元测试 | `*.test.ts(x)` | `withApi.test.ts` |
| 属性测试 | `*.property{N}.test.ts` | `parse.property7.test.ts` |
| 集成测试 | `*.integration.test.ts` | `api-pipeline.integration.test.ts` |

## 测试编写规范

### 单元测试

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('functionName', () => {
  it('应该在正常输入时返回预期结果', () => {
    expect(fn(input)).toBe(expected)
  })

  it('应该在异常输入时抛出错误', () => {
    expect(() => fn(badInput)).toThrow(ExpectedError)
  })
})
```

### 属性测试 (fast-check)

```typescript
import { describe, it } from 'vitest'
import fc from 'fast-check'

describe('parseOrThrow 属性', () => {
  it('对任意合法输入都返回解析结果', async () => {
    await fc.assert(
      fc.asyncProperty(validInputArb, async (input) => {
        const result = parseOrThrow(schema, input)
        expect(result).toBeDefined()
      })
    )
  })
})
```

### Mock 规范

```typescript
// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn() })),
    auth: { getUser: vi.fn() },
  })),
}))

// Mock 环境变量
vi.stubEnv('NODE_ENV', 'production')
```

## 运行命令

```bash
npm run test          # vitest run：Vitest 发现的全量测试（配置无 include 过滤）
npm run test:watch    # 监听模式 (vitest)
```

仓库没有 `test:smoke`。本地 `npm test` 与 CI 的 `quality` job 使用同一条命令。

## 覆盖率目标

下表是目标，不是 CI 门槛。当前没有覆盖率依赖，也没有覆盖率脚本。CI 不收集覆盖率，也不强制这些数字。

| 模块 | 目标 |
|------|------|
| `src/lib/api/` | ≥ 90% |
| `src/lib/auth/` | ≥ 90% |
| `src/lib/validation/` | ≥ 95% |
| `src/components/` | ≥ 70% |
| 整体 | ≥ 80% |
