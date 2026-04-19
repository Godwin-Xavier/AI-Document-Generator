// Tiny, dependency-free Markdown → HTML renderer.
// Purpose-built for what our AI emits: H1-H3, paragraphs, **bold**, *italic*,
// `code`, bullet + numbered lists, pipe tables, horizontal rules.

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(text: string): string {
  let t = escape(text);
  // Links [text](url)
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>');
  // Bold
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  // Italic (be careful not to match inside words)
  t = t.replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, "$1<em>$2</em>");
  t = t.replace(/(^|\W)_([^_]+)_(?=\W|$)/g, "$1<em>$2</em>");
  // Inline code
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  return t;
}

function splitRow(line: string): string[] {
  const s = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return s.split("|").map((c) => c.trim());
}

export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  const paraBuf: string[] = [];
  const flushPara = () => {
    if (paraBuf.length === 0) return;
    const text = paraBuf.join(" ").trim();
    if (text) out.push(`<p>${inline(text)}</p>`);
    paraBuf.length = 0;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.trim() === "") {
      flushPara();
      i++;
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      const level = Math.min(h[1].length, 3);
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(line.trim())) {
      flushPara();
      out.push("<hr />");
      i++;
      continue;
    }

    if (
      line.trim().startsWith("|") &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[i + 1])
    ) {
      flushPara();
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${header.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${header.map((_, ci) => `<td>${inline(r[ci] ?? "")}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    if (/^(\s*)[-*+]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^(\s*)[-*+]\s+(.*)$/.test(lines[i])) {
        const m = /^(\s*)[-*+]\s+(.*)$/.exec(lines[i])!;
        items.push(m[2].trim());
        i++;
      }
      out.push(`<ul>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^(\s*)\d+[.)]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^(\s*)\d+[.)]\s+(.*)$/.test(lines[i])) {
        const m = /^(\s*)\d+[.)]\s+(.*)$/.exec(lines[i])!;
        items.push(m[2].trim());
        i++;
      }
      out.push(`<ol>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</ol>`);
      continue;
    }

    paraBuf.push(line.trim());
    i++;
  }
  flushPara();
  return out.join("\n");
}
