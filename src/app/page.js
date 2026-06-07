"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState("Connecting...");
  const [regime, setRegime] = useState(null);
  const [signal, setSignal] = useState(null);
  const [globalPulse, setGlobalPulse] = useState(null);
  const [newsIndex, setNewsIndex] = useState(0);
  const [marketStatus, setMarketStatus] = useState("");

  // Market Status Tracker (NSE Hours)
  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date();
      // Get YYYY-MM-DD for Asia/Kolkata to check holidays
      const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
      
      // Official NSE Trading Holidays (2026)
      const nseHolidays = {
        "2026-01-26": "Republic Day",
        "2026-03-03": "Holi",
        "2026-03-26": "Shri Ram Navami",
        "2026-03-31": "Shri Mahavir Jayanti",
        "2026-04-03": "Good Friday",
        "2026-04-14": "Dr. Ambedkar Jayanti",
        "2026-05-01": "Maharashtra Day",
        "2026-05-28": "Bakri Id",
        "2026-06-26": "Muharram",
        "2026-09-14": "Ganesh Chaturthi",
        "2026-10-02": "Gandhi Jayanti",
        "2026-10-20": "Dussehra",
        "2026-11-10": "Diwali",
        "2026-11-24": "Gurpurab",
        "2026-12-25": "Christmas"
      };

      const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric', minute: 'numeric', weekday: 'short' };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);
      
      let hour = 0, minute = 0, weekday = "";
      parts.forEach(p => {
        if (p.type === 'hour') hour = parseInt(p.value);
        if (p.type === 'minute') minute = parseInt(p.value);
        if (p.type === 'weekday') weekday = p.value;
      });

      const currentTimeInMinutes = hour * 60 + minute;
      const marketOpen = 9 * 60 + 15; // 9:15 AM
      const marketClose = 15 * 60 + 30; // 3:30 PM

      if (nseHolidays[dateStr]) {
        const holidayName = nseHolidays[dateStr].toUpperCase();
        setMarketStatus(`MARKET CLOSED • ${holidayName}`);
      } else if (weekday === 'Sat') {
        setMarketStatus("MARKET CLOSED (WEEKEND) • OPENS MON 09:15 AM");
      } else if (weekday === 'Sun') {
        setMarketStatus("MARKET CLOSED (WEEKEND) • OPENS TMRW 09:15 AM");
      } else if (currentTimeInMinutes < marketOpen) {
        setMarketStatus("PRE-MARKET • OPENS AT 09:15 AM");
      } else if (currentTimeInMinutes >= marketClose) {
        const nextDay = weekday === 'Fri' ? "MON" : "TMRW";
        setMarketStatus(`MARKET CLOSED • OPENS ${nextDay} 09:15 AM`);
      } else {
        setMarketStatus("MARKET OPEN");
      }
    };

    updateMarketStatus();
    const timer = setInterval(updateMarketStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  // Rotating News Ticker
  useEffect(() => {
    if (!globalPulse?.news_sentiment?.top_headlines) return;
    const interval = setInterval(() => {
      setNewsIndex((prev) => 
        (prev + 1) % globalPulse.news_sentiment.top_headlines.length
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [globalPulse]);

  // WebSocket Connection
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setStatus("Engine Live");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.regime) setRegime(data.regime);
          if (data.signals) setSignal({ signals: data.signals });
          if (data.global_pulse) {
             setGlobalPulse(data.global_pulse);
             setNewsIndex(0);
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setStatus("Engine Offline");
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
    <main className="min-h-screen w-full lg:h-screen lg:w-screen lg:overflow-hidden pt-3 flex flex-col relative bg-[#050505] overflow-y-auto">
      
      {/* ULTRA-COMPACT TOP NAVBAR (Just Indices & News) */}
      <header className="flex-shrink-0 flex flex-col lg:flex-row items-start lg:items-center px-4 py-3 mb-4 z-10 w-full space-y-4 lg:space-y-0 border-b border-white/[0.05]">
        
        {/* CENTER COMPONENT: Indian Indices + News (Stacked) */}
        <div className="flex flex-col w-full overflow-hidden relative">
          {globalPulse && globalPulse.indian_indices ? (
            <div className="flex flex-col">
               <div className="flex overflow-hidden pb-2 border-b border-white/[0.05] group relative">
                 {(() => {
                   const otherIndian = Object.values(globalPulse?.indian_indices || {}).filter(m => m.name !== "NIFTY 50" && m.name !== "SENSEX");
                   return (
                     <>
                       <div className="flex space-x-6 animate-marquee-slow min-w-full shrink-0 pr-6 group-hover:[animation-play-state:paused]">
                         {otherIndian.map((m, i) => (
                           <div key={`ind1-${i}`} className="flex items-center space-x-2 whitespace-nowrap flex-shrink-0">
                             <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{m.name}</span>
                             <span className="text-white text-sm font-bold">{m.price.toFixed(2)}</span>
                             <span className={`text-sm font-bold ${m.pct_change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {m.pct_change > 0 ? '+' : ''}{m.pct_change.toFixed(2)}%
                             </span>
                           </div>
                         ))}
                       </div>
                       <div className="flex space-x-6 animate-marquee-slow min-w-full shrink-0 pr-6 group-hover:[animation-play-state:paused]" aria-hidden="true">
                         {otherIndian.map((m, i) => (
                           <div key={`ind2-${i}`} className="flex items-center space-x-2 whitespace-nowrap flex-shrink-0">
                             <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{m.name}</span>
                             <span className="text-white text-sm font-bold">{m.price.toFixed(2)}</span>
                             <span className={`text-sm font-bold ${m.pct_change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {m.pct_change > 0 ? '+' : ''}{m.pct_change.toFixed(2)}%
                             </span>
                           </div>
                         ))}
                       </div>
                     </>
                   );
                 })()}
               </div>

               {/* Rotating News Below */}
               <div className="mt-2 truncate transition-opacity duration-500 max-w-full">
                 {(() => {
                   const newsStr = globalPulse.news_sentiment.top_headlines[newsIndex];
                   if (!newsStr) return null;
                   const match = newsStr.match(/^\[(.*?)\]\s*(.*)$/);
                   if (match) {
                     return (
                       <>
                         <span className="text-zinc-500 font-mono text-[11px] uppercase tracking-wider mr-3">{match[1]}</span>
                         <span className="text-zinc-300 font-sans text-sm font-medium">{match[2]}</span>
                       </>
                     );
                   }
                   return <span className="text-zinc-300 font-sans text-sm font-medium">{newsStr}</span>;
                 })()}
               </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <div className="animate-pulse h-5 bg-white/5 w-full max-w-md rounded"></div>
              <div className="animate-pulse h-3 bg-white/5 w-full max-w-sm rounded"></div>
            </div>
          )}
        </div>
      </header>

      {/* MASTER SCANNERS CONTAINER */}
      <div className="flex-grow flex flex-col lg:flex-row lg:overflow-hidden z-10 w-full space-y-6 lg:space-y-0 lg:space-x-8 px-4">
        
        {/* BUYS COLUMN */}
        <section className="w-full lg:w-1/2 flex flex-col h-auto lg:h-full lg:overflow-hidden">
          <div className="flex items-center mb-2 pb-2 border-b border-emerald-500/20 flex-shrink-0">
            <h3 className="text-emerald-500 text-base font-bold tracking-widest uppercase">
              Buy Setups
            </h3>
          </div>

          <div className="flex-grow overflow-y-auto lg:pr-4 space-y-2">
            {signal ? (
              signal.signals
                .filter(s => s.action.includes('BUY'))
                .sort((a, b) => {
                  if (a.action === 'STRONG BUY' && b.action !== 'STRONG BUY') return -1;
                  if (a.action !== 'STRONG BUY' && b.action === 'STRONG BUY') return 1;
                  return b.confidence - a.confidence;
                })
                .map((s, i) => (
                  <div key={i} className="py-4 border-b border-white/[0.05] flex flex-col">
                    <div className="flex justify-between items-start md:items-center mb-2 flex-col md:flex-row space-y-2 md:space-y-0">
                      
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold tracking-tight text-white leading-none">{s.name || s.symbol}</h3>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                            {s.action}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-400">{s.confidence || "--"}% CONF</span>
                          <span className="text-zinc-600">|</span>
                          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">{s.recommended_strategy}</span>
                          <span className="text-zinc-600">|</span>
                          <span className="text-[11px] font-mono text-zinc-500">{s.date}</span>
                        </div>
                      </div>

                      <div className="md:text-right mt-2 md:mt-0 flex flex-col">
                        <div className="flex items-center md:justify-end space-x-2">
                           <span className="text-xl font-bold text-white block leading-none">₹{s.latest_close?.toFixed(2) || "0.00"}</span>
                           <span className={`text-xs font-bold ${s.abs_change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {s.abs_change > 0 ? '+' : ''}{s.abs_change?.toFixed(2) || "0.00"} ({s.pct_change?.toFixed(2) || "0.00"}%) 1D
                           </span>
                        </div>
                        <div className="flex flex-col md:items-end mt-1.5 space-y-0.5">
                          {s.entry_price && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">ENTRY: ₹{s.entry_price?.toFixed(2)}</span>}
                          {s.stop_loss && <span className="text-[10px] font-bold text-rose-500/80 uppercase tracking-wider">SL: ₹{s.stop_loss?.toFixed(2)}</span>}
                          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mt-1 block">
                            TARGET: {s.previous_target ? (
                              <><span className="line-through text-zinc-600 mr-1.5">₹{s.previous_target.toFixed(2)}</span> <span className="text-amber-400 animate-pulse">₹{s.target_price?.toFixed(2) || "0.00"}</span></>
                            ) : (
                              `₹${s.target_price?.toFixed(2) || "0.00"}`
                            )}
                          </span>
                        </div>
                      </div>

                    </div>
                    
                    {s.rationale && (
                      <div className="space-y-1 mt-2">
                        {s.rationale.map((reason, idx) => (
                          <p key={idx} className="text-[13px] font-mono text-zinc-400 leading-snug flex items-start">
                            <span className="text-emerald-500/50 font-bold mr-2 mt-[1px]">›</span> 
                            <span className="flex-1">{reason}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
            ) : (
              Array.from({length: 4}).map((_, i) => <div key={i} className="animate-pulse h-32 bg-white/5 rounded-lg mb-3" />)
            )}
          </div>
        </section>

        {/* SELLS COLUMN */}
        <section className="w-full lg:w-1/2 flex flex-col h-auto lg:h-full lg:overflow-hidden">
          <div className="flex items-center mb-2 pb-2 border-b border-rose-500/20 flex-shrink-0">
            <h3 className="text-rose-500 text-base font-bold tracking-widest uppercase">
              Sell Setups
            </h3>
          </div>

          <div className="flex-grow overflow-y-auto lg:pr-4 space-y-2">
            {signal ? (
              signal.signals
                .filter(s => s.action.includes('SELL'))
                .sort((a, b) => b.confidence - a.confidence)
                .map((s, i) => (
                  <div key={i} className="py-4 border-b border-white/[0.05] flex flex-col">
                    <div className="flex justify-between items-start md:items-center mb-2 flex-col md:flex-row space-y-2 md:space-y-0">
                      
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold tracking-tight text-white leading-none">{s.name || s.symbol}</h3>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">
                            {s.action}
                          </span>
                          <span className="text-[11px] font-bold text-rose-400">{s.confidence || "--"}% CONF</span>
                          <span className="text-zinc-600">|</span>
                          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">{s.recommended_strategy}</span>
                          <span className="text-zinc-600">|</span>
                          <span className="text-[11px] font-mono text-zinc-500">{s.date}</span>
                        </div>
                      </div>

                      <div className="md:text-right mt-2 md:mt-0 flex flex-col">
                        <div className="flex items-center md:justify-end space-x-2">
                           <span className="text-xl font-bold text-white block leading-none">₹{s.latest_close?.toFixed(2) || "0.00"}</span>
                           <span className={`text-xs font-bold ${s.abs_change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {s.abs_change > 0 ? '+' : ''}{s.abs_change?.toFixed(2) || "0.00"} ({s.pct_change?.toFixed(2) || "0.00"}%) 1D
                           </span>
                        </div>
                        <div className="flex flex-col md:items-end mt-1.5 space-y-0.5">
                          {s.entry_price && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">ENTRY: ₹{s.entry_price?.toFixed(2)}</span>}
                          {s.stop_loss && <span className="text-[10px] font-bold text-rose-500/80 uppercase tracking-wider">SL: ₹{s.stop_loss?.toFixed(2)}</span>}
                          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mt-1 block">
                            TARGET: {s.previous_target ? (
                              <><span className="line-through text-zinc-600 mr-1.5">₹{s.previous_target.toFixed(2)}</span> <span className="text-amber-400 animate-pulse">₹{s.target_price?.toFixed(2) || "0.00"}</span></>
                            ) : (
                              `₹${s.target_price?.toFixed(2) || "0.00"}`
                            )}
                          </span>
                        </div>
                      </div>

                    </div>
                    
                    {s.rationale && (
                      <div className="space-y-1 mt-2">
                        {s.rationale.map((reason, idx) => (
                          <p key={idx} className="text-[13px] font-mono text-zinc-400 leading-snug flex items-start">
                            <span className="text-rose-500/50 font-bold mr-2 mt-[1px]">›</span> 
                            <span className="flex-1">{reason}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
            ) : (
              Array.from({length: 4}).map((_, i) => <div key={i} className="animate-pulse h-32 bg-white/5 rounded-lg mb-3" />)
            )}
          </div>
        </section>

      </div>

      {/* SECONDARY TERMINAL: GLOBAL MARKETS & MAIN INDICES */}
      {globalPulse && globalPulse.global_indices && (
         <div className="flex-shrink-0 w-full border-t border-white/[0.05] mt-4 flex bg-[#0A0A0A] overflow-hidden">
            
            {/* Static Left Section (Nifty & Sensex) */}
            <div className="flex items-center z-10 shadow-[8px_0_15px_-3px_rgba(0,0,0,0.5)] bg-[#0A0A0A] shrink-0 border-r border-white/10">
               {(() => {
                 const mainIndices = Object.values(globalPulse?.indian_indices || {}).filter(m => m.name === "NIFTY 50" || m.name === "SENSEX");
                 return mainIndices.map((m, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center space-x-2 whitespace-nowrap border-r border-white/10 bg-[#0c0c0c] h-full">
                      <span className="text-[#3b82f6] text-xs font-bold uppercase tracking-wider">{m.name}</span>
                      <span className="text-white text-sm font-bold">{m.price.toFixed(2)}</span>
                      <span className={`text-sm font-bold ${m.pct_change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {m.pct_change > 0 ? '+' : ''}{m.pct_change.toFixed(2)}%
                      </span>
                    </div>
                 ));
               })()}
               <div className="px-4 py-2.5 flex items-center h-full">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Global Mkts</span>
               </div>
            </div>

            {/* Marquee Right Section (Global Indices) */}
            <div className="flex overflow-hidden py-2.5 group flex-grow ml-2">
              {(() => {
                 const grouped = {};
                 Object.values(globalPulse?.global_indices || {}).forEach(m => {
                   const region = m.region || "OTHER MARKETS";
                   if (!grouped[region]) grouped[region] = [];
                   grouped[region].push(m);
                 });
                 
                 const order = ["US MARKETS", "EUROPEAN MARKETS", "ASIAN MARKETS"];
                 
                 const GlobalRender = () => order.map((region, rIdx) => {
                   if (!grouped[region]) return null;
                   return (
                     <div key={rIdx} className="flex items-center space-x-6 flex-shrink-0 border-r border-white/10 pr-6 mr-6">
                       <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">{region}</span>
                       {grouped[region].map((m, i) => (
                         <div key={i} className="flex items-center space-x-2 whitespace-nowrap">
                           {m.flag && <img src={`https://flagcdn.com/w20/${m.flag}.png`} alt={m.flag} className="h-3 w-auto rounded-[1px] opacity-80" />}
                           <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{m.name}</span>
                           <span className="text-white text-sm font-bold">{m.price.toFixed(2)}</span>
                           <span className={`text-sm font-bold ${m.pct_change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {m.pct_change > 0 ? '+' : ''}{m.pct_change.toFixed(2)}%
                           </span>
                         </div>
                       ))}
                     </div>
                   );
                 });

                 return (
                   <>
                     <div className="flex animate-marquee-slow min-w-full shrink-0 pr-6 group-hover:[animation-play-state:paused]">
                       <GlobalRender />
                     </div>
                     <div className="flex animate-marquee-slow min-w-full shrink-0 pr-6 group-hover:[animation-play-state:paused]" aria-hidden="true">
                       <GlobalRender />
                     </div>
                   </>
                 );
              })()}
            </div>
         </div>
      )}

      {/* MAIN BOTTOM STATUS FOOTER */}
      <footer className="flex-shrink-0 w-full border-t border-white/[0.05] pt-3 pb-2 md:pb-3 px-4 flex justify-between items-center text-[10px] font-mono tracking-widest uppercase">
        <div className="flex items-center space-x-6">
           
           {/* Vault Logo Dropped to Footer */}
           <div className="flex items-baseline border-r border-white/10 pr-6">
             <h1 className="text-xl font-extrabold tracking-tight text-white leading-none font-sans">
               Vault
             </h1>
             <span className="w-1.5 h-1.5 bg-emerald-500 ml-0.5 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)] inline-block" />
           </div>

           <div className="flex items-center space-x-2">
              <span className="text-zinc-600">Macro Radar</span>
              <span className="text-zinc-700">|</span>
              <span className="text-white font-bold">{regime ? regime.label : "SCANNING..."}</span>
           </div>
           
           <div className="hidden md:flex items-center space-x-2 border-l border-white/10 pl-6">
              <span className="text-zinc-600">NSE Market</span>
              <span className="text-zinc-700">|</span>
              <span className={`font-bold ${marketStatus.includes("OPEN") && !marketStatus.includes("CLOSED") ? 'text-emerald-400' : 'text-rose-400'}`}>{marketStatus || "CHECKING..."}</span>
           </div>
        </div>
        
        <div className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status.includes("Live") ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className={`${status.includes("Live") ? 'text-emerald-500' : 'text-rose-400'} font-bold`}>
              {status}
            </span>
        </div>
      </footer>

    </main>
  );
}
