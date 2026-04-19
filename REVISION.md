# Dynamix DocGen — Project Recap & Revision History

## 📖 System Overview

**Dynamix DocGen** is an enterprise-grade AI proposal and document generator built for Dynamix Solutions. It transforms raw meeting transcripts into polished, well-formatted project documents fully tailored to specific industry compliance requirements and standards.

- **Stack:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Deployment:** Vercel (Automatic GitHub deployment from `main`)
- **Document Exporter:** Generates both HTML for PDF print output and branded `.docx` files using the `docx` library.

### 🧠 AI Capabilities & Providers
The application is entirely LLM-agnostic, seamlessly implementing a multi-provider abstraction layer in `lib/llm/providers.ts`.
- **Supported Models:** 
  - **Anthropic:** Claude 3.5 Sonnet / Opus / Haiku
  - **OpenAI:** GPT-4o / GPT-4o-mini / GPT-4 Turbo / o1 reasoning models
  - **Google Gemini:** 1.5 Pro / 1.5 Flash / 2.0 Flash
- **Context Handling:** Configured for large context windows (up to 128k - 1M depending on provider).
- **Vision Integration:** The app supports *iterative multimodal revision*. Users can paste/upload screenshots during the chat revision process to command the AI to adapt layouts or incorporate text seen in images.

### 🏗️ Key Architectures
- **Templates Catalog (`lib/templates/catalog.ts`):** 7 distinct standards-based document outlines (BRD, SOW, Scope, Contract, SRS, Solution Design, System Architecture).
- **Industry Overlays (`lib/templates/industries.ts`):** 10 industry profiles injecting compliance limits, risks, and vocabulary (e.g., HIPAA for Healthcare, PCI-DSS for Finance). 
- **Prompt Builder (`lib/templates/prompt.ts`):** Merges the transcript, user options, and dynamic templates into rich context prompts.
- **Client Side App (`components/DocumentGenerator.tsx`):** The primary view. Manages state for transcripts, settings selection from `localStorage`, PDF rendering invocation, and calling API endpoints.

### 🌐 API Routes (`app/api/`)
- `POST /api/generate`: First pass generation matching transcript to markdown.
- `POST /api/chat`: Multi-turn revision utilizing previous chat history, newly generated markdown, and images to adapt the document specifically.
- `POST /api/download`: Accepts markdown to trigger `.docx` building via `lib/docx/builder.ts` or raw print-ready HTML generation via `lib/md/render.ts`.

---

## 🛠️ Work Completed — Session Recap (April 19, 2026)

### 1. Vercel Deployment Rescue & Configuration
- **The Issue:** The project had been flattened out of the `dynamix-docgen` subdirectory directly into the repository root so Vercel could deploy it organically natively. However, legacy `vercel.json` and misconfigured Vercel Project "Framework Presets" were causing `404 NOT_FOUND` empty directories and Serverless un-matched function errors.
- **The Fix:**
  - Deleted the legacy `vercel.json` file completely, forcing Vercel to rely blindly on the native Next.js routing config. 
  - Vercel Dashboard was directed to use **Framework Preset: Next.js** and **Root Directory: `./`**.
  - Redeployed from `main`, successfully resolving all framework mapping errors so the website functions correctly.

### 2. Next.js & Security Warnings Resolution
- **The Issue:** Vercel threw a loud security vulnerability flag against Next.js, and an annoying `node-domexception` warning.
- **The Fix:** 
  - Updated Next.js from `14.2.15` specifically to `14.2.35`. It patched the `Image Optimizer` DoS vulnerabilities while aggressively avoiding Next 15 (which would trigger intense structural breaking changes).
  - Updated `@anthropic-ai/sdk` and `openai` dependencies securely to absorb upstream `node-domexception` deprecations.

### 3. Feature Addition: Transcript File Upload
- **The Request:** Enable users to skip copy-pasting heavy transcripts by uploading directly.
- **The Feature:** Installed a lightweight, natively processed file input specifically targeting `.txt`, `.csv`, `.md`, `.srt`, and `.vtt`. 
  - Integrated directly within `DocumentGenerator.tsx`. 
  - Implemented client-side `FileReader` text parsing to populate the React state almost instantly.

### 📝 Next Steps / Future Dev Notes
1. **Adding Support for Audio/Video or PDFs:** If transcripts need to be extracted straight from MP4/PDFs later, you'll need a backend text extractor component or lightweight server process (e.g. `mammoth` for DOCX, or Whisper integration).
2. **Expanding Templates/Industries:** Simply modify `lib/templates/industries.ts` and `lib/templates/catalog.ts` to add new sectors without needing to rewrite any of the LLM prompt logic!
3. **API Keys Execution:** Whenever doing UI testing, the API keys load mostly client-side right from `localStorage` unless `useServerKey` is checked (where it routes into the Next.js secrets). Each server endpoint parses these seamlessly.
