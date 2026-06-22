# 宝塔部署指南（HBPattern，零基础版）

> **推荐部署方式为腾讯云 EdgeOne Pages**，见 `deploy-edgeone.md`。本指南作为自建服务器备选方案。

> 现状：当前只需部署**一个 Next.js 网站**。Python/AI 后端还没实现（路线图 Phase 3），
> 所以 `deployment-runbook.md` 里的 FastAPI/Gunicorn 部分**现在不用管**。

## 0. 架构（一句话）

```
用户浏览器
   │ HTTPS
   ▼
宝塔 Nginx（反向代理 + SSL）  ──►  Node 进程 next start (127.0.0.1:3000)
                                          │
                                          ▼
                              Supabase 云（数据库 + 登录 + 图片存储）
```

**数据库不用在宝塔装。** 它是云服务（Supabase），你只是把它的连接信息填到服务器的环境变量里。

## 1. 前提

- 一台 Linux 云服务器，已装好**宝塔面板**。
- 一个域名（如 `HBpattern.husteread.com`），DNS 加一条 **A 记录**指向服务器公网 IP。
- 服务器内存 **≥ 2GB**（构建 Next 吃内存）。小于 2GB 先加 swap（见第 5 步避坑）。
- ⚠️ Supabase 服务器在海外。国内云服务器连它**延迟较高**；若访问慢，考虑海外服务器或给 Supabase 选就近区域。

## 2. 宝塔装软件（软件商店里点安装）

| 软件 | 说明 |
|------|------|
| Nginx | 反向代理 + 一键 SSL |
| Node.js 版本管理器 | 安装 **Node 20**（项目要求 20+） |
| PM2 管理器 | 守护 Node 进程，开机自启 |

> 不需要装 MySQL / PostgreSQL —— 数据库在 Supabase 云上。

## 3. 把代码放到服务器

宝塔 → 文件 → 进入 `/www/wwwroot/`，然后二选一：

- **方式 A（推荐，海外服务器）**：打开宝塔「终端」执行
  ```bash
  cd /www/wwwroot
  git clone https://github.com/AIMFllys/HBPattern.git hbpattern
  ```
- **方式 B（国内服务器，clone GitHub 慢/失败时）**：本地把项目打包成 zip（**不要**包含 `node_modules` 和 `.next`），用宝塔文件管理上传到 `/www/wwwroot/hbpattern` 再解压。

最终代码在 `/www/wwwroot/hbpattern`。

## 4. 配置环境变量（务必在构建之前做！）

在 `/www/wwwroot/hbpattern` 下**新建文件 `.env.local`**（宝塔文件管理 → 新建文件），内容：

```env
NEXT_PUBLIC_SUPABASE_URL=你的-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的-anon-key
DATABASE_URL=你的-数据库连接串
DIRECT_URL=你的-直连连接串
NEXT_PUBLIC_SITE_URL=https://你的域名
```

**这几个值从哪来：** 直接复制你本地电脑 `D:\project\HBPattern\HBPattern\.env.local` 里现成的前 4 个（它连的就是同一个生产 Supabase），再加最后一行 `NEXT_PUBLIC_SITE_URL`。
也可以去 Supabase 控制台拿：Project Settings → **API**（URL、anon key）；→ **Database** → Connection string（`DATABASE_URL` 用连接池 6543，`DIRECT_URL` 用直连 5432）。

> 关键：`NEXT_PUBLIC_*` 变量会在**构建时**被打进前端代码。所以必须**先填好 `.env.local`，再执行下一步的 `npm run build`**，否则网站前端连不上 Supabase。项目的 `prebuild` 脚本会自动检查这 4 个变量，缺了会直接报错提醒你。

## 5. 安装依赖 + 构建

宝塔终端：

```bash
cd /www/wwwroot/hbpattern
npm install
npm run build
```

> ⚠️ 避坑：构建很吃内存。若服务器 < 2GB，先加 swap，否则会卡死/OOM：
> ```bash
> dd if=/dev/zero of=/swapfile bs=1M count=2048
> chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
> echo '/swapfile none swap sw 0 0' >> /etc/fstab
> ```

## 6. 用 PM2 启动（开机自启）

```bash
cd /www/wwwroot/hbpattern
pm2 start npm --name hbpattern -- start   # 跑 next start，监听 3000
pm2 save
pm2 startup                                # 按它输出的提示再复制执行一条命令，实现开机自启
```

检查是否起来了：

```bash
pm2 status
curl -I http://127.0.0.1:3000             # 返回 HTTP 200/3xx 即正常
```

也可以用宝塔「PM2 管理器」图形界面查看日志和状态。

## 7. 加站点 + 反向代理 + SSL

1. 宝塔 → 网站 → **添加站点**：域名填 `HBpattern.husteread.com`，PHP 选「纯静态」，不建数据库。
2. 进入该站点 → **反向代理** → 添加：
   - 目标 URL：`http://127.0.0.1:3000`
   - 发送域名：`$host`
3. 确认生成的 Nginx 配置里**带这几个头**（限流和安全头依赖它们；宝塔默认模板通常已包含，核对一下）：
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;   # HTTPS 识别 + HSTS 需要
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       client_max_body_size 12m;                     # 上传图片上限 10MB，留余量
   }
   ```
4. 站点 → **SSL** → Let's Encrypt → 申请证书，勾选「强制 HTTPS」。

打开 `https://你的域名` 应能看到首页。

## 8. 上线后建议（非必须，但推荐）

- 在 Supabase 控制台 → SQL Editor，执行 `supabase/migrations/0001_performance_indexes.sql` 加索引（数据量变大后明显更快）。
- 确认 Supabase 项目**没被暂停**（免费版闲置 7 天会自动暂停 → 网站数据加载失败；进控制台点 Restore，或升级付费保持常开）。

## 日常更新（改了代码后重新发布）

```bash
cd /www/wwwroot/hbpattern
git pull origin main      # 或重新上传代码
npm install               # 依赖有变化时
npm run build
pm2 restart hbpattern
```

## 出问题先看这里

| 现象 | 排查 |
|------|------|
| 网站打不开 / 502 | `pm2 status` 看进程在不在；`pm2 logs hbpattern` 看报错；`curl -I http://127.0.0.1:3000` |
| 页面出来了但数据空 / 登录失败 | `.env.local` 的 Supabase 值是否正确、是否**在 build 之前**就配好；Supabase 项目是否被暂停 |
| `npm run build` 卡死 | 内存不足，加 swap（第 5 步） |
| 构建报「缺少环境变量」 | `.env.local` 没配全那 4 个必需变量 |
| 上传图片失败 | Nginx `client_max_body_size` 是否 ≥ 12m |
```
