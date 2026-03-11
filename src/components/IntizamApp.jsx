"use client";
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../lib/firebase";

const FULL_MEDAL_TIME = 300;
const STAGES = [
  { min: 0, label: "Tahsis Bekliyor", badges: 0 },
  { min: 0.001, label: "Görev Atandı", badges: 0 },
  { min: 1, label: "İlk Temas", badges: 0 },
  { min: 10, label: "Ana Form Belirdi", badges: 0 },
  { min: 30, label: "Gövde Netleşti", badges: 0 },
  { min: 60, label: "1. Nişan Kazanıldı", badges: 1 },
  { min: 100, label: "2. Nişan Kazanıldı", badges: 2 },
  { min: 150, label: "3. Nişan Kazanıldı", badges: 3 },
  { min: 210, label: "4. Nişan Kazanıldı", badges: 4 },
  { min: 270, label: "5. Nişan Kazanıldı", badges: 5 },
  { min: 300, label: "MADALYA HAK EDİLDİ", badges: 5, complete: true },
];

function getStageInfo(totalMin) {
  let current = STAGES[0], next = STAGES[1];
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (totalMin >= STAGES[i].min) { current = STAGES[i]; next = STAGES[i + 1] || null; break; }
  }
  return { current, next };
}

function fmtTime(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtMin(min) {
  if (min < 60) return `${Math.floor(min)} dk`;
  const h = Math.floor(min / 60), m = Math.floor(min % 60);
  return m > 0 ? `${h}sa ${m}dk` : `${h}sa`;
}

const C = {
  bg: "#181c28", card: "#1e2436", cardL: "#262e44", border: "#3e4866", borderL: "#566080",
  gold: "#ecc050", goldB: "#ffd866", goldD: "#c09a3a",
  green: "#78dd78", greenD: "#55b855", greenBg: "#1a2820",
  red: "#ff7777", redD: "#cc5555", redBg: "#2a1616",
  text: "#ececf0", textM: "#c0c0c8", textD: "#9098aa", textF: "#6a7088",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${C.bg}}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:${C.bg}}
::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
::selection{background:rgba(212,168,75,0.25);color:${C.goldB}}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeInScale{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes breathe{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes medalGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(240,200,92,.4))}50%{filter:drop-shadow(0 0 18px rgba(240,200,92,.7))}}
@keyframes spin{to{transform:rotate(360deg)}}
textarea::placeholder,input::placeholder{color:${C.textF}}
button{transition:all .15s ease;outline:none}
button:hover{filter:brightness(1.2)}
button:active{transform:scale(.97)}
.ms{transition:all .35s cubic-bezier(.4,0,.2,1)}
.ms:hover{transform:scale(1.1);filter:brightness(1.25)}
`;

const btn = (bg, brd, col) => ({
  background: bg, border: `1px solid ${brd}`, color: col || brd,
  padding: "7px 14px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
  letterSpacing: 1, borderRadius: 4, cursor: "pointer", textTransform: "uppercase", outline: "none",
});

function MedalSVG({ subject, totalMinutes, size = 80, onClick, isEmpty, showLabel = true }) {
  const p = Math.min(totalMinutes / FULL_MEDAL_TIME, 1);
  const { current } = getStageInfo(totalMinutes);
  const badges = current.badges, comp = !!current.complete;
  const op = isEmpty ? 0.22 : Math.max(0.28, p * 0.72 + 0.28);
  const d = p;
  const gold = comp ? "#f0d060" : `rgb(${110 + p * 140},${90 + p * 128},${45 + p * 52})`;
  const rib = isEmpty ? "#222238" : comp ? "#992828" : `rgb(${60 + p * 93},${22 + p * 14},${22 + p * 14})`;
  const edge = isEmpty ? "#333348" : comp ? "#ffe878" : `rgb(${85 + p * 130},${68 + p * 115},${38 + p * 60})`;
  const syms = { Python: "λ", Matematik: "∑", Fransızca: "Fr", İngilizce: "En", Tarih: "⚔", Fizik: "Φ", Robotik: "⚙", Çizim: "✎", Yazarlık: "✒", Algoritma: "Δ", "Müzik Teorisi": "♪", Kimya: "⚗", Felsefe: "Ω", Hukuk: "§", Tıp: "☤", Ekonomi: "£" };
  const sym = subject ? (syms[subject] || subject.substring(0, 2).toUpperCase()) : "?";
  const id = Math.random().toString(36).substr(2, 6);

  return (
    <div className="ms" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <svg width={size} height={size * 1.35} viewBox="0 0 80 108" style={{ filter: comp ? undefined : p > 0.5 ? `drop-shadow(0 0 ${p * 8}px rgba(240,200,92,${p * 0.3}))` : "none", animation: comp ? "medalGlow 3s ease-in-out infinite" : "none" }}>
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gold} stopOpacity={op}/>
            <stop offset="50%" stopColor={edge} stopOpacity={op * .85}/>
            <stop offset="100%" stopColor={gold} stopOpacity={op * .65}/>
          </linearGradient>
          <radialGradient id={`b${id}`} cx="38%" cy="35%">
            <stop offset="0%" stopColor={comp ? "#fff" : gold} stopOpacity={comp ? .18 : op * .25}/>
            <stop offset="100%" stopColor="#000" stopOpacity={0}/>
          </radialGradient>
        </defs>
        <path d={`M26,0 L40,${d>.2?26:20} L54,0 L58,0 L58,32 L40,24 L22,32 L22,0 Z`} fill={rib} stroke={edge} strokeWidth={d>.3?.7:.3} opacity={op}/>
        {d>.3&&<><line x1="34" y1="0" x2="37" y2="22" stroke={edge} strokeWidth=".3" opacity={op*.5}/><line x1="46" y1="0" x2="43" y2="22" stroke={edge} strokeWidth=".3" opacity={op*.5}/></>}
        <circle cx="40" cy="60" r="28" fill={`url(#a${id})`} stroke={edge} strokeWidth={comp?2.5:.7+d*1.3} opacity={op}/>
        <circle cx="40" cy="60" r="28" fill={`url(#b${id})`}/>
        {d>.15&&<circle cx="40" cy="60" r="24" fill="none" stroke={gold} strokeWidth={.4+d*.6} opacity={op*.55}/>}
        {d>.35&&<circle cx="40" cy="60" r="20" fill="none" stroke={edge} strokeWidth=".25" opacity={op*.35} strokeDasharray="1.5 2.5"/>}
        {d>.6&&<circle cx="40" cy="60" r="16" fill="none" stroke={gold} strokeWidth=".2" opacity={op*.25}/>}
        {!isEmpty&&d>.08&&<text x="40" y="65" textAnchor="middle" fontSize={d>.25?15:11} fontWeight="bold" fill={gold} opacity={Math.min(op*1.3,1)} fontFamily="'Playfair Display',serif" style={{userSelect:"none"}}>{sym}</text>}
        {isEmpty&&<text x="40" y="64" textAnchor="middle" fontSize="18" fill={C.textD} fontFamily="monospace" style={{userSelect:"none"}}>+</text>}
        {badges>0&&Array.from({length:badges}).map((_,i)=>{const a=-Math.PI/2+(i/5)*Math.PI*2;return(<g key={i}><circle cx={40+Math.cos(a)*17} cy={60+Math.sin(a)*17} r={comp?3.2:2.5} fill={comp?"#ffd700":gold} stroke={edge} strokeWidth=".5" opacity={op}/>{comp&&<circle cx={40+Math.cos(a)*17} cy={60+Math.sin(a)*17} r="1.2" fill="#fff" opacity=".5"/>}</g>)})}
        {comp&&<g opacity=".9"><polygon points="30,28 35,20 40,25 45,20 50,28" fill="#ffd700" stroke="#ecd060" strokeWidth=".6"/><circle cx="35" cy="19" r="1.5" fill="#ffe066"/><circle cx="40" cy="17" r="2" fill="#ffe066"/><circle cx="45" cy="19" r="1.5" fill="#ffe066"/></g>}
      </svg>
      {showLabel&&subject&&!isEmpty&&<div style={{fontSize:9,color:op>.5?C.textM:C.textD,fontFamily:"'JetBrains Mono',monospace",marginTop:2,textAlign:"center",maxWidth:size,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:.5}}>{subject}</div>}
    </div>
  );
}

function MedalShowcase({ onClose }) {
  const data = [
    {min:0,label:"Boş Yuva",desc:"Henüz atanmadı"},{min:.5,label:"Görev Atandı",desc:"Konu eklendi"},
    {min:1,label:"İlk Temas",desc:"1 dk"},{min:10,label:"Ana Form Belirdi",desc:"10 dk"},
    {min:30,label:"Gövde Netleşti",desc:"30 dk"},{min:60,label:"1. Nişan",desc:"60 dk"},
    {min:100,label:"2. Nişan",desc:"100 dk"},{min:150,label:"3. Nişan",desc:"150 dk"},
    {min:210,label:"4. Nişan",desc:"210 dk"},{min:270,label:"5. Nişan",desc:"270 dk"},
    {min:300,label:"TAM MADALYA",desc:"300 dk"},
  ];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(6,6,10,.94)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fadeIn .3s ease"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"28px 30px",maxWidth:960,width:"100%",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
          <div>
            <div style={{fontSize:15,color:C.goldB,fontFamily:"'Playfair Display',serif",fontWeight:700,marginBottom:4}}>Madalya İlerleme Kademeleri</div>
            <div style={{fontSize:11,color:C.textD,fontFamily:"'JetBrains Mono',monospace"}}>Çalışma süresine göre 11 kademeli görsel evrim</div>
          </div>
          <button onClick={onClose} style={{background:C.cardL,border:`1px solid ${C.border}`,color:C.textM,width:36,height:36,borderRadius:6,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:14}}>
          {data.map((d,i)=>(
            <div key={i} style={{background:i===data.length-1?"#1c1a12":C.bg,border:`1px solid ${i===data.length-1?C.goldD:C.border}`,borderRadius:8,padding:"18px 10px 14px",display:"flex",flexDirection:"column",alignItems:"center",animation:`fadeIn .4s ease ${i*.04}s both`}}>
              <MedalSVG subject="Örnek" totalMinutes={d.min} size={62} showLabel={false}/>
              <div style={{fontSize:10,color:C.goldB,fontFamily:"'JetBrains Mono',monospace",marginTop:10,textAlign:"center",fontWeight:600}}>{d.label}</div>
              <div style={{fontSize:9,color:C.textD,fontFamily:"'JetBrains Mono',monospace",marginTop:3}}>{d.desc}</div>
              <div style={{width:"100%",height:3,background:"#1a1c24",marginTop:8,borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${(d.min/300)*100}%`,height:"100%",background:i===data.length-1?C.goldB:C.greenD,borderRadius:2}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:20,padding:"16px 20px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8}}>
          <div style={{fontSize:11,color:C.textM,fontFamily:"'JetBrains Mono',monospace",lineHeight:2.2}}>
            <span style={{color:C.goldB,fontWeight:600}}>MADALYA</span> — Ana fiziksel ödül. Her görev alanı bir madalya ile temsil edilir.<br/>
            <span style={{color:C.goldB,fontWeight:600}}>NİŞAN</span> — Madalya üzerinde biriken kademe işaretleri. 5 nişan = tam madalya.<br/>
            <span style={{color:C.red,fontWeight:600}}>KURAL</span> — 10 dakika altı oturumlar geçersiz. Disiplin, ödülün temelidir.
          </div>
        </div>
      </div>
    </div>
  );
}

function SoldierDisplay({ subjects, onMedalClick, onEmptyClick, img }) {
  const slots = Array.from({length:12},(_,i)=>subjects[i]||null);
  return (
    <div style={{position:"relative",width:"100%",maxWidth:440,margin:"0 auto"}}>
      {/* Ornamental frame */}
      <div style={{position:"absolute",inset:-6,borderRadius:14,border:`2px solid ${C.goldD}`,opacity:.25,pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"absolute",inset:-3,borderRadius:12,border:`1px solid ${C.goldD}`,opacity:.12,pointerEvents:"none",zIndex:1}}/>
      {/* Corner ornaments */}
      {[{t:-8,l:-8},{t:-8,r:-8},{b:-8,l:-8},{b:-8,r:-8}].map((pos,i)=>(
        <div key={i} style={{position:"absolute",...pos,width:16,height:16,border:`1px solid ${C.gold}`,opacity:.3,borderRadius:2,zIndex:2,transform:"rotate(45deg)"}}/>
      ))}
      <div style={{width:"100%",paddingBottom:"100%",position:"relative",borderRadius:10,overflow:"hidden",boxShadow:`0 0 80px rgba(0,0,0,.5), 0 8px 40px rgba(0,0,0,.4), inset 0 0 0 1px ${C.border}, 0 0 30px rgba(212,168,75,.06)`}}>
        {img?<img src={img} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",filter:"brightness(1) contrast(1.08) saturate(1.1)"}}/>
          :<div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 30%,#2a2e40,${C.bg} 70%)`}}/>}
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 35%,transparent 30%,rgba(10,12,18,.45) 100%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:"43%",left:"13%",right:"13%",bottom:"7%",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gridTemplateRows:"repeat(3,1fr)",gap:"3px"}}>
          {slots.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",borderRadius:5,background:s?"rgba(0,0,0,.3)":"rgba(0,0,0,.18)",backdropFilter:"blur(2px)",transition:"all .3s",border:"1px solid rgba(240,200,92,.06)"}}
              onClick={()=>s?onMedalClick(s.id):onEmptyClick(i)}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(240,200,92,.12)";e.currentTarget.style.borderColor="rgba(240,200,92,.25)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=s?"rgba(0,0,0,.3)":"rgba(0,0,0,.18)";e.currentTarget.style.borderColor="rgba(240,200,92,.06)";}}>
              <MedalSVG subject={s?.name} totalMinutes={s?.totalMinutes||0} size={50} isEmpty={!s} showLabel={false}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:10,padding:"0 8px"}}>
        {slots.map((s,i)=><div key={i} style={{fontSize:9,color:s?C.textM:C.textF,fontFamily:"'JetBrains Mono',monospace",textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s?s.name:`Yuva ${i+1}`}</div>)}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, label, h = 6 }) {
  const pct = Math.min(value / max * 100, 100);
  return (
    <div style={{width:"100%",marginBottom:6}}>
      {label&&<div style={{fontSize:10,color:C.textD,marginBottom:5,fontFamily:"'JetBrains Mono',monospace",letterSpacing:.8}}>{label}</div>}
      <div style={{width:"100%",height:h,background:"#14161e",border:`1px solid ${C.border}`,borderRadius:3,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:pct>=100?`linear-gradient(90deg,${C.goldD},${C.gold},${C.goldB},${C.gold})`:`linear-gradient(90deg,#1a3022,#2a5038,#3a7048)`,backgroundSize:pct>=100?"200% 100%":"100%",animation:pct>=100?"shimmer 2s linear infinite":"none",transition:"width .8s cubic-bezier(.4,0,.2,1)",borderRadius:3}}/>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, hl, icon }) {
  return (
    <div style={{background:hl?"#1a1810":C.bg,border:`1px solid ${hl?C.goldD:C.border}`,borderRadius:6,padding:"12px 14px",position:"relative",overflow:"hidden"}}>
      {hl&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${C.goldB},transparent)`}}/>}
      <div style={{fontSize:9,color:C.textD,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.2,textTransform:"uppercase",marginBottom:6}}>{icon} {label}</div>
      <div style={{fontSize:17,color:hl?C.goldB:C.gold,fontFamily:"'Playfair Display',serif",fontWeight:700}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:C.green,fontFamily:"'JetBrains Mono',monospace",marginTop:4}}>{sub}</div>}
    </div>
  );
}

function Timer({ run, el, pau, onStart, onPause, onResume, onStop, onReset }) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"20px 24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:10,color:C.green,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2}}>◉ OPERASYON KRONOMETRESİ</div>
        {run&&el<600&&<div style={{fontSize:9,color:C.redD,fontFamily:"'JetBrains Mono',monospace",animation:"breathe 2s ease infinite"}}>⚠ Min. 10dk ({Math.ceil((600-el)/60)}dk kaldı)</div>}
      </div>
      <div style={{fontSize:48,fontFamily:"'JetBrains Mono',monospace",fontWeight:300,color:run&&!pau?C.goldB:pau?C.goldD:C.textF,textAlign:"center",letterSpacing:8,marginBottom:18,transition:"color .4s",textShadow:run&&!pau?`0 0 30px rgba(240,200,92,.2)`:"none"}}>{fmtTime(el)}</div>
      {run&&<div style={{marginBottom:12}}><ProgressBar value={Math.min(el/600,1)*100} max={100} label={el>=600?"✓ GEÇERLİ OPERASYON":"Minimum süreye ilerleme"} h={4}/></div>}
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
        {!run&&<button onClick={onStart} style={btn(C.greenBg,C.greenD,C.green)}>▶ OPERASYON BAŞLAT</button>}
        {run&&!pau&&<button onClick={onPause} style={btn("#1c1a10",C.goldD,C.gold)}>⏸ DURAKLAT</button>}
        {run&&pau&&<button onClick={onResume} style={btn(C.greenBg,C.greenD,C.green)}>▶ DEVAM ET</button>}
        {run&&<button onClick={onStop} style={btn(C.redBg,C.redD,C.red)}>⏹ BİTİR & KAYDET</button>}
        {run&&<button onClick={onReset} style={btn(C.card,C.border,C.textD)}>✕ İPTAL</button>}
      </div>
    </div>
  );
}

function NoteSystem({ subject, onUpdate }) {
  const [aS,setAS]=useState(0);
  const [aP,setAP]=useState(0);
  const [showNS,setShowNS]=useState(false);
  const [showNP,setShowNP]=useState(false);
  const [nn,setNN]=useState("");
  const [eS,setES]=useState(null);
  const [eP,setEP]=useState(null);
  const [en,setEN]=useState("");
  const [ctx,setCtx]=useState(null);
  const secs=subject.sections||[];
  const cS=secs[aS];
  const pgs=cS?.pages||[];
  const cP=pgs[aP];

  const addSec=()=>{if(!nn.trim())return;onUpdate({...subject,sections:[...secs,{name:nn.trim(),pages:[{name:"Sayfa 1",content:""}]}]});setNN("");setShowNS(false);setAS(secs.length);setAP(0);};
  const addPg=()=>{if(!nn.trim()||!cS)return;const ns=[...secs];ns[aS]={...cS,pages:[...pgs,{name:nn.trim(),content:""}]};onUpdate({...subject,sections:ns});setNN("");setShowNP(false);setAP(pgs.length);};
  const renSec=i=>{if(!en.trim())return;const ns=[...secs];ns[i]={...ns[i],name:en.trim()};onUpdate({...subject,sections:ns});setES(null);};
  const renPg=i=>{if(!en.trim())return;const ns=[...secs],np=[...pgs];np[i]={...np[i],name:en.trim()};ns[aS]={...cS,pages:np};onUpdate({...subject,sections:ns});setEP(null);};
  const delSec=i=>{const ns=secs.filter((_,j)=>j!==i);onUpdate({...subject,sections:ns});if(aS>=ns.length)setAS(Math.max(0,ns.length-1));setAP(0);setCtx(null);};
  const delPg=i=>{const np=pgs.filter((_,j)=>j!==i);const ns=[...secs];ns[aS]={...cS,pages:np};onUpdate({...subject,sections:ns});if(aP>=np.length)setAP(Math.max(0,np.length-1));setCtx(null);};
  const updC=c=>{const ns=[...secs],np=[...pgs];np[aP]={...cP,content:c};ns[aS]={...cS,pages:np};onUpdate({...subject,sections:ns});};

  useEffect(()=>{const h=()=>setCtx(null);if(ctx)window.addEventListener("click",h);return()=>window.removeEventListener("click",h);},[ctx]);

  const iSt={background:C.bg,border:`1px solid ${C.borderL}`,color:C.text,padding:"5px 10px",fontSize:11,fontFamily:"'JetBrains Mono',monospace",borderRadius:3,outline:"none",width:130};

  const Ctx=({items})=>(
    <div style={{position:"absolute",top:"100%",left:0,marginTop:4,zIndex:60,background:C.cardL,border:`1px solid ${C.borderL}`,borderRadius:6,padding:5,minWidth:165,boxShadow:"0 12px 32px rgba(0,0,0,.5)"}} onClick={e=>e.stopPropagation()}>
      {items.map((it,i)=>(
        <button key={i} onClick={it.action} style={{display:"block",width:"100%",textAlign:"left",background:"none",border:"none",color:it.danger?C.red:C.textM,padding:"8px 12px",fontSize:10,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",borderRadius:4}}
          onMouseEnter={e=>e.currentTarget.style.background=it.danger?C.redBg:C.card}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
          {it.icon} {it.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:340,animation:"fadeIn .3s ease"}}>
      <div style={{fontSize:10,color:C.green,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:12}}>◉ SAHA KAYITLARI — {subject.name}</div>
      <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        {secs.map((sec,i)=>eS===i?(
          <div key={i} style={{display:"flex",gap:4}}>
            <input value={en} onChange={e=>setEN(e.target.value)} style={iSt} onKeyDown={e=>{if(e.key==="Enter")renSec(i);if(e.key==="Escape")setES(null);}} autoFocus/>
            <button onClick={()=>renSec(i)} style={{...btn(C.greenBg,C.greenD),padding:"4px 8px",fontSize:10}}>✓</button>
            <button onClick={()=>setES(null)} style={{...btn(C.card,C.border,C.textD),padding:"4px 8px",fontSize:10}}>✕</button>
          </div>
        ):(
          <div key={i} style={{position:"relative",display:"inline-flex",alignItems:"center",gap:1}}>
            <button onClick={()=>{setAS(i);setAP(0);setCtx(null);}}
              style={{background:i===aS?C.greenBg:C.bg,border:`1px solid ${i===aS?C.greenD:C.border}`,color:i===aS?C.green:C.textD,padding:"6px 14px",fontSize:11,fontFamily:"'JetBrains Mono',monospace",borderRadius:"4px 0 0 4px",cursor:"pointer",fontWeight:i===aS?600:400}}>
              {sec.name}
            </button>
            {i===aS&&<>
              <button onClick={()=>{setES(i);setEN(sec.name);}} title="Yeniden Adlandır" style={{background:C.bg,border:`1px solid ${C.greenD}`,borderLeft:"none",color:C.textD,padding:"6px 5px",fontSize:10,cursor:"pointer",borderRadius:0,fontFamily:"monospace"}}>✎</button>
              <button onClick={()=>delSec(i)} title="Bölümü Sil" style={{background:C.bg,border:`1px solid ${C.greenD}`,borderLeft:"none",color:C.redD,padding:"6px 5px",fontSize:10,cursor:"pointer",borderRadius:"0 4px 4px 0",fontFamily:"monospace"}}>✕</button>
            </>}
          </div>
        ))}
        {!showNS?<button onClick={()=>{setShowNS(true);setNN("");}} style={{background:"none",border:`1px dashed ${C.borderL}`,color:C.textD,padding:"6px 12px",fontSize:10,fontFamily:"'JetBrains Mono',monospace",borderRadius:4,cursor:"pointer"}}>+ Bölüm Ekle</button>
        :<div style={{display:"flex",gap:4}}>
          <input value={nn} onChange={e=>setNN(e.target.value)} placeholder="Bölüm adı" style={iSt} onKeyDown={e=>{if(e.key==="Enter")addSec();if(e.key==="Escape")setShowNS(false);}} autoFocus/>
          <button onClick={addSec} style={{...btn(C.greenBg,C.greenD),padding:"4px 8px",fontSize:10}}>✓</button>
          <button onClick={()=>setShowNS(false)} style={{...btn(C.card,C.border,C.textD),padding:"4px 8px",fontSize:10}}>✕</button>
        </div>}
      </div>
      {cS&&<div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        {pgs.map((pg,i)=>eP===i?(
          <div key={i} style={{display:"flex",gap:4}}>
            <input value={en} onChange={e=>setEN(e.target.value)} style={{...iSt,width:100}} onKeyDown={e=>{if(e.key==="Enter")renPg(i);if(e.key==="Escape")setEP(null);}} autoFocus/>
            <button onClick={()=>renPg(i)} style={{...btn("#10101e","#3a3a6a"),padding:"3px 7px",fontSize:9}}>✓</button>
          </div>
        ):(
          <div key={i} style={{position:"relative",display:"inline-flex",alignItems:"center",gap:1}}>
            <button onClick={()=>{setAP(i);setCtx(null);}}
              style={{background:i===aP?"#1c1c30":C.bg,border:`1px solid ${i===aP?"#4a4a80":C.border}`,color:i===aP?"#aaaaee":C.textD,padding:"4px 12px",fontSize:10,fontFamily:"'JetBrains Mono',monospace",borderRadius:i===aP?"3px 0 0 3px":"3px",cursor:"pointer"}}>
              {pg.name}
            </button>
            {i===aP&&<>
              <button onClick={()=>{setEP(i);setEN(pg.name);}} title="Yeniden Adlandır" style={{background:"#1c1c30",border:"1px solid #4a4a80",borderLeft:"none",color:C.textD,padding:"4px 4px",fontSize:9,cursor:"pointer",borderRadius:0,fontFamily:"monospace"}}>✎</button>
              <button onClick={()=>delPg(i)} title="Sil" style={{background:"#1c1c30",border:"1px solid #4a4a80",borderLeft:"none",color:C.redD,padding:"4px 4px",fontSize:9,cursor:"pointer",borderRadius:"0 3px 3px 0",fontFamily:"monospace"}}>✕</button>
            </>}
          </div>
        ))}
        {!showNP?<button onClick={()=>{setShowNP(true);setNN("");}} style={{background:"none",border:`1px dashed ${C.border}`,color:C.textF,padding:"4px 10px",fontSize:9,fontFamily:"'JetBrains Mono',monospace",borderRadius:3,cursor:"pointer"}}>+ Sayfa</button>
        :<div style={{display:"flex",gap:4}}>
          <input value={nn} onChange={e=>setNN(e.target.value)} placeholder="Sayfa adı" style={{...iSt,width:100,fontSize:10}} onKeyDown={e=>{if(e.key==="Enter")addPg();if(e.key==="Escape")setShowNP(false);}} autoFocus/>
          <button onClick={addPg} style={{...btn("#10101e","#3a3a6a"),padding:"3px 7px",fontSize:9}}>✓</button>
        </div>}
      </div>}
      {cP?<textarea value={cP.content} onChange={e=>updC(e.target.value)} placeholder="Saha kaydını buraya gir. Disiplinli notlar, güçlü zihinler inşa eder..."
        style={{flex:1,minHeight:"calc(100vh - 280px)",background:"#141824",border:`1px solid ${C.border}`,color:C.text,padding:"24px 28px",fontSize:15,fontFamily:"'JetBrains Mono',monospace",fontWeight:300,lineHeight:2.1,borderRadius:6,resize:"vertical",outline:"none",letterSpacing:.4,boxShadow:"inset 0 2px 8px rgba(0,0,0,.2)"}}/>
      :<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.textD,fontFamily:"'JetBrains Mono',monospace",fontSize:12,border:`1px dashed ${C.border}`,borderRadius:6,minHeight:"calc(100vh - 280px)"}}>{secs.length===0?"Yukarıdan '+ Bölüm Ekle' ile Saha Kayıtlarına başla":pgs.length===0?"Bu bölümde sayfa yok. '+ Sayfa' ile ekle":"Sayfa seçilmedi"}</div>}
    </div>
  );
}

function DetailView({ subject, onBack, onUpdate, onTimeSave, timer }) {
  const [tab,setTab]=useState("progress");
  const tm=subject.totalMinutes||0;
  const {current,next}=getStageInfo(tm);
  const sess=subject.sessions||[];

  return (
    <div style={{maxWidth:980,margin:"0 auto",padding:"16px 20px",animation:"fadeIn .35s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:22,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
        <button onClick={onBack} style={{...btn(C.card,C.border,C.textM),padding:"8px 16px",fontSize:11}}>← GERİ</button>
        <div style={{flex:1}}>
          <div style={{fontSize:24,color:C.goldB,fontFamily:"'Playfair Display',serif",fontWeight:700,letterSpacing:1}}>{subject.name}</div>
          <div style={{fontSize:10,color:C.textD,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5,marginTop:3}}>GÖREV ALANI — {current.label}</div>
        </div>
        <MedalSVG subject={subject.name} totalMinutes={tm} size={58} showLabel={false}/>
      </div>
      <div style={{display:"flex",gap:0,marginBottom:22,borderBottom:`1px solid ${C.border}`}}>
        {[{key:"progress",label:"◆ İLERLEME & OPERASYON"},{key:"notes",label:"◉ SAHA KAYITLARI"}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{background:"none",border:"none",borderBottom:tab===t.key?`2px solid ${C.gold}`:"2px solid transparent",color:tab===t.key?C.gold:C.textD,padding:"12px 24px",fontSize:11,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,cursor:"pointer",transition:"all .3s"}}>{t.label}</button>
        ))}
      </div>
      {/* Timer ALWAYS rendered so it doesn't reset on tab switch */}
      <div style={{display:tab==="progress"?"block":"none"}}>
        <div style={{animation:"fadeIn .3s ease"}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:22,marginBottom:18,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${C.greenD},transparent)`}}/>
          <div style={{fontSize:11,color:C.green,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:18}}>◉ İLERLEME MERKEZİ</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:18}}>
            <StatBox icon="⏱" label="Toplam Hizmet" value={fmtMin(tm)}/>
            <StatBox icon="◆" label="Mevcut Aşama" value={current.label}/>
            <StatBox icon="★" label="Nişan Sayısı" value={`${current.badges}/5`}/>
            <StatBox icon="▶" label="Operasyon" value={sess.length.toString()}/>
            {next&&<StatBox icon="→" label="Sonraki Kademe" value={next.label} sub={`${fmtMin(Math.max(0,next.min-tm))} kaldı`}/>}
            <StatBox icon="🎖" label="Tam Madalya" value={tm>=FULL_MEDAL_TIME?"HAK EDİLDİ":fmtMin(FULL_MEDAL_TIME-tm)} hl={tm>=FULL_MEDAL_TIME}/>
          </div>
          <ProgressBar value={tm} max={FULL_MEDAL_TIME} label={`GENEL İLERLEME — ${fmtMin(tm)} / ${fmtMin(FULL_MEDAL_TIME)}`} h={10}/>
          <div style={{display:"flex",justifyContent:"space-between",padding:"0 2px",marginTop:4}}>
            {[0,60,100,150,210,270,300].map(m=><div key={m} style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:tm>=m?C.green:C.textF,transition:"color .5s",fontWeight:tm>=m?600:400}}>{m}dk</div>)}
          </div>
        </div>
        <div style={{marginBottom:18}}>
          {(!timer.run||timer.subId===subject.id)?
            <Timer run={timer.run&&timer.subId===subject.id} el={timer.subId===subject.id?timer.el:0} pau={timer.pau}
              onStart={()=>timer.onStart(subject.id)} onPause={timer.onPause} onResume={timer.onResume} onStop={timer.onStop} onReset={timer.onReset}/>
          :<div style={{background:C.card,border:`1px solid ${C.goldD}`,borderRadius:8,padding:"18px 22px",cursor:"pointer"}} onClick={()=>{/*navigate to that subject*/}}>
            <div style={{fontSize:10,color:C.goldD,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5,marginBottom:8}}>⚠ AKTİF OPERASYON BAŞKA ALANDA</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:12,color:C.text,fontFamily:"'JetBrains Mono',monospace"}}>{timer.subName} alanında operasyon devam ediyor</div>
              <div style={{fontSize:20,color:C.goldB,fontFamily:"'JetBrains Mono',monospace",fontWeight:500,letterSpacing:3}}>{fmtTime(timer.el)}</div>
            </div>
            <div style={{fontSize:9,color:C.textD,fontFamily:"'JetBrains Mono',monospace",marginTop:6}}>Önce o operasyonu bitir veya iptal et.</div>
          </div>}
        </div>
        {sess.length>0&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"14px 18px"}}>
          <div style={{fontSize:10,color:C.textD,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5,marginBottom:10}}>SON OPERASYONLAR</div>
          {sess.slice(-8).reverse().map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.bg}`,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>
              <span style={{color:C.textM}}>{new Date(s.date).toLocaleDateString("tr-TR")} {new Date(s.date).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</span>
              <span style={{color:C.green,fontWeight:600}}>{fmtTime(s.duration)}</span>
              <span style={{color:C.textD,fontSize:9}}>{s.type}</span>
            </div>
          ))}
        </div>}
        </div>
      </div>
      <div style={{display:tab==="notes"?"block":"none"}}>
        <NoteSystem subject={subject} onUpdate={onUpdate}/>
      </div>
    </div>
  );
}

function AddDialog({ onAdd, onCancel, slot }) {
  const [name,setName]=useState("");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(6,6,10,.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:150,padding:20,animation:"fadeIn .2s ease"}} onClick={onCancel}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:28,maxWidth:440,width:"100%",animation:"fadeInScale .25s ease"}}>
        <div style={{fontSize:15,color:C.goldB,fontFamily:"'Playfair Display',serif",fontWeight:700,marginBottom:4}}>Yeni Görev Ata</div>
        <div style={{fontSize:10,color:C.textD,fontFamily:"'JetBrains Mono',monospace",marginBottom:20}}>Yuva #{slot+1} — Çalışma alanı belirle</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Görev alanı adı yazın..."
          style={{width:"100%",background:C.bg,border:`1px solid ${C.borderL}`,color:C.goldB,padding:"13px 16px",fontSize:16,fontFamily:"'Playfair Display',serif",borderRadius:6,marginBottom:22,outline:"none",boxSizing:"border-box"}}
          onKeyDown={e=>e.key==="Enter"&&name.trim()&&onAdd(name.trim())} autoFocus/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>name.trim()&&onAdd(name.trim())} disabled={!name.trim()} style={{...btn(C.greenBg,C.greenD,C.green),flex:1,padding:"11px",fontSize:12,opacity:name.trim()?1:.3}}>✓ GÖREV ONAYLA</button>
          <button onClick={onCancel} style={{...btn(C.card,C.border,C.textD),padding:"11px 20px"}}>İPTAL</button>
        </div>
      </div>
    </div>
  );
}

export default function IntizamApp({ user }) {
  const [subs,setSubs]=useState([]);
  const [view,setView]=useState("cmd");
  const [selId,setSelId]=useState(null);
  const [addDlg,setAddDlg]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [img,setImg]=useState(null);

  // ─── GLOBAL TIMER STATE (persists across views) ───
  const [tmRun,setTmRun]=useState(false);
  const [tmEl,setTmEl]=useState(0);
  const [tmPau,setTmPau]=useState(false);
  const [tmSubId,setTmSubId]=useState(null); // which subject timer is for
  const tmInt=useRef(null), tmStart=useRef(null), tmAcc=useRef(0);

  const tmGo=(subId)=>{ tmStart.current=Date.now();tmAcc.current=tmEl;setTmRun(true);setTmPau(false);setTmSubId(subId);tmInt.current=setInterval(()=>setTmEl(tmAcc.current+Math.floor((Date.now()-tmStart.current)/1000)),1000); };
  const tmPa=()=>{ clearInterval(tmInt.current);tmAcc.current=tmEl;setTmPau(true); };
  const tmRe=()=>{ tmStart.current=Date.now();setTmPau(false);tmInt.current=setInterval(()=>setTmEl(tmAcc.current+Math.floor((Date.now()-tmStart.current)/1000)),1000); };
  const tmSt=()=>{ clearInterval(tmInt.current);
    if(tmEl/60<10){alert(`⚠ OPERASYON GEÇERSİZ\n\nMinimum: 10 dakika\nGeçen: ${fmtTime(tmEl)}\n\n10 dakika altı oturumlar kayda alınmaz.`);}
    else{ const type=tmEl/60<30?"Kısa Operasyon":tmEl/60<90?"Standart Operasyon":"Derin Operasyon";
      setSubs(p=>p.map(s=>s.id===tmSubId?{...s,totalMinutes:(s.totalMinutes||0)+tmEl/60,sessions:[...(s.sessions||[]),{date:new Date().toISOString(),duration:tmEl,type}]}:s));
    }
    setTmEl(0);setTmRun(false);setTmPau(false);setTmSubId(null);tmAcc.current=0;
  };
  const tmRs=()=>{ clearInterval(tmInt.current);setTmEl(0);setTmRun(false);setTmPau(false);setTmSubId(null);tmAcc.current=0; };
  useEffect(()=>()=>clearInterval(tmInt.current),[]);
  const tmSubName=subs.find(s=>s.id===tmSubId)?.name||"";

  useEffect(()=>{(async()=>{
    try{
      const snap=await getDoc(doc(db,"users",user.uid));
      if(snap.exists()&&snap.data().subs) setSubs(JSON.parse(snap.data().subs));
    }catch(e){console.error("Load error:",e)}
    setImg("/soldier.png");
    setLoaded(true);
  })();},[]);

  useEffect(()=>{if(loaded&&user)(async()=>{try{await setDoc(doc(db,"users",user.uid),{subs:JSON.stringify(subs),updatedAt:new Date().toISOString()},{merge:true});}catch(e){console.error("Save error:",e)}})();},[subs,loaded]);

  const add=(name,slot)=>{setSubs(p=>[...p,{id:Date.now().toString(),name,slotIndex:slot,totalMinutes:0,sessions:[],sections:[],createdAt:new Date().toISOString()}]);setAddDlg(null);};
  const upd=u=>setSubs(p=>p.map(s=>s.id===u.id?u:s));
  const sel=subs.find(s=>s.id===selId);
  const tTime=subs.reduce((a,s)=>a+(s.totalMinutes||0),0);
  const tSess=subs.reduce((a,s)=>a+(s.sessions?.length||0),0);
  const earned=subs.filter(s=>(s.totalMinutes||0)>=FULL_MEDAL_TIME).length;

  if(!loaded)return(<div style={{background:C.bg,color:C.textD,height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}><style>{CSS}</style><div style={{width:32,height:32,border:`2px solid ${C.border}`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin 1s linear infinite"}}/><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:4}}>SİSTEM YÜKLENİYOR...</div></div>);

  return (
    <div style={{background:`radial-gradient(ellipse at 50% 0%,#1e2438 0%,${C.bg} 50%,#121420 100%)`,color:C.text,minHeight:"100vh",fontFamily:"'Playfair Display',serif"}}>
      <style>{CSS}</style>
      {view==="cmd"?<div style={{maxWidth:1100,margin:"0 auto",padding:"12px 16px",animation:"fadeIn .4s ease"}}>
        {/* Ornamental Header */}
        <div style={{textAlign:"center",padding:"30px 20px 12px",position:"relative"}}>
          <div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",width:"80%",maxWidth:500,height:1,background:`linear-gradient(90deg,transparent,${C.goldD},${C.gold},${C.goldD},transparent)`,opacity:.3}}/>
          <div style={{fontSize:10,color:C.goldD,fontFamily:"'JetBrains Mono',monospace",letterSpacing:8,marginBottom:6}}>━━━ ◉ ━━━</div>
          <div style={{fontSize:42,color:C.goldB,fontFamily:"'Playfair Display',serif",fontWeight:900,letterSpacing:12,marginBottom:6,textShadow:`0 0 60px rgba(255,216,102,.15), 0 2px 0 ${C.goldD}`}}>İNTİZAM</div>
          <div style={{fontSize:14,color:C.gold,fontFamily:"'Cormorant Garamond',serif",letterSpacing:10,opacity:.8,fontWeight:600}}>KOMUTA MERKEZİ</div>
          <div style={{fontSize:9,color:C.textD,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginTop:10,maxWidth:400,margin:"10px auto 0",textAlign:"center",lineHeight:1.6}}>Terakkiye ulaşma hususunda tesis olunan disiplin, sarsılmaz bir kuvvettir</div>
          <div style={{marginTop:8,fontSize:10,color:C.goldD,letterSpacing:6}}>━━━━━━━━━━</div>
        </div>
        {/* Stats row with card backgrounds */}
        <div style={{display:"flex",justifyContent:"center",gap:16,padding:"16px 0 24px",flexWrap:"wrap",marginBottom:20}}>
          {[{l:"GÖREV ALANLARI",v:`${subs.length}/12`,icon:"◆"},{l:"TOPLAM HİZMET",v:fmtMin(tTime),icon:"⏱"},{l:"OPERASYONLAR",v:tSess.toString(),icon:"▶"},{l:"MADALYALAR",v:earned.toString(),icon:"★"}].map((s,i)=>(
            <div key={i} style={{textAlign:"center",minWidth:110,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"14px 18px"}}>
              <div style={{fontSize:8,color:C.textD,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:6}}>{s.icon} {s.l}</div>
              <div style={{fontSize:24,color:C.goldB,fontFamily:"'Playfair Display',serif",fontWeight:700}}>{s.v}</div>
            </div>
          ))}
        </div>
        <SoldierDisplay subjects={subs} img={img} onMedalClick={id=>{setSelId(id);setView("det");}} onEmptyClick={i=>subs.length<12&&setAddDlg(i)}/>
        {/* Active operation indicator */}
        {tmRun&&<div style={{maxWidth:620,margin:"20px auto 0",cursor:"pointer",animation:"breathe 2.5s ease infinite"}} onClick={()=>{setSelId(tmSubId);setView("det");}}>
          <div style={{background:`linear-gradient(135deg,${C.redBg},#1a1215)`,border:`1px solid ${tmPau?C.goldD:C.redD}`,borderRadius:8,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:tmPau?C.goldD:C.red,boxShadow:tmPau?"none":`0 0 8px ${C.red}`,animation:tmPau?"none":"breathe 1.5s ease infinite"}}/>
              <div>
                <div style={{fontSize:10,color:tmPau?C.goldD:C.red,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5,fontWeight:600}}>{tmPau?"⏸ OPERASYON DURAKLATILDI":"◉ AKTİF OPERASYON"}</div>
                <div style={{fontSize:11,color:C.text,fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{tmSubName}</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,color:tmPau?C.goldD:C.goldB,fontFamily:"'JetBrains Mono',monospace",fontWeight:500,letterSpacing:3}}>{fmtTime(tmEl)}</div>
              <div style={{fontSize:8,color:C.textD,fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>DEVAM ETMEK İÇİN TIKLA →</div>
            </div>
          </div>
        </div>}
        {subs.length>0&&<div style={{maxWidth:620,margin:"28px auto 0",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 20px"}}>
          <div style={{fontSize:10,color:C.textD,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5,marginBottom:12}}>SON AKTİVİTELER</div>
          {subs.flatMap(s=>(s.sessions||[]).map(ss=>({...ss,sn:s.name}))).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5).map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.bg}`,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>
              <span style={{color:C.gold,fontWeight:600,minWidth:80}}>{s.sn}</span>
              <span style={{color:C.textD}}>{new Date(s.date).toLocaleDateString("tr-TR")}</span>
              <span style={{color:C.green,fontWeight:500}}>{fmtTime(s.duration)}</span>
            </div>
          ))}
          {subs.every(s=>!s.sessions?.length)&&<div style={{fontSize:11,color:C.textF,fontFamily:"'JetBrains Mono',monospace",textAlign:"center",padding:16}}>Henüz operasyon kaydı yok. Görev seç ve çalışmaya başla.</div>}
        </div>}
        <div style={{textAlign:"center",padding:"32px 0 18px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:14}}>
            <div style={{flex:1,maxWidth:80,height:1,background:`linear-gradient(90deg,transparent,${C.goldD})`}}/>
            <div style={{fontSize:10,color:C.goldD}}>◉</div>
            <div style={{flex:1,maxWidth:80,height:1,background:`linear-gradient(90deg,${C.goldD},transparent)`}}/>
          </div>
          <div style={{fontSize:8,color:C.textF,fontFamily:"'JetBrains Mono',monospace",letterSpacing:3}}>İNTİZAM v3 — DİSİPLİN · DÜZEN · HAKİMİYET</div>
          <button onClick={()=>signOut(auth)} style={{marginTop:12,background:"none",border:`1px solid ${C.border}`,color:C.textF,padding:"6px 16px",fontSize:9,fontFamily:"'JetBrains Mono',monospace",borderRadius:4,cursor:"pointer",letterSpacing:1}}>ÇIKIŞ YAP</button>
        </div>
      </div>
      :sel?<DetailView subject={sel} onBack={()=>setView("cmd")} onUpdate={upd} onTimeSave={upd}
        timer={{run:tmRun,el:tmEl,pau:tmPau,subId:tmSubId,subName:tmSubName,onStart:tmGo,onPause:tmPa,onResume:tmRe,onStop:tmSt,onReset:tmRs}}/>:null}
      {addDlg!==null&&<AddDialog slot={addDlg} onAdd={n=>add(n,addDlg)} onCancel={()=>setAddDlg(null)}/>}
    </div>
  );
}
