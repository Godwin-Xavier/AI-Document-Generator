"use client";

import {
  Bot,
  ImagePlus,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  Undo2,
  User,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export interface ChatImage {
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  base64: string;
  dataUrl: string; // for preview only
  name: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  images?: ChatImage[];
  // for assistant messages that produced a revision — so the user can undo
  revisionSnapshot?: {
    previousMarkdown: string;
    appliedMarkdown: string;
  };
  timestamp: number;
}

export interface ChatPanelProps {
  disabled?: boolean;
  markdown: string;
  onApplyRevision: (newMarkdown: string, snapshotPrevious: string) => void;
  onUndoRevision: (previousMarkdown: string) => void;
  sendChat: (payload: {
    userText: string;
    images: { mediaType: ChatImage["mediaType"]; base64: string }[];
    history: { role: "user" | "assistant"; text: string; images?: ChatImage[] }[];
  }) => Promise<{ reply: string; revisedMarkdown?: string | null; error?: string }>;
  visionSupported: boolean;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

function fileToChatImage(file: File): Promise<ChatImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
      if (!m) return reject(new Error("Could not read image"));
      const mt = m[1] as ChatImage["mediaType"];
      const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
      if (!allowed.includes(mt)) return reject(new Error(`Unsupported image type: ${mt}`));
      resolve({
        mediaType: mt,
        base64: m[2],
        dataUrl,
        name: file.name || "pasted-image",
      });
    };
    reader.onerror = () => reject(reader.error ?? new Error("Read error"));
    reader.readAsDataURL(file);
  });
}

export default function ChatPanel({
  disabled,
  markdown,
  onApplyRevision,
  onUndoRevision,
  sendChat,
  visionSupported,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<ChatImage[]>([]);
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const addImages = async (files: FileList | File[]) => {
    setError(null);
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const converted: ChatImage[] = [];
    for (const f of arr) {
      if (f.size > MAX_IMAGE_BYTES) {
        setError(`Image "${f.name}" is larger than 8MB. Please downsize first.`);
        continue;
      }
      try {
        converted.push(await fileToChatImage(f));
      } catch (e: any) {
        setError(e?.message ?? "Failed to read image");
      }
    }
    if (converted.length) setPendingImages((prev) => [...prev, ...converted]);
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) await addImages(e.target.files);
    e.target.value = "";
  };

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of Array.from(items)) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f && f.type.startsWith("image/")) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      await addImages(files);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) await addImages(e.dataTransfer.files);
  };

  const removePendingImage = (idx: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && pendingImages.length === 0) return;
    if (disabled) return;

    if (pendingImages.length && !visionSupported) {
      setError(
        "The currently selected model does not support images. Open Settings and switch to a vision-capable model (Claude Sonnet 4.6, GPT-4o, Gemini 1.5 Pro)."
      );
      return;
    }

    setError(null);
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      text,
      images: pendingImages,
      timestamp: Date.now(),
    };
    const historyForApi = messages.map((m) => ({
      role: m.role,
      text: m.text,
      images: m.images,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPendingImages([]);
    setSending(true);

    try {
      const snapshotPrevious = markdown;
      const res = await sendChat({
        userText: text,
        images: pendingImages.map((img) => ({ mediaType: img.mediaType, base64: img.base64 })),
        history: historyForApi,
      });

      if (res.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${Date.now()}`,
            role: "assistant",
            text: `⚠️ ${res.error}`,
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: res.reply || (res.revisedMarkdown ? "Document updated." : "(no reply)"),
        timestamp: Date.now(),
      };
      if (res.revisedMarkdown) {
        assistantMsg.revisionSnapshot = {
          previousMarkdown: snapshotPrevious,
          appliedMarkdown: res.revisedMarkdown,
        };
        onApplyRevision(res.revisedMarkdown, snapshotPrevious);
      }
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          text: `⚠️ ${err?.message ?? "Chat failed"}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && (e.ctrlKey || e.metaKey || !e.altKey)) {
      // Enter or Cmd/Ctrl+Enter sends; Shift+Enter newline
      if (!e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleUndo = (msg: ChatMessage) => {
    if (!msg.revisionSnapshot) return;
    onUndoRevision(msg.revisionSnapshot.previousMarkdown);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, text: `${m.text}\n\n_(Reverted by user)_`, revisionSnapshot: undefined } : m
      )
    );
  };

  return (
    <div className="border-t border-gray-200 bg-gradient-to-b from-dynamix/5 to-white rounded-b-xl">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-dynamix/10">
        <div className="flex items-center gap-2 text-dynamix">
          <Bot className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Chat to revise this document</h3>
        </div>
        <div className="text-[11px] text-gray-500">
          {visionSupported ? "Drop or paste screenshots to guide edits" : "Current model is text-only"}
        </div>
      </div>

      {/* Thread */}
      <div
        ref={scrollerRef}
        className="px-4 py-3 max-h-[420px] overflow-y-auto space-y-3"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {messages.length === 0 && (
          <div className="text-xs text-gray-500 italic py-4 text-center">
            Ask for changes in natural language — or drop a screenshot of a reference layout, marked-up PDF, or existing
            document and the assistant will use it to revise the draft.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-dynamix text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed shadow-sm border ${
                m.role === "user"
                  ? "bg-dynamix text-white border-dynamix"
                  : "bg-white text-gray-800 border-gray-200"
              }`}
            >
              {m.images && m.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {m.images.map((im, i) => (
                    <img
                      key={i}
                      src={im.dataUrl}
                      alt={im.name}
                      className="max-w-[200px] max-h-[140px] rounded border border-white/50"
                    />
                  ))}
                </div>
              )}
              <div>{m.text}</div>
              {m.revisionSnapshot && (
                <button
                  onClick={() => handleUndo(m)}
                  className="mt-2 text-[11px] inline-flex items-center gap-1 text-dynamix hover:text-dynamix-dark bg-dynamix/10 hover:bg-dynamix/20 border border-dynamix/30 px-2 py-0.5 rounded"
                >
                  <Undo2 className="w-3 h-3" />
                  Undo this revision
                </button>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-dynamix/20 text-dynamix flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-dynamix text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-dynamix" />
              Thinking & revising...
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div
        className={`p-3 border-t border-gray-200 ${dragOver ? "bg-dynamix/10" : "bg-white"} rounded-b-xl`}
      >
        {error && (
          <div className="mb-2 text-xs rounded bg-red-50 border border-red-200 text-red-800 px-2 py-1.5">
            {error}
          </div>
        )}

        {pendingImages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-16 h-16 object-cover rounded border border-gray-300"
                />
                <button
                  onClick={() => removePendingImage(idx)}
                  className="absolute -top-1.5 -right-1.5 bg-white border border-gray-300 rounded-full w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-600 shadow-sm"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || !visionSupported}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-40"
            title={visionSupported ? "Attach screenshot" : "Current model doesn't support images"}
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Generate a document first to start chatting with revisions..."
                : "Describe the changes you need — e.g., 'Make the fee structure match this screenshot' (drop / paste an image)"
            }
            disabled={disabled}
            rows={2}
            className="flex-1 resize-y border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-dynamix/30 disabled:bg-gray-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || disabled || (!input.trim() && pendingImages.length === 0)}
            className="p-2 rounded-md bg-dynamix text-white hover:bg-dynamix-dark disabled:opacity-50 disabled:cursor-not-allowed self-stretch flex items-center justify-center min-w-[40px]"
            title="Send (Enter)"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            Drop, paste, or click the image button to attach
          </span>
          <span>Enter to send · Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  );
}
