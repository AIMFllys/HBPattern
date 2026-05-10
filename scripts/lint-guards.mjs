// lint-guards.mjs
// CI 静态守护脚本 — 检查 src/ 中的禁止模式
//
// 检查项：
// 1. aspect-[${ 动态 Tailwind 类名（Requirement 1.5）
// 2. className/class= 中含 min-screen（Requirement 1.6）
// 3. src/app/api 下 route.ts 中内联 Zod schema（Requirement 3.4.b）
// 4. gallery/[id]/page.tsx 中 mock 数据导入（Requirement 1.1 回归守护）
// 5. 除 SiteFooter.tsx 外的内联 <footer>（Requirement 8.4 / 8.5）
//
// 用法：node scripts/lint-guards.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');

// ─── 工具函数 ────────────────────────────────────────────────────────────────

/**
 * 递归收集满足 predicate 的文件路径（绝对路径）
 * @param {string} dir
 * @param {(filePath: string) => boolean} predicate
 * @returns {string[]}
 */
function collectFiles(dir, predicate) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full, predicate));
    } else if (stat.isFile() && predicate(full)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * 将绝对路径转为相对于项目根目录的路径（使用正斜杠）
 * @param {string} absPath
 * @returns {string}
 */
function relPath(absPath) {
  return relative(ROOT, absPath).split(sep).join('/');
}

/**
 * 在文件内容中搜索正则，返回所有命中行的描述字符串数组
 * @param {string} filePath
 * @param {RegExp} pattern
 * @returns {string[]}
 */
function findMatches(filePath, pattern) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      hits.push(`  ${relPath(filePath)}:${i + 1}: ${lines[i].trim()}`);
    }
  }
  return hits;
}

// ─── 文件集合 ────────────────────────────────────────────────────────────────

/** src/**\/*.{ts,tsx} */
const allTsTsx = collectFiles(SRC, (f) => /\.(ts|tsx)$/.test(f));

/** src/app/api/**\/route.ts */
const apiRouteFiles = collectFiles(
  join(SRC, 'app', 'api'),
  (f) => f.endsWith('route.ts')
);

/** src/app/gallery/[id]/page.tsx（单文件） */
const galleryDetailPage = join(SRC, 'app', 'gallery', '[id]', 'page.tsx');

// ─── 守护检查 ────────────────────────────────────────────────────────────────

let failed = false;

/**
 * 执行一项守护检查
 * @param {string} label 检查名称
 * @param {string[]} hits 命中行描述列表
 */
function check(label, hits) {
  if (hits.length > 0) {
    console.error(`\n✗ [lint-guards] ${label}`);
    for (const hit of hits) {
      console.error(hit);
    }
    failed = true;
  }
}

// ── 检查 1：动态 Tailwind aspect 类名（Requirement 1.5）
// 模式：aspect-[${
{
  const pattern = /aspect-\[\$\{/;
  const hits = allTsTsx.flatMap((f) => findMatches(f, pattern));
  check(
    '动态 Tailwind aspect 类名（`aspect-[${...}]`）在 src/**/*.{ts,tsx} 中必须零命中 [Req 1.5]',
    hits
  );
}

// ── 检查 2：className/class= 中含 min-screen（Requirement 1.6）
// 模式：class(Name)?=["'][^"']*min-screen
{
  const pattern = /class(?:Name)?=["'][^"']*min-screen/;
  const hits = allTsTsx.flatMap((f) => findMatches(f, pattern));
  check(
    '`min-screen` 作为 CSS 类名出现在 className/class= 中，必须零命中 [Req 1.6]',
    hits
  );
}

// ── 检查 3：route.ts 中内联 Zod schema（Requirement 3.4.b）
// 模式：z\.(object|string|number|enum|array)\(
{
  const pattern = /z\.(object|string|number|enum|array)\(/;
  const hits = apiRouteFiles.flatMap((f) => findMatches(f, pattern));
  check(
    '`src/app/api/**/route.ts` 中出现内联 Zod schema 调用，必须零命中 [Req 3.4.b]',
    hits
  );
}

// ── 检查 4：gallery/[id]/page.tsx 中 mock 数据导入（Requirement 1.1 回归守护）
// 模式：from ['"]@/data/mock/patterns['"]
{
  const pattern = /from\s+['"]@\/data\/mock\/patterns['"]/;
  let hits = [];
  try {
    hits = findMatches(galleryDetailPage, pattern);
  } catch {
    // 文件不存在时跳过（不视为命中）
  }
  check(
    '`src/app/gallery/[id]/page.tsx` 中出现 mock 数据导入，必须零命中 [Req 1.1]',
    hits
  );
}

// ── 检查 5：除 SiteFooter.tsx 外的内联 <footer>（Requirement 8.4 / 8.5）
// 模式：^\s*<footer
{
  const pattern = /^\s*<footer/;
  const hits = allTsTsx
    .filter((f) => !f.endsWith('SiteFooter.tsx'))
    .flatMap((f) => findMatches(f, pattern));
  check(
    '除 `SiteFooter.tsx` 外的文件中出现内联 `<footer>`，必须零命中 [Req 8.4/8.5]',
    hits
  );
}

// ─── 结果输出 ────────────────────────────────────────────────────────────────

if (failed) {
  console.error('\nlint-guards: FAILED');
  process.exit(1);
} else {
  console.log('lint-guards: OK');
  process.exit(0);
}
