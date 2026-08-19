import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import api from "../lib/api";

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", content: "Hello! I am Anndevta, your AI growth manager. How can I help you with your restaurant today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    
    const history = messages.map(m => ({ role: m.role === "model" ? "model" : "user", content: m.content }));
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: userMessage,
        history: history.slice(1)
      });
      setMessages(prev => [...prev, { role: "model", content: res.data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "model", content: "Sorry, I am having trouble connecting to my brain right now. Ensure the GEMINI_API_KEY is configured in the backend .env file." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed
          bottom-6
          right-6
          w-10
          h-10
          flex
          items-center
          justify-center
          rounded-full
          bg-gradient-to-br
          from-[#FF8A3D]
          to-[#FF6B00]
          text-white
          shadow-[0_12px_28px_rgba(255,107,0,0.28)]
          hover:scale-105
          transition-all
          duration-300
          ${isOpen ? "scale-0" : "scale-100"}
          z-50
        `}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-white border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: "500px", maxHeight: "80vh" }}>
        
        {/* Header */}
        <div className="bg-gradient-to-br
          from-[#FF8A3D]
          to-[#FF6B00] text-white p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-display tracking-wide">Anndevta AI</h3>
              <p className="text-[10px] text-white/80">Restaurant Growth Expert</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sand-subtle/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-forest text-white rounded-tr-sm' : 'bg-white border border-border shadow-sm text-foreground rounded-tl-sm'}`}>
                {msg.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-border shadow-sm text-foreground rounded-2xl rounded-tl-sm p-3 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-terracota/50 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-terracota/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-terracota/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-border flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Anndevta..."
            className="flex-1 px-3 py-2 text-sm border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-terracota/50 bg-sand-subtle/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-gradient-to-br
          from-[#FF8A3D]
          to-[#FF6B00] text-white rounded-full hover:bg-terracota-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
}
