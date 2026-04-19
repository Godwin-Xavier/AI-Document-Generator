// Multi-provider LLM abstraction.
// Supports OpenAI, Anthropic, and Google Gemini.
// Adds vision (image) support for iterative revision.
// API keys are resolved in this order:
//   1. User-supplied key from the UI (per-request)
//   2. Server-side env var (ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY)

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type ProviderId = "anthropic" | "openai" | "gemini";

export interface ProviderCatalogEntry {
  id: ProviderId;
  label: string;
  envVar: string;
  models: {
    id: string;
    label: string;
    contextK: number;
    recommended?: boolean;
    vision?: boolean;
  }[];
  defaultModel: string;
}

export const PROVIDERS: ProviderCatalogEntry[] = [
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    envVar: "ANTHROPIC_API_KEY",
    defaultModel: "claude-sonnet-4-6",
    models: [
      { id: "claude-opus-4-6", label: "Claude Opus 4.6 (most capable)", contextK: 200, vision: true },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (balanced)", contextK: 200, recommended: true, vision: true },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (fast, cheap)", contextK: 200, vision: true },
    ],
  },
  {
    id: "openai",
    label: "OpenAI (GPT)",
    envVar: "OPENAI_API_KEY",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o (balanced, vision)", contextK: 128, recommended: true, vision: true },
      { id: "gpt-4o-mini", label: "GPT-4o mini (fast, vision)", contextK: 128, vision: true },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo (vision)", contextK: 128, vision: true },
      { id: "o1-preview", label: "o1-preview (reasoning, no vision)", contextK: 128 },
      { id: "o1-mini", label: "o1-mini (reasoning, no vision)", contextK: 128 },
    ],
  },
  {
    id: "gemini",
    label: "Google Gemini",
    envVar: "GOOGLE_API_KEY",
    defaultModel: "gemini-1.5-pro",
    models: [
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (1M ctx, vision)", contextK: 1024, recommended: true, vision: true },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (fast, vision)", contextK: 1024, vision: true },
      { id: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (vision)", contextK: 1024, vision: true },
    ],
  },
];

export function getProvider(id: ProviderId): ProviderCatalogEntry {
  const p = PROVIDERS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

export function modelSupportsVision(provider: ProviderId, model: string): boolean {
  const p = PROVIDERS.find((x) => x.id === provider);
  if (!p) return false;
  const m = p.models.find((x) => x.id === model);
  return !!m?.vision;
}

// ----- Shared message types -----

export interface ImageAttachment {
  // data URL or raw base64 — the route adapts per provider
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  base64: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  images?: ImageAttachment[];
}

export interface GenerateInput {
  provider: ProviderId;
  model: string;
  system: string;
  user: string;
  images?: ImageAttachment[];
  history?: ChatTurn[]; // prior conversation (optional)
  apiKey?: string; // optional — overrides env var
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateOutput {
  text: string;
  providerUsed: ProviderId;
  modelUsed: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

function resolveKey(provider: ProviderId, userKey?: string): string {
  if (userKey && userKey.trim()) return userKey.trim();
  const envVar = getProvider(provider).envVar;
  const key = process.env[envVar];
  if (!key) {
    throw new Error(
      `No API key found. Provide one in the UI or set ${envVar} in your Vercel environment variables.`
    );
  }
  return key;
}

// ---- Anthropic ----

function toAnthropicContent(text: string, images?: ImageAttachment[]): Anthropic.Messages.ContentBlockParam[] {
  const parts: Anthropic.Messages.ContentBlockParam[] = [];
  if (images?.length) {
    for (const img of images) {
      parts.push({
        type: "image",
        source: { type: "base64", media_type: img.mediaType, data: img.base64 },
      } as Anthropic.Messages.ImageBlockParam);
    }
  }
  parts.push({ type: "text", text });
  return parts;
}

async function callAnthropic(i: GenerateInput, key: string): Promise<GenerateOutput> {
  const client = new Anthropic({ apiKey: key });
  const messages: Anthropic.Messages.MessageParam[] = [];
  if (i.history?.length) {
    for (const t of i.history) {
      messages.push({ role: t.role, content: toAnthropicContent(t.text, t.images) });
    }
  }
  messages.push({ role: "user", content: toAnthropicContent(i.user, i.images) });
  const res = await client.messages.create({
    model: i.model,
    max_tokens: i.maxTokens ?? 8000,
    temperature: i.temperature ?? 0.3,
    system: i.system,
    messages,
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as any).text)
    .join("\n");
  return {
    text,
    providerUsed: "anthropic",
    modelUsed: i.model,
    usage: { inputTokens: res.usage?.input_tokens, outputTokens: res.usage?.output_tokens },
  };
}

// ---- OpenAI ----

function toOpenAIContent(text: string, images?: ImageAttachment[]): any {
  if (!images?.length) return text;
  const parts: any[] = [{ type: "text", text }];
  for (const img of images) {
    parts.push({
      type: "image_url",
      image_url: { url: `data:${img.mediaType};base64,${img.base64}` },
    });
  }
  return parts;
}

async function callOpenAI(i: GenerateInput, key: string): Promise<GenerateOutput> {
  const client = new OpenAI({ apiKey: key });
  const isReasoning = i.model.startsWith("o1");
  const hasImages = (i.images?.length ?? 0) > 0 || !!i.history?.some((t) => t.images?.length);

  if (isReasoning && hasImages) {
    throw new Error(`Model ${i.model} does not support images. Switch to gpt-4o, gpt-4o-mini, or gpt-4-turbo.`);
  }

  if (isReasoning) {
    const res = await client.chat.completions.create({
      model: i.model,
      messages: [{ role: "user", content: `${i.system}\n\n${i.user}` }],
      max_completion_tokens: i.maxTokens ?? 8000,
    });
    const text = res.choices?.[0]?.message?.content ?? "";
    return {
      text,
      providerUsed: "openai",
      modelUsed: i.model,
      usage: { inputTokens: res.usage?.prompt_tokens, outputTokens: res.usage?.completion_tokens },
    };
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: i.system },
  ];
  if (i.history?.length) {
    for (const t of i.history) {
      messages.push({ role: t.role, content: toOpenAIContent(t.text, t.images) } as any);
    }
  }
  messages.push({ role: "user", content: toOpenAIContent(i.user, i.images) } as any);
  const res = await client.chat.completions.create({
    model: i.model,
    messages,
    max_tokens: i.maxTokens ?? 8000,
    temperature: i.temperature ?? 0.3,
  });
  const text = res.choices?.[0]?.message?.content ?? "";
  return {
    text,
    providerUsed: "openai",
    modelUsed: i.model,
    usage: { inputTokens: res.usage?.prompt_tokens, outputTokens: res.usage?.completion_tokens },
  };
}

// ---- Gemini ----

function toGeminiParts(text: string, images?: ImageAttachment[]): any[] {
  const parts: any[] = [];
  if (images?.length) {
    for (const img of images) {
      parts.push({ inlineData: { mimeType: img.mediaType, data: img.base64 } });
    }
  }
  parts.push({ text });
  return parts;
}

async function callGemini(i: GenerateInput, key: string): Promise<GenerateOutput> {
  const client = new GoogleGenerativeAI(key);
  const model = client.getGenerativeModel({
    model: i.model,
    systemInstruction: i.system,
    generationConfig: {
      temperature: i.temperature ?? 0.3,
      maxOutputTokens: i.maxTokens ?? 8000,
    },
  });

  if (i.history?.length) {
    const chat = model.startChat({
      history: i.history.map((t) => ({
        role: t.role === "assistant" ? "model" : "user",
        parts: toGeminiParts(t.text, t.images),
      })),
    });
    const res = await chat.sendMessage(toGeminiParts(i.user, i.images));
    const text = res.response.text();
    return {
      text,
      providerUsed: "gemini",
      modelUsed: i.model,
      usage: {
        inputTokens: res.response.usageMetadata?.promptTokenCount,
        outputTokens: res.response.usageMetadata?.candidatesTokenCount,
      },
    };
  }

  const res = await model.generateContent(toGeminiParts(i.user, i.images));
  const text = res.response.text();
  return {
    text,
    providerUsed: "gemini",
    modelUsed: i.model,
    usage: {
      inputTokens: res.response.usageMetadata?.promptTokenCount,
      outputTokens: res.response.usageMetadata?.candidatesTokenCount,
    },
  };
}

export async function generate(input: GenerateInput): Promise<GenerateOutput> {
  const key = resolveKey(input.provider, input.apiKey);
  if (input.provider === "anthropic") return callAnthropic(input, key);
  if (input.provider === "openai") return callOpenAI(input, key);
  if (input.provider === "gemini") return callGemini(input, key);
  throw new Error(`Unsupported provider: ${input.provider}`);
}
