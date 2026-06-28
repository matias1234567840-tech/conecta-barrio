import "./App.css"
import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { supabase } from "./supabase"
import html2canvas from "html2canvas"

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])
  return isMobile
}

const Logo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2E7D32"/>
        <stop offset="100%" stopColor="#00796B"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#lg)"/>
    <polygon points="50,18 76,40 70,40 70,72 30,72 30,40 24,40" fill="white" opacity="0.95"/>
    <rect x="41" y="50" width="18" height="22" rx="3" fill="#2E7D32"/>
    <ellipse cx="18" cy="60" rx="9" ry="11" fill="#388E3C" opacity="0.85"/>
    <rect x="16" y="68" width="4" height="7" rx="1" fill="#5D4037"/>
    <ellipse cx="82" cy="60" rx="9" ry="11" fill="#388E3C" opacity="0.85"/>
    <rect x="80" y="68" width="4" height="7" rx="1" fill="#5D4037"/>
    <circle cx="50" cy="36" r="5" fill="#A5D6A7"/>
    <path d="M18 82 Q50 68 82 82" stroke="white" strokeWidth="2.5" fill="none" opacity="0.5"/>
  </svg>
)

const iconPendiente = new L.Icon({ iconUrl: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png", iconSize: [32,32] })
const iconResuelto  = new L.Icon({ iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",  iconSize: [32,32] })

function MapClick({ setPosicion, setUbicacion }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng
      setPosicion({ lat, lng })
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        const data = await res.json()
        const dir = [data.address?.road, data.address?.house_number, data.address?.suburb].filter(Boolean).join(" ")
        if (dir) setUbicacion(dir)
      } catch {}
    }
  })
  return null
}

const prioColor = p => p === "alta" ? "#E53935" : p === "media" ? "#F57C00" : "#2E7D32"
const prioIcon  = p => p === "alta" ? "🔴" : p === "media" ? "🟠" : "🟢"
const estadoBadge = estado => {
  const isPend = estado === "pendiente"
  return (
    <span style={{ background:isPend?"#FFF3E0":"#E8F5E9", color:isPend?"#E65100":"#2E7D32", border:`1px solid ${isPend?"#FFB74D":"#81C784"}`, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, textTransform:"capitalize", whiteSpace:"nowrap" }}>
      {isPend ? "⏳ Pendiente" : "✅ Resuelto"}
    </span>
  )
}
const getId = () => Date.now() + Math.random().toString(36).slice(2)
const hoy   = () => new Date().toLocaleString("es-AR")

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function PantallaLogin({ onLogin }) {
  const [modo, setModo] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  async function handleLogin() {
    setCargando(true); setError("")
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError("Email o contraseña incorrectos"); setCargando(false); return }
    const { data: perfil } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()
    onLogin({ id: data.user.id, email: data.user.email, ...perfil })
    setCargando(false)
  }

async function handleRegistro() {
    if (!nombre || !email || !password) return setError("Completá todos los campos")
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres")
    setCargando(true); setError("")
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre } }
    })
    if (error) { setError(error.message); setCargando(false); return }
    if (!data.user) { setError("Error al crear el usuario, intentá de nuevo"); setCargando(false); return }
    onLogin({ id: data.user.id, email, nombre, rol: "socio", cuota_al_dia: false })
    setCargando(false)
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0A1628 0%,#1B3A2D 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:"36px 28px", width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><Logo size={68}/></div>
          <div style={{ fontSize:24, fontWeight:900, color:"#0A1628", letterSpacing:-0.5 }}>Conecta Barrio</div>
          <div style={{ fontSize:12, color:"#9E9E9E", marginTop:4 }}>Sociedad de Fomento Barrio Las Heras</div>
        </div>
        <div style={{ display:"flex", background:"#F5F7FA", borderRadius:12, padding:4, marginBottom:20 }}>
          {[["login","Iniciar sesión"],["registro","Registrarse"]].map(([val,label]) => (
            <button key={val} onClick={() => { setModo(val); setError("") }} style={{ flex:1, padding:"9px 0", borderRadius:9, border:"none", background:modo===val?"#fff":"none", color:modo===val?"#0A1628":"#9E9E9E", fontWeight:modo===val?700:500, fontSize:14, cursor:"pointer", fontFamily:"inherit", boxShadow:modo===val?"0 2px 8px rgba(0,0,0,0.08)":"none" }}>{label}</button>
          ))}
        </div>
        {modo==="registro" && <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="👤 Nombre completo" style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", marginBottom:12, boxSizing:"border-box" }}/>}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="📧 Correo electrónico" type="email" style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", marginBottom:12, boxSizing:"border-box" }}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="🔒 Contraseña" type="password" onKeyDown={e=>e.key==="Enter"&&(modo==="login"?handleLogin():handleRegistro())} style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", marginBottom:16, boxSizing:"border-box" }}/>
        {error && <div style={{ background:"#FFEBEE", color:"#C62828", padding:"10px 14px", borderRadius:10, fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}
        <button onClick={modo==="login"?handleLogin:handleRegistro} disabled={cargando} style={{ width:"100%", padding:"13px 0", borderRadius:12, border:"none", background:"linear-gradient(135deg,#2E7D32,#00796B)", color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(46,125,50,0.35)", opacity:cargando?0.7:1 }}>
          {cargando ? "⏳ Cargando..." : (modo==="login" ? "Entrar al barrio 🏘️" : "Crear cuenta")}
        </button>
        {modo==="login" && (
          <div style={{ textAlign:"center", marginTop:12 }}>
            <button onClick={async()=>{ if(!email) return alert("Ingresá tu email primero"); await supabase.auth.resetPasswordForEmail(email,{redirectTo:"https://conecta-barrio.vercel.app"}); alert("✅ Revisá tu email") }} style={{ background:"none", border:"none", color:"#2E7D32", fontSize:13, cursor:"pointer", fontFamily:"inherit", textDecoration:"underline" }}>¿Olvidaste tu contraseña?</button>
          </div>
        )}
        {modo==="registro" && <div style={{ fontSize:11, color:"#9E9E9E", textAlign:"center", marginTop:12 }}>💡 El primer usuario registrado será administrador</div>}
        <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:"#9E9E9E" }}>Juntos hacemos un barrio mejor 💚</div>
      </div>
    </div>
  )
}

// ── CAMPANITA ─────────────────────────────────────────────────────────────────
function Campanita({ usuario }) {
  const [notificaciones, setNotificaciones] = useState([])
  const [abierto, setAbierto] = useState(false)
  useEffect(() => { cargar() }, [])
  async function cargar() {
    const { data } = await supabase.from("notificaciones").select("*").eq("user_id", usuario.id).order("fecha",{ascending:false})
    if (data) setNotificaciones(data)
  }
  async function marcarLeidas() {
    await supabase.from("notificaciones").update({leida:true}).eq("user_id",usuario.id); cargar()
  }
  const noLeidas = notificaciones.filter(n=>!n.leida).length
  return (
    <div style={{ position:"relative" }}>
      <button onClick={()=>{setAbierto(!abierto);if(!abierto)marcarLeidas()}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, position:"relative", padding:4 }}>
        🔔
        {noLeidas>0 && <span style={{ position:"absolute", top:0, right:0, background:"#E53935", color:"#fff", borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 5px", minWidth:16, textAlign:"center" }}>{noLeidas}</span>}
      </button>
      {abierto && (
        <div style={{ position:"fixed", right:12, top:56, background:"#fff", borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.15)", width:280, zIndex:1000, overflow:"hidden" }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #F0F4F8", fontWeight:800, fontSize:14 }}>🔔 Notificaciones</div>
          {notificaciones.length===0 && <div style={{ padding:20, textAlign:"center", color:"#9E9E9E", fontSize:13 }}>Sin notificaciones</div>}
          {notificaciones.slice(0,8).map(n=>(
            <div key={n.id} style={{ padding:"10px 14px", borderBottom:"1px solid #F0F4F8", background:n.leida?"#fff":"#F0FFF4" }}>
              <div style={{ fontSize:13, fontWeight:700 }}>{n.titulo}</div>
              <div style={{ fontSize:12, color:"#6B7280", marginTop:2 }}>{n.mensaje}</div>
              <div style={{ fontSize:11, color:"#9E9E9E", marginTop:3 }}>{n.fecha}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── COMENTARIOS ───────────────────────────────────────────────────────────────
function SeccionComentarios({ reclamoId, usuario }) {
  const [comentarios, setComentarios] = useState([])
  const [texto, setTexto] = useState("")
  const [abierto, setAbierto] = useState(false)
  useEffect(()=>{if(abierto)cargar()},[abierto])
  async function cargar() {
    const { data } = await supabase.from("comentarios").select("*").eq("reclamo_id",reclamoId).order("fecha",{ascending:true})
    if(data)setComentarios(data)
  }
  async function comentar() {
    if(!texto.trim())return
    await supabase.from("comentarios").insert({id:getId(),reclamo_id:reclamoId,user_id:usuario.id,autor:usuario.nombre,texto,fecha:hoy()})
    setTexto(""); cargar()
  }
  return (
    <div style={{ marginTop:10, borderTop:"1px solid #F0F4F8", paddingTop:10 }}>
      <button onClick={()=>setAbierto(!abierto)} style={{ background:"none", border:"none", color:"#1565C0", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
        💬 {abierto?"Ocultar comentarios":`Ver comentarios${comentarios.length>0?` (${comentarios.length})`:""}`}
      </button>
      {abierto && (
        <div style={{ marginTop:10 }}>
          {comentarios.length===0 && <div style={{ fontSize:12, color:"#9E9E9E", marginBottom:8 }}>Sin comentarios aún</div>}
          {comentarios.map(c=>(
            <div key={c.id} style={{ background:"#F5F7FA", borderRadius:8, padding:"8px 12px", marginBottom:6, fontSize:13 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontWeight:700, color:"#0A1628" }}>{c.autor}</span>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"#9E9E9E" }}>{c.fecha}</span>
                  {c.user_id===usuario.id && <button onClick={async()=>{await supabase.from("comentarios").delete().eq("id",c.id);cargar()}} style={{ background:"none", border:"none", color:"#C62828", fontSize:11, cursor:"pointer" }}>🗑️</button>}
                </div>
              </div>
              <div style={{ color:"#6B7280", marginTop:4 }}>{c.texto}</div>
            </div>
          ))}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <input value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Escribí un comentario..." onKeyDown={e=>e.key==="Enter"&&comentar()} style={{ flex:1, padding:"8px 12px", borderRadius:8, border:"1.5px solid #E8ECF0", fontSize:13, fontFamily:"inherit" }}/>
            <button onClick={comentar} style={{ padding:"8px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#2E7D32,#00796B)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SOCIOS ────────────────────────────────────────────────────────────────────
function SeccionSocios({ usuario, esAdmin }) {
  const [socios, setSocios] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const isMobile = useIsMobile()
  useEffect(()=>{cargar()},[])
  async function cargar() {
    const { data } = await supabase.from("profiles").select("*")
    if(data)setSocios(data)
  }
  async function toggleCuota(id,actual) {
    if(!esAdmin)return
    await supabase.from("profiles").update({cuota_al_dia:!actual}).eq("id",id); cargar()
  }
  async function toggleAdmin(id,rolActual) {
    if(!esAdmin)return
    await supabase.from("profiles").update({rol:rolActual==="admin"?"socio":"admin"}).eq("id",id); cargar()
  }
  async function eliminarSocio(id) {
    await supabase.from("profiles").delete().eq("id", id); cargar()
  }
  const filtrados = socios.filter(s=>s.nombre?.toLowerCase().includes(busqueda.toLowerCase())||s.email?.toLowerCase().includes(busqueda.toLowerCase()))
  const alDia = socios.filter(s=>s.cuota_al_dia)
  const atrasados = socios.filter(s=>!s.cuota_al_dia)
  return (
    <div>
      <div className="grid-stats">
        {[
          {icon:"👥",value:socios.length,label:"Total socios",color:"#1565C0",bg:"#E3F2FD"},
          {icon:"✅",value:alDia.length,label:"Cuota al día",color:"#2E7D32",bg:"#E8F5E9"},
          {icon:"⚠️",value:atrasados.length,label:"Cuota atrasada",color:"#E65100",bg:"#FFF3E0"},
        ].map((s,i)=>(
          <div key={i} style={{ background:"#fff", borderRadius:16, padding:"18px 20px", borderTop:`3px solid ${s.color}`, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:26,fontWeight:900,color:s.color,lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:12,color:"#9E9E9E",marginTop:3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", borderRadius:18, padding:isMobile?14:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="socios-header">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:6,height:24,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
            <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Gestión de Socios</h2>
          </div>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar..." className="socios-search" style={{ padding:"8px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:13,fontFamily:"inherit" }}/>
        </div>
        <div className="tabla-desktop">
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F5F7FA" }}>
              {["Nombre","Email","Rol","Cuota",esAdmin?"Acciones":""].map(h=><th key={h} style={{ textAlign:"left",padding:"10px 12px",fontSize:11,color:"#9E9E9E",fontWeight:700 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtrados.length===0&&<tr><td colSpan={5} style={{ textAlign:"center",padding:28,color:"#9E9E9E" }}>Sin socios</td></tr>}
              {filtrados.map(s=>(
                <tr key={s.id} style={{ borderBottom:"1px solid #F0F4F8" }}>
                  <td style={{ padding:"11px 12px",fontSize:13,fontWeight:600,color:"#0A1628" }}>{s.nombre}{s.id===usuario.id&&<span style={{ fontSize:10,color:"#9E9E9E" }}> (vos)</span>}</td>
                  <td style={{ padding:"11px 12px",fontSize:12,color:"#9E9E9E" }}>{s.email}</td>
                  <td style={{ padding:"11px 12px" }}><span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:s.rol==="admin"?"#E8EAF6":"#F5F7FA",color:s.rol==="admin"?"#3949AB":"#9E9E9E" }}>{s.rol==="admin"?"⚙️ Admin":"👤 Socio"}</span></td>
                  <td style={{ padding:"11px 12px" }}><span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:s.cuota_al_dia?"#E8F5E9":"#FFF3E0",color:s.cuota_al_dia?"#2E7D32":"#E65100" }}>{s.cuota_al_dia?"✅ Al día":"⚠️ Atrasada"}</span></td>
                  {esAdmin&&<td style={{ padding:"11px 12px" }}>{s.id!==usuario.id&&<div style={{ display:"flex",gap:6 }}>
                    <button onClick={()=>toggleCuota(s.id,s.cuota_al_dia)} style={{ padding:"4px 10px",borderRadius:6,border:"none",background:s.cuota_al_dia?"#FFF3E0":"#E8F5E9",color:s.cuota_al_dia?"#E65100":"#2E7D32",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{s.cuota_al_dia?"Marcar atrasada":"Marcar al día"}</button>
                    <button onClick={()=>toggleAdmin(s.id,s.rol)} style={{ padding:"4px 10px",borderRadius:6,border:"none",background:"#E8EAF6",color:"#3949AB",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{s.rol==="admin"?"Quitar admin":"Hacer admin"}</button>
                    <button onClick={async()=>{ if(window.confirm("¿Estás seguro de que querés eliminar este socio?")) await eliminarSocio(s.id) }} style={{ padding:"4px 10px",borderRadius:6,border:"none",background:"#FFEBEE",color:"#C62828",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>🗑️ Eliminar</button>
                  </div>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cards-mobile">
          {filtrados.length===0&&<div style={{ textAlign:"center",padding:28,color:"#9E9E9E",fontSize:13 }}>Sin socios</div>}
          {filtrados.map(s=>(
            <div key={s.id} style={{ background:"#F5F7FA",borderRadius:12,padding:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:14,color:"#0A1628" }}>{s.nombre}{s.id===usuario.id&&<span style={{ fontSize:10,color:"#9E9E9E" }}> (vos)</span>}</div>
                  <div style={{ fontSize:12,color:"#9E9E9E",marginTop:2 }}>{s.email}</div>
                </div>
                <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:s.cuota_al_dia?"#E8F5E9":"#FFF3E0",color:s.cuota_al_dia?"#2E7D32":"#E65100",flexShrink:0 }}>{s.cuota_al_dia?"✅ Al día":"⚠️ Atrasada"}</span>
              </div>
              {esAdmin&&s.id!==usuario.id&&<div style={{ display:"flex",gap:8,marginTop:8 }}>
                <button onClick={()=>toggleCuota(s.id,s.cuota_al_dia)} style={{ flex:1,padding:"7px 0",borderRadius:8,border:"none",background:s.cuota_al_dia?"#FFF3E0":"#E8F5E9",color:s.cuota_al_dia?"#E65100":"#2E7D32",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{s.cuota_al_dia?"Atrasada":"Al día"}</button>
                <button onClick={()=>toggleAdmin(s.id,s.rol)} style={{ flex:1,padding:"7px 0",borderRadius:8,border:"none",background:"#E8EAF6",color:"#3949AB",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{s.rol==="admin"?"Quitar admin":"Hacer admin"}</button>
              </div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── AVISOS ────────────────────────────────────────────────────────────────────
function SeccionAvisos({ usuario, esAdmin }) {
  const [avisos, setAvisos] = useState([])
  const [titulo, setTitulo] = useState("")
  const [contenido, setContenido] = useState("")
  const isMobile = useIsMobile()
  useEffect(()=>{cargar()},[])
  async function cargar() {
    const { data } = await supabase.from("avisos").select("*").order("fecha",{ascending:false})
    if(data)setAvisos(data)
  }
  async function publicar() {
    if(!titulo||!contenido)return
    await supabase.from("avisos").insert({id:getId(),titulo,contenido,autor:usuario.nombre,fecha:hoy()})
    setTitulo(""); setContenido(""); cargar()
  }
  return (
    <div className={esAdmin&&!isMobile?"avisos-grid-admin":""}>
      {esAdmin&&(
        <div style={{ background:"#fff",borderRadius:18,padding:isMobile?14:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",alignSelf:"start" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
            <div style={{ width:6,height:24,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
            <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Publicar aviso</h2>
          </div>
          <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="📢 Título del aviso" style={{ width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box" }}/>
          <textarea value={contenido} onChange={e=>setContenido(e.target.value)} placeholder="Escribí el contenido..." rows={4} style={{ width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",marginBottom:14,boxSizing:"border-box",resize:"none" }}/>
          <button onClick={publicar} style={{ width:"100%",padding:"12px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#2E7D32,#00796B)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>📢 Publicar aviso</button>
        </div>
      )}
      <div>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
          <div style={{ width:6,height:24,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
          <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Avisos del barrio</h2>
        </div>
        {avisos.length===0&&<div style={{ background:"#fff",borderRadius:16,padding:32,textAlign:"center",color:"#9E9E9E" }}>No hay avisos aún</div>}
        {avisos.map(a=>(
          <div key={a.id} style={{ background:"#fff",borderRadius:16,padding:isMobile?14:20,marginBottom:12,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",borderLeft:"5px solid #2E7D32" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
              <div style={{ fontWeight:800,fontSize:15,color:"#0A1628",marginBottom:6 }}>📢 {a.titulo}</div>
              {esAdmin&&<button onClick={async()=>{await supabase.from("avisos").delete().eq("id",a.id);cargar()}} style={{ padding:"3px 10px",borderRadius:6,border:"none",background:"#FFEBEE",color:"#C62828",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0 }}>🗑️</button>}
            </div>
            <p style={{ fontSize:13,color:"#6B7280",lineHeight:1.6,margin:"0 0 8px" }}>{a.contenido}</p>
            <div style={{ fontSize:11,color:"#9E9E9E" }}>Por {a.autor} · {a.fecha}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MENSAJES ──────────────────────────────────────────────────────────────────
function SeccionMensajes({ usuario, esAdmin }) {
  const [socios, setSocios] = useState([])
  const [destinatario, setDestinatario] = useState(null)
  const [texto, setTexto] = useState("")
  const [mensajes, setMensajes] = useState([])
  const isMobile = useIsMobile()
  useEffect(()=>{cargarSocios()},[])
  useEffect(()=>{cargarMensajes()},[destinatario])
  async function cargarSocios() {
    const { data } = await supabase.from("profiles").select("*")
    if(data)setSocios(data.filter(u=>u.id!==usuario.id))
  }
  async function cargarMensajes() {
    if(esAdmin&&!destinatario)return
    let query = supabase.from("mensajes").select("*").order("fecha",{ascending:true})
    if(esAdmin&&destinatario) query=query.or(`and(de_id.eq.${usuario.id},para_id.eq.${destinatario.id}),and(de_id.eq.${destinatario.id},para_id.eq.${usuario.id})`)
    else query=query.or(`de_id.eq.${usuario.id},para_id.eq.${usuario.id}`)
    const { data } = await query
    if(data)setMensajes(data)
  }
  async function enviar() {
    if(!texto.trim()||(esAdmin&&!destinatario))return
    await supabase.from("mensajes").insert({id:getId(),de_id:usuario.id,de_nombre:usuario.nombre,para_id:esAdmin?destinatario.id:null,para_nombre:esAdmin?destinatario.nombre:"Todos",texto,fecha:hoy()})
    setTexto(""); cargarMensajes()
  }
  return (
    <div className={esAdmin&&!isMobile?"mensajes-grid":""}>
      {esAdmin&&!isMobile&&(
        <div style={{ background:"#fff",borderRadius:18,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:800,fontSize:14,color:"#0A1628",marginBottom:12 }}>Socios</div>
          {socios.length===0&&<div style={{ fontSize:13,color:"#9E9E9E" }}>Sin socios</div>}
          {socios.map(s=>(
            <div key={s.id} onClick={()=>{ setDestinatario(s); cargarMensajes() }} style={{ padding:"10px 12px",borderRadius:10,cursor:"pointer",marginBottom:6,background:destinatario?.id===s.id?"#E8F5E9":"#F5F7FA",borderLeft:destinatario?.id===s.id?"3px solid #2E7D32":"3px solid transparent" }}>
              <div style={{ fontSize:13,fontWeight:600,color:"#0A1628" }}>{s.nombre}</div>
              <div style={{ fontSize:11,color:"#9E9E9E" }}>{s.email}</div>
            </div>
          ))}
        </div>
      )}
      {esAdmin&&isMobile&&(
        <div style={{ marginBottom:12 }}>
          <select onChange={e=>{ const s=socios.find(x=>x.id===e.target.value); setDestinatario(s||null) }} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",background:"#fff" }}>
            <option value="">Seleccioná un socio...</option>
            {socios.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      )}
      <div style={{ background:"#fff",borderRadius:18,padding:isMobile?14:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
          <div style={{ width:6,height:24,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
          <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>{esAdmin?(destinatario?`Mensajes con ${destinatario.nombre}`:"Seleccioná un socio"):"Mis mensajes"}</h2>
        </div>
        <div style={{ flex:1,overflowY:"auto",maxHeight:isMobile?300:400,marginBottom:14,display:"flex",flexDirection:"column",gap:8 }}>
          {mensajes.length===0&&<div style={{ textAlign:"center",padding:32,color:"#9E9E9E",fontSize:13 }}>{esAdmin&&!destinatario?"Seleccioná un socio":"Sin mensajes"}</div>}
          {mensajes.map(m=>{
            const esMio=m.de_id===usuario.id
            return (
              <div key={m.id} style={{ alignSelf:esMio?"flex-end":"flex-start",background:esMio?"linear-gradient(135deg,#2E7D32,#00796B)":"#F5F7FA",color:esMio?"#fff":"#0A1628",borderRadius:esMio?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",maxWidth:"75%" }}>
                <div style={{ fontSize:13,lineHeight:1.5 }}>{m.texto}</div>
                <div style={{ fontSize:10,opacity:0.7,marginTop:3 }}>{m.de_nombre} · {m.fecha}</div>
              </div>
            )
          })}
        </div>
        {(!esAdmin||destinatario)&&(
          <div style={{ display:"flex",gap:8 }}>
            <input value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Escribí un mensaje..." onKeyDown={e=>e.key==="Enter"&&enviar()} style={{ flex:1,padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit" }}/>
            <button onClick={enviar} style={{ padding:"10px 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#2E7D32,#00796B)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>Enviar</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── PERFIL Y CARNET ───────────────────────────────────────────────────────────
function SeccionPerfil({ usuario, setUsuario }) {
  const [nombre, setNombre] = useState(usuario.nombre||"")
  const [direccion, setDireccion] = useState(usuario.direccion||"")
  const [dni, setDni] = useState(usuario.dni||"")
  const [foto, setFoto] = useState(usuario.foto||null)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const carnetRef = useRef(null)
  const isMobile = useIsMobile()

  async function descargarCarnet() {
    if(!carnetRef.current) return
    const canvas = await html2canvas(carnetRef.current, { scale: 2, useCORS: true })
    const link = document.createElement("a")
    link.download = `carnet-${nombre}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  async function guardar() {
    setGuardando(true)
    const { error } = await supabase.from("profiles").update({ nombre, direccion, dni, foto }).eq("id", usuario.id)
    if (!error) {
      setUsuario(u => ({ ...u, nombre, direccion, dni, foto }))
      setExito(true)
      setTimeout(() => setExito(false), 3000)
    }
    setGuardando(false)
  }

  function handleFoto(e) {
    const f = e.target.files[0]
    if (f) {
      const r = new FileReader()
      r.onloadend = () => setFoto(r.result)
      r.readAsDataURL(f)
    }
  }

  return (
    <div className={!isMobile?"grid-2":""} style={{ alignItems:"start" }}>
      <div style={{ background:"#fff", borderRadius:18, padding:isMobile?14:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <div style={{ width:6,height:24,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
          <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Mi perfil</h2>
        </div>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ width:90,height:90,borderRadius:45,background:"#F0F4F8",margin:"0 auto 10px",overflow:"hidden",border:"3px solid #E8ECF0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36 }}>
            {foto ? <img src={foto} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/> : "👤"}
          </div>
          <label style={{ display:"inline-block",padding:"7px 16px",borderRadius:10,border:"1.5px dashed #CBD5E1",cursor:"pointer",color:"#9E9E9E",fontSize:13 }}>
            📷 Cambiar foto
            <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleFoto}/>
          </label>
        </div>
        {[
          {label:"Nombre completo",val:nombre,set:setNombre,ph:"Tu nombre"},
          {label:"Dirección",val:direccion,set:setDireccion,ph:"Tu dirección en el barrio"},
          {label:"DNI",val:dni,set:setDni,ph:"Tu número de DNI"},
        ].map(({label,val,set,ph})=>(
          <div key={label} style={{ marginBottom:12 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:5,letterSpacing:0.5 }}>{label.toUpperCase()}</div>
            <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",boxSizing:"border-box" }}/>
          </div>
        ))}
        {exito && <div style={{ background:"#E8F5E9",color:"#2E7D32",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12 }}>✅ Perfil actualizado</div>}
        <button onClick={guardar} disabled={guardando} style={{ width:"100%",padding:"12px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#2E7D32,#00796B)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",opacity:guardando?0.7:1 }}>
          {guardando?"⏳ Guardando...":"💾 Guardar cambios"}
        </button>
      </div>
      <div>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
          <div style={{ width:6,height:24,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
          <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Mi carnet</h2>
        </div>
        <div ref={carnetRef} style={{ background:"linear-gradient(135deg,#0A1628 0%,#1B3A2D 100%)",borderRadius:20,padding:24,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",color:"#fff",maxWidth:360 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <div>
              <div style={{ fontSize:13,fontWeight:800,letterSpacing:0.5 }}>CONECTA BARRIO</div>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.5)",letterSpacing:1 }}>SOC. DE FOMENTO LAS HERAS</div>
            </div>
            <Logo size={40}/>
          </div>
          <div style={{ display:"flex",gap:16,alignItems:"center",marginBottom:20 }}>
            <div style={{ width:70,height:70,borderRadius:35,background:"rgba(255,255,255,0.1)",overflow:"hidden",border:"2px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0 }}>
              {foto?<img src={foto} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:"👤"}
            </div>
            <div>
              <div style={{ fontSize:18,fontWeight:900,lineHeight:1.2 }}>{nombre||"Sin nombre"}</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:4 }}>{usuario.rol==="admin"?"⚙️ Administrador":"👤 Socio"}</div>
              <div style={{ marginTop:6 }}>
                <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:usuario.cuota_al_dia?"#2E7D32":"#E65100" }}>
                  {usuario.cuota_al_dia?"✅ Cuota al día":"⚠️ Cuota atrasada"}
                </span>
              </div>
            </div>
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:14,display:"flex",flexDirection:"column",gap:6 }}>
            {direccion&&<div style={{ fontSize:12,color:"rgba(255,255,255,0.7)" }}>📍 {direccion}</div>}
            {dni&&<div style={{ fontSize:12,color:"rgba(255,255,255,0.7)" }}>🪪 DNI: {dni}</div>}
            {usuario.fecha_registro&&<div style={{ fontSize:12,color:"rgba(255,255,255,0.7)" }}>📅 Socio desde: {usuario.fecha_registro}</div>}
          </div>
          <div style={{ marginTop:16,background:"#fff",borderRadius:12,padding:10,display:"flex",justifyContent:"center" }}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Socio:${encodeURIComponent(nombre)}-DNI:${dni||"N/A"}-Barrio Las Heras`} alt="QR" style={{ width:100,height:100 }}/>
          </div>
          <div style={{ textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:10 }}>ID: {usuario.id?.slice(0,8).toUpperCase()}</div>
        </div>
        <button onClick={descargarCarnet} style={{ width:"100%",marginTop:12,padding:"12px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#2E7D32,#00796B)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(46,125,50,0.35)" }}>
          ⬇️ Descargar carnet
        </button>
      </div>
    </div>
  )
}

// ── MIS PAGOS ─────────────────────────────────────────────────────────────────
function MisPagos({ userId, cuotaAlDia }) {
  const [pagos, setPagos] = useState([])
  const isMobile = useIsMobile()
  useEffect(()=>{ cargar() },[])
  async function cargar() {
    const { data } = await supabase.from("pagos").select("*").eq("user_id", userId).order("fecha",{ascending:false})
    if(data) setPagos(data)
  }
  return (
    <div>
      <div style={{ background:"#fff",borderRadius:18,padding:isMobile?14:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
          <div style={{ width:6,height:24,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
          <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Mi estado de cuota</h2>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:12,background:cuotaAlDia?"#E8F5E9":"#FFF3E0",border:`1.5px solid ${cuotaAlDia?"#81C784":"#FFB74D"}` }}>
          <div style={{ fontSize:32 }}>{cuotaAlDia?"✅":"⚠️"}</div>
          <div>
            <div style={{ fontWeight:800,fontSize:15,color:cuotaAlDia?"#2E7D32":"#E65100" }}>{cuotaAlDia?"Cuota al día":"Cuota atrasada"}</div>
            <div style={{ fontSize:12,color:"#9E9E9E",marginTop:2 }}>{cuotaAlDia?"Estás al corriente con tus pagos":"Contactá al administrador para regularizar"}</div>
          </div>
        </div>
      </div>
      <div style={{ background:"#fff",borderRadius:18,padding:isMobile?14:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
          <div style={{ width:6,height:24,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
          <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Historial de pagos</h2>
        </div>
        {pagos.length===0&&<div style={{ textAlign:"center",padding:28,color:"#9E9E9E",fontSize:13 }}>Sin pagos registrados</div>}
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {pagos.map(p=>(
            <div key={p.id} style={{ background:"#F5F7FA",borderRadius:12,padding:14,borderLeft:"4px solid #2E7D32" }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <div style={{ fontWeight:700,fontSize:14,color:"#0A1628" }}>{p.concepto}</div>
                <div style={{ fontWeight:800,fontSize:14,color:"#2E7D32" }}>${p.monto}</div>
              </div>
              <div style={{ fontSize:11,color:"#9E9E9E" }}>{p.fecha}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── PAGOS ─────────────────────────────────────────────────────────────────────
function SeccionPagos({ usuario }) {
  const [pagos, setPagos] = useState([])
  const [socios, setSocios] = useState([])
  const [socioId, setSocioId] = useState("")
  const [monto, setMonto] = useState("")
  const [concepto, setConcepto] = useState("Cuota mensual")
  const [fecha, setFecha] = useState("")
  const [filtroBusqueda, setFiltroBusqueda] = useState("")
  const [filtroSocio, setFiltroSocio] = useState("")
  const isMobile = useIsMobile()

  useEffect(()=>{ cargar(); cargarSocios() },[])

  async function cargar() {
    const { data } = await supabase.from("pagos").select("*").order("fecha",{ascending:false})
    if(data) setPagos(data)
  }

  async function cargarSocios() {
    const { data } = await supabase.from("profiles").select("*")
    if(data) setSocios(data)
  }

  async function registrarPago() {
    if(!socioId||!monto||!fecha) return alert("Completá todos los campos")
    const socio = socios.find(s=>s.id===socioId)
    await supabase.from("pagos").insert({
      id:getId(), user_id:socioId, nombre_socio:socio?.nombre,
      monto:parseFloat(monto), concepto, fecha, registrado_por:usuario.nombre
    })
    await supabase.from("profiles").update({cuota_al_dia:true}).eq("id",socioId)
    setSocioId(""); setMonto(""); setFecha("")
    cargar(); cargarSocios()
  }

  async function borrarPago(id) {
    if(!window.confirm("¿Eliminás este pago?")) return
    await supabase.from("pagos").delete().eq("id", id)
    cargar()
  }

  const pagosFiltrados = pagos.filter(p =>
    p.nombre_socio?.toLowerCase().includes(filtroBusqueda.toLowerCase()) &&
    (filtroSocio === "" || p.user_id === filtroSocio)
  )

  const totalRecaudado = pagosFiltrados.reduce((acc, p) => acc + (parseFloat(p.monto)||0), 0)

  return (
    <div>
      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom:20 }}>
        {[
          { icon:"💰", value:`$${totalRecaudado.toLocaleString("es-AR")}`, label:"Total recaudado", color:"#2E7D32", bg:"#E8F5E9" },
          { icon:"📄", value:pagosFiltrados.length, label:"Pagos registrados", color:"#1565C0", bg:"#E3F2FD" },
          { icon:"👥", value:socios.filter(s=>s.cuota_al_dia).length, label:"Socios al día", color:"#00796B", bg:"#E0F2F1" },
        ].map((s,i)=>(
          <div key={i} style={{ background:"#fff", borderRadius:14, padding:"14px 16px", borderTop:`3px solid ${s.color}`, boxShadow:"0 2px 10px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40,height:40,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:20,fontWeight:900,color:s.color,lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11,color:"#9E9E9E",marginTop:3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario */}
      <div style={{ background:"#fff",borderRadius:18,padding:isMobile?14:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
          <div style={{ width:6,height:24,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
          <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Registrar pago</h2>
        </div>
        <div className={!isMobile?"grid-2":""} style={{ gap:12 }}>
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:5 }}>SOCIO</div>
            <select value={socioId} onChange={e=>setSocioId(e.target.value)} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",marginBottom:12,background:"#fff" }}>
              <option value="">Seleccioná un socio...</option>
              {socios.map(s=><option key={s.id} value={s.id}>{s.nombre} {s.cuota_al_dia?"✅":""}</option>)}
            </select>
            <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:5 }}>CONCEPTO</div>
            <input value={concepto} onChange={e=>setConcepto(e.target.value)} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box" }}/>
          </div>
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:5 }}>MONTO ($)</div>
            <input value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0.00" type="number" style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box" }}/>
            <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:5 }}>FECHA</div>
            <input value={fecha} onChange={e=>setFecha(e.target.value)} type="date" style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box" }}/>
          </div>
        </div>
        <button onClick={registrarPago} style={{ width:"100%",padding:"12px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#2E7D32,#00796B)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>💰 Registrar pago</button>
      </div>

      {/* Historial */}
      <div style={{ background:"#fff",borderRadius:18,padding:isMobile?14:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:6,height:24,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
            <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Historial de pagos</h2>
          </div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            <input value={filtroBusqueda} onChange={e=>setFiltroBusqueda(e.target.value)}
              placeholder="🔍 Buscar por nombre..."
              style={{ padding:"8px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:13,fontFamily:"inherit" }}/>
            <select value={filtroSocio} onChange={e=>setFiltroSocio(e.target.value)}
              style={{ padding:"8px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:13,fontFamily:"inherit",background:"#fff" }}>
              <option value="">Todos los socios</option>
              {socios.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        </div>

        {/* Desktop */}
        <div className="tabla-desktop">
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F5F7FA" }}>
              {["Socio","Concepto","Monto","Fecha","Registrado por",""].map(h=>(
                <th key={h} style={{ textAlign:"left",padding:"10px 12px",fontSize:11,color:"#9E9E9E",fontWeight:700 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {pagosFiltrados.length===0&&(
                <tr><td colSpan={6} style={{ textAlign:"center",padding:28,color:"#9E9E9E" }}>Sin pagos registrados</td></tr>
              )}
              {pagosFiltrados.map(p=>(
                <tr key={p.id} style={{ borderBottom:"1px solid #F0F4F8" }}>
                  <td style={{ padding:"10px 12px",fontSize:13,fontWeight:600,color:"#0A1628" }}>{p.nombre_socio}</td>
                  <td style={{ padding:"10px 12px",fontSize:13,color:"#6B7280" }}>{p.concepto}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <span style={{ fontSize:13,fontWeight:800,color:"#2E7D32",background:"#E8F5E9",padding:"3px 10px",borderRadius:20 }}>
                      ${parseFloat(p.monto).toLocaleString("es-AR")}
                    </span>
                  </td>
                  <td style={{ padding:"10px 12px",fontSize:12,color:"#9E9E9E" }}>{p.fecha}</td>
                  <td style={{ padding:"10px 12px",fontSize:12,color:"#9E9E9E" }}>{p.registrado_por}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <button onClick={()=>borrarPago(p.id)} style={{ padding:"4px 10px",borderRadius:6,border:"none",background:"#FFEBEE",color:"#C62828",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                      🗑️ Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="cards-mobile">
          {pagosFiltrados.length===0&&(
            <div style={{ textAlign:"center",padding:28,color:"#9E9E9E",fontSize:13 }}>Sin pagos registrados</div>
          )}
          {pagosFiltrados.map(p=>(
            <div key={p.id} style={{ background:"#F5F7FA",borderRadius:12,padding:14,borderLeft:"4px solid #2E7D32" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:14,color:"#0A1628" }}>{p.nombre_socio}</div>
                  <div style={{ fontSize:12,color:"#6B7280",marginTop:2 }}>{p.concepto}</div>
                </div>
                <span style={{ fontWeight:800,fontSize:14,color:"#2E7D32",background:"#E8F5E9",padding:"3px 10px",borderRadius:20,flexShrink:0 }}>
                  ${parseFloat(p.monto).toLocaleString("es-AR")}
                </span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8 }}>
                <div style={{ fontSize:11,color:"#9E9E9E" }}>{p.fecha} · {p.registrado_por}</div>
                <button onClick={()=>borrarPago(p.id)} style={{ padding:"4px 10px",borderRadius:6,border:"none",background:"#FFEBEE",color:"#C62828",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {pagosFiltrados.length > 0 && (
          <div style={{ marginTop:16,padding:"12px 16px",background:"#F0FFF4",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:13,fontWeight:700,color:"#2E7D32" }}>Total mostrado</span>
            <span style={{ fontSize:16,fontWeight:900,color:"#2E7D32" }}>${totalRecaudado.toLocaleString("es-AR")}</span>
          </div>
        )}
      </div>
    </div>
  )
}
// ── CRONOGRAMA ────────────────────────────────────────────────────────────────
function SeccionCronograma({ usuario, esAdmin }) {
  const [celdas, setCeldas] = useState({})
  const [horarios, setHorarios] = useState([])
  const [espacios, setEspacios] = useState([])
  const [nuevoHorario, setNuevoHorario] = useState("")
  const [nuevoEspacio, setNuevoEspacio] = useState("")
  const [celdaEditando, setCeldaEditando] = useState(null)
  const [formCelda, setFormCelda] = useState({ actividad:"", espacio:"" })
  const isMobile = useIsMobile()

  const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [h, e, c] = await Promise.all([
      supabase.from("cronograma_horarios").select("*").order("orden"),
      supabase.from("cronograma_espacios").select("*").order("nombre"),
      supabase.from("cronograma_celdas").select("*"),
    ])
    if (h.data) setHorarios(h.data)
    if (e.data) setEspacios(e.data)
    if (c.data) {
      const mapa = {}
      c.data.forEach(cel => { mapa[`${cel.horario_id}_${cel.dia}`] = cel })
      setCeldas(mapa)
    }
  }

  async function agregarHorario() {
    if (!nuevoHorario.trim()) return
    await supabase.from("cronograma_horarios").insert({ id: getId(), label: nuevoHorario.trim(), orden: horarios.length })
    setNuevoHorario("")
    cargar()
  }

  async function eliminarHorario(id) {
    if (!window.confirm("¿Eliminar este horario?")) return
    await supabase.from("cronograma_horarios").delete().eq("id", id)
    await supabase.from("cronograma_celdas").delete().eq("horario_id", id)
    cargar()
  }

  async function agregarEspacio() {
    if (!nuevoEspacio.trim()) return
    await supabase.from("cronograma_espacios").insert({ id: getId(), nombre: nuevoEspacio.trim() })
    setNuevoEspacio("")
    cargar()
  }

  async function eliminarEspacio(id) {
    if (!window.confirm("¿Eliminar este espacio?")) return
    await supabase.from("cronograma_espacios").delete().eq("id", id)
    cargar()
  }

  async function guardarCelda() {
    if (!celdaEditando) return
    const { horarioId, dia } = celdaEditando
    const key = `${horarioId}_${dia}`
    if (!formCelda.actividad.trim()) {
      // Si está vacío, borrar la celda
      await supabase.from("cronograma_celdas").delete().eq("horario_id", horarioId).eq("dia", dia)
    } else {
      const existe = celdas[key]
      if (existe) {
        await supabase.from("cronograma_celdas").update({ actividad: formCelda.actividad, espacio: formCelda.espacio }).eq("id", existe.id)
      } else {
        await supabase.from("cronograma_celdas").insert({ id: getId(), horario_id: horarioId, dia, actividad: formCelda.actividad, espacio: formCelda.espacio })
      }
    }
    setCeldaEditando(null)
    cargar()
  }

  function abrirCelda(horarioId, dia) {
    if (!esAdmin) return
    const key = `${horarioId}_${dia}`
    const celda = celdas[key]
    setFormCelda({ actividad: celda?.actividad || "", espacio: celda?.espacio || "" })
    setCeldaEditando({ horarioId, dia })
  }

  return (
    <div>
      {/* Modal editar celda */}
      {celdaEditando && (
        <div onClick={e=>e.target===e.currentTarget&&setCeldaEditando(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:18, padding:24, width:"100%", maxWidth:400 }}>
            <div style={{ fontWeight:800, fontSize:16, marginBottom:16, color:"#0A1628" }}>
              ✏️ {celdaEditando.dia} — {horarios.find(h=>h.id===celdaEditando.horarioId)?.label}
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:"#9E9E9E", marginBottom:6 }}>ACTIVIDAD</div>
            <input value={formCelda.actividad} onChange={e=>setFormCelda({...formCelda, actividad:e.target.value})}
              placeholder="Ej: Yoga, Taller de costura..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", boxSizing:"border-box", marginBottom:14 }}/>
            <div style={{ fontSize:11, fontWeight:700, color:"#9E9E9E", marginBottom:6 }}>ESPACIO / LUGAR</div>
            <select value={formCelda.espacio} onChange={e=>setFormCelda({...formCelda, espacio:e.target.value})}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", marginBottom:6 }}>
              <option value="">Sin espacio asignado</option>
              {espacios.map(e=><option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>
            <div style={{ fontSize:11, color:"#9E9E9E", marginBottom:16 }}>
              💡 Dejá la actividad vacía para borrar esta celda
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setCeldaEditando(null)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1.5px solid #E8ECF0", background:"#fff", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              <button onClick={guardarCelda} style={{ flex:2, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#2E7D32,#00796B)", color:"#fff", fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Panel admin — horarios y espacios */}
      {esAdmin && (
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16, marginBottom:20 }}>
          {/* Horarios */}
          <div style={{ background:"#fff", borderRadius:16, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight:800, fontSize:14, color:"#0A1628", marginBottom:12 }}>⏰ Horarios</div>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <input value={nuevoHorario} onChange={e=>setNuevoHorario(e.target.value)}
                placeholder="Ej: 08:00 - 09:00"
                onKeyDown={e=>e.key==="Enter"&&agregarHorario()}
                style={{ flex:1, padding:"9px 12px", borderRadius:9, border:"1.5px solid #E8ECF0", fontSize:13, fontFamily:"inherit" }}/>
              <button onClick={agregarHorario} style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#2E7D32,#00796B)", color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>+ Agregar</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {horarios.length===0 && <div style={{ fontSize:12, color:"#9E9E9E", textAlign:"center", padding:12 }}>Sin horarios aún</div>}
              {horarios.map(h=>(
                <div key={h.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"#F5F7FA", borderRadius:8 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>🕐 {h.label}</span>
                  <button onClick={()=>eliminarHorario(h.id)} style={{ background:"none", border:"none", color:"#C62828", cursor:"pointer", fontSize:14 }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>

          {/* Espacios */}
          <div style={{ background:"#fff", borderRadius:16, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight:800, fontSize:14, color:"#0A1628", marginBottom:12 }}>📍 Espacios</div>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <input value={nuevoEspacio} onChange={e=>setNuevoEspacio(e.target.value)}
                placeholder="Ej: Salón principal, Patio..."
                onKeyDown={e=>e.key==="Enter"&&agregarEspacio()}
                style={{ flex:1, padding:"9px 12px", borderRadius:9, border:"1.5px solid #E8ECF0", fontSize:13, fontFamily:"inherit" }}/>
              <button onClick={agregarEspacio} style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#2E7D32,#00796B)", color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>+ Agregar</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {espacios.length===0 && <div style={{ fontSize:12, color:"#9E9E9E", textAlign:"center", padding:12 }}>Sin espacios aún</div>}
              {espacios.map(e=>(
                <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"#F5F7FA", borderRadius:8 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>📍 {e.nombre}</span>
                  <button onClick={()=>eliminarEspacio(e.id)} style={{ background:"none", border:"none", color:"#C62828", cursor:"pointer", fontSize:14 }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grilla semanal */}
      <div style={{ background:"#fff", borderRadius:18, padding:isMobile?10:20, boxShadow:"0 2px 10px rgba(0,0,0,0.06)", overflowX:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:6, height:24, borderRadius:3, background:"linear-gradient(#2E7D32,#00796B)" }}/>
          <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0A1628" }}>Cronograma semanal</h2>
          {esAdmin && <span style={{ fontSize:12, color:"#9E9E9E" }}>— hacé click en una celda para editar</span>}
        </div>

        {horarios.length === 0
          ? <div style={{ textAlign:"center", padding:40, color:"#9E9E9E", fontSize:13 }}>
              {esAdmin ? "Agregá horarios arriba para comenzar" : "El cronograma aún no tiene horarios cargados"}
            </div>
          : (
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
              <thead>
                <tr>
                  <th style={{ padding:"10px 14px", background:"#0A1628", color:"#fff", fontSize:12, fontWeight:700, textAlign:"left", borderRadius:"8px 0 0 0", width:120 }}>Horario</th>
                  {DIAS.map((dia, i) => (
                    <th key={dia} style={{ padding:"10px 8px", background:"#0A1628", color:"#fff", fontSize:12, fontWeight:700, textAlign:"center", borderRadius: i===6?"0 8px 0 0":"0" }}>
                      {isMobile ? dia.slice(0,3) : dia}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horarios.map((h, hi) => (
                  <tr key={h.id} style={{ background: hi%2===0 ? "#fff" : "#F9FAFB" }}>
                    <td style={{ padding:"10px 14px", fontSize:12, fontWeight:700, color:"#374151", borderRight:"2px solid #E8ECF0", whiteSpace:"nowrap" }}>
                      🕐 {h.label}
                    </td>
                    {DIAS.map(dia => {
                      const key = `${h.id}_${dia}`
                      const celda = celdas[key]
                      return (
                        <td key={dia} onClick={()=>abrirCelda(h.id, dia)}
                          style={{ padding:"8px", border:"1px solid #F0F4F8", textAlign:"center", cursor:esAdmin?"pointer":"default", verticalAlign:"top",
                            transition:"background 0.15s", minWidth:90,
                          }}
                          onMouseOver={e=>{ if(esAdmin) e.currentTarget.style.background="#E8F5E9" }}
                          onMouseOut={e=>{ e.currentTarget.style.background="" }}
                        >
                          {celda ? (
                            <div style={{ textAlign:"left" }}>
                              <div style={{ fontSize:12, fontWeight:700, color:"#0A1628" }}>{celda.actividad}</div>
                              {celda.espacio && <div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>📍 {celda.espacio}</div>}
                            </div>
                          ) : (
                            esAdmin && <span style={{ fontSize:18, color:"#E8ECF0" }}>+</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  )
}
// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
function App() {
  const [usuario, setUsuario] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [ubicacion, setUbicacion] = useState("")
  const [categoria, setCategoria] = useState("")
const [detalleCategoria, setDetalleCategoria] = useState("")
const [entreCalles, setEntreCalles] = useState("")
  const [imagen, setImagen] = useState(null)
  const [prioridad, setPrioridad] = useState("media")
  const [posicion, setPosicion] = useState(null)
  const [map, setMap] = useState(null)
  const [filtro, setFiltro] = useState("todos")
  const [seccion, setSeccion] = useState("reclamos")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [menuMobileOpen, setMenuMobileOpen] = useState(false)
  const [reclamos, setReclamos] = useState([])
  const [sugerencias, setSugerencias] = useState([])
  const [descExpandidas, setDescExpandidas] = useState({})
  const isMobile = useIsMobile()

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session){
        const { data: perfil } = await supabase.from("profiles").select("*").eq("id",session.user.id).single()
        if(perfil)setUsuario({id:session.user.id,email:session.user.email,...perfil})
      }
      setCargandoSesion(false)
    })
  },[])

  useEffect(()=>{ if(usuario)cargarReclamos() },[usuario])

  async function cargarReclamos() {
    const { data } = await supabase.from("reclamos").select("*").order("fecha",{ascending:false})
    if(data)setReclamos(data.map(r=>({...r,posicion:r.posicion_lat&&r.posicion_lng?{lat:r.posicion_lat,lng:r.posicion_lng}:null})))
  }

  if(cargandoSesion) return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0A1628,#1B3A2D)" }}>
      <div style={{ color:"#fff",fontSize:16 }}>⏳ Cargando...</div>
    </div>
  )

  if(!usuario) return <PantallaLogin onLogin={u=>setUsuario(u)}/>

  const esAdmin = usuario.rol==="admin"

  async function cerrarSesion() { await supabase.auth.signOut(); setUsuario(null) }

  function irA(id) { setSeccion(id); setMenuMobileOpen(false) }
  function toggleDescripcion(id) { setDescExpandidas(prev => ({ ...prev, [id]: !prev[id] })) }

 async function agregar() {
    if(!titulo||!ubicacion||!categoria){ alert("Completá título, ubicación y categoría"); return }
    if(categoria==="luz"&&!detalleCategoria){ alert("Seleccioná el tipo de poste"); return }
    if(categoria==="calle"&&!detalleCategoria){ alert("Seleccioná el tipo de superficie"); return }
    if(categoria==="microbasural"&&!entreCalles){ alert("Ingresá entre qué calles"); return }
    await supabase.from("reclamos").insert({id:getId(),titulo,descripcion,ubicacion,imagen,posicion_lat:posicion?.lat||null,posicion_lng:posicion?.lng||null,estado:"pendiente",prioridad,fecha:hoy(),categoria,detalle_categoria:detalleCategoria,entre_calles:entreCalles})
    setTitulo(""); setDescripcion(""); setUbicacion(""); setPosicion(null); setImagen(null); setCategoria(""); setDetalleCategoria(""); setEntreCalles("")
    cargarReclamos()
  }

  async function borrar(id) { if(window.confirm("¿Eliminás este reclamo?")){await supabase.from("reclamos").delete().eq("id",id);cargarReclamos()} }
  async function toggle(id,estadoActual) { await supabase.from("reclamos").update({estado:estadoActual==="pendiente"?"resuelto":"pendiente"}).eq("id",id);cargarReclamos() }

  const pendientes = reclamos.filter(r=>r.estado==="pendiente")
  const resueltos  = reclamos.filter(r=>r.estado==="resuelto")
  const filtrados  = reclamos.filter(r=>filtro==="todos"?true:r.estado===filtro)

  const navItems = [
    {id:"reclamos",icon:"📋",label:"Reclamos"},
    {id:"mapa",icon:"🗺️",label:"Mapa"},
    {id:"socios",icon:"🪪",label:"Socios",soloAdmin:true},
    {id:"pagos",icon:"💰",label:"Pagos",soloAdmin:true},
    {id:"perfil",icon:"👤",label:"Mi perfil"},
    {id:"mis-pagos",icon:"💳",label:"Mis pagos"},
    {id:"cronograma", icon:"🗓️", label:"Cronograma"},
    {id:"avisos",icon:"📢",label:"Avisos"},
    {id:"mensajes",icon:"✉️",label:"Mensajes"},
    {id:"admin",icon:"⚙️",label:"Admin",soloAdmin:true},
  ].filter(it=>!it.soloAdmin||esAdmin)

  const sidebarW = sidebarOpen ? 220 : 64

  return (
    <div className="app-layout">
      {isMobile && (
        <div className={`sidebar-overlay${menuMobileOpen?" visible":""}`} onClick={()=>setMenuMobileOpen(false)}/>
      )}
      <div className={`sidebar${isMobile&&menuMobileOpen?" open":""}`} style={{ width: isMobile ? 220 : sidebarW }}>
        <div style={{ padding:"22px 14px 18px",borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <Logo size={34}/>
            <div>
              <div style={{ fontSize:13,fontWeight:800,color:"#fff",letterSpacing:-0.3 }}>Conecta Barrio</div>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:0.5 }}>LAS HERAS</div>
            </div>
          </div>
        </div>
        <div style={{ flex:1,padding:"10px 8px",overflowY:"auto" }}>
          {navItems.map(it=>(
            <button key={it.id} onClick={()=>irA(it.id)} style={{ width:"100%",padding:"12px 10px",borderRadius:10,border:"none",background:seccion===it.id?"rgba(76,175,80,0.18)":"none",color:seccion===it.id?"#66BB6A":"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:4,fontWeight:seccion===it.id?700:400,fontSize:14,fontFamily:"inherit",textAlign:"left",borderLeft:seccion===it.id?"3px solid #66BB6A":"3px solid transparent" }}>
              <span style={{ fontSize:20,flexShrink:0 }}>{it.icon}</span>
              <span>{it.label}</span>
            </button>
          ))}
        </div>
        <div style={{ padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize:12,fontWeight:700,color:"#fff" }}>{usuario.nombre}</div>
          <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)" }}>{esAdmin?"⚙️ Administrador":"👤 Socio"}</div>
        </div>
        <button onClick={cerrarSesion} style={{ margin:"0 8px 6px",padding:10,borderRadius:8,border:"none",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:13,fontFamily:"inherit",textAlign:"left" }}>
          🚪 Cerrar sesión
        </button>
        {!isMobile && (
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ margin:"0 8px 14px",padding:8,borderRadius:8,border:"none",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:14 }}>
            {sidebarOpen?"◀":"▶"}
          </button>
        )}
      </div>

      <div className="main-content" style={{ marginLeft: isMobile ? 0 : sidebarW }}>
        <div className="topbar">
          <div style={{ display:"flex",alignItems:"center",gap:4 }}>
            <button className="hamburger-btn" onClick={()=>setMenuMobileOpen(!menuMobileOpen)}>
              <span/><span/><span/>
            </button>
            <div>
              <div style={{ fontSize:isMobile?15:18,fontWeight:900,color:"#0A1628",letterSpacing:-0.5 }}>Panel Comunitario</div>
              <div className="topbar-sub" style={{ fontSize:11,color:"#9E9E9E",marginTop:2 }}>Soc. de Fomento Barrio Las Heras</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <span className="topbar-date" style={{ fontSize:11,color:"#9E9E9E" }}>{new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</span>
            <Campanita usuario={usuario}/>
            <div style={{ width:32,height:32,borderRadius:16,background:"linear-gradient(135deg,#2E7D32,#00796B)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:13,flexShrink:0 }}>
              {usuario.nombre?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="main-scroll">
          {(seccion==="reclamos"||seccion==="admin")&&(
            <div className="grid-stats">
              {[
                {icon:"📋",value:reclamos.length,label:"Reclamos totales",color:"#1565C0",bg:"#E3F2FD"},
                {icon:"⏳",value:pendientes.length,label:"Pendientes",color:"#E65100",bg:"#FFF3E0"},
                {icon:"✅",value:resueltos.length,label:"Resueltos",color:"#2E7D32",bg:"#E8F5E9"},
              ].map((s,i)=>(
                <div key={i} style={{ background:"#fff",borderRadius:14,padding:"14px 16px",borderTop:`3px solid ${s.color}`,boxShadow:"0 2px 10px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:12 }}>
                  <div style={{ width:40,height:40,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize:22,fontWeight:900,color:s.color,lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:11,color:"#9E9E9E",marginTop:3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {seccion==="reclamos"&&(
            <div className="grid-2">
              <div style={{ background:"#fff",borderRadius:18,padding:isMobile?14:22,boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
                  <div style={{ width:5,height:22,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
                  <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Nuevo reclamo</h2>
                </div>
               
<div style={{ position:"relative",marginBottom:10 }}>
  <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15 }}>📍</span>
  <input value={ubicacion} onChange={e=>setUbicacion(e.target.value)} placeholder="Calle y número" style={{ width:"100%",padding:"10px 14px 10px 36px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",color:"#0A1628" }}/>
</div>
<div style={{ marginBottom:10 }}>
  <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:6,letterSpacing:0.5 }}>CATEGORÍA</div>
  <select value={categoria} onChange={e=>{ setCategoria(e.target.value); setDetalleCategoria(""); setEntreCalles(""); setTitulo(e.target.options[e.target.selectedIndex].text) }} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",background:"#fff",color:"#0A1628" }}>
    <option value="">Seleccioná una categoría...</option>
    <option value="luz">Iluminación</option>
    <option value="calle">Estado de calles</option>
    <option value="microbasural">Microbasural</option>
    <option value="otros">Otros</option>
  </select>
</div>
{categoria==="luz"&&(
  <div style={{ marginBottom:10 }}>
    <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:6,letterSpacing:0.5 }}>TIPO DE POSTE</div>
    <select value={detalleCategoria} onChange={e=>setDetalleCategoria(e.target.value)} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",background:"#fff",color:"#0A1628" }}>
      <option value="">Seleccioná el tipo de poste...</option>
      <option value="madera">Madera</option>
      <option value="hormigon">Hormigón</option>
    </select>
  </div>
)}
{categoria==="calle"&&(
  <div style={{ marginBottom:10 }}>
    <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:6,letterSpacing:0.5 }}>TIPO DE SUPERFICIE</div>
    <select value={detalleCategoria} onChange={e=>setDetalleCategoria(e.target.value)} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",background:"#fff",color:"#0A1628" }}>
      <option value="">Seleccioná el tipo de superficie...</option>
      <option value="asfalto">Asfalto</option>
      <option value="tierra">Tierra</option>
      <option value="piedra">Piedra</option>
    </select>
  </div>
)}
{categoria==="microbasural"&&(
  <div style={{ marginBottom:10 }}>
    <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:6,letterSpacing:0.5 }}>ENTRE CALLES</div>
    <input value={entreCalles} onChange={e=>setEntreCalles(e.target.value)} placeholder="Ej: Pellegrini y San Martín" style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",color:"#0A1628" }}/>
  </div>
)}
<textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} placeholder="Descripción del problema..." rows={3} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",resize:"none",marginBottom:10,color:"#0A1628" }}/>
<div style={{ marginBottom:10 }}>
  <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:6,letterSpacing:0.5 }}>PRIORIDAD</div>
  <select value={prioridad} onChange={e=>setPrioridad(e.target.value)} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E8ECF0",fontSize:14,fontFamily:"inherit",background:"#fff",color:"#0A1628" }}>
    <option value="alta">🔴 Alta</option>
    <option value="media">🟠 Media</option>
    <option value="baja">🟢 Baja</option>
  </select>
</div>
<label style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderRadius:10,border:"1.5px dashed #CBD5E1",cursor:"pointer",marginBottom:12,color:"#9E9E9E",fontSize:13 }}>
  📷 {imagen?"✅ Foto cargada":"Adjuntar foto (opcional)"}
  <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0];if(f){const r=new FileReader();r.onloadend=()=>setImagen(r.result);r.readAsDataURL(f)} }}/>
</label>
<div style={{ marginBottom:12 }}>
  <div style={{ fontSize:11,fontWeight:700,color:"#9E9E9E",marginBottom:6,letterSpacing:0.5 }}>UBICACIÓN EN MAPA (opcional)</div>
  <div style={{ borderRadius:12,overflow:"hidden",border:"1.5px solid #E8ECF0" }}>
    <MapContainer center={[-38.0055,-57.5426]} zoom={13} style={{ height:isMobile?180:220,width:"100%" }} whenCreated={setMap}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <MapClick setPosicion={setPosicion} setUbicacion={setUbicacion}/>
      {posicion&&<Marker position={[posicion.lat,posicion.lng]} icon={iconPendiente}><Popup>Ubicación seleccionada</Popup></Marker>}
      {reclamos.filter(r=>r.posicion).map(r=><Marker key={r.id} position={[r.posicion.lat,r.posicion.lng]} icon={r.estado==="pendiente"?iconPendiente:iconResuelto}><Popup><b>{r.titulo}</b><br/>{r.descripcion}</Popup></Marker>)}
      
    </MapContainer>
  </div>
</div>
                <button onClick={agregar} style={{ width:"100%",padding:"12px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#2E7D32,#00796B)",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(46,125,50,0.35)" }}>➕ Crear reclamo</button>
              </div>

              <div>
                <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap" }}>
                  {[["todos","Todos","#1565C0"],["pendiente","Pendientes","#E65100"],["resuelto","Resueltos","#2E7D32"]].map(([val,label,col])=>(
                    <button key={val} onClick={()=>setFiltro(val)} style={{ padding:"6px 14px",borderRadius:18,border:"none",background:filtro===val?col:"#fff",color:filtro===val?"#fff":"#9E9E9E",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",boxShadow:filtro===val?`0 4px 12px ${col}44`:"0 2px 6px rgba(0,0,0,0.06)" }}>{label}</button>
                  ))}
                  <span style={{ fontSize:12,color:"#9E9E9E",alignSelf:"center",marginLeft:"auto" }}>{filtrados.length} reclamos</span>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  {filtrados.length===0&&<div style={{ textAlign:"center",padding:36,color:"#9E9E9E",background:"#fff",borderRadius:14,fontSize:13 }}>Sin reclamos</div>}
                  {filtrados.map(r=>(
                    <div key={r.id} style={{ background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",borderLeft:`5px solid ${prioColor(r.prioridad)}` }}>
                      {r.imagen&&<img src={r.imagen} alt="" style={{ width:"100%",height:130,objectFit:"cover" }}/>}
                      <div style={{ padding:isMobile?12:16 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:8 }}>
                          <div style={{ minWidth:0 }}>
                            <h3 style={{ margin:0,fontSize:14,fontWeight:800,color:"#0A1628",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.titulo}</h3>
                            <div style={{ fontSize:11,color:"#9E9E9E",marginTop:2 }}>📍 {r.ubicacion}</div>
                          </div>
                          {estadoBadge(r.estado)}
                        </div>
                        <p style={{ margin:"0 0 4px",fontSize:13,color:"#6B7280",lineHeight:1.5,display:descExpandidas[r.id]?"block":"-webkit-box",WebkitLineClamp:descExpandidas[r.id]?"unset":2,WebkitBoxOrient:"vertical",overflow:descExpandidas[r.id]?"visible":"hidden" }}>{r.descripcion}</p>
                        {r.descripcion&&r.descripcion.length>80&&(
                          <button onClick={()=>toggleDescripcion(r.id)} style={{ background:"none",border:"none",padding:0,color:"#1565C0",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:8 }}>
                            {descExpandidas[r.id]?"Ver menos":"Ver más"}
                          </button>
                        )}
                        <div style={{ display:"flex",flexWrap:"wrap",alignItems:"center",gap:6,marginBottom:10 }}>
                          <span style={{ fontSize:11,fontWeight:700,color:"#1565C0",background:"#E3F2FD",padding:"3px 10px",borderRadius:20 }}>
                           🏷️ {
                              r.categoria==="luz" ? `Tipo de poste: ${r.detalle_categoria==="madera"?"Madera":r.detalle_categoria==="hormigon"?"Hormigón":"Sin especificar"}` :
                              r.categoria==="calle" ? `Superficie: ${r.detalle_categoria==="asfalto"?"Asfalto":r.detalle_categoria==="tierra"?"Tierra":r.detalle_categoria==="piedra"?"Piedra":"Sin especificar"}` :
                              r.categoria==="microbasural" ? "Categoría: Microbasural" :
                              "Categoría: Otros"
                            }
                          </span>
                          {r.entre_calles&&(
                            <span style={{ fontSize:11,fontWeight:700,color:"#6B7280",background:"#F5F7FA",padding:"3px 10px",borderRadius:20 }}>
                              📍 Entre: {r.entre_calles}
                            </span>
                          )}
                          <span style={{ fontSize:11,fontWeight:700,color:prioColor(r.prioridad),background:prioColor(r.prioridad)+"15",padding:"3px 10px",borderRadius:20 }}>{prioIcon(r.prioridad)} Prioridad: {r.prioridad}</span>
                          <span style={{ fontSize:11,color:"#9E9E9E",marginLeft:"auto" }}>{r.fecha}</span>
                        </div>
                        <div style={{ display:"flex",gap:8 }}>
                          {esAdmin&&<button onClick={()=>toggle(r.id,r.estado)} style={{ flex:1,padding:"7px 0",borderRadius:8,border:"none",background:r.estado==="pendiente"?"linear-gradient(135deg,#2E7D32,#00796B)":"linear-gradient(135deg,#E65100,#F57C00)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>{r.estado==="pendiente"?"✅ Resolver":"↩ Reabrir"}</button>}
                          {r.posicion&&<button onClick={()=>{setSeccion("mapa");setTimeout(()=>{if(map)map.flyTo([r.posicion.lat,r.posicion.lng],17)},300)}} style={{ flex:1,padding:"7px 0",borderRadius:8,border:"1.5px solid #E8ECF0",background:"#fff",color:"#1565C0",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>🗺️ Mapa</button>}
                          {esAdmin&&<button onClick={()=>borrar(r.id)} style={{ padding:"7px 12px",borderRadius:8,border:"1.5px solid #FFCDD2",background:"#FFF5F5",color:"#C62828",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>🗑️</button>}
                        </div>
                        <SeccionComentarios reclamoId={r.id} usuario={usuario}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {seccion==="mapa"&&(
            <div style={{ background:"#fff",borderRadius:18,padding:isMobile?14:22,boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap" }}>
                <div style={{ width:5,height:22,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
                <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Mapa del barrio</h2>
                <div style={{ display:"flex",gap:12,marginLeft:4 }}>
                  {[["🟠","Pendiente"],["🟢","Resuelto"]].map(([ic,l])=><span key={l} style={{ fontSize:12,color:"#6B7280" }}>{ic} {l}</span>)}
                </div>
              </div>
              <div style={{ borderRadius:12,overflow:"hidden",border:"1.5px solid #E8ECF0" }}>
                <MapContainer center={[-38.0055,-57.5426]} zoom={13} style={{ height:isMobile?350:520,width:"100%" }} whenCreated={setMap}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                  {reclamos.filter(r=>r.posicion).map(r=>(
                    <Marker key={r.id} position={[r.posicion.lat,r.posicion.lng]} icon={r.estado==="pendiente"?iconPendiente:iconResuelto}>
                      <Popup><b>{r.titulo}</b><br/>{r.descripcion}<br/><small>📍 {r.ubicacion}</small></Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}

          {seccion==="socios"&&esAdmin&&<SeccionSocios usuario={usuario} esAdmin={esAdmin}/>}
          {seccion==="avisos"&&<SeccionAvisos usuario={usuario} esAdmin={esAdmin}/>}
          {seccion==="mensajes"&&<SeccionMensajes usuario={usuario} esAdmin={esAdmin}/>}
          {seccion==="perfil"&&<SeccionPerfil usuario={usuario} setUsuario={setUsuario}/>}
          {seccion==="mis-pagos"&&<MisPagos userId={usuario.id} cuotaAlDia={usuario.cuota_al_dia}/>}
          {seccion==="pagos"&&esAdmin&&<SeccionPagos usuario={usuario}/>}
          {seccion==="cronograma"&&<SeccionCronograma usuario={usuario} esAdmin={esAdmin}/>}

          {seccion==="admin"&&esAdmin&&(
            <div style={{ background:"#fff",borderRadius:18,padding:isMobile?14:22,boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18 }}>
                <div style={{ width:5,height:22,borderRadius:3,background:"linear-gradient(#2E7D32,#00796B)" }}/>
                <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:"#0A1628" }}>Administración</h2>
              </div>
              <div className="grid-admin" style={{ marginBottom:20 }}>
                {[
                  {icon:"📋",label:"Total reclamos",value:reclamos.length,col:"#1565C0"},
                  {icon:"⏳",label:"Pendientes",value:pendientes.length,col:"#E65100"},
                  {icon:"✅",label:"Resueltos",value:resueltos.length,col:"#2E7D32"},
                  {icon:"🔴",label:"Alta",value:reclamos.filter(r=>r.prioridad==="alta").length,col:"#E53935"},
                  {icon:"🟠",label:"Media",value:reclamos.filter(r=>r.prioridad==="media").length,col:"#F57C00"},
                  {icon:"🟢",label:"Baja",value:reclamos.filter(r=>r.prioridad==="baja").length,col:"#2E7D32"},
                ].map((s,i)=>(
                  <div key={i} style={{ background:"#F5F7FA",borderRadius:12,padding:"14px 12px",borderTop:`3px solid ${s.col}`,textAlign:"center" }}>
                    <div style={{ fontSize:22 }}>{s.icon}</div>
                    <div style={{ fontSize:20,fontWeight:900,color:s.col,marginTop:6 }}>{s.value}</div>
                    <div style={{ fontSize:11,color:"#9E9E9E",marginTop:3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontWeight:800,fontSize:14,color:"#0A1628",marginBottom:12 }}>Todos los reclamos</div>
              <div className="tabla-desktop">
                <table style={{ width:"100%",borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"#F5F7FA" }}>
                    {["Título","Ubicación","Prioridad","Estado","Fecha","Acción"].map(h=><th key={h} style={{ textAlign:"left",padding:"10px 12px",fontSize:11,color:"#9E9E9E",fontWeight:700 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {reclamos.length===0&&<tr><td colSpan={6} style={{ textAlign:"center",padding:28,color:"#9E9E9E" }}>Sin reclamos</td></tr>}
                    {reclamos.map(r=>(
                      <tr key={r.id} style={{ borderBottom:"1px solid #F0F4F8" }}>
                        <td style={{ padding:"10px 12px",fontSize:13,fontWeight:600,color:"#0A1628" }}>{r.titulo}</td>
                        <td style={{ padding:"10px 12px",fontSize:12,color:"#9E9E9E" }}>{r.ubicacion}</td>
                        <td style={{ padding:"10px 12px" }}><span style={{ fontSize:12,fontWeight:700,color:prioColor(r.prioridad) }}>{prioIcon(r.prioridad)} {r.prioridad}</span></td>
                        <td style={{ padding:"10px 12px" }}>{estadoBadge(r.estado)}</td>
                        <td style={{ padding:"10px 12px",fontSize:11,color:"#9E9E9E" }}>{r.fecha}</td>
                        <td style={{ padding:"10px 12px" }}>
                          <div style={{ display:"flex",gap:6 }}>
                            <button onClick={()=>toggle(r.id,r.estado)} style={{ padding:"4px 10px",borderRadius:6,border:"none",background:r.estado==="pendiente"?"#E8F5E9":"#FFF3E0",color:r.estado==="pendiente"?"#2E7D32":"#E65100",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{r.estado==="pendiente"?"Resolver":"Reabrir"}</button>
                            <button onClick={()=>borrar(r.id)} style={{ padding:"4px 10px",borderRadius:6,border:"none",background:"#FFEBEE",color:"#C62828",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Borrar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cards-mobile">
                {reclamos.map(r=>(
                  <div key={r.id} style={{ background:"#F5F7FA",borderRadius:12,padding:14,borderLeft:`4px solid ${prioColor(r.prioridad)}` }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,gap:8 }}>
                      <div style={{ fontWeight:700,fontSize:14,color:"#0A1628",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.titulo}</div>
                      {estadoBadge(r.estado)}
                    </div>
                    <div style={{ fontSize:12,color:"#9E9E9E",marginBottom:8 }}>📍 {r.ubicacion} · {r.fecha}</div>
                    <div style={{ display:"flex",gap:8 }}>
                      <button onClick={()=>toggle(r.id,r.estado)} style={{ flex:1,padding:"7px 0",borderRadius:8,border:"none",background:r.estado==="pendiente"?"#E8F5E9":"#FFF3E0",color:r.estado==="pendiente"?"#2E7D32":"#E65100",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{r.estado==="pendiente"?"Resolver":"Reabrir"}</button>
                      <button onClick={()=>borrar(r.id)} style={{ padding:"7px 12px",borderRadius:8,border:"none",background:"#FFEBEE",color:"#C62828",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
