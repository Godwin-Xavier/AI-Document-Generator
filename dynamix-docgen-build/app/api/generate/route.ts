import { NextRequest, NextResponse } from "next/server";
import { buildPrompt } from "@/lib/templates/prompt";
import { DocType } from "@/lib/templates/catalog";
import { IndustryId } from "@/lib/templates/industries";
import { generate, ProviderId } from "@/lib/llm/providers";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds (Vercel Hobby plan max)

interface Body {
  docType: DocType;
  industry: IndustryId;
  transcript: string;
  clientName?: string;
  projectName?: string;
  extraNotes?: string;
  provider: ProviderId;
  model: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.transcript || body.transcript.trim().length < 50) {
      return NextResponse.json(
        { error: "Transcript is required and must be at least 50 characters." },
        { status: 400 }
      );
    }
    if (!body.docType || !body.provider || !body.model) {
      return NextResponse.json(
        { error: "docType, provider, and model are required." },
        { status: 400 }
      );
    }

    const { system, user } = buildPrompt({
      docType: body.docType,
      industry: body.industry ?? "general",
      transcript: body.transcript,
      clientName: body.clientName,
      projectName: body.projectName,
      extraNotes: body.extraNotes,
    });

    const result = await generate({
      provider: body.provider,
      model: body.model,
      system,
      user,
      apiKey: body.apiKey,
      maxTokens: 8000,
      temperature: 0.3,
    });

    return NextResponse.json({
      ok: true,
      markdown: result.text,
      provider: result.providerUsed,
      model: result.modelUsed,
      usage: result.usage,
    });
  } catch (err: any) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}
