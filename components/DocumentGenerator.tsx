"use client";

import { DOC_CATALOG, DocType, INDUSTRIES, IndustryId, modelSupportsVision, PROVIDERS, ProviderId, SAMPLE_TRANSCRIPT } from "@/lib/shared";
import { mdToHtml } from "@/lib/md/render";
import {
  Copy,
  Download,
  FileText,
  FlaskConical,
  Loader2,
  Settings,
  Sparkles,
  Check,
  FileDown,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import SettingsPanel from "./SettingsPanel";
import ChatPanel from "./ChatPanel";

interface SavedSettings {
  provider: ProviderId;
  model: string;
  apiKey: string;
  useServerKey: boolean;
}

const DEFAULT_SETTINGS: SavedSettings = {
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  apiKey: "",
  useServerKey: true,
};

export default function DocumentGenerator() {
  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SavedSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("dynamix-docgen.settings");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedSettings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {}
  }, []);

  // Inputs
  const [transcript, setTranscript] = useState("");
  const [docType, setDocType] = useState<DocType>("brd");
  const [industry, setIndustry] = useState<IndustryId>("general");
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setTranscript(text);
      }
    };
    reader.readAsText(file);
    // Reset file input so the user can upload the same file again if needed
    e.target.value = "";
  };

  // Output
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [meta, setMeta] = useState<{ provider: string; model: string; usage?: any } | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const html = useMemo(() => (markdown ? mdToHtml(markdown) : ""), [markdown]);

  const docMeta = DOC_CATALOG.find((x) => x.id === docType)!;

  const handleGenerate = async () => {
    setError(null);
    if (transcript.trim().length < 50) {
      setError("Please paste a meeting transcript of at least 50 characters.");
      return;
    }
    // Pre-flight: user picked "bring-your-own-key" but field is empty
    if (!settings.useServerKey && !settings.apiKey.trim()) {
      setError("API key is missing. Opening Settings — paste your key or switch to the server-side key.");
      setSettingsOpen(true);
      return;
    }
    setLoading(true);
    setMarkdown("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          industry,
          transcript,
          clientName,
          projectName,
          extraNotes,
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.useServerKey ? undefined : settings.apiKey,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        const msg: string = json?.error ?? "Generation failed";
        // Route server "No API key found" errors straight to the Settings modal
        if (/no api key found/i.test(msg)) setSettingsOpen(true);
        throw new Error(msg);
      }
      setMarkdown(json.markdown);
      setMeta({ provider: json.provider, model: json.model, usage: json.usage });
      requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const title = `${clientName || "Client"} — ${docMeta.short}${projectName ? ` — ${projectName}` : ""}`;

  const handleDownload = async (format: "docx" | "pdf") => {
    if (!markdown) return;
    setDownloading(format);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: format === "docx" ? "docx" : "pdf-html",
          markdown,
          title,
          clientName,
          projectName,
        }),
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      if (format === "docx") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${sanitize(title)}.docx`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const html = await res.text();
        const w = window.open("", "_blank");
        if (w) {
          w.document.open();
          w.document.write(html);
          w.document.close();
          setTimeout(() => {
            try {
              w.focus();
              w.print();
            } catch {}
          }, 400);
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const providerLabel = PROVIDERS.find((x) => x.id === settings.provider)?.label ?? settings.provider;
  const keySource = settings.useServerKey ? "Server env var" : "Your key (browser)";
  const visionSupported = useMemo(
    () => modelSupportsVision(settings.provider, settings.model),
    [settings.provider, settings.model]
  );

  const sendChat = async (payload: {
    userText: string;
    images: { mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; base64: string }[];
    history: { role: "user" | "assistant"; text: string; images?: { mediaType: any; base64: string }[] }[];
  }): Promise<{ reply: string; revisedMarkdown?: string | null; error?: string }> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: payload.userText,
          images: payload.images,
          history: payload.history.map((h) => ({
            role: h.role,
            text: h.text,
            images: h.images?.map((i: any) => ({ mediaType: i.mediaType, base64: i.base64 })),
          })),
          markdown,
          docType,
          industry,
          clientName,
          projectName,
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.useServerKey ? undefined : settings.apiKey,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        return { reply: "", error: json?.error ?? "Revision failed" };
      }
      return { reply: json.reply ?? "", revisedMarkdown: json.revisedMarkdown ?? null };
    } catch (err: any) {
      return { reply: "", error: err?.message ?? "Network error" };
    }
  };

  const handleApplyRevision = (newMd: string, _previous: string) => {
    setMarkdown(newMd);
  };

  const handleUndoRevision = (previous: string) => {
    setMarkdown(previous);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
      {/* LEFT — INPUTS */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 h-fit sticky top-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dynamix flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> Generate Document
          </h2>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-dynamix/30 text-dynamix bg-dynamix/5 hover:bg-dynamix/10 inline-flex items-center gap-1.5"
            title="LLM provider & API key settings"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>
        </div>

        <div className="rounded-md bg-dynamix/5 border border-dynamix/15 px-3 py-2 text-[11px] text-dynamix flex items-center justify-between">
          <span><strong>LLM:</strong> {providerLabel} · <span className="font-mono">{settings.model}</span></span>
          <span className="text-dynamix/70">{keySource}</span>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1.5">
            Document Type
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white"
          >
            {DOC_CATALOG.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">{docMeta.description}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Based on: {docMeta.standardBasis}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1.5">
            Industry
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value as IndustryId)}
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white"
          >
            {INDUSTRIES.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Template adapts to industry best practices, compliance frameworks, terminology, KPIs and risks.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1.5">
              Client Name
            </label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme Medical"
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1.5">
              Project Name
            </label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="HubSpot CRM Implementation"
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Meeting Transcript
            </label>
            <div className="flex items-center gap-3">
              <label 
                className="text-[11px] text-dynamix hover:underline inline-flex items-center gap-1 cursor-pointer" 
                title="Upload a text-based transcript file (.txt, .md, .csv, .srt, .vtt)"
              >
                <Upload className="w-3 h-3" /> Upload file
                <input 
                  type="file" 
                  accept=".txt,.md,.csv,.srt,.vtt" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </label>
              <button
                onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
                className="text-[11px] text-dynamix hover:underline inline-flex items-center gap-1"
                title="Load a sample transcript"
              >
                <FlaskConical className="w-3 h-3" /> Load sample
              </button>
            </div>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={10}
            placeholder="Paste the full meeting transcript here. Speaker names, timestamps, and action items all welcome."
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm font-mono leading-relaxed resize-y"
          />
          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
            <span>{transcript.length.toLocaleString()} chars</span>
            <span>{transcript.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1.5">
            Extra Instructions (optional)
          </label>
          <textarea
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            rows={2}
            placeholder="e.g., Emphasize data privacy section; target 22-business-day timeline; format fees in INR."
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || transcript.trim().length < 50}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-dynamix text-white py-2.5 px-4 font-medium hover:bg-dynamix-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating {docMeta.short}...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate {docMeta.short}
            </>
          )}
        </button>
      </section>

      {/* RIGHT — PREVIEW */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[70vh]" ref={previewRef}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-dynamix" />
            <h2 className="font-semibold text-dynamix">
              {markdown ? `${docMeta.short} Preview` : "Document Preview"}
            </h2>
            {meta && (
              <span className="text-[11px] text-gray-500 ml-2">
                · {meta.provider} / {meta.model}
              </span>
            )}
          </div>
          {markdown && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 inline-flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy markdown"}
              </button>
              <button
                onClick={() => handleDownload("docx")}
                disabled={downloading !== null}
                className="text-xs px-3 py-1.5 rounded-md bg-dynamix text-white hover:bg-dynamix-dark inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {downloading === "docx" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Download .docx
              </button>
              <button
                onClick={() => handleDownload("pdf")}
                disabled={downloading !== null}
                className="text-xs px-3 py-1.5 rounded-md bg-dynamix-light text-white hover:bg-dynamix inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {downloading === "pdf" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                Save as PDF
              </button>
            </div>
          )}
        </div>

        <div className="p-6 md:p-10">
          {!markdown && !loading && (
            <div className="text-gray-500 text-sm flex flex-col items-center justify-center min-h-[60vh] text-center">
              <Sparkles className="w-10 h-10 text-dynamix/40 mb-3" />
              <div className="text-base font-medium text-gray-700">Ready when you are.</div>
              <p className="text-gray-500 mt-1 max-w-md">
                Paste a meeting transcript on the left, pick the document type and industry, and hit
                <em> Generate</em>. Your document preview will appear here.
              </p>
            </div>
          )}
          {loading && !markdown && (
            <div className="text-gray-600 text-sm flex flex-col items-center justify-center min-h-[60vh] text-center">
              <Loader2 className="w-10 h-10 text-dynamix animate-spin mb-4" />
              <div className="font-medium">Drafting your {docMeta.short}...</div>
              <div className="text-xs text-gray-500 mt-1">Using {providerLabel} · {settings.model}</div>
            </div>
          )}
          {markdown && (
            <article
              className="doc-preview max-w-3xl mx-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>

        <ChatPanel
          disabled={!markdown || loading}
          markdown={markdown}
          onApplyRevision={handleApplyRevision}
          onUndoRevision={handleUndoRevision}
          sendChat={sendChat}
          visionSupported={visionSupported}
        />
      </section>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        provider={settings.provider}
        model={settings.model}
        apiKey={settings.apiKey}
        useServerKey={settings.useServerKey}
        onChange={(v) => setSettings(v)}
      />
    </div>
  );
}

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9\-_. ]/gi, "_").slice(0, 80) || "document";
}
