"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import IntizamApp from "../components/IntizamApp";

const C = {
  bg: "#181c28", card: "#1e2436", border: "#3e4866",
  gold: "#ecc050", goldB: "#ffd866", goldD: "#c09a3a",
  green: "#78dd78", greenD: "#55b855", greenBg: "#1a2820",
  red: "#ff7777", redD: "#cc5555",
  text: "#ececf0", textM: "#c0c0c8", textD: "#9098aa", textF: "#6a7088",
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setAuthLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, pass);
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (err) {
      const msgs = {
        "auth/invalid-email": "Geçersiz e-posta adresi.",
        "auth/user-not-found": "Kullanıcı bulunamadı.",
        "auth/wrong-password": "Hatalı şifre.",
        "auth/email-already-in-use": "Bu e-posta zaten kayıtlı.",
        "auth/weak-password": "Şifre en az 6 karakter olmalı.",
        "auth/invalid-credential": "Giriş bilgileri hatalı.",
      };
      setError(msgs[err.code] || `Hata: ${err.message}`);
    }
    setAuthLoading(false);
  };

  // Loading screen
  if (loading) {
    return (
      <div style={{ background: C.bg, color: C.textD, height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${C.border}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: 4 }}>SİSTEM YÜKLENİYOR...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Auth screen
  if (!user) {
    return (
      <div style={{ background: `radial-gradient(ellipse at 50% 30%,#1e2438,${C.bg})`, color: C.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Playfair Display',serif" }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}} button{transition:all .15s ease;outline:none} button:hover{filter:brightness(1.2)} button:active{transform:scale(.97)} input:focus{border-color:${C.gold}!important}`}</style>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 36, maxWidth: 400, width: "100%", animation: "fadeIn .4s ease" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 10, color: C.goldD, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 6, marginBottom: 6 }}>━━ ◉ ━━</div>
            <div style={{ fontSize: 32, color: C.goldB, fontWeight: 900, letterSpacing: 8, marginBottom: 4 }}>İNTİZAM</div>
            <div style={{ fontSize: 11, color: C.gold, fontFamily: "'Cormorant Garamond',serif", letterSpacing: 6, opacity: .7 }}>KOMUTA MERKEZİ</div>
            <div style={{ fontSize: 9, color: C.textD, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, marginTop: 12, lineHeight: 1.6, maxWidth: 300, margin: "12px auto 0" }}>
              {isRegister ? "Yeni hesap oluştur ve eğitime başla" : "Kimlik doğrulama gerekli"}
            </div>
          </div>

          {/* Form */}
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: C.textD, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>E-Posta</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@mail.com"
                style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "12px 14px", fontSize: 14, fontFamily: "'JetBrains Mono',monospace", borderRadius: 6, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: C.textD, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>Şifre</div>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••"
                onKeyDown={e => e.key === "Enter" && handleAuth(e)}
                style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "12px 14px", fontSize: 14, fontFamily: "'JetBrains Mono',monospace", borderRadius: 6, outline: "none", boxSizing: "border-box" }} />
            </div>

            {error && <div style={{ padding: "10px 14px", background: "#2a1616", border: `1px solid ${C.redD}`, borderRadius: 6, marginBottom: 16, fontSize: 11, color: C.red, fontFamily: "'JetBrains Mono',monospace" }}>{error}</div>}

            <button onClick={handleAuth} disabled={authLoading || !email || !pass}
              style={{ width: "100%", background: C.greenBg, border: `1px solid ${C.greenD}`, color: C.green, padding: "12px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, borderRadius: 6, cursor: "pointer", textTransform: "uppercase", opacity: (!email || !pass) ? 0.3 : 1, marginBottom: 12 }}>
              {authLoading ? "..." : isRegister ? "✓ KAYIT OL" : "✓ GİRİŞ YAP"}
            </button>

            <button onClick={() => { setIsRegister(!isRegister); setError(""); }}
              style={{ width: "100%", background: "none", border: `1px solid ${C.border}`, color: C.textD, padding: "10px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, borderRadius: 6, cursor: "pointer" }}>
              {isRegister ? "Zaten hesabım var → Giriş yap" : "Hesabım yok → Kayıt ol"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // App - user authenticated
  return <IntizamApp user={user} />;
}
