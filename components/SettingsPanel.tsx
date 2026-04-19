"use client";

import { PROVIDERS, ProviderId } from "@/lib/shared";
import { KeyRound, Eye, EyeOff, X, Info } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  provider: ProviderId;
  model: string;
  apiKey: string;
  useServerKey: boolean;
  onChange: (v: { provider: ProviderId; model: string; apiKey: string; useServerKey: boolean }) => void;
}

export default function SettingsPanel(p: Props) {
  const [showKey, setShowKey] = useState(false);
  const [local, setLocal] = useState({
    provider: p.provider,
    model: p.model,
    apiKey: p.apiKey,
    useServerKey: p.useServerKey,
  });

  useEffect(() => {
    setLocal({ provider: p.provider, model: p.model, apiKey: p.apiKey, useServerKey: p.useServerKey });
  }, [p.provider, p.model, p.apiKey, p.useServerKey, p.open]);

  const providerDef = PROVIDERS.find((x) => x.id === local.provider)!;

  const handleProviderChange = (id: ProviderId) => {
    const def = PROVIDERS.find((x) => x.id === id)!;
    setLocal((s) => ({ ...s, provider: id, model: def.defaultModel }));
  };

  const save = () => {
    p.onChange({
      provider: local.provider,
      model: local.model,
      apiKey: local.apiKey,
      useServerKey: local.useServerKey,
    });
    // Persist API key + prefs in localStorage (user key only; server keys never leave Vercel).
    if (typeof window !== "undefined") {
      const store = {
        provider: local.provider,
        model: local.model,
        useServerKey: local.useServerKey,
        apiKey: local.useServerKey ? "" : local.apiKey,
      };
      localStorage.setItem("dynamix-docgen.settings", JSON.stringify(store));
    }
    p.onClose();
  };

  if (!p.open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full mt-10 border border-dynamix/20">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-dynamix/5 rounded-t-xl">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-dynamix" />
            <h2 className="text-lg font-semibold text-dynamix">LLM Provider & API Settings</h2>
          </div>
          <button
            onClick={p.onClose}
            className="text-gray-500 hover:text-gray-700 rounded-md p-1 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              LLM Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((pv) => (
                <button
                  key={pv.id}
                  onClick={() => handleProviderChange(pv.id)}
                  className={
                    "text-sm px-3 py-2 rounded-md border transition " +
                    (local.provider === pv.id
                      ? "bg-dynamix text-white border-dynamix"
                      : "bg-white text-gray-700 border-gray-300 hover:border-dynamix/60")
                  }
                >
                  {pv.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Model
            </label>
            <select
              value={local.model}
              onChange={(e) => setLocal((s) => ({ ...s, model: e.target.value }))}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-dynamix/30"
            >
              {providerDef.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                  {m.recommended ? " — Recommended" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
            <label className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="keySource"
                checked={!local.useServerKey}
                onChange={() => setLocal((s) => ({ ...s, useServerKey: false }))}
                className="mt-1 accent-dynamix"
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  Use my own API key (this browser)
                </div>
                <div className="text-xs text-gray-500">
                  Key is stored in your browser only and sent to our server with each request to call the LLM. Never logged.
                </div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="keySource"
                checked={local.useServerKey}
                onChange={() => setLocal((s) => ({ ...s, useServerKey: true }))}
                className="mt-1 accent-dynamix"
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  Use server-side key (Vercel env var)
                </div>
                <div className="text-xs text-gray-500">
                  Uses the key set in your Vercel project under{" "}
                  <code className="bg-gray-100 px-1 rounded">{providerDef.envVar}</code>.
                </div>
              </div>
            </label>
          </div>

          {!local.useServerKey && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {providerDef.label} API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={local.apiKey}
                  onChange={(e) => setLocal((s) => ({ ...s, apiKey: e.target.value }))}
                  placeholder={providerDef.id === "anthropic" ? "sk-ant-..." : providerDef.id === "openai" ? "sk-..." : "AIza..."}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-dynamix/30"
                />
                <button
                  onClick={() => setShowKey((s) => !s)}
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2 text-xs text-gray-500 mt-1.5">
                <Info className="w-3.5 h-3.5 mt-0.5" />
                <div>
                  Get a key:{" "}
                  {providerDef.id === "anthropic" && (
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-dynamix underline">console.anthropic.com/settings/keys</a>
                  )}
                  {providerDef.id === "openai" && (
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-dynamix underline">platform.openai.com/api-keys</a>
                  )}
                  {providerDef.id === "gemini" && (
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-dynamix underline">aistudio.google.com/app/apikey</a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
          <button
            onClick={p.onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 text-sm rounded-md bg-dynamix text-white hover:bg-dynamix-dark"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
