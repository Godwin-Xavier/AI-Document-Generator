import { NextRequest, NextResponse } from "next/server";
import { markdownToDocxBuffer } from "@/lib/docx/builder";
import { mdToHtml } from "@/lib/md/render";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  format: "docx" | "pdf-html";
  markdown: string;
  title: string;
  clientName?: string;
  projectName?: string;
}

// Standalone, print-optimized HTML for PDF export via the browser's "Save as PDF".
function buildPrintHtml(md: string, opts: { title: string; clientName?: string; projectName?: string }): string {
  const bodyHtml = mdToHtml(md);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${opts.title}</title>
<style>
  @page { size: A4; margin: 22mm 18mm 22mm 18mm; }
  :root {
    --dynamix: #123E7C;
    --dynamix-light: #1E5BB8;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  html, body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: "Calibri", "Segoe UI", Arial, sans-serif;
    color: #1f2937;
    line-height: 1.55;
    margin: 0;
  }
  .cover {
    page-break-after: always;
    text-align: center;
    padding-top: 120px;
  }
  .cover img { max-width: 220px; height: auto; }
  .cover h1 {
    font-size: 34px;
    color: var(--dynamix);
    margin: 40px 0 10px;
  }
  .cover .proj {
    font-size: 18px;
    color: var(--dynamix-light);
    font-style: italic;
  }
  .cover .client {
    font-size: 16px;
    color: #333;
    margin-top: 10px;
  }
  .cover .date {
    margin-top: 40px;
    font-size: 13px;
    color: #666;
  }
  h1 {
    color: var(--dynamix);
    font-size: 22px;
    border-bottom: 2px solid var(--dynamix);
    padding-bottom: 4px;
    margin: 28px 0 12px;
  }
  h2 {
    color: var(--dynamix);
    font-size: 18px;
    margin: 22px 0 8px;
  }
  h3 {
    color: var(--dynamix-light);
    font-size: 15px;
    margin: 18px 0 6px;
  }
  p { margin: 0 0 8px; font-size: 12.5px; }
  ul, ol { margin: 0 0 10px 20px; font-size: 12.5px; }
  li { margin-bottom: 3px; }
  code { background: #eef2ff; padding: 1px 5px; border-radius: 3px; font-size: 0.9em; }
  hr { border: 0; border-top: 1px solid #d1d5db; margin: 16px 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 11.5px;
  }
  th {
    background: var(--dynamix);
    color: white;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid var(--dynamix);
  }
  td { border: 1px solid #cbd5e1; padding: 6px 8px; }
  tr:nth-child(even) td { background: #f1f5fb; }
  .page-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    border-bottom: 1px solid var(--dynamix);
    padding: 6px 0;
    font-size: 10px;
    color: var(--dynamix);
  }
  .page-footer {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    border-top: 1px solid var(--dynamix);
    padding: 6px 0;
    font-size: 10px;
    color: #666;
    text-align: center;
  }
  .print-hint {
    background: #FEF3C7;
    color: #92400E;
    border: 1px solid #F59E0B;
    padding: 10px 14px;
    margin: 12px 18mm 0;
    border-radius: 6px;
    font-size: 13px;
  }
  @media print {
    .print-hint { display: none !important; }
    .page-header, .page-footer { display: block; }
  }
  @media screen { body { max-width: 860px; margin: 0 auto; padding: 24px; } }
</style>
</head>
<body>
  <div class="print-hint">
    <strong>Save as PDF:</strong> Press <code>Ctrl+P</code> (Windows) or <code>Cmd+P</code> (Mac) and choose <em>Save as PDF</em> / <em>Microsoft Print to PDF</em> in the destination dropdown.
  </div>
  <div class="cover">
    <img src="/logo.png" alt="Dynamix Solutions"/>
    <h1>${escapeHtml(opts.title)}</h1>
    ${opts.projectName ? `<div class="proj">${escapeHtml(opts.projectName)}</div>` : ""}
    ${opts.clientName ? `<div class="client">Prepared for ${escapeHtml(opts.clientName)}</div>` : ""}
    <div class="date">Prepared by Dynamix Solutions • ${today}</div>
  </div>
  <div class="page-header">Dynamix Solutions  •  Innovate, Optimize, Succeed</div>
  <div class="page-footer">Confidential — Dynamix Solutions</div>
  <main>${bodyHtml}</main>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.markdown || !body?.title) {
      return NextResponse.json({ error: "markdown and title required" }, { status: 400 });
    }
    if (body.format === "docx") {
      const buf = await markdownToDocxBuffer(body.markdown, {
        title: body.title,
        clientName: body.clientName,
        projectName: body.projectName,
      });
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${sanitize(body.title)}.docx"`,
        },
      });
    }
    if (body.format === "pdf-html") {
      const html = buildPrintHtml(body.markdown, {
        title: body.title,
        clientName: body.clientName,
        projectName: body.projectName,
      });
      return new NextResponse(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return NextResponse.json({ error: "unsupported format" }, { status: 400 });
  } catch (err: any) {
    console.error("[/api/download]", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9\-_. ]/gi, "_").slice(0, 80) || "document";
}
