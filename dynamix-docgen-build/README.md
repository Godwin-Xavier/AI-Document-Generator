# Dynamix DocGen

Turn a meeting transcript into a polished, Dynamix-branded project document in seconds — then iterate on it with a chat + screenshot interface.

Supports **7 document types**, **10 industries**, **3 LLM providers**, **5+ models**, exports to **Word (.docx)** and **PDF**, and lets you refine the draft via an in-app **chat assistant that accepts screenshots**.

---

## What it generates

| Document type | Standards basis |
|---|---|
| Business Requirements Document (BRD) — with User Stories & Use Cases | BABOK v3, IIBA |
| Statement of Work (SOW) | PMBOK 6/7 |
| Scope of Work (lightweight) | PMI work-package practice |
| Executable Service Contract | Dynamix Solutions sample template |
| Software Requirements Specification (SRS) | IEEE 830-1998 |
| Solution Document / Solution Design | TOGAF ADM (B–D) |
| System Architecture Document | arc42 / ISO/IEC/IEEE 42010 / 4+1 view |

Industry adaptations (compliance, terminology, KPIs, risks) for: **SaaS, Healthcare, Finance, Manufacturing, E-commerce, Government, Consulting, Education, Construction, Telecom** plus a **General** fallback.

## Supported LLMs

| Provider | Models |
|---|---|
| Anthropic | Claude Opus 4.6, Sonnet 4.6, Haiku 4.5 |
| OpenAI | GPT-4o, GPT-4o mini, GPT-4 Turbo, o1-preview, o1-mini |
| Google | Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 2.0 Flash |

Choose provider + model from the in-app **Settings** panel.

## API keys — two modes

1. **User-provided (browser)** — enter your own key in Settings. Stored in `localStorage` only, sent with each request to call the LLM directly.
2. **Server-side (Vercel env var)** — set one or more of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY` on Vercel and toggle "Use server-side key" in Settings.

---

## Deploy to Vercel in 5 minutes

### Option A — Deploy from a GitHub repo (recommended)

1. Create a new GitHub repo and push this folder:
   ```bash
   cd dynamix-docgen
   git init && git add . && git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/dynamix-docgen.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** your repo.
3. Framework preset: **Next.js** (auto-detected). Leave build command and output directory as defaults.
4. Under **Environment Variables**, add any of the following you plan to use:
   - `ANTHROPIC_API_KEY` — get one at <https://console.anthropic.com/settings/keys>
   - `OPENAI_API_KEY` — get one at <https://platform.openai.com/api-keys>
   - `GOOGLE_API_KEY` — get one at <https://aistudio.google.com/app/apikey>
5. Click **Deploy**. First build takes ~60 seconds.
6. Visit your `https://<project>.vercel.app` URL. Done.

### Option B — Deploy with the Vercel CLI

```bash
npm install -g vercel
cd dynamix-docgen
vercel
# follow prompts, then:
vercel env add ANTHROPIC_API_KEY production   # (and/or OPENAI_API_KEY, GOOGLE_API_KEY)
vercel --prod
```

### Local development

```bash
cd dynamix-docgen
npm install
cp .env.example .env.local   # add one or more keys
npm run dev
# open http://localhost:3000
```

---

## How to use the tool

1. Open the app. The **Settings** button (top-right of the left panel) lets you pick the LLM provider, model, and API key source.
2. On the left:
   - Pick **Document Type** (BRD, SOW, Scope, Contract, SRS, Solution, Architecture).
   - Pick **Industry** (the template auto-adapts — compliance, KPIs, risks).
   - Enter **Client Name** and **Project Name** (used on the cover page).
   - Paste the **Meeting Transcript**.
   - Optionally add **Extra Instructions**.
   - Click **Generate**.
3. On the right the document previews in Dynamix Solutions house style. Actions:
   - **Copy markdown** — raw markdown to clipboard.
   - **Download .docx** — branded Word document with logo cover page, headers, footers, styled tables.
   - **Download PDF** — opens a print-styled HTML page; press Cmd/Ctrl+P → Save as PDF.
4. **Iterate with the chat assistant** (panel below the preview):
   - Type a change request ("tighten the scope section", "add a risk for PHI exposure").
   - **Paste or drop a screenshot** (e.g., a marked-up PDF, a reference layout from another proposal, a Slack snippet) — the assistant first describes what it sees, then revises the document to match.
   - The document preview live-updates. If you don't like an edit, click **Undo this revision** on the assistant's message.
   - Requires a **vision-capable model**: Claude Opus/Sonnet/Haiku 4.x, GPT-4o / GPT-4o mini / GPT-4 Turbo, or any Gemini 1.5/2.0. Switch in Settings if you're on o1-preview/o1-mini.

---

## Project layout

```
dynamix-docgen/
├── app/
│   ├── api/
│   │   ├── generate/route.ts    # POST: transcript → markdown via LLM
│   │   ├── chat/route.ts        # POST: chat + screenshots → revised markdown
│   │   └── download/route.ts    # POST: markdown → .docx or print HTML
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── DocumentGenerator.tsx    # Main UI
│   ├── ChatPanel.tsx            # Chat + image-upload revision interface
│   ├── Header.tsx
│   └── SettingsPanel.tsx        # LLM provider/model/key modal
├── lib/
│   ├── llm/providers.ts         # Unified LLM client (Anthropic/OpenAI/Gemini)
│   ├── md/render.ts             # Markdown → HTML (preview + PDF)
│   ├── docx/builder.ts          # Markdown → .docx with Dynamix branding
│   ├── templates/
│   │   ├── catalog.ts           # 7 document templates & sections
│   │   ├── industries.ts        # 10 industry overlays
│   │   └── prompt.ts            # System + user prompt builder
│   └── shared.ts                # Exports for the client bundle
├── public/logo.png              # Dynamix Solutions logo
├── .env.example
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## Why this template structure

The section outlines in `lib/templates/catalog.ts` are derived from authoritative references:

- **BRD** — BABOK v3 / IIBA guidance + MoSCoW prioritization + INVEST user stories + UML use-case template
- **SOW** — PMBOK 6/7, PMI procurement SOW
- **SRS** — IEEE 830-1998 / ISO/IEC/IEEE 29148
- **Solution Design** — TOGAF ADM phases B-D
- **System Architecture** — arc42 12-section template + 4+1 view model + ISO/IEC/IEEE 42010

Industry overlays in `lib/templates/industries.ts` bake in:
- Regulatory frameworks (HIPAA, PCI-DSS, SOX, FedRAMP, FERPA, etc.)
- Preferred terminology (PHI vs PII, CDE vs PII, etc.)
- Default KPIs (uptime, latency, defect rate, OEE, etc.)
- Common risks (breach, recall, scope creep, etc.)

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `No API key found` | The app now auto-opens Settings when no key is configured. Paste your key there, or set `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY` in Vercel env vars and toggle "Use server-side key". |
| Long transcript times out | Vercel Hobby serverless cap is 60 s (already set in `vercel.json`). For >30k-char transcripts, switch to Gemini 1.5 Flash or Claude Haiku 4.5 in Settings. |
| Chat revision: "model does not support images" | Open Settings and switch to a vision-capable model: Claude Sonnet 4.6, GPT-4o, or Gemini 1.5 Pro. |

---

© Dynamix Solutions. _Innovate, Optimize, Succeed with Dynamix Solutions._
