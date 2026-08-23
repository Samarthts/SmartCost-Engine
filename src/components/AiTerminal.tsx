import React, { useState, useRef, useEffect } from 'react';
import { CadPart, CostBreakdownDetails, MaterialSpec, SourcingRegion } from '../types';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Terminal as TerminalIcon, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Check, 
  Copy, 
  ChevronRight, 
  AlertTriangle, 
  TrendingDown, 
  Layers, 
  Globe2
} from 'lucide-react';

interface AiTerminalProps {
  part: CadPart;
  material: MaterialSpec;
  region: SourcingRegion;
  batchSize: number;
  costDetails: CostBreakdownDetails;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

export const AiTerminal: React.FC<AiTerminalProps> = ({
  part,
  material,
  region,
  batchSize,
  costDetails,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'system',
      text: 'Multimodal AI Sourcing Engine v4.2 initialized. Connected to 3D CAD geometry analyzer and global supplier matrix (250,000+ audited vendors).',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'msg-greeting',
      sender: 'assistant',
      text: `**Welcome to the AI Sourcing Co-Pilot.**

I have continuous visibility into the active 3D CAD mesh for **${part.name.split(' (')[0]}**. 

Current Parameters:
• **Material**: ${material.name}
• **Batch Volume**: ${batchSize.toLocaleString()} units
• **Primary Hub**: ${region.name} (${region.subHub})
• **Landed Should-Cost**: **$${costDetails.pillars.totalShouldCost.toFixed(2)}** / unit
• **Scope 3 Carbon**: **${costDetails.carbonEmissions.totalScope3Co2eKgPerUnit} kg CO₂e** / unit

Ask me to analyze material pivots, calculate custom mold tooling amortizations, evaluate DFM geometry adjustments to eliminate EDM, or match vetted suppliers.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickChips = [
    {
      label: 'DuPont Zytel vs SS316 Pivot',
      query: 'We are getting killed on the unit margins for this housing assembly. What happens if I change the base material from Stainless Steel 316 to DuPont Zytel nylon? Walk me through the cost sliders, tool lifespan, and carbon footprint.',
    },
    {
      label: 'DFM Deep-Dive (Eliminate EDM)',
      query: 'Identify the top 3 over-engineered geometrical features on the active 3D mesh that are driving up machining cycle time and tooling wear.',
    },
    {
      label: 'India vs Mexico Landed Cost',
      query: 'Compare landed costs and freight lead times between India (Bengaluru) and Mexico (Monterrey) corridors for a 20,000 unit batch.',
    },
    {
      label: 'Scope 3 Carbon Abatement',
      query: 'What is the most cost-effective way to trim Scope 3 embodied carbon by over 50% without degrading structural strength?',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputQuery;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            partName: part.name,
            material: material.name,
            batchSize,
            region: region.name,
            unitCost: costDetails.pillars.totalShouldCost,
            carbon: costDetails.carbonEmissions.totalScope3Co2eKgPerUnit,
          },
        }),
      });

      const data = await response.json();
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Analysis completed with Core Sourcing Engine.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Simple browser speech synthesis if voice is toggled
      if (isVoiceEnabled && 'speechSynthesis' in window) {
        const cleanText = assistantMsg.text.replace(/[*#•_-]/g, ' ');
        const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 300));
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: `**Parametric Should-Cost Analysis**\n\n• Unit target: **$${costDetails.pillars.totalShouldCost.toFixed(2)}**\n• Tooling amortization: **$${costDetails.pillars.setupToolingAmortized.toFixed(2)}**\n• Recommendation: Core out thick wall sections to reduce cycle time by 140s.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="ai-sourcing-assistant-terminal" className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-2xl text-white flex flex-col h-full min-h-[580px]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-md">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">The AI Sourcing Assistant Terminal</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400">Powered by Parametric Core Engine & Gemini 3.7</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="terminal-voice-toggle-btn"
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`p-1.5 rounded-lg border transition-all ${
              isVoiceEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Voice Narration"
          >
            {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-2.5 border-b border-slate-800/80 no-scrollbar">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.query)}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-950 text-slate-300 hover:text-cyan-300 hover:bg-slate-850 border border-slate-800 whitespace-nowrap transition-all flex items-center gap-1 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Log Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 py-4 px-1 max-h-[380px] font-sans text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSystem = msg.sender === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center gap-2">
                <TerminalIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-400 px-1">
                <span className="font-semibold">{isUser ? 'You (Sourcing Lead)' : 'AI Sourcing Assistant'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`relative group max-w-[92%] p-3.5 rounded-2xl leading-relaxed ${
                  isUser
                    ? 'bg-cyan-600 text-white rounded-br-none shadow-md font-medium'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow-lg'
                }`}
              >
                {/* Format markdown bullet text nicely */}
                <div className="whitespace-pre-line space-y-1">
                  {msg.text.split('\n').map((line, lIdx) => {
                    if (line.startsWith('•') || line.startsWith('-')) {
                      return (
                        <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{line.replace(/^[•-]\s*/, '')}</span>
                        </div>
                      );
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <div key={lIdx} className="font-bold text-slate-100 text-[13px] pt-1">
                          {line.replace(/\*\*/g, '')}
                        </div>
                      );
                    }
                    return <div key={lIdx}>{line}</div>;
                  })}
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.text)}
                  className="absolute top-2 right-2 p-1 rounded bg-slate-900/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy message"
                >
                  {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 p-3 bg-slate-950 rounded-xl border border-slate-800 animate-pulse">
            <Bot className="w-4 h-4 animate-spin" />
            <span>Sourcing Engine analyzing 3D CAD geometry & calculating should-cost delta...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-auto pt-3 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          id="ai-terminal-input"
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask AI Assistant (e.g., 'What if we switch to DuPont Zytel?' or 'Explain EDM cost spike')..."
          className="flex-1 bg-slate-950 text-slate-100 text-xs rounded-xl border border-slate-700 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium placeholder:text-slate-500"
          disabled={isLoading}
        />
        <button
          id="ai-terminal-send-btn"
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1.5"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
