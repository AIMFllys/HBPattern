// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * SiteFooter 渲染 + a11y 快照测试
 * Validates: Requirement 8.6；design.md §Testing Strategy（快照 / a11y）
 */
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import SiteFooter from '../SiteFooter'

// 将 jest-dom 的 matchers 扩展到 vitest 的 expect
expect.extend(matchers)

// next/link 在 jsdom 环境下需要 mock，避免依赖 Next.js 路由上下文
vi.mock('next/link', () => ({
  default: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

// 每个测试后清理 DOM，防止多次 render 的元素累积
afterEach(() => {
  cleanup()
})

describe('SiteFooter', () => {
  describe('variant="light"', () => {
    it('渲染 role="contentinfo" 的 footer 元素，且文档中只有一个 <footer>', () => {
      const { container } = render(<SiteFooter variant="light" />)
      // getByRole('contentinfo') 对应 <footer role="contentinfo">
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
      // 文档中只有一个 <footer> 元素（Requirement 8.6 / Correctness Property）
      expect(container.querySelectorAll('footer').length).toBe(1)
    })

    it('版权区包含可聚焦的 <a> 元素', () => {
      const { container } = render(<SiteFooter variant="light" />)
      const footer = container.querySelector('footer')!
      // 在 footer 范围内查找所有链接
      const links = within(footer).getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
      // 每个链接都应有 href 属性（可聚焦）
      links.forEach((link) => {
        expect(link).toHaveAttribute('href')
      })
    })
  })

  describe('variant="dark"', () => {
    it('渲染 role="contentinfo" 的 footer 元素，且文档中只有一个 <footer>', () => {
      const { container } = render(<SiteFooter variant="dark" />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
      expect(container.querySelectorAll('footer').length).toBe(1)
    })

    it('版权区包含可聚焦的 <a> 元素', () => {
      const { container } = render(<SiteFooter variant="dark" />)
      const footer = container.querySelector('footer')!
      const links = within(footer).getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
      links.forEach((link) => {
        expect(link).toHaveAttribute('href')
      })
    })
  })

  describe('a11y 结构', () => {
    it('footer 根元素具有 role="contentinfo"', () => {
      const { container } = render(<SiteFooter variant="light" />)
      const footer = container.querySelector('footer')
      expect(footer).not.toBeNull()
      expect(footer).toHaveAttribute('role', 'contentinfo')
    })

    it('dark 变体的 footer 根元素同样具有 role="contentinfo"', () => {
      const { container } = render(<SiteFooter variant="dark" />)
      const footer = container.querySelector('footer')
      expect(footer).not.toBeNull()
      expect(footer).toHaveAttribute('role', 'contentinfo')
    })
  })
})
