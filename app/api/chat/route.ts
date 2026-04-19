import { NextRequest, NextResponse } from "next/server";
import { generate, ProviderId, ChatTurn, ImageAttachment, modelSupportsVision } from "@/lib/llm/providers";
import { getDoc, DocType } from "@/lib/templates/catalog";
import { getIndustry, IndustryId } from "@/lib/templates/industries";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  // conversation
  userMessage: string;
  images?: ImageAttachment[];
  history?: ChatTurn[];

  // current document state
  markdown: string;
  docType: DocType;
  industry: IndustryId;
  clientName?: string;
  projectName?: string;

  // llm
  provider: ProviderId;
  model: string;
  apiKey?: string;
}

/**
 * Chat revision endpoint.
 *
 * The assistant replies with a short natural-language message summarising what
 * it did (including what it saw in any attached screenshot), then — on a new
 * line — returns a single fenced markdown block starting with
 *   ```revised-document
 * containing the full revised document.  If the assistant is only asking a
 * clarifying question and does NOT want to revise yet, it can omit the block.
 *
 * We parse the response: if we find the fenced block, we return { reply, revisedMarkdown }.
 * Otherwise we return { reply } and the client keeps the existing markdown.
 */

const REVISION_TAG_OPEN = "```revised-document";
const REVISION_TAG_CLOSE = "```";

function buildSystemPrompt(docType: DocType, industry: IndustryId, clientName?: string, projectName?: string): string {
  const doc = getDoc(docType);
  const ind = getIndustry(industry);
  return [
    `You are an expert Business Analyst and Solution Architect at Dynamix Solutions.`,
    `You are helping a user iteratively refine a "${doc.label}" for client "${clientName || "[unspecified]"}"${projectName ? `, project "${projectName}"` : ""}.`,
    `Standard basis: ${doc.standardBasis}.`,
    `Industry context: ${ind.label}.`,
    ``,
    `You will be given:`,
    `  1. The CURRENT version of the document (Markdown).`,
    `  2. The user's new chat message — possibly with SCREENSHOTS attached.`,
    `  3. Prior conversation history.`,
    ``,
    `STEP-BY-STEP BEHAVIOUR:`,
    `  A. If the user attached one or more screenshots, FIRST describe concisely what you see in each screenshot (1-3 short bullets). Reference which part of the document it relates to.`,
    `  B. Then explain, in 1-3 sentences, what edits you will make (or are asking to clarify).`,
    `  C. If the request is clear enough to act on, output the FULL REVISED DOCUMENT.`,
    `     - Use this EXACT fenced wrapper so the app can extract it:`,
    `       ${REVISION_TAG_OPEN}`,
    `       <full revised Markdown document here, starting with its H1 title>`,
    `       ${REVISION_TAG_CLOSE}`,
    `     - Preserve all sections from the current document unless the user explicitly said to remove them.`,
    `     - Keep the Dynamix house style: formal, precise, third-person.`,
    `     - Keep the Document Control block at the top updated (bump version, update Date, update Status if appropriate).`,
    `     - Output the ENTIRE document, not just the changed section.`,
    `  D. If the user's request is ambiguous, ask ONE focused clarifying question and do NOT emit the revised-document block.`,
    ``,
    `IMPORTANT:`,
    `- Do NOT invent facts. If information is missing, mark it as "[To be confirmed with stakeholder]".`,
    `- Do NOT change numeric totals (fees, hours, dates) unless the user explicitly asks.`,
    `- Never wrap the revised document in anything other than the exact ${REVISION_TAG_OPEN} ... ${REVISION_TAG_CLOSE} fence described above.`,
  ].join("\n");
}

function buildUserMessage(opts: { markdown: string; userText: string }): string {
  return [
    `## Current document (Markdown)`,
    `"""`,
    opts.markdown.trim(),
    `"""`,
    ``,
    `## My request`,
    opts.userText.trim() || "(no text — see attached screenshot(s) for context)",
  ].join("\n");
}

function extractRevision(raw: string): { reply: string; revisedMarkdown?: string } {
  const openIdx = raw.indexOf(REVISION_TAG_OPEN);
  if (openIdx === -1) return { reply: raw.trim() };
  // Close fence after the open tag
  const afterOpen = openIdx + REVISION_TAG_OPEN.length;
  const closeIdx = raw.indexOf(REVISION_TAG_CLOSE, afterOpen);
  if (closeIdx === -1) {
    // No closing fence — treat entire remainder as revision
    const body = raw.slice(afterOpen).replace(/^\r?\n/, "").trim();
    const reply = raw.slice(0, openIdx).trim() || "Document updated.";
    return body ? { reply, revisedMarkdown: body } : { reply: raw.trim() };
  }
  const body = raw.slice(afterOpen, closeIdx).replace(/^\r?\n/, "").trim();
  const reply = (raw.slice(0, openIdx) + raw.slice(closeIdx + REVISION_TAG_CLOSE.length)).trim();
  return body ? { reply: reply || "Document updated.", revisedMarkdown: body } : { reply: raw.trim() };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.userMessage && !(body?.images?.length)) {
      return NextResponse.json({ error: "userMessage or at least one image is required" }, { status: 400 });
    }
    if (!body?.markdown) {
      return NextResponse.json({ error: "markdown (current document) is required" }, { status: 400 });
    }
    if (!body?.provider || !body?.model) {
      return NextResponse.json({ error: "provider and model are required" }, { status: 400 });
    }

    if (body.images?.length && !modelSupportsVision(body.provider, body.model)) {
      return NextResponse.json(
        {
          error: `Model ${body.model} does not support image inputs. Open Settings and switch to a vision-capable model (e.g., Claude Sonnet 4.6, GPT-4o, Gemini 1.5 Pro).`,
        },
        { status: 400 }
      );
    }

    const system = buildSystemPrompt(body.docType, body.industry, body.clientName, body.projectName);
    const user = buildUserMessage({ markdown: body.markdown, userText: body.userMessage || "" });

    const result = await generate({
      provider: body.provider,
      model: body.model,
      system,
      user,
      images: body.images,
      history: body.history,
      apiKey: body.apiKey,
      maxTokens: 8000,
      temperature: 0.3,
    });

    const parsed = extractRevision(result.text);

    return NextResponse.json({
      ok: true,
      reply: parsed.reply,
      revisedMarkdown: parsed.revisedMarkdown ?? null,
      rawText: result.text,
      provider: result.providerUsed,
      model: result.modelUsed,
      usage: result.usage,
    });
  } catch (err: any) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: err?.message ?? "Unknown server error" }, { status: 500 });
  }
}
