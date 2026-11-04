# becoming · 《改写人生剧本》Phase-3 UI Prototype

Vite + React + TypeScript + Tailwind local web app (no Lovable, no backend).

## Run

```bash
cd /workspace/becoming-life-script
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Build: `npm run build` · Preview: `npm run preview -- --host 0.0.0.0 --port 5173`

## Routes

| Path | Page |
|------|------|
| `/` | Homepage (becoming logo + brand copy + CTA) |
| `/consent` | Privacy / consent |
| `/quiz` | 21 questions (7×3) |
| `/explore` | Deep dive Top1–2 dimensions |
| `/report` | 你的内在探索地图 |
| `/admin` | Local WeChat / QR / booking placeholders |

Session answers stored in `localStorage`. Question bank: `src/data/bank.json` (parsed from Phase-2 v2.0 markdown).
