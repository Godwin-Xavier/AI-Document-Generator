// Markdown → DOCX conversion with Dynamix Solutions branding.
// Supports: H1/H2/H3, paragraphs, bold, italic, bulleted/numbered lists,
// pipe tables, horizontal rules, and inline code. Includes the Dynamix
// logo on the first page and styled headers/footers.

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";
import fs from "fs";
import path from "path";

const DYNAMIX_BLUE = "123E7C";
const DYNAMIX_BLUE_LIGHT = "1E5BB8";
const ROW_ALT_FILL = "F1F5FB";

type Token =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "hr" };

// ---------- Markdown tokenizer (handles what our AI actually emits) ----------

function tokenize(md: string): Token[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const tokens: Token[] = [];
  let i = 0;

  const paraBuf: string[] = [];
  const flushPara = () => {
    if (paraBuf.length === 0) return;
    const text = paraBuf.join(" ").trim();
    if (text) tokens.push({ type: "p", text });
    paraBuf.length = 0;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Blank line flushes paragraph
    if (line.trim() === "") {
      flushPara();
      i++;
      continue;
    }

    // Headings
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      const level = h[1].length;
      const text = h[2].trim();
      if (level === 1) tokens.push({ type: "h1", text });
      else if (level === 2) tokens.push({ type: "h2", text });
      else tokens.push({ type: "h3", text });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(line.trim())) {
      flushPara();
      tokens.push({ type: "hr" });
      i++;
      continue;
    }

    // Table: line starts with |, next line is pipe separator
    if (line.trim().startsWith("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[i + 1])) {
      flushPara();
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      tokens.push({ type: "table", header, rows });
      continue;
    }

    // Unordered list
    const ulMatch = /^(\s*)[-*+]\s+(.*)$/.exec(line);
    if (ulMatch) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^(\s*)[-*+]\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        items.push(m[2].trim());
        i++;
      }
      tokens.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    const olMatch = /^(\s*)\d+[.)]\s+(.*)$/.exec(line);
    if (olMatch) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^(\s*)\d+[.)]\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        items.push(m[2].trim());
        i++;
      }
      tokens.push({ type: "ol", items });
      continue;
    }

    // Paragraph line
    paraBuf.push(line.trim());
    i++;
  }
  flushPara();
  return tokens;
}

function splitRow(line: string): string[] {
  const s = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return s.split("|").map((c) => c.trim());
}

// ---------- Inline formatting: **bold**, *italic*, `code` ----------

function inlineRuns(text: string, base: Partial<{ bold: boolean; italics: boolean; color: string; size: number; font: string }> = {}): TextRun[] {
  // Strip common markdown link syntax to readable form
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

  // Tokenize the string into bold/italic/code/plain segments
  const runs: TextRun[] = [];
  const regex = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  const m = text.matchAll(regex);
  for (const match of m) {
    const idx = match.index ?? 0;
    if (idx > last) {
      runs.push(new TextRun({ text: text.slice(last, idx), ...base }));
    }
    const tok = match[0];
    if (tok.startsWith("**") || tok.startsWith("__")) {
      runs.push(new TextRun({ text: tok.slice(2, -2), bold: true, ...base }));
    } else if (tok.startsWith("`")) {
      runs.push(
        new TextRun({
          text: tok.slice(1, -1),
          font: "Consolas",
          ...base,
        })
      );
    } else {
      runs.push(new TextRun({ text: tok.slice(1, -1), italics: true, ...base }));
    }
    last = idx + tok.length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), ...base }));
  return runs;
}

// ---------- Token → docx elements ----------

function tokenToParagraphs(tok: Token): (Paragraph | Table)[] {
  if (tok.type === "h1") {
    return [
      new Paragraph({
        spacing: { before: 360, after: 120 },
        children: [
          new TextRun({
            text: tok.text,
            bold: true,
            color: DYNAMIX_BLUE,
            size: 36, // half-points
            font: "Calibri",
          }),
        ],
        border: {
          bottom: { color: DYNAMIX_BLUE, size: 8, style: BorderStyle.SINGLE, space: 2 },
        },
      }),
    ];
  }
  if (tok.type === "h2") {
    return [
      new Paragraph({
        spacing: { before: 280, after: 100 },
        children: [
          new TextRun({ text: tok.text, bold: true, color: DYNAMIX_BLUE, size: 28, font: "Calibri" }),
        ],
      }),
    ];
  }
  if (tok.type === "h3") {
    return [
      new Paragraph({
        spacing: { before: 220, after: 80 },
        children: [
          new TextRun({ text: tok.text, bold: true, color: DYNAMIX_BLUE_LIGHT, size: 24, font: "Calibri" }),
        ],
      }),
    ];
  }
  if (tok.type === "p") {
    return [
      new Paragraph({
        spacing: { after: 120, line: 300 },
        children: inlineRuns(tok.text, { size: 22, font: "Calibri" }),
      }),
    ];
  }
  if (tok.type === "ul") {
    return tok.items.map(
      (it) =>
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60, line: 280 },
          children: inlineRuns(it, { size: 22, font: "Calibri" }),
        })
    );
  }
  if (tok.type === "ol") {
    return tok.items.map(
      (it, idx) =>
        new Paragraph({
          numbering: undefined,
          spacing: { after: 60, line: 280 },
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true, size: 22, font: "Calibri" }),
            ...inlineRuns(it, { size: 22, font: "Calibri" }),
          ],
        })
    );
  }
  if (tok.type === "hr") {
    return [
      new Paragraph({
        spacing: { before: 200, after: 200 },
        border: { bottom: { color: "BBBBBB", size: 6, style: BorderStyle.SINGLE, space: 1 } },
        children: [new TextRun({ text: "" })],
      }),
    ];
  }
  if (tok.type === "table") {
    const header = new TableRow({
      tableHeader: true,
      children: tok.header.map(
        (h) =>
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill: DYNAMIX_BLUE },
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20, font: "Calibri" })],
              }),
            ],
          })
      ),
    });
    const rows = tok.rows.map(
      (r, ri) =>
        new TableRow({
          children: tok.header.map((_, ci) => {
            const val = r[ci] ?? "";
            return new TableCell({
              shading:
                ri % 2 === 1
                  ? { type: ShadingType.CLEAR, color: "auto", fill: ROW_ALT_FILL }
                  : undefined,
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              children: [
                new Paragraph({
                  spacing: { line: 260 },
                  children: inlineRuns(val, { size: 20, font: "Calibri" }),
                }),
              ],
            });
          }),
        })
    );
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.AUTOFIT,
      rows: [header, ...rows],
    });
    return [table, new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "" })] })];
  }
  return [];
}

// ---------- Header / footer with Dynamix branding ----------

function buildHeader(): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: "Dynamix Solutions",
            bold: true,
            color: DYNAMIX_BLUE,
            size: 20,
            font: "Calibri",
          }),
          new TextRun({
            text: "  |  Innovate, Optimize, Succeed",
            italics: true,
            color: "666666",
            size: 18,
            font: "Calibri",
          }),
        ],
        border: {
          bottom: { color: DYNAMIX_BLUE, size: 6, style: BorderStyle.SINGLE, space: 1 },
        },
      }),
    ],
  });
}

function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: { color: DYNAMIX_BLUE, size: 6, style: BorderStyle.SINGLE, space: 1 },
        },
        children: [
          new TextRun({
            text: "Confidential — Dynamix Solutions  •  Page ",
            color: "666666",
            size: 18,
            font: "Calibri",
          }),
          new TextRun({ children: [PageNumber.CURRENT], color: "666666", size: 18, font: "Calibri" }),
          new TextRun({ text: " of ", color: "666666", size: 18, font: "Calibri" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], color: "666666", size: 18, font: "Calibri" }),
        ],
      }),
    ],
  });
}

function loadLogo(): Buffer | null {
  try {
    const p = path.join(process.cwd(), "public", "logo.png");
    return fs.readFileSync(p);
  } catch {
    return null;
  }
}

function coverPage(opts: { title: string; clientName?: string; projectName?: string }): Paragraph[] {
  const logo = loadLogo();
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { before: 1200 }, children: [new TextRun({ text: "" })] }));

  if (logo) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: logo,
            transformation: { width: 200, height: 143 },
            type: "png",
          } as any),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 120 },
      children: [
        new TextRun({
          text: opts.title,
          bold: true,
          color: DYNAMIX_BLUE,
          size: 56,
          font: "Calibri",
        }),
      ],
    })
  );

  if (opts.projectName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: opts.projectName,
            italics: true,
            color: DYNAMIX_BLUE_LIGHT,
            size: 28,
            font: "Calibri",
          }),
        ],
      })
    );
  }
  if (opts.clientName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: `Prepared for ${opts.clientName}`,
            color: "444444",
            size: 24,
            font: "Calibri",
          }),
        ],
      })
    );
  }
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: `Prepared by Dynamix Solutions  •  ${new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          color: "666666",
          size: 20,
          font: "Calibri",
        }),
      ],
    })
  );
  // Page break
  children.push(
    new Paragraph({ children: [new TextRun({ text: "", break: 1 })], pageBreakBefore: true })
  );
  return children;
}

export async function markdownToDocxBuffer(md: string, opts: { title: string; clientName?: string; projectName?: string }): Promise<Buffer> {
  const tokens = tokenize(md);
  const body: (Paragraph | Table)[] = [];
  for (const t of tokens) body.push(...tokenToParagraphs(t));

  const cover = coverPage(opts);

  const doc = new Document({
    creator: "Dynamix Solutions",
    title: opts.title,
    description: "Generated by Dynamix DocGen",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [
      {
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.9),
              bottom: convertInchesToTwip(0.9),
              left: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.9),
            },
          },
        },
        children: [...cover, ...body],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}
