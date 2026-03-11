"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Bot, User, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface PendingAction {
  name: string;
  args: string[];
  label: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userScrolledUp = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    // User is "scrolled up" if more than 100px from bottom
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    userScrolledUp.current = !atBottom;
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/ai/chat");
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch {
      console.error("Failed to load chat history");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    setLoading(true);
    userScrolledUp.current = false;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.data.response) {
          const assistantMsg: ChatMessage = {
            id: Date.now() + 1,
            role: "assistant",
            content: data.data.response,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
        if (data.data.pendingAction) {
          setPendingAction(data.data.pendingAction);
        }
      } else {
        toast.error(data.error || "Failed to get response");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function clearHistory() {
    if (!confirm("Clear all chat history?")) return;
    try {
      const res = await fetch("/api/ai/chat", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
        setPendingAction(null);
        toast.success("Chat history cleared");
      }
    } catch {
      toast.error("Failed to clear history");
    }
  }

  async function handleActionConfirm() {
    if (!pendingAction) return;
    setLoading(true);
    const action = pendingAction;
    setPendingAction(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmAction: { name: action.name, args: action.args } }),
      });
      const data = await res.json();
      if (data.success && data.data.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: "assistant",
            content: data.data.response,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      toast.error("Failed to execute action");
    } finally {
      setLoading(false);
    }
  }

  async function handleActionDeny() {
    setPendingAction(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denyAction: true }),
      });
      const data = await res.json();
      if (data.success && data.data.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: "assistant",
            content: data.data.response,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      toast.error("Failed to process denial");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-4xl md:text-5xl font-bold text-[#2d2d2d] -rotate-1"
          style={{ fontFamily: "'Kalam', cursive" }}
        >
          AI Chat
        </h1>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="border-2 border-[#2d2d2d] text-[#6b6560] hover:bg-red-50 hover:text-red-600"
            style={{ borderRadius: "var(--radius-wobbly)" }}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div
        className="flex-1 border-2 border-[#2d2d2d] bg-white overflow-hidden flex flex-col"
        style={{
          borderRadius: "var(--radius-wobbly)",
          boxShadow: "var(--shadow-sketch-subtle)",
        }}
      >
        <div
          className="flex-1 overflow-y-auto p-4"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {historyLoading ? (
            <div className="flex items-center justify-center h-full py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#6b6560]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <Bot className="w-16 h-16 text-[#d4cfc9] mb-4" />
              <p
                className="text-xl text-[#6b6560] mb-2"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                Ask me anything about your job search!
              </p>
              <div className="text-sm text-[#a09890] space-y-1">
                <p>&quot;What skills am I missing for senior roles?&quot;</p>
                <p>&quot;Help me prepare for an interview at Google&quot;</p>
                <p>&quot;How should I negotiate my salary?&quot;</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2d5da1] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div
                    className="bg-[#f5f0eb] border-2 border-[#d4cfc9] px-4 py-3"
                    style={{ borderRadius: "var(--radius-wobbly)" }}
                  >
                    <div className="flex items-center gap-2 text-[#6b6560]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span
                        className="text-sm"
                        style={{ fontFamily: "'Patrick Hand', cursive" }}
                      >
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {pendingAction && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#ff9800] flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <div
                    className="max-w-[75%] px-4 py-3 border-2 border-[#ff9800] bg-[#fff3e0]"
                    style={{ borderRadius: "var(--radius-wobbly)" }}
                  >
                    <p
                      className="text-sm font-bold text-[#2d2d2d] mb-2"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      Permission requested
                    </p>
                    <p
                      className="text-sm text-[#2d2d2d] mb-3"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      {pendingAction.label}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleActionConfirm}
                        disabled={loading}
                        className="bg-[#4caf50] hover:bg-[#388e3c] text-white border-2 border-[#2d2d2d]"
                        style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                      >
                        Allow
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleActionDeny}
                        disabled={loading}
                        className="border-2 border-[#2d2d2d] text-[#2d2d2d]"
                        style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={sendMessage}
          className="border-t-2 border-[#d4cfc9] p-3 flex gap-2 bg-[#fdfbf7]"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 border-2 border-[#2d2d2d] bg-white"
            style={{
              borderRadius: "var(--radius-wobbly)",
              fontFamily: "'Patrick Hand', cursive",
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-[#2d5da1] hover:bg-[#1e4a8a] text-white border-2 border-[#2d2d2d] px-4"
            style={{ borderRadius: "var(--radius-wobbly)" }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-[#ff4d4d]" : "bg-[#2d5da1]"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={`max-w-[75%] px-4 py-3 border-2 ${
          isUser
            ? "bg-[#fff9c4] border-[#2d2d2d]"
            : "bg-[#f5f0eb] border-[#d4cfc9]"
        }`}
        style={{ borderRadius: "var(--radius-wobbly)" }}
      >
        <div
          className="text-sm text-[#2d2d2d] break-words"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div className="prose prose-sm prose-stone max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:bg-[#f0ece6] [&_code]:px-1 [&_code]:rounded [&_pre]:bg-[#f0ece6] [&_pre]:p-2 [&_pre]:rounded [&_strong]:text-[#2d2d2d]">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className="text-[10px] text-[#a09890] mt-1">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
