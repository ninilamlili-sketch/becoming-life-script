# becoming · 《改写人生剧本》

Vite + React + TypeScript + Tailwind. Redeem-gated exploration with **Netlify Functions + Neon PostgreSQL**.

> **Phase-3 status:** 兑换码功能代码已落地于分支 `feature/redeem-codes`。  
> **在 Jay 配置 Netlify 环境变量 + Neon schema 之前，真实兑换 NOT live。**  
> 本地可用 `vite preview` 预览 `/redeem` UI；API 在无 env 时会友好失败。

## Run (UI)

```bash
cd /workspace/becoming-life-script
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Build / preview UI:

```bash
npm run build
npm run preview:ui
```

## Routes

| Path | Page | Gate |
|------|------|------|
| `/` | Homepage | — |
| `/redeem` | 兑换码验证 | — |
| `/consent` | Privacy / consent | redeem JWT |
| `/quiz` | 21 questions (7×3) | redeem JWT |
| `/explore` | Deep dive Top1–2 | redeem JWT |
| `/report` | 你的内在探索地图 | redeem JWT |

Session answers stay in `localStorage` only — **never uploaded** with redeem.

## Redeem (server)

| Endpoint | Function | Notes |
|----------|----------|-------|
| `POST /api/redeem/activate` | `redeem-activate` | rate-limited; atomic activate; issues HMAC JWT |
| `GET /api/redeem/session` | `redeem-session` | optional session check |
| `POST /api/admin/void` | `admin-void` | `X-Admin-Secret` only — no public admin UI |

Schema: `db/schema.sql`  
Env template: `.env.example`  
Ops notes: `/workspace/becoming/previews/redeem-phase3-notes.md`

### Generate codes (ops)

```bash
CODE_PEPPER='…same as Netlify…' npm run codes:generate -- --count 20
# → scripts/out/codes-plaintext-*.txt  (Jay only — do not commit)
# → scripts/out/codes-insert-*.sql     (hashes for Neon)
```

Unit test (no Neon): `npm run test:codes`

## Deploy (preview first)

1. Push / connect `feature/redeem-codes` to Netlify **Deploy Preview** (not production).
2. Set env: `DATABASE_URL`, `CODE_PEPPER`, `REDEEM_JWT_SECRET`, optional `ADMIN_SECRET`.
3. Apply `db/schema.sql` on Neon; insert hashes via generate script SQL.
4. Verify `/redeem` on preview URL. **Do not overwrite production until approved.**

## Branch policy

- Develop on `feature/redeem-codes` only for this work.
- Keep `main` at Phase-2 baseline until Phase-5 / production cutover.
