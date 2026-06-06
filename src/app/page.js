"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState("Connecting...");
  const [regime, setRegime] = useState(null);
  const [signal, setSignal] = useState(null);
  const [globalPulse, setGlobalPulse] = useState(null);

  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      ws = new WebSocket("ws://localhost:8000/ws");

      ws.onopen = () => {
        setStatus("🟢 Engine Live");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.regime) setRegime(data.regime);
          if (data.signals) setSignal({ signals: data.signals });
          if (data.global_pulse) setGlobalPulse(data.global_pulse);
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setStatus("🔴 Engine Offline");
        // Attempt to reconnect after 5 seconds without throwing red developer errors
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket encountered an error", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 relative">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-blue-900/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-emerald-900/20 blur-[150px] rounded-full mix-blend-screen" />
      </div>
      
      <div className="w-full px-4 md:px-8 py-6 relative z-10">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-white/5 pb-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
              VAULT<span className="text-blue-500">.AI</span>
            </h1>
            <p className="text-white/40 mt-2 font-mono text-[10px] md:text-sm tracking-widest uppercase">Institutional Quant Platform</p>
          </div>
          <div className="flex flex-col items-end">
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-full border ${status.includes("Live") ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
              <div className={`w-2 h-2 rounded-full ${status.includes("Live") ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`} />
              <span className={`font-mono text-[10px] md:text-xs uppercase tracking-widest ${status.includes("Live") ? 'text-emerald-500' : 'text-rose-500'}`}>
                {status}
              </span>
            </div>
            {status.includes("Offline") && (
               <p className="text-[10px] text-white/30 mt-2 font-mono tracking-widest uppercase animate-pulse">Retrying connection...</p>
            )}
          </div>
        </header>

        {/* Master Layout */}
        <div className="flex flex-col space-y-8">
          
        {/* Top Intelligence Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Macro Radar */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h2 className="text-white/40 text-xs font-mono tracking-[0.2em] uppercase mb-6 flex items-center">
              <span className="w-4 h-[1px] bg-white/20 mr-3" /> Macro Radar (Domestic)
            </h2>
            {regime ? (
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <p className="text-3xl md:text-4xl font-light tracking-tight">{regime.label}</p>
                </div>
                <div className="inline-flex items-center space-x-2 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                  <span className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Updated:</span>
                  <span className="text-blue-400 text-[10px] font-mono">{regime.date}</span>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-4">
                 <div className="h-10 bg-white/5 rounded-lg w-1/3" />
                 <div className="h-4 bg-white/5 rounded-full w-48" />
              </div>
            )}
          </section>

          {/* Global Pulse & US Sentiment */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-white/40 text-xs font-mono tracking-[0.2em] uppercase flex items-center">
                <span className="w-4 h-[1px] bg-white/20 mr-3" /> Global Pulse & News
              </h2>
              {globalPulse && (
                <span className={`text-[10px] px-3 py-1 rounded-full border font-mono tracking-widest ${globalPulse.news_sentiment.label === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : globalPulse.news_sentiment.label === 'FEAR / NEGATIVE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-white/5 text-white/50 border-white/10'}`}>
                  NLP: {globalPulse.news_sentiment.label}
                </span>
              )}
            </div>
            
            {globalPulse ? (
              <div className="space-y-4">
                <div className="flex space-x-6">
                  {Object.values(globalPulse.us_markets).map((m, i) => (
                    <div key={i}>
                      <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-1">{m.name}</p>
                      <p className={`text-xl font-light tracking-tight ${m.pct_change > 0 ? 'text-emerald-400' : m.pct_change < 0 ? 'text-rose-400' : 'text-white/60'}`}>
                        {m.pct_change > 0 ? '+' : ''}{m.pct_change.toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-black/30 rounded-xl p-3 border border-white/[0.05]">
                   <p className="text-xs font-mono text-white/60 leading-relaxed">
                     <span className="text-purple-400 mr-2">»</span>
                     {globalPulse.news_sentiment.top_headline}
                   </p>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-4">
                 <div className="flex space-x-6">
                    <div className="h-8 bg-white/5 rounded-lg w-16" />
                    <div className="h-8 bg-white/5 rounded-lg w-16" />
                 </div>
                 <div className="h-10 bg-white/5 rounded-xl w-full" />
              </div>
            )}
          </section>
        </div>

          {/* AI Scanner */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 backdrop-blur-xl flex flex-col flex-grow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white/40 text-xs font-mono tracking-[0.2em] uppercase flex items-center">
                <span className="w-4 h-[1px] bg-white/20 mr-3" /> XGBoost Scanner
              </h2>
              <div className="text-[10px] px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-mono tracking-widest">
                {signal?.signals?.length || 0} SCANNED
              </div>
            </div>
            
            {signal ? (
              signal.error ? (
                <div className="w-full p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <p className="text-rose-400 font-mono tracking-widest text-xs uppercase">Engine Error: {signal.error}</p>
                </div>
              ) : signal.signals ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  
                  {/* BUYS COLUMN */}
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-emerald-400/80 text-xs font-mono tracking-[0.2em] uppercase pb-2 border-b border-emerald-500/20 text-center">
                      AI BUY SETUPS
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {signal.signals
                        .filter(s => s.action.includes('BUY'))
                        .sort((a, b) => {
                          if (a.action === 'STRONG BUY' && b.action !== 'STRONG BUY') return -1;
                          if (a.action !== 'STRONG BUY' && b.action === 'STRONG BUY') return 1;
                          return b.confidence - a.confidence;
                        })
                        .map((s, i) => (
                          <div key={i} className="group p-5 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/[0.05] hover:bg-emerald-500/[0.04] transition-all duration-300">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h3 className="text-lg font-bold tracking-tight leading-none">{s.symbol}</h3>
                                <span className="text-[9px] font-mono text-white/30">{s.date}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-medium text-white/90 block leading-none mb-1">₹{s.latest_close?.toFixed(2) || "0.00"}</span>
                                <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">TGT: ₹{s.target_price?.toFixed(2) || "0.00"}</span>
                              </div>
                            </div>
                            <div className="bg-black/40 rounded-xl p-3 flex flex-col space-y-3 border border-emerald-500/10">
                              <div className="flex justify-between items-center">
                                 <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                   {s.action}
                                 </span>
                                 <span className="text-xs font-mono text-white/70">{s.confidence || "--"}% CONF</span>
                              </div>
                              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block text-center border-t border-white/5 pt-2">{s.recommended_strategy}</span>
                              
                              {/* Explainable AI (XAI) Reasoning */}
                              {s.rationale && (
                                <div className="pt-2 border-t border-white/5 space-y-1">
                                  {s.rationale.map((reason, idx) => (
                                    <p key={idx} className="text-[9px] font-mono text-white/50 leading-tight flex items-start">
                                      <span className="text-emerald-500/50 mr-1.5 mt-[2px]">•</span> 
                                      <span className="flex-1">{reason}</span>
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* SELLS COLUMN */}
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-rose-400/80 text-xs font-mono tracking-[0.2em] uppercase pb-2 border-b border-rose-500/20 text-center">
                      AI SELL SETUPS
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {signal.signals
                        .filter(s => s.action.includes('SELL'))
                        .sort((a, b) => b.confidence - a.confidence)
                        .map((s, i) => (
                          <div key={i} className="group p-5 rounded-2xl bg-rose-500/[0.02] border border-rose-500/[0.05] hover:bg-rose-500/[0.04] transition-all duration-300">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h3 className="text-lg font-bold tracking-tight leading-none">{s.symbol}</h3>
                                <span className="text-[9px] font-mono text-white/30">{s.date}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-medium text-white/90 block leading-none mb-1">₹{s.latest_close?.toFixed(2) || "0.00"}</span>
                                <span className="text-[10px] font-mono text-rose-500/60 uppercase tracking-widest">TGT: ₹{s.target_price?.toFixed(2) || "0.00"}</span>
                              </div>
                            </div>
                            <div className="bg-black/40 rounded-xl p-3 flex flex-col space-y-3 border border-rose-500/10">
                              <div className="flex justify-between items-center">
                                 <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                   {s.action}
                                 </span>
                                 <span className="text-xs font-mono text-white/70">{s.confidence || "--"}% CONF</span>
                              </div>
                              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block text-center border-t border-white/5 pt-2">{s.recommended_strategy}</span>
                              
                              {/* Explainable AI (XAI) Reasoning */}
                              {s.rationale && (
                                <div className="pt-2 border-t border-white/5 space-y-1">
                                  {s.rationale.map((reason, idx) => (
                                    <p key={idx} className="text-[9px] font-mono text-white/50 leading-tight flex items-start">
                                      <span className="text-rose-500/50 mr-1.5 mt-[2px]">•</span> 
                                      <span className="flex-1">{reason}</span>
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                </div>
              ) : null
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="animate-pulse h-32 bg-white/5 rounded-2xl" />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
