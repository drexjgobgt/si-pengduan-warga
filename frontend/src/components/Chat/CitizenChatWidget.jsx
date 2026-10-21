import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Send,
  Bot,
  Sparkles,
  RefreshCw,
  LogIn,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  User,
} from "lucide-react";
import { chatAPI } from "../../services/api";

const MAX_MESSAGE_LENGTH = 500;

const DEFAULT_SUGGESTIONS = [
  "📋 Cara Membuat Pengaduan",
  "⏱️ Target Waktu Penanganan (SLA)",
  "🔍 Lacak Status Laporan Saya",
  "📊 Arti Status Laporan",
  "🛡️ Pengaduan Anonim",
];

export const CitizenChatWidget = ({
  isAuthenticated = false,
  user = null,
  onOpenLogin = () => {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Halo! Saya Asisten Virtual SIPW berbasis AI. Saya siap membantu menjawab pertanyaan seputar panduan pengaduan, kategori, SLA, dan status penanganan laporan warga.",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of message list
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, scrollToBottom]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    if (text.length > MAX_MESSAGE_LENGTH) {
      setError(`Panjang pesan melebihi batas maksimum (${MAX_MESSAGE_LENGTH} karakter).`);
      return;
    }

    setError(null);
    setInputValue("");

    const userMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build lightweight conversation history for context (last 4 messages)
      const historyPayload = newMessages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatAPI.sendMessage({
        message: text,
        history: historyPayload,
      });

      if (res.data?.success && res.data.data) {
        const { reply, suggestions: newSuggestions, requiresAuth } = res.data.data;

        setMessages((prev) => [
          ...prev,
          {
            id: "msg-" + Date.now() + "-reply",
            role: "assistant",
            content: reply,
            requiresAuth: Boolean(requiresAuth),
            timestamp: new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);

        if (Array.isArray(newSuggestions) && newSuggestions.length > 0) {
          setSuggestions(newSuggestions);
        }
      } else {
        throw new Error(res.data?.error || "Gagal mendapatkan respons dari asisten AI.");
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        "Terjadi kendala koneksi ke asisten AI. Silakan coba kembali.";

      setError(errMsg);

      setMessages((prev) => [
        ...prev,
        {
          id: "msg-" + Date.now() + "-err",
          role: "assistant",
          isError: true,
          content:
            "Mohon maaf, sistem AI sedang tidak dapat merespons. Layanan tetap dapat diakses melalui menu navigasi SIPW.",
          timestamp: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectSuggestion = (suggestionText) => {
    // If suggestion is 'Masuk Akun', open login directly
    if (suggestionText === "Masuk Akun") {
      onOpenLogin();
      return;
    }
    handleSendMessage(suggestionText);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Jendela Chat Asisten AI SIPW"
          className="mb-3 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-indigo-900/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"
                  title="Sistem AI Aktif"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight text-white">
                    Asisten Virtual SIPW
                  </h3>
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    Kios AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Layanan Publik Cerdas Pengaduan Warga
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Tutup jendela chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status Bar */}
          <div className="bg-slate-50 border-b border-slate-100 px-3.5 py-2 flex items-center justify-between text-xs">
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium truncate max-w-[200px]">
                  Masuk: <strong>{user?.name || "Warga"}</strong>
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                  Pelacakan Aktif
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mode Publik (FAQ & Panduan)</span>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors"
                >
                  <LogIn className="w-3 h-3" />
                  Masuk Akun
                </button>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-xs"
                      : msg.isError
                      ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Auth Call-to-Action inside bubble if required */}
                  {msg.requiresAuth && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80">
                      <button
                        onClick={onOpenLogin}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg font-semibold text-[11px] shadow-xs transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Masuk untuk Lacak Laporan Anda
                      </button>
                    </div>
                  )}

                  <div
                    className={`mt-1 text-[9px] text-right ${
                      msg.role === "user" ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                    <span className="text-[11px] font-medium text-slate-500 ml-1.5">
                      Memproses jawaban...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          {suggestions.length > 0 && !isLoading && (
            <div className="bg-white px-3 py-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
                Pilihan:
              </span>
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSuggestion(sug)}
                  className="shrink-0 text-[11px] font-medium text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 px-2.5 py-1 rounded-full transition-all text-left"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border-t border-red-200 px-3 py-1.5 flex items-center justify-between text-xs text-red-700">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-[11px] line-clamp-1">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-[10px] font-bold"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isAuthenticated
                    ? "Tanyakan panduan atau 'status laporan saya'..."
                    : "Tanyakan cara lapor, kategori, SLA..."
                }
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={isLoading}
                className="w-full text-xs pl-3.5 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60 placeholder:text-slate-400"
              />

              <div className="absolute right-1.5 flex items-center gap-1">
                <span
                  className={`text-[10px] ${
                    inputValue.length >= MAX_MESSAGE_LENGTH
                      ? "text-red-500 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {inputValue.length}/{MAX_MESSAGE_LENGTH}
                </span>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Kirim pesan"
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Tekan Enter untuk mengirim</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Data aman & terjaga
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer active:scale-95"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Tutup Asisten AI" : "Buka Asisten AI Warga"}
      >
        <div className="relative">
          {isOpen ? (
            <X className="w-5 h-5 transition-transform duration-200 rotate-90" />
          ) : (
            <>
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-700" />
            </>
          )}
        </div>

        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold tracking-tight leading-none flex items-center gap-1">
            Asisten AI
            <Sparkles className="w-3 h-3 text-amber-300" />
          </span>
          <span className="text-[10px] text-indigo-200 leading-tight">
            Tanya Layanan & Status
          </span>
        </div>
      </button>
    </div>
  );
};

export default CitizenChatWidget;
