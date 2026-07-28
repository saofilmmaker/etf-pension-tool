import { useState, useEffect, useRef } from "react";

const F = `'Outfit', sans-serif`;
const M = `'Space Mono', monospace`;
const G = "#C6F135";
const BL = "#4ea2b7";
const BG = "#0A0A0A";
const C1 = "#141414";
const C2 = "#1C1C1C";
const C3 = "#242424";
const TX = "#F2F2F2";
const DM = "#555";
const D2 = "#333";

const ETFS = [
  {
    id: "sp500",
    name: "S&P 500",
    ticker: "SXR8",
    isin: "IE00B5BMR087",
    full: "iShares Core S&P 500 UCITS ETF (Acc)",
    rate: 0.10,
    color: G,
    annuo: "~10%/anno",
    simple: "Le 500 aziende più grandi d'America — Apple, Microsoft, Amazon, Nvidia. Quando loro crescono, cresci anche tu.",
    kid: "Immagina di comprare un pezzettino di tutte le aziende più famose del mondo. Se vanno bene loro, guadagni anche tu — senza fare nulla.",
  },
  {
    id: "msci",
    name: "MSCI World",
    ticker: "EUNL",
    isin: "IE00B4L5Y983",
    full: "iShares Core MSCI World UCITS ETF (Acc)",
    rate: 0.085,
    color: "#4ea2b7",
    annuo: "~8.5%/anno",
    simple: "Oltre 1600 aziende in 23 paesi. USA, Europa, Giappone, Canada. Più sei sparso, meno rischi.",
    kid: "Come scommettere su tutto il mondo insieme. Se un paese va male, gli altri compensano. È la versione più tranquilla.",
  },
  {
    id: "deposit",
    name: "Conto Deposito",
    ticker: "—",
    isin: "—",
    full: "Conto Deposito 3% annuo",
    rate: 0.03,
    color: DM,
    annuo: "~3%/anno",
    simple: "I soldi sono al sicuro, ma l'inflazione ogni anno li vale un po' meno. A lungo termine perdi potere d'acquisto.",
    kid: "È come tenere i soldi in un salvadanaio che cresce pochissimo. Va bene per i risparmi da non toccare, non per costruire ricchezza.",
  },
];

function calcGrowth(monthly, rate, years) {
  if (years === 0) return 0;
  const r = rate / 12;
  const n = years * 12;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

function fmt(n) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function Chart({ monthly, years }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);
    const pad = { t: 12, r: 8, b: 28, l: 8 };
    const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;
    const pts = {};
    ETFS.forEach(e => {
      pts[e.id] = [];
      for (let y = 0; y <= years; y++) pts[e.id].push(calcGrowth(monthly, e.rate, y));
    });
    const maxVal = Math.max(...ETFS.map(e => pts[e.id][years]));
    const tx = i => pad.l + (i / years) * cW;
    const ty = v => pad.t + (1 - v / maxVal) * cH;
    // grid
    [0.33, 0.66, 1].forEach(t => {
      ctx.beginPath(); ctx.strokeStyle = "#1E1E1E"; ctx.lineWidth = 1;
      ctx.moveTo(pad.l, pad.t + (1 - t) * cH); ctx.lineTo(W - pad.r, pad.t + (1 - t) * cH); ctx.stroke();
    });
    // invested dashed
    ctx.beginPath(); ctx.setLineDash([3, 5]); ctx.strokeStyle = D2; ctx.lineWidth = 1.5;
    for (let y = 0; y <= years; y++) {
      const v = monthly * 12 * y;
      y === 0 ? ctx.moveTo(tx(y), ty(v)) : ctx.lineTo(tx(y), ty(v));
    }
    ctx.stroke(); ctx.setLineDash([]);
    // area fill sp500
    ctx.beginPath();
    pts["sp500"].forEach((v, i) => i === 0 ? ctx.moveTo(tx(i), ty(v)) : ctx.lineTo(tx(i), ty(v)));
    ctx.lineTo(tx(years), ty(0)); ctx.lineTo(tx(0), ty(0)); ctx.closePath();
    ctx.fillStyle = "rgba(198,241,53,0.05)"; ctx.fill();
    // lines
    ETFS.forEach(e => {
      ctx.beginPath(); ctx.strokeStyle = e.color;
      ctx.lineWidth = e.id === "deposit" ? 1.5 : 2.5;
      ctx.globalAlpha = e.id === "deposit" ? 0.35 : 1;
      pts[e.id].forEach((v, i) => i === 0 ? ctx.moveTo(tx(i), ty(v)) : ctx.lineTo(tx(i), ty(v)));
      ctx.stroke(); ctx.globalAlpha = 1;
    });
    // year labels
    ctx.fillStyle = "#2E2E2E"; ctx.font = `10px 'Space Mono', monospace`; ctx.textAlign = "center";
    const steps = Math.min(years, 5);
    for (let s = 0; s <= steps; s++) {
      const y = Math.round((s / steps) * years);
      ctx.fillText(`${y}a`, tx(y), H - 6);
    }
  }, [monthly, years]);
  return <canvas ref={ref} style={{ width: "100%", height: 170, display: "block" }} />;
}

function Tag({ children, color }) {
  return (
    <span style={{
      fontFamily: M, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.08em",
      color: color || G,
      background: `${color || G}15`,
      border: `1px solid ${color || G}30`,
      borderRadius: 5, padding: "2px 7px",
      display: "inline-block",
    }}>{children}</span>
  );
}

function SliderRow({ label, value, min, max, step, onChange, display, lo, hi, accent }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontFamily: M, fontSize: 10, color: DM, letterSpacing: "0.1em" }}>{label}</span>
        <span style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: accent || G, letterSpacing: "-0.02em" }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: "100%", cursor: "pointer", height: 3,
          appearance: "none", WebkitAppearance: "none", outline: "none",
          borderRadius: 2,
          background: `linear-gradient(to right,${G} 0%,${G} ${pct}%,#252525 ${pct}%,#252525 100%)`,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: M, fontSize: 10, color: D2, marginTop: 5 }}>
        <span>{lo}</span><span>{hi}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [monthly, setMonthly] = useState(100);
  const [years, setYears] = useState(10);
  const [tab, setTab] = useState("sp500");
  const etf = ETFS.find(e => e.id === tab);
  const invested = monthly * 12 * years;
  const final = calcGrowth(monthly, etf.rate, years);
  const gain = final - invested;

  return (
    <div style={{ fontFamily: F, background: BG, color: TX, minHeight: "100vh", maxWidth: 460, margin: "0 auto", padding: "0 0 64px", boxSizing: "border-box", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Space+Mono&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ padding: "40px 20px 28px", borderBottom: `1px solid ${C2}` }}>
        <img src="/Logo Cresco.png" alt="Cresco" style={{ height: 130, display: "block", margin: "0 auto 20px" }} />
        <h1 style={{ fontFamily: F, fontWeight: 800, fontSize: 28, margin: "14px 0 10px", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
          Metti da parte{" "}
          <span style={{ color: G }}>{fmt(monthly)}</span> al mese.<br />
          Il futuro ti ringrazierà.
        </h1>
        <p style={{ fontSize: 14, color: DM, margin: 0, lineHeight: 1.7 }}>
          I soldi che non investi oggi non lavorano per te. L'interesse composto è semplice: <strong style={{ color: "#888" }}>più aspetti, meno guadagni</strong>.
        </p>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* SLIDERS */}
        <div style={{ background: C1, borderRadius: 16, padding: "22px 18px", margin: "14px 0", border: `1px solid ${C2}`, display: "flex", flexDirection: "column", gap: 22 }}>
          <SliderRow label="QUANTO METTI DA PARTE OGNI MESE" value={monthly} min={50} max={500} step={50}
            onChange={setMonthly} display={fmt(monthly)} lo="€50" hi="€500" />
          <SliderRow label="PER QUANTI ANNI" value={years} min={5} max={40} step={5}
            onChange={setYears} display={`${years} anni`} lo="5a" hi="40a" accent={TX} />
        </div>

        {/* CHART */}
        <div style={{ background: C1, borderRadius: 16, padding: "18px 14px 12px", marginBottom: 14, border: `1px solid ${C2}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: M, fontSize: 10, color: DM, letterSpacing: "0.1em" }}>CRESCITA NEL TEMPO</span>
          </div>
          <Chart monthly={monthly} years={years} />
          <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
            {ETFS.map(e => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 16, height: 2, borderRadius: 1, background: e.color, opacity: e.id === "deposit" ? 0.4 : 1 }} />
                <span style={{ fontSize: 10, fontFamily: M, color: DM }}>{e.name}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 16, borderTop: "1.5px dashed #2a2a2a" }} />
              <span style={{ fontSize: 10, fontFamily: M, color: D2 }}>Versato</span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {ETFS.map(e => (
            <button key={e.id} onClick={() => setTab(e.id)} style={{
              flex: 1, border: `1.5px solid ${tab === e.id ? e.color : C3}`,
              background: tab === e.id ? `${e.color}12` : C1,
              color: tab === e.id ? e.color : DM,
              borderRadius: 10, padding: "10px 0",
              fontSize: 11, fontFamily: M, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.04em", transition: "all .15s",
            }}>{e.name}</button>
          ))}
        </div>

        {/* ACTIVE ETF */}
        <div style={{ background: C1, borderRadius: 16, padding: "20px", marginBottom: 14, border: `1px solid ${etf.color}25`, position: "relative", overflow: "hidden" }}>
          

          {/* Ticker + ISIN */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Tag color={etf.color}>{etf.ticker}</Tag>
            <span style={{ fontSize: 10, fontFamily: M, color: D2 }}>{etf.isin}</span>
          </div>

          {/* Big number */}
          <p style={{ fontFamily: M, fontSize: 10, color: DM, letterSpacing: "0.1em", margin: "0 0 4px" }}>VALORE FINALE STIMATO</p>
          <p style={{ fontFamily: F, fontWeight: 800, fontSize: 40, letterSpacing: "-0.03em", margin: "0 0 6px", lineHeight: 1, color: TX }}>
            {fmt(final)}
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: etf.id === "deposit" ? DM : G }}>+{fmt(gain)}</span>
            <span style={{ fontFamily: M, fontSize: 10, color: DM }}>×{(final / Math.max(invested, 1)).toFixed(2)} il tuo capitale · {etf.annuo}</span>
          </div>

          {/* Mini stats */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { l: "VERSATO DA TE", v: fmt(invested) },
              { l: "REGALO DEL TEMPO", v: `+${fmt(gain)}` },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: C2, borderRadius: 10, padding: "11px 12px", border: `1px solid ${C3}` }}>
                <p style={{ margin: "0 0 3px", fontFamily: M, fontSize: 9, color: DM, letterSpacing: "0.08em" }}>{s.l}</p>
                <p style={{ margin: 0, fontFamily: F, fontSize: 15, fontWeight: 700, color: i === 1 && etf.id !== "deposit" ? G : TX }}>{s.v}</p>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: C2, margin: "0 0 14px" }} />

          {/* Spiegazione semplice */}
          <p style={{ fontFamily: M, fontSize: 9, color: DM, letterSpacing: "0.1em", margin: "0 0 6px" }}>SPIEGAZIONE SEMPLICE</p>
          <p style={{ fontSize: 13, color: "#999", lineHeight: 1.7, margin: 0 }}>{etf.kid}</p>
        </div>

        {/* CONFRONTO */}
        <div style={{ background: C1, borderRadius: 16, padding: "18px 18px", marginBottom: 14, border: `1px solid ${C2}` }}>
          <p style={{ fontFamily: M, fontSize: 10, color: DM, letterSpacing: "0.1em", margin: "0 0 12px" }}>CONFRONTO FINALE</p>
          {ETFS.map((e, i) => {
            const f = calcGrowth(monthly, e.rate, years);
            const g = f - invested;
            const pct = ((g / Math.max(invested, 1)) * 100).toFixed(0);
            const isActive = e.id === tab;
            return (
              <div key={e.id} onClick={() => setTab(e.id)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 10px", borderRadius: 10, cursor: "pointer",
                background: isActive ? `${e.color}08` : "transparent",
                border: `1px solid ${isActive ? e.color + "25" : "transparent"}`,
                marginBottom: i < ETFS.length - 1 ? 6 : 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 3, height: 36, borderRadius: 2, background: e.color, opacity: e.id === "deposit" ? 0.35 : 1, flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontFamily: F, fontSize: 14, fontWeight: 600, color: e.id === "deposit" ? DM : TX }}>{e.name}</p>
                    <p style={{ margin: 0, fontFamily: M, fontSize: 10, color: D2 }}>{e.ticker} · {e.annuo}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontFamily: F, fontSize: 16, fontWeight: 700, color: e.id === "deposit" ? DM : TX }}>{fmt(f)}</p>
                  <p style={{ margin: 0, fontFamily: M, fontSize: 10, color: e.id === "deposit" ? D2 : G }}>+{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* INSIGHT */}
        <div style={{ background: C1, border: `1px solid ${C2}`, borderRadius: 16, padding: "18px 18px", marginBottom: 14 }}>
          <p style={{ fontFamily: M, fontSize: 10, color: G, letterSpacing: "0.1em", margin: "0 0 10px" }}>COSA SIGNIFICA IN PAROLE SEMPLICI</p>
          <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.8, margin: "0 0 10px" }}>
            Con{" "}<span style={{ color: TX, fontWeight: 700 }}>{fmt(monthly)} al mese</span>{" "}per{" "}
            <span style={{ color: TX, fontWeight: 700 }}>{years} anni</span>,
            metti da parte in totale{" "}
            <span style={{ color: TX, fontWeight: 700 }}>{fmt(invested)}</span>.{" "}
            Ma sull'S&P 500 potresti arrivare a{" "}
            <span style={{ color: G, fontWeight: 800 }}>{fmt(calcGrowth(monthly, 0.10, years))}</span>.
          </p>
          <p style={{ fontSize: 13, color: DM, lineHeight: 1.7, margin: "0 0 10px" }}>
            I <span style={{ color: G, fontWeight: 700 }}>{fmt(calcGrowth(monthly, 0.10, years) - invested)}</span> di differenza non li hai versati tu.
            Li ha prodotti il tempo. È questo l'interesse composto: i tuoi soldi guadagnano, e poi quei guadagni guadagnano ancora.
          </p>
          <div style={{ background: `${BL}10`, borderRadius: 10, padding: "14px 16px", border: `1px solid ${BL}30` }}>
            <p style={{ fontFamily: M, fontSize: 10, color: BL, margin: "0 0 5px", letterSpacing: "0.08em" }}>PERCHÉ (ACC) È IMPORTANTE</p>
            <p style={{ fontSize: 12, color: "#777", margin: 0, lineHeight: 1.6 }}>
              Questi ETF sono <strong style={{ color: "#aaa" }}>ad accumulazione</strong>: i dividendi vengono reinvestiti automaticamente ogni giorno, senza che tu debba fare nulla. Più reinvesti, più cresce veloce.
            </p>
          </div>
        </div>

        {/* TRADE REPUBLIC */}
        <div style={{ marginBottom: 14 }}>

          {/* Header card — TR white */}
          <div style={{
            background: "#F5F5F0", borderRadius: "20px 20px 0 0",
            padding: "22px 20px 20px",
          }}>
            <div>
              <p style={{ fontFamily: M, fontSize: 10, letterSpacing: "0.12em", color: "rgba(0,0,0,0.35)", margin: "0 0 4px" }}>DOVE INVESTIRE</p>
              <p style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: "#0A0A0A", margin: 0, letterSpacing: "-0.02em" }}>Trade Republic</p>
            </div>
            {/* Stat pills */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {[
                { v: "0€", l: "commissioni PAC" },
                { v: "3.25%", l: "sul liquido" },
                { v: "10min", l: "per aprire" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "rgba(0,0,0,0.06)", borderRadius: 10,
                  padding: "8px 10px", flex: 1,
                }}>
                  <p style={{ fontFamily: F, fontWeight: 800, fontSize: 15, color: "#0A0A0A", margin: "0 0 1px" }}>{s.v}</p>
                  <p style={{ fontFamily: M, fontSize: 9, color: "rgba(0,0,0,0.4)", margin: 0, letterSpacing: "0.04em" }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features list */}
          <div style={{ background: C1, padding: "6px 20px 4px", border: `1px solid ${C2}`, borderTop: "none" }}>
            {[
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={TX} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="2" width="12" height="14" rx="2"/>
                    <line x1="6" y1="6" x2="12" y2="6"/>
                    <line x1="6" y1="9" x2="12" y2="9"/>
                    <line x1="6" y1="12" x2="9" y2="12"/>
                  </svg>
                ),
                t: "Apri in 10 minuti",
                d: "Documento d'identità + selfie. Niente banca, niente filiale.",
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={TX} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9a6 6 0 1 0 12 0A6 6 0 0 0 3 9z"/>
                    <path d="M9 6v3l2 2"/>
                  </svg>
                ),
                t: "PAC automatico — imposti e dimentichi",
                d: `${fmt(monthly)}/mese in automatico ogni mese. Tu non tocchi nulla.`,
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={TX} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 2L2 6v6l7 4 7-4V6L9 2z"/>
                    <path d="M9 12V8"/>
                    <circle cx="9" cy="6.5" r="0.8" fill={G} stroke="none"/>
                  </svg>
                ),
                t: "Zero commissioni sui PAC",
                d: "Gli acquisti automatici sugli ETF sono completamente gratuiti.",
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={TX} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="14" height="10" rx="2"/>
                    <path d="M5 5V4a4 4 0 0 1 8 0v1"/>
                    <circle cx="9" cy="10" r="1.5"/>
                  </svg>
                ),
                t: "3.25% sui soldi fermi",
                d: "Il tuo fondo d'emergenza rende il 3.25% senza fare nulla.",
              },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                padding: "15px 0",
                borderBottom: i < 3 ? `1px solid ${C2}` : "none",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: C2, border: `1px solid ${C3}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <p style={{ margin: "0 0 3px", fontFamily: F, fontSize: 14, fontWeight: 600, color: TX }}>{item.t}</p>
                  <p style={{ margin: 0, fontSize: 12, color: DM, lineHeight: 1.6 }}>{item.d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Prima mossa */}
          <div style={{
            background: C2, padding: "16px 20px", border: `1px solid ${C2}`,
            borderTop: `1px solid ${C3}`,
          }}>
            <p style={{ fontFamily: M, fontSize: 9, color: DM, letterSpacing: "0.12em", margin: "0 0 8px" }}>PRIMA MOSSA</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {[
                { t: "Usa il tool", dim: false },
                { t: "→", dim: true },
                { t: "Scrivimi su IG", dim: false },
                { t: "→", dim: true },
                { t: "Ricevi il link", dim: false, green: true },
                { t: "→", dim: true },
                { t: "Apri TR", dim: false, green: true },
                { t: "→", dim: true },
                { t: "Fatto ✓", dim: false, green: true },
              ].map((s, i) => (
                <span key={i} style={{
                  fontFamily: F,
                  fontSize: 13,
                  fontWeight: s.green || !s.dim ? 600 : 400,
                  color: s.green ? G : s.dim ? D2 : "#888",
                }}>{s.t}</span>
              ))}
            </div>
          </div>

          {/* Referral — blue accent */}
          <div style={{
            background: `${BL}10`,
            border: `1px solid ${BL}35`,
            borderRadius: "0 0 20px 20px",
            borderTop: "none",
            padding: "22px 20px",
          }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: `${BL}18`, border: `1px solid ${BL}40`,
              borderRadius: 8, padding: "4px 10px", marginBottom: 14,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={BL} strokeWidth="1.4" strokeLinecap="round">
                <path d="M6 1l1.2 2.5L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.8-.5L6 1z"/>
              </svg>
              <span style={{ fontFamily: M, fontSize: 10, color: BL, letterSpacing: "0.1em", fontWeight: 700 }}>LINK RISERVATO</span>
            </div>

            <p style={{ fontFamily: F, fontSize: 20, fontWeight: 800, color: TX, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Vuoi aprire Trade Republic?
            </p>
            <p style={{ fontSize: 13, color: DM, margin: "0 0 16px", lineHeight: 1.6 }}>
              Scrivimi su Instagram — ti mando il link personale con il bonus di benvenuto attivo.
            </p>

            {/* Steps */}
            {[
              { n: "1", t: "Clicca il bottone qui sotto", d: "Il messaggio viene copiato automaticamente. Apri il DM e incolla — ci vuole 1 tap." },
              { n: "2", t: "Ricevi il link riservato", d: "Ti rispondo con il link per aprire Trade Republic e attivare il bonus." },
              { n: "3", t: "Apri il conto e investi", d: "10 minuti dal telefono. Fai 3 investimenti e versa €100 entro 21 giorni: il bonus è tuo." },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < 2 ? 14 : 20 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: `${BL}20`, border: `1px solid ${BL}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: M, fontSize: 11, fontWeight: 700, color: BL }}>{s.n}</span>
                </div>
                <div style={{ paddingTop: 2 }}>
                  <p style={{ margin: "0 0 2px", fontFamily: F, fontSize: 13, fontWeight: 600, color: TX }}>{s.t}</p>
                  <p style={{ margin: 0, fontSize: 12, color: DM, lineHeight: 1.5 }}>{s.d}</p>
                  {i === 0 && (
                    <p style={{ margin: "6px 0 0", fontFamily: M, fontSize: 11, color: BL, background: `${BL}12`, border: `1px solid ${BL}30`, borderRadius: 8, padding: "6px 10px", lineHeight: 1.5 }}>
                      "Ciao! Ho usato il tuo tool ETF e voglio aprire Trade Republic con il tuo link 🌱"
                    </p>
                  )}
                </div>
              </div>
            ))}

            <a href="https://ig.me/m/saothefilmmaker" target="_blank" rel="noopener noreferrer"
              onClick={() => navigator.clipboard.writeText("Ciao! Ho usato il tuo tool ETF e voglio aprire Trade Republic con il tuo link 🌱")}
              style={{
                display: "block", textAlign: "center",
                background: BL, color: "#fff",
                borderRadius: 14, padding: "15px",
                fontSize: 15, fontWeight: 800, fontFamily: F,
                textDecoration: "none", letterSpacing: "-0.01em",
              }}>
              Scrivimi su Instagram →
            </a>
            <p style={{ textAlign: "center", fontFamily: M, fontSize: 10, color: `${BL}70`, margin: "8px 0 0", lineHeight: 1.6 }}>
              Il messaggio viene copiato automaticamente — incollalo nel DM
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", fontFamily: M, fontSize: 10, color: "#555", marginTop: 16, lineHeight: 1.9 }}>
          Rendimenti storici. Non sono garanzia di risultati futuri.<br />
          Al lordo di tasse (26% plusvalenze IT) e TER ETF (~0.07–0.20%/anno).
        </p>
      </div>
    </div>
  );
}
