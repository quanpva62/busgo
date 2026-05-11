import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = import.meta.env.VITE_API_URL;

const mdComponents = {
  h3: ({ children }) => <p className="font-bold text-on-surface mt-2 mb-1">{children}</p>,
  strong: ({ children }) => <span className="font-bold text-on-surface">{children}</span>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="hidden">{children}</thead>,
  tr: ({ children }) => <tr className="border-b border-outline-variant/20">{children}</tr>,
  td: ({ children }) => <td className="py-1.5 pr-3 first:text-secondary first:w-28 align-top">{children}</td>,
  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
  hr: () => <hr className="my-2 border-outline-variant/30" />,
  li: ({ children }) => <li className="ml-3 list-disc">{children}</li>,
};

const MIN_W = 280, MAX_W = 700, MIN_H = 300, MAX_H = 750;

export default function Chatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const mdWithNav = {
    ...mdComponents,
    a: ({ href, children }) => (
      <button
        onClick={() => { navigate(href); setOpen(false); }}
        className="inline text-primary font-bold underline hover:opacity-75 transition-opacity cursor-pointer"
      >
        {children}
      </button>
    ),
  };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState({ width: 384, height: 500 });
  const bottomRef = useRef(null);

  function startResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;

    function onMove(e) {
      setSize({
        width:  Math.min(MAX_W, Math.max(MIN_W, startW + (startX - e.clientX))),
        height: Math.min(MAX_H, Math.max(MIN_H, startH + (startY - e.clientY))),
      });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages, // gửi lịch sử để giữ ngữ cảnh
        }),
      });
      const data = await res.json();
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-2 left-2 sm:left-auto sm:right-6 z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/20 sm:w-(--cw) sm:h-(--ch) h-[70vh] max-h-[calc(100vh-6rem)]"
          style={{ "--cw": `${size.width}px`, "--ch": `${size.height}px` }}
        >
          {/* Resize handle — góc trên trái (ẩn trên mobile) */}
          <div
            onMouseDown={startResize}
            className="hidden sm:flex absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-10 items-center justify-center"
            title="Kéo để thay đổi kích thước"
          >
            <span className="material-symbols-outlined text-white/50 text-sm select-none">drag_indicator</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white shrink-0">
            <span className="material-symbols-outlined text-xl">smart_toy</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight">BusGo Assistant</p>
              <p className="text-white/70 text-xs">Hỏi về tuyến, giá vé, lịch xe...</p>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded-lg p-1 transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-secondary text-sm mt-8 space-y-2">
                <span className="material-symbols-outlined text-4xl text-primary/40 block">smart_toy</span>
                <p>Xin chào! Tôi có thể giúp bạn tìm chuyến xe, xem giá vé và lịch khởi hành.</p>
                <div className="flex flex-col gap-1.5 mt-4">
                  {[
                    "Có chuyến Hà Nội → Vinh ngày mai không?",
                    "Giá vé Hà Nội Hải Phòng bao nhiêu?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-xs text-primary border border-primary/30 rounded-xl px-3 py-2 hover:bg-primary/5 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    m.role === "user"
                      ? "bg-primary text-white rounded-br-sm whitespace-pre-wrap"
                      : "bg-surface-container-low text-on-surface rounded-bl-sm"
                  }`}
                >
                  {m.role === "user" ? m.content : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdWithNav}>
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-container-low rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-outline-variant/20 flex gap-2 shrink-0">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Nhập câu hỏi..."
              rows={1}
              className="flex-1 px-3 py-2 text-sm bg-surface-container-low rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-24"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-3 py-2 bg-primary text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
            >
              <span className="material-symbols-outlined text-xl">send</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-2xl">
          {open ? "close" : "smart_toy"}
        </span>
      </button>
    </>
  );
}
