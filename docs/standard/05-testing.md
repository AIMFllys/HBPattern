# 05 - 测试规范

## 测试框架

| 工具 | 用途 |
|------|------|
| Vitest | 测试运行器 |
| @testing-library/react | 组件测试 |
| fast-check | 属性测试 (Property-based testing) |
| jsdom | DOM 环境模拟 |

## 文件组织

```
src/
├── __tests__/              # 全局/集成测试
│   └── proxy.test.ts
├── lib/
│   ├── api/__tests__/      # API 工具测试
│   │   ├── withApi.test.ts
│   │   └── withApi.property*.test.ts
│   ├── auth/__tests__/
│   ├── validation/__tests__/
│   └── upload/__tests__/
├── app/(main)/gallery/[id]/__tests__/  # 页面测试
└── components/layout/__tests__/        # 组件测试
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
npm run test          # 运行所有测试 (vitest run)
npm run test:watch    # 监听模式 (vitest)
```

## 覆盖率目标

| 模块 | 目标 |
|------|------|
| `src/lib/api/` | ≥ 90% |
| `src/lib/auth/` | ≥ 90% |
| `src/lib/validation/` | ≥ 95% |
| `src/components/` | ≥ 70% |
| 整体 | ≥ 80% |
