import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2, X, Sparkles } from "lucide-react";
import { useChatWithMentor } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts?: number;
}

export default function MentorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Student Buddy AI mentor. I guide you to discover solutions through questions rather than giving away answers.\n\nWhat coding problem are we working on today? Feel free to describe it or paste it here.",
      ts: Date.now(),
    }
  ]);
  const [input, setInput] = useState("");
  const [problemTitle, setProblemTitle] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatMentor = useChatWithMentor();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMentor.isPending]);

  const handleSend = async () => {
    if (!input.trim() || chatMentor.isPending) return;
    const userMessage = input.trim();
    setInput("");

    const updatedMessages: Message[] = [...messages, { role: "user" as const, content: userMessage, ts: Date.now() }];
    setMessages(updatedMessages);

    try {
      const history = updatedMessages.slice(1, -1).map(m => ({ role: m.role, content: m.content }));
      const result = await chatMentor.mutateAsync({
        data: { message: userMessage, problemTitle: problemTitle || undefined, conversationHistory: history }
      });
      setMessages(prev => [...prev, { role: "assistant", content: result.reply, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        ts: Date.now(),
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-white/5 bg-card/50 shrink-0 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Mentor Chat</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Socratic AI — guides you to the answer</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Online</span>
          </div>
        </div>

        {/* Problem pin */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              className="w-full bg-background/60 border border-white/8 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary pr-8 placeholder:text-muted-foreground/50"
              placeholder="📌 Pin a problem for context (e.g. Two Sum)"
              value={problemTitle}
              onChange={e => setProblemTitle(e.target.value)}
            />
            {problemTitle && (
              <button
                onClick={() => setProblemTitle("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {problemTitle && (
            <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full shrink-0 font-medium">
              Pinned
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-secondary/80 text-foreground rounded-tl-sm border border-white/5"
              }`}>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {chatMentor.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-secondary/80 border border-white/5">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 md:p-5 border-t border-white/5 bg-card/50 shrink-0 backdrop-blur-sm">
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full bg-background/60 border border-white/8 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[52px] max-h-[150px] resize-none disabled:opacity-60 placeholder:text-muted-foreground/50 transition-all"
            placeholder="Ask about a problem, algorithm, or bug... (Enter to send, Shift+Enter for newline)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={chatMentor.isPending}
          />
          <motion.button
            onClick={handleSend}
            disabled={chatMentor.isPending || !input.trim()}
            className="absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.9 }}
          >
            {chatMentor.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </motion.button>
        </div>
        <p className="text-xs text-muted-foreground/50 mt-2">
          {messages.length > 1
            ? `${messages.length - 1} message${messages.length > 2 ? "s" : ""} in this session`
            : "Start by describing your problem or asking a question"}
        </p>
      </div>
    </div>
  );
}
