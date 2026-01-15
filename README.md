# Captain Hajimi
一个基于 Next.js 与 Supabase 的订阅管理与配置生成应用，支持合并订阅、远程规则、生成持久化链接并匿名下载。

本项99%采用 Vibe coding 开发，没有经过严格的测试与验证，仅建议在本地开发与测试环境中使用。

订阅后端基于 [subconverter](https://github.com/tindy2013/subconverter)

## 关于部署
请先通读此文件，确保已配置好环境变量。
前端可以自行托管或部署在 [Vercel](https://vercel.com/), 后端依赖 [Supabase](https://supabase.com/)。

## 技术栈
- Next.js 16（App Router，Turbopack）
- TypeScript
- Supabase（Auth、Storage、RLS、SQL Migrations；服务端 SSR 客户端与 Service Role 管理端）
- next-intl（多语言，含 zh-CN 与 en）
- Radix UI + shadcn/ui（UI 组件）
- Tailwind CSS v4
- lucide-react（图标）
- sonner（通知）
- nanoid（ID 生成）

## 功能概览
- 管理订阅源：支持 URL 与“直接填写内容”两种类型
- 远程配置（规则提供者）管理
- 与 Subconverter 后端集成，生成配置并存储到 Supabase Storage
- 生成可共享的下载链接（需要携带 key），支持匿名下载
- 用户系统与角色：首个注册用户自动成为管理员，可在后台开关注册
- 严格的行级安全（RLS）：所有数据按用户隔离

## 环境变量
在项目根目录创建 `.env.local` 并配置以下变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=<你的 Supabase 项目 URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<你的 Supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<你的 Supabase service role key>
```

- 匿名 Key 仅用于 SSR 客户端会话管理（安全地保存在服务端环境）。
- Service Role Key 仅在服务端接口中使用（如公开下载与原始内容输出），请务必只在服务端环境变量中配置，切勿暴露到客户端。

## 数据库初始化（Supabase SQL）
本项目在 `sqls/` 目录中提供了 SQL 文件用于初始化与迁移：

- `001_schema.sql`：基础表结构与公开存储桶 `configs`
- `002_rls_profiles_settings.sql`：启用 RLS、用户角色与系统设置、各表用户隔离策略、首个用户自动设为 admin
- `003_add_content_to_subscriptions.sql`：为订阅源新增 `content` 字段，并允许 `url` 可选，添加“至少存在一个来源”的约束
- `900_set_admin.sql`：可选的管理员设置脚本（如需要手动设为 admin）

你可以直接将这些 SQL 在 Supabase 项目的 SQL Editor 中按顺序执行（先 001，再 002，之后 003，最后 900 视需要）。

## 本地开发
```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 代码检查（可选）
pnpm lint

# 构建生产包
pnpm build

# 启动生产环境
pnpm start
```

## 关键服务端能力
- 服务端 Supabase 客户端（SSR）：`utils/supabase/server.ts`（基于 @supabase/ssr 与 cookies）
- 管理端 Supabase 客户端：`utils/supabase/admin.ts`（使用 Service Role Key，仅在服务端路由中使用）
- 公开下载接口：`app/api/s/[id]/route.ts`（校验 token 与从 Storage 下载文件，匿名可访问）
- 原始内容接口：`app/api/raw/[id]/route.ts`（返回订阅源中的原始内容，匿名可访问）

## 使用说明（核心流程）
1. 在“订阅源”页添加来源：
   - URL：直接填写订阅链接
   - Content：粘贴节点信息内容（保存后系统会生成指向 `/api/raw/[id]` 的内部链接并写回 URL 字段）
2. 在“转换”页选择订阅源、后端与远程配置，设置参数后生成配置
3. 系统将调用 Subconverter 后端，生成的文本会上传到 Supabase Storage 并登记到数据库
4. 列表中会显示可共享的下载链接（需要携带 key，如 `...?key=XXXX`），支持匿名下载

## 部署到 Vercel
1. 将仓库推送到 Git 平台（GitHub/GitLab）并在 Vercel 导入项目
2. 在 Vercel 项目设置中配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. 在 Supabase 项目执行 SQL 初始化（见“数据库初始化”）
4. 关联自定义域名（可选），并在 Supabase Auth 设置中添加允许的重定向域（如果你的登录流程需要）
5. 触发部署，完成后即可访问应用。首次注册的用户会自动成为管理员。

## 安全注意事项
- Service Role Key 只在服务端使用；代码中仅存在于服务端 Route Handler 内
- RLS 保证用户数据隔离；所有写操作都会带上 `user_id`
- 公开下载接口在校验 key 后才允许下载生成的配置文件

## 常见问题
- Subconverter 超时：默认已设置 120 秒超时；请确保后端地址可达
- 公开下载失败：确认链接中携带了正确的 `key`，且 Storage 中存在对应文件
- 内容型订阅源无法显示 URL：保存内容后系统会为该订阅源生成内部链接，如果仍为空请检查服务端环境变量与 `api/raw` 接口是否正常

---

如需二次开发，请先通读本 README，理解 Supabase 初始化与环境变量配置，再进行修改。祝使用愉快！
