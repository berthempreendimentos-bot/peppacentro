# PEPACORP CENTRO

Sistema de gestão de contratos (ERP) focado em controle financeiro, documentos
e acompanhamento da execução de contratos. Next.js 15 (App Router) + Supabase
(Postgres, Storage, Auth, RLS).

## Stack

- Next.js 15 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`) — Postgres com RLS, Auth, Storage
- TanStack Query, React Hook Form + Zod
- Recharts (dashboard), `xlsx` e `@react-pdf/renderer` (relatórios)

## Configuração local

1. Copie `.env.local.example` para `.env.local` e preencha com as credenciais
   do projeto Supabase:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

2. Aplique as migrations em `supabase/migrations/` (em ordem, via SQL Editor
   do Supabase ou Supabase CLI).

3. Instale as dependências e crie o primeiro usuário admin:

   ```bash
   npm install
   node scripts/create-admin.mjs email@exemplo.com senha "Nome Completo"
   ```

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

1. Importe o repositório no [Vercel](https://vercel.com/new) (framework
   detectado automaticamente: Next.js).
2. Em **Project Settings → Environment Variables**, adicione as três
   variáveis acima (mesmos valores do `.env.local`). `SUPABASE_SERVICE_ROLE_KEY`
   nunca deve ser exposta com prefixo `NEXT_PUBLIC_`.
3. Deploy. As migrations do Supabase **não** rodam automaticamente — aplique-as
   diretamente no projeto Supabase antes do primeiro acesso.

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — serve o build de produção
- `npm run lint` — lint
