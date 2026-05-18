import "./App.css"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { supabase } from "./supabase"

// ── LOGO ─────────────────────────────────────────────────────────────────────
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

// ── ICONOS MAPA ───────────────────────────────────────────────────────────────
const iconPendiente = new L.Icon({ iconUrl: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png", iconSize: [32,32] })
const iconResuelto  = new L.Icon({ iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",  iconSize: [32,32] })

function MapClick({ setPosicion }) {
  useMapEvents({ click(e) { setPosicion({ lat: e.latlng.lat, lng: e.latlng.lng }) } })
  return null
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const prioColor = p => p === "alta" ? "#E53935" : p === "media" ? "#F57C00" : "#2E7D32"
const prioIcon  = p => p === "alta" ? "🔴" : p === "media" ? "🟠" : "🟢"
const estadoBadge = estado => {
  const isPend = estado === "pendiente"
  return (
    <span style={{
      background: isPend ? "#FFF3E0" : "#E8F5E9",
      color: isPend ? "#E65100" : "#2E7D32",
      border: `1px solid ${isPend ? "#FFB74D" : "#81C784"}`,
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, textTransform: "capitalize"
    }}>{isPend ? "⏳ Pendiente" : "✅ Resuelto"}</span>
  )
}

const getId = () => Date.now() + Math.random().toString(36).slice(2)
const hoy = () => new Date().toLocaleString("es-AR")

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function PantallaLogin({ onLogin }) {
  const [modo, setModo] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  async function handleLogin() {
    setCargando(true)
    setError("")
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError("Email o contraseña incorrectos"); setCargando(false); return }
    const { data: perfil } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()
    onLogin({ id: data.user.id, email: data.user.email, ...perfil })
    setCargando(false)
  }

  async function handleRegistro() {
    if (!nombre || !email || !password) return setError("Completá todos los campos")
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres")
    setCargando(true)
    setError("")
    const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true })
    const rol = count === 0 ? "admin" : "socio"
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setCargando(false); return }
    await supabase.from("profiles").insert({
      id: data.user.id, nombre, rol, cuota_al_dia: false, fecha_registro: hoy()
    })
    onLogin({ id: data.user.id, email, nombre, rol, cuota_al_dia: false })
    setCargando(false)
  }

  return (
    <div style={{
      minHeight:"100vh", background:"linear-gradient(135deg,#0A1628 0%,#1B3A2D 100%)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20
    }}>
      <div style={{
        background:"#fff", borderRadius:24, padding:"40px 36px",
        width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
            <Logo size={72}/>
          </div>
          <div style={{ fontSize:26, fontWeight:900, color:"#0A1628", letterSpacing:-0.5 }}>Conecta Barrio</div>
          <div style={{ fontSize:13, color:"#9E9E9E", marginTop:4 }}>Sociedad de Fomento Barrio Las Heras</div>
        </div>

        <div style={{ display:"flex", background:"#F5F7FA", borderRadius:12, padding:4, marginBottom:24 }}>
          {[["login","Iniciar sesión"],["registro","Registrarse"]].map(([val,label]) => (
            <button key={val} onClick={() => { setModo(val); setError("") }} style={{
              flex:1, padding:"9px 0", borderRadius:9, border:"none",
              background: modo===val ? "#fff" : "none",
              color: modo===val ? "#0A1628" : "#9E9E9E",
              fontWeight: modo===val ? 700 : 500, fontSize:14,
              cursor:"pointer", fontFamily:"inherit",
              boxShadow: modo===val ? "0 2px 8px rgba(0,0,0,0.08)" : "none"
            }}>{label}</button>
          ))}
        </div>

        {modo === "registro" && (
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="👤 Nombre completo"
            style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", marginBottom:12, boxSizing:"border-box" }}
          />
        )}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="📧 Correo electrónico" type="email"
          style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", marginBottom:12, boxSizing:"border-box" }}
        />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="🔒 Contraseña" type="password"
          onKeyDown={e => e.key==="Enter" && (modo==="login" ? handleLogin() : handleRegistro())}
          style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", marginBottom:16, boxSizing:"border-box" }}
        />

        {error && <div style={{ background:"#FFEBEE", color:"#C62828", padding:"10px 14px", borderRadius:10, fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}

        <button onClick={modo==="login" ? handleLogin : handleRegistro} disabled={cargando} style={{
          width:"100%", padding:"14px 0", borderRadius:12, border:"none",
          background:"linear-gradient(135deg,#2E7D32,#00796B)",
          color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer",
          fontFamily:"inherit", boxShadow:"0 4px 14px rgba(46,125,50,0.35)",
          opacity: cargando ? 0.7 : 1
        }}>{cargando ? "⏳ Cargando..." : (modo==="login" ? "Entrar al barrio 🏘️" : "Crear cuenta")}</button>

        {modo==="registro" && (
          <div style={{ fontSize:11, color:"#9E9E9E", textAlign:"center", marginTop:12 }}>
            💡 El primer usuario registrado será administrador
          </div>
        )}
        <div style={{ textAlign:"center", marginTop:16, fontSize:12, color:"#9E9E9E" }}>Juntos hacemos un barrio mejor 💚</div>
      </div>
    </div>
  )
}

// ── SECCIÓN SOCIOS ────────────────────────────────────────────────────────────
function SeccionSocios({ usuario, esAdmin }) {
  const [socios, setSocios] = useState([])
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase.from("profiles").select("*")
    if (data) setSocios(data)
  }

  async function toggleCuota(id, actual) {
    if (!esAdmin) return
    await supabase.from("profiles").update({ cuota_al_dia: !actual }).eq("id", id)
    cargar()
  }

  async function toggleAdmin(id, rolActual) {
    if (!esAdmin) return
    await supabase.from("profiles").update({ rol: rolActual === "admin" ? "socio" : "admin" }).eq("id", id)
    cargar()
  }

  const filtrados = socios.filter(s =>
    s.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.email?.toLowerCase().includes(busqueda.toLowerCase())
  )
  const alDia     = socios.filter(s => s.cuota_al_dia)
  const atrasados = socios.filter(s => !s.cuota_al_dia)

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        {[
          { icon:"👥", value:socios.length,    label:"Total socios",   color:"#1565C0", bg:"#E3F2FD" },
          { icon:"✅", value:alDia.length,     label:"Cuota al día",   color:"#2E7D32", bg:"#E8F5E9" },
          { icon:"⚠️", value:atrasados.length, label:"Cuota atrasada", color:"#E65100", bg:"#FFF3E0" },
        ].map((s,i) => (
          <div key={i} style={{ background:"#fff", borderRadius:16, padding:"20px 22px", borderTop:`3px solid ${s.color}`, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:30, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:13, color:"#9E9E9E", marginTop:4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:"#fff", borderRadius:18, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:6, height:24, borderRadius:3, background:"linear-gradient(#2E7D32,#00796B)" }}/>
            <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0A1628" }}>Gestión de Socios</h2>
          </div>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar..."
            style={{ padding:"8px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:13, fontFamily:"inherit", width:200 }}
          />
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#F5F7FA" }}>
              {["Nombre","Email","Rol","Cuota", esAdmin ? "Acciones" : ""].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"10px 12px", fontSize:11, color:"#9E9E9E", fontWeight:700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && <tr><td colSpan={5} style={{ textAlign:"center", padding:28, color:"#9E9E9E" }}>Sin socios registrados</td></tr>}
            {filtrados.map(s => (
              <tr key={s.id} style={{ borderBottom:"1px solid #F0F4F8" }}>
                <td style={{ padding:"11px 12px", fontSize:13, fontWeight:600, color:"#0A1628" }}>
                  {s.nombre} {s.id===usuario.id && <span style={{ fontSize:10, color:"#9E9E9E" }}>(vos)</span>}
                </td>
                <td style={{ padding:"11px 12px", fontSize:12, color:"#9E9E9E" }}>{s.email}</td>
                <td style={{ padding:"11px 12px" }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:s.rol==="admin"?"#E8EAF6":"#F5F7FA", color:s.rol==="admin"?"#3949AB":"#9E9E9E" }}>
                    {s.rol==="admin" ? "⚙️ Admin" : "👤 Socio"}
                  </span>
                </td>
                <td style={{ padding:"11px 12px" }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:s.cuota_al_dia?"#E8F5E9":"#FFF3E0", color:s.cuota_al_dia?"#2E7D32":"#E65100" }}>
                    {s.cuota_al_dia ? "✅ Al día" : "⚠️ Atrasada"}
                  </span>
                </td>
                {esAdmin && (
                  <td style={{ padding:"11px 12px" }}>
                    {s.id !== usuario.id && (
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => toggleCuota(s.id, s.cuota_al_dia)} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:s.cuota_al_dia?"#FFF3E0":"#E8F5E9", color:s.cuota_al_dia?"#E65100":"#2E7D32", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                          {s.cuota_al_dia ? "Marcar atrasada" : "Marcar al día"}
                        </button>
                        <button onClick={() => toggleAdmin(s.id, s.rol)} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:"#E8EAF6", color:"#3949AB", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                          {s.rol==="admin" ? "Quitar admin" : "Hacer admin"}
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── SECCIÓN AVISOS ────────────────────────────────────────────────────────────
function SeccionAvisos({ usuario, esAdmin }) {
  const [avisos, setAvisos] = useState([])
  const [titulo, setTitulo] = useState("")
  const [contenido, setContenido] = useState("")

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase.from("avisos").select("*").order("fecha", { ascending: false })
    if (data) setAvisos(data)
  }

  async function publicar() {
    if (!titulo || !contenido) return
    await supabase.from("avisos").insert({ id: getId(), titulo, contenido, autor: usuario.nombre, fecha: hoy() })
    setTitulo(""); setContenido("")
    cargar()
    // Enviar email a todos los socios
    await supabase.functions.invoke("enviar-notificacion", {
      body: {
        tipo: "aviso",
        destinatarios: [usuario.email],
        asunto: `📢 Nuevo aviso: ${titulo}`,
        contenido: `<h3>${titulo}</h3><p>${contenido}</p><p>— ${usuario.nombre}</p>`
      }
    })
  }

  async function borrarAviso(id) {
    await supabase.from("avisos").delete().eq("id", id)
    cargar()
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns: esAdmin ? "1fr 1.6fr" : "1fr", gap:20 }}>
      {esAdmin && (
        <div style={{ background:"#fff", borderRadius:18, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", alignSelf:"start" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div style={{ width:6, height:24, borderRadius:3, background:"linear-gradient(#2E7D32,#00796B)" }}/>
            <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0A1628" }}>Publicar aviso</h2>
          </div>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="📢 Título del aviso"
            style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", marginBottom:12, boxSizing:"border-box" }}
          />
          <textarea value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Escribí el contenido..." rows={5}
            style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", marginBottom:14, boxSizing:"border-box", resize:"none" }}
          />
          <button onClick={publicar} style={{ width:"100%", padding:"12px 0", borderRadius:12, border:"none", background:"linear-gradient(135deg,#2E7D32,#00796B)", color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
            📢 Publicar aviso
          </button>
        </div>
      )}
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:6, height:24, borderRadius:3, background:"linear-gradient(#2E7D32,#00796B)" }}/>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0A1628" }}>Avisos del barrio</h2>
        </div>
        {avisos.length === 0 && <div style={{ background:"#fff", borderRadius:16, padding:40, textAlign:"center", color:"#9E9E9E" }}>No hay avisos publicados aún</div>}
        {avisos.map(a => (
          <div key={a.id} style={{ background:"#fff", borderRadius:16, padding:20, marginBottom:12, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", borderLeft:"5px solid #2E7D32" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ fontWeight:800, fontSize:15, color:"#0A1628", marginBottom:6 }}>📢 {a.titulo}</div>
              {esAdmin && <button onClick={() => borrarAviso(a.id)} style={{ padding:"3px 10px", borderRadius:6, border:"none", background:"#FFEBEE", color:"#C62828", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>🗑️</button>}
            </div>
            <p style={{ fontSize:14, color:"#6B7280", lineHeight:1.6, margin:"0 0 10px" }}>{a.contenido}</p>
            <div style={{ fontSize:11, color:"#9E9E9E" }}>Por {a.autor} · {a.fecha}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SECCIÓN MENSAJES ──────────────────────────────────────────────────────────
function SeccionMensajes({ usuario, esAdmin }) {
  const [socios, setSocios] = useState([])
  const [destinatario, setDestinatario] = useState(null)
  const [texto, setTexto] = useState("")
  const [mensajes, setMensajes] = useState([])

  useEffect(() => { cargarSocios() }, [])
  useEffect(() => { cargarMensajes() }, [destinatario])

  async function cargarSocios() {
    const { data } = await supabase.from("profiles").select("*")
    if (data) setSocios(data.filter(u => u.id !== usuario.id))
  }

  async function cargarMensajes() {
    if (esAdmin && !destinatario) return
    let query = supabase.from("mensajes").select("*").order("fecha", { ascending: true })
    if (esAdmin && destinatario) {
      query = query.or(`and(de_id.eq.${usuario.id},para_id.eq.${destinatario.id}),and(de_id.eq.${destinatario.id},para_id.eq.${usuario.id})`)
    } else {
      query = query.or(`de_id.eq.${usuario.id},para_id.eq.${usuario.id}`)
    }
    const { data } = await query
    if (data) setMensajes(data)
  }

  async function enviar() {
    if (!texto.trim()) return
    if (esAdmin && !destinatario) return
    await supabase.from("mensajes").insert({
      id: getId(),
      de_id: usuario.id,
      de_nombre: usuario.nombre,
      para_id: esAdmin ? destinatario.id : null,
      para_nombre: esAdmin ? destinatario.nombre : "Todos",
      texto,
      fecha: hoy()
    })
    setTexto("")
    cargarMensajes()
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns: esAdmin ? "260px 1fr" : "1fr", gap:20 }}>
      {esAdmin && (
        <div style={{ background:"#fff", borderRadius:18, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:800, fontSize:15, color:"#0A1628", marginBottom:14 }}>Socios</div>
          {socios.length === 0 && <div style={{ fontSize:13, color:"#9E9E9E" }}>No hay socios registrados</div>}
          {socios.map(s => (
            <div key={s.id} onClick={() => setDestinatario(s)} style={{
              padding:"10px 12px", borderRadius:10, cursor:"pointer", marginBottom:6,
              background: destinatario?.id===s.id ? "#E8F5E9" : "#F5F7FA",
              borderLeft: destinatario?.id===s.id ? "3px solid #2E7D32" : "3px solid transparent"
            }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0A1628" }}>{s.nombre}</div>
              <div style={{ fontSize:11, color:"#9E9E9E" }}>{s.email}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background:"#fff", borderRadius:18, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:6, height:24, borderRadius:3, background:"linear-gradient(#2E7D32,#00796B)" }}/>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0A1628" }}>
            {esAdmin ? (destinatario ? `Mensajes con ${destinatario.nombre}` : "Seleccioná un socio") : "Mis mensajes"}
          </h2>
        </div>

        <div style={{ flex:1, overflowY:"auto", maxHeight:400, marginBottom:16, display:"flex", flexDirection:"column", gap:10 }}>
          {mensajes.length === 0 && (
            <div style={{ textAlign:"center", padding:40, color:"#9E9E9E", fontSize:14 }}>
              {esAdmin && !destinatario ? "Seleccioná un socio para ver la conversación" : "Sin mensajes"}
            </div>
          )}
          {mensajes.map(m => {
            const esMio = m.de_id === usuario.id
            return (
              <div key={m.id} style={{
                alignSelf: esMio ? "flex-end" : "flex-start",
                background: esMio ? "linear-gradient(135deg,#2E7D32,#00796B)" : "#F5F7FA",
                color: esMio ? "#fff" : "#0A1628",
                borderRadius: esMio ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding:"12px 16px", maxWidth:"70%"
              }}>
                <div style={{ fontSize:13, lineHeight:1.5 }}>{m.texto}</div>
                <div style={{ fontSize:10, opacity:0.7, marginTop:4 }}>{m.de_nombre} · {m.fecha}</div>
              </div>
            )
          })}
        </div>

        {(!esAdmin || destinatario) && (
          <div style={{ display:"flex", gap:10 }}>
            <input value={texto} onChange={e => setTexto(e.target.value)}
              placeholder="Escribí un mensaje..." onKeyDown={e => e.key==="Enter" && enviar()}
              style={{ flex:1, padding:"11px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit" }}
            />
            <button onClick={enviar} style={{ padding:"11px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#2E7D32,#00796B)", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
              Enviar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── APP ───────────────────────────────────────────────────────────────────────
function App() {
  const [usuario, setUsuario] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [ubicacion, setUbicacion] = useState("")
  const [imagen, setImagen] = useState(null)
  const [prioridad, setPrioridad] = useState("media")
  const [posicion, setPosicion] = useState(null)
  const [map, setMap] = useState(null)
  const [filtro, setFiltro] = useState("todos")
  const [seccion, setSeccion] = useState("reclamos")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [reclamos, setReclamos] = useState([])

  // Verificar sesión activa al cargar
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: perfil } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
        if (perfil) setUsuario({ id: session.user.id, email: session.user.email, ...perfil })
      }
      setCargandoSesion(false)
    })
  }, [])

  // Cargar reclamos desde Supabase
  useEffect(() => {
    if (usuario) cargarReclamos()
  }, [usuario])

  async function cargarReclamos() {
    const { data } = await supabase.from("reclamos").select("*").order("fecha", { ascending: false })
    if (data) {
      setReclamos(data.map(r => ({
        ...r,
        posicion: r.posicion_lat && r.posicion_lng ? { lat: r.posicion_lat, lng: r.posicion_lng } : null
      })))
    }
  }

  if (cargandoSesion) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#0A1628 0%,#1B3A2D 100%)" }}>
      <div style={{ color:"#fff", fontSize:16 }}>⏳ Cargando...</div>
    </div>
  )

  if (!usuario) return <PantallaLogin onLogin={u => setUsuario(u)} />

  const esAdmin = usuario.rol === "admin"

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setUsuario(null)
  }

  async function agregar() {
    if (!titulo || !descripcion || !ubicacion || !posicion) {
      alert("Completá todos los campos y seleccioná la ubicación en el mapa")
      return
    }
    const nuevo = {
      id: getId(), titulo, descripcion, ubicacion, imagen,
      posicion_lat: posicion.lat, posicion_lng: posicion.lng,
      estado: "pendiente", prioridad, fecha: hoy()
    }
    await supabase.from("reclamos").insert(nuevo)
    setTitulo(""); setDescripcion(""); setUbicacion(""); setPosicion(null); setImagen(null)
    cargarReclamos()
  }

  async function borrar(id) {
    if (window.confirm("¿Eliminás este reclamo?")) {
      await supabase.from("reclamos").delete().eq("id", id)
      cargarReclamos()
    }
  }

  async function toggle(id, estadoActual) {
    await supabase.from("reclamos").update({ estado: estadoActual === "pendiente" ? "resuelto" : "pendiente" }).eq("id", id)
    cargarReclamos()
  }

  const pendientes = reclamos.filter(r => r.estado==="pendiente")
  const resueltos  = reclamos.filter(r => r.estado==="resuelto")
  const filtrados  = reclamos.filter(r => filtro==="todos" ? true : r.estado===filtro)

  const navItems = [
    { id:"reclamos", icon:"📋", label:"Reclamos" },
    { id:"mapa",     icon:"🗺️", label:"Mapa" },
    { id:"socios",   icon:"🪪", label:"Socios", soloAdmin:true },
    { id:"avisos",   icon:"📢", label:"Avisos" },
    { id:"mensajes", icon:"✉️", label:"Mensajes" },
    { id:"admin",    icon:"⚙️", label:"Administración", soloAdmin:true },
  ]

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Segoe UI', system-ui, sans-serif", background:"#F0F4F8" }}>

      {/* SIDEBAR */}
      <div style={{ width:sidebarOpen?220:64, flexShrink:0, background:"linear-gradient(180deg,#0A1628 0%,#1B3A2D 100%)", display:"flex", flexDirection:"column", transition:"width 0.3s ease", overflow:"hidden", boxShadow:"4px 0 20px rgba(0,0,0,0.2)" }}>
        <div style={{ padding:"24px 16px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Logo size={36}/>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>Conecta Barrio</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:0.5 }}>LAS HERAS</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex:1, padding:"12px 8px" }}>
          {navItems.filter(it => !it.soloAdmin || esAdmin).map(it => (
            <button key={it.id} onClick={() => setSeccion(it.id)} style={{
              width:"100%", padding:"10px 10px", borderRadius:10, border:"none",
              background: seccion===it.id ? "rgba(76,175,80,0.18)" : "none",
              color: seccion===it.id ? "#66BB6A" : "rgba(255,255,255,0.6)",
              display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:4,
              fontWeight: seccion===it.id ? 700 : 400, fontSize:13, fontFamily:"inherit",
              textAlign:"left", borderLeft: seccion===it.id ? "3px solid #66BB6A" : "3px solid transparent"
            }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{it.icon}</span>
              {sidebarOpen && <span>{it.label}</span>}
            </button>
          ))}
        </div>

        {sidebarOpen && (
          <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{usuario.nombre}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{esAdmin ? "⚙️ Administrador" : "👤 Socio"}</div>
          </div>
        )}

        <button onClick={cerrarSesion} style={{ margin:"0 8px 8px", padding:8, borderRadius:8, border:"none", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
          {sidebarOpen ? "🚪 Cerrar sesión" : "🚪"}
        </button>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ margin:"0 8px 16px", padding:8, borderRadius:8, border:"none", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:16 }}>
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ background:"#fff", padding:"16px 28px", borderBottom:"1px solid #E8ECF0", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:"#0A1628", letterSpacing:-0.5 }}>Panel Comunitario</div>
            <div style={{ fontSize:12, color:"#9E9E9E", marginTop:2 }}>Sociedad de Fomento Barrio Las Heras · Mar del Plata</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ fontSize:12, color:"#9E9E9E" }}>{new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</div>
            <div style={{ width:36, height:36, borderRadius:18, background:"linear-gradient(135deg,#2E7D32,#00796B)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:14 }}>
              {usuario.nombre?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>

          {(seccion==="reclamos" || seccion==="admin") && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
              {[
                { icon:"📋", value:reclamos.length,   label:"Reclamos totales", color:"#1565C0", bg:"#E3F2FD" },
                { icon:"⏳", value:pendientes.length,  label:"Pendientes",       color:"#E65100", bg:"#FFF3E0" },
                { icon:"✅", value:resueltos.length,   label:"Resueltos",        color:"#2E7D32", bg:"#E8F5E9" },
              ].map((s,i) => (
                <div key={i} style={{ background:"#fff", borderRadius:16, padding:"20px 22px", borderTop:`3px solid ${s.color}`, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize:30, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:13, color:"#9E9E9E", marginTop:4 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {seccion==="reclamos" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ background:"#fff", borderRadius:18, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                  <div style={{ width:6, height:24, borderRadius:3, background:"linear-gradient(#2E7D32,#00796B)" }}/>
                  <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0A1628" }}>Nuevo reclamo</h2>
                </div>
                {[{val:titulo,set:setTitulo,ph:"Título del reclamo",icon:"📝"},{val:ubicacion,set:setUbicacion,ph:"Dirección / Ubicación",icon:"📍"}].map(({val,set,ph,icon}) => (
                  <div key={ph} style={{ position:"relative", marginBottom:12 }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:16 }}>{icon}</span>
                    <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
                      style={{ width:"100%", padding:"11px 14px 11px 38px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", boxSizing:"border-box", color:"#0A1628" }}
                    />
                  </div>
                ))}
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="💬 Descripción detallada..." rows={3}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1.5px solid #E8ECF0", fontSize:14, fontFamily:"inherit", boxSizing:"border-box", resize:"none", marginBottom:12, color:"#0A1628" }}
                />
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#9E9E9E", marginBottom:8, letterSpacing:0.5 }}>PRIORIDAD</div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["alta","media","baja"].map(p => (
                      <button key={p} onClick={() => setPrioridad(p)} style={{ flex:1, padding:"8px 0", borderRadius:8, border:`2px solid ${prioridad===p?prioColor(p):"#E8ECF0"}`, background:prioridad===p?prioColor(p)+"15":"#fff", color:prioridad===p?prioColor(p):"#9E9E9E", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
                        {prioIcon(p)} {p.charAt(0).toUpperCase()+p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <label style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:"1.5px dashed #CBD5E1", cursor:"pointer", marginBottom:14, color:"#9E9E9E", fontSize:13 }}>
                  📷 {imagen ? "✅ Foto cargada" : "Adjuntar foto (opcional)"}
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => { const f=e.target.files[0]; if(f){const r=new FileReader();r.onloadend=()=>setImagen(r.result);r.readAsDataURL(f)} }}/>
                </label>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#9E9E9E", marginBottom:8, letterSpacing:0.5 }}>UBICACIÓN EN EL MAPA {posicion?"✅":"— hacé clic para marcar"}</div>
                  <div style={{ borderRadius:12, overflow:"hidden", border:"1.5px solid #E8ECF0" }}>
                    <MapContainer center={[-38.0055,-57.5426]} zoom={13} style={{ height:220, width:"100%" }} whenCreated={setMap}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                      <MapClick setPosicion={setPosicion}/>
                      {posicion && <Marker position={[posicion.lat,posicion.lng]} icon={iconPendiente}><Popup>Nueva ubicación</Popup></Marker>}
                      {reclamos.filter(r=>r.posicion).map(r => <Marker key={r.id} position={[r.posicion.lat,r.posicion.lng]} icon={r.estado==="pendiente"?iconPendiente:iconResuelto}><Popup><b>{r.titulo}</b><br/>{r.descripcion}</Popup></Marker>)}
                    </MapContainer>
                  </div>
                </div>
                <button onClick={agregar} style={{ width:"100%", padding:"13px 0", borderRadius:12, border:"none", background:"linear-gradient(135deg,#2E7D32,#00796B)", color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(46,125,50,0.35)" }}>
                  ➕ Crear reclamo
                </button>
              </div>

              <div>
                <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                  {[["todos","Todos","#1565C0"],["pendiente","Pendientes","#E65100"],["resuelto","Resueltos","#2E7D32"]].map(([val,label,col]) => (
                    <button key={val} onClick={() => setFiltro(val)} style={{ padding:"7px 16px", borderRadius:20, border:"none", background:filtro===val?col:"#fff", color:filtro===val?"#fff":"#9E9E9E", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit", boxShadow:filtro===val?`0 4px 12px ${col}44`:"0 2px 8px rgba(0,0,0,0.06)" }}>{label}</button>
                  ))}
                  <span style={{ marginLeft:"auto", fontSize:12, color:"#9E9E9E", alignSelf:"center" }}>{filtrados.length} reclamos</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {filtrados.length===0 && <div style={{ textAlign:"center", padding:"40px 20px", color:"#9E9E9E", background:"#fff", borderRadius:16 }}>Sin reclamos en esta categoría</div>}
                  {filtrados.map(r => (
                    <div key={r.id} style={{ background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", borderLeft:`5px solid ${prioColor(r.prioridad)}` }}>
                      {r.imagen && <img src={r.imagen} alt="" style={{ width:"100%", height:160, objectFit:"cover" }}/>}
                      <div style={{ padding:"16px 18px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                          <div>
                            <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0A1628" }}>{r.titulo}</h3>
                            <div style={{ fontSize:12, color:"#9E9E9E", marginTop:3 }}>📍 {r.ubicacion}</div>
                          </div>
                          {estadoBadge(r.estado)}
                        </div>
                        <p style={{ margin:"0 0 10px", fontSize:13, color:"#6B7280", lineHeight:1.5 }}>{r.descripcion}</p>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:prioColor(r.prioridad), background:prioColor(r.prioridad)+"15", padding:"3px 10px", borderRadius:20 }}>{prioIcon(r.prioridad)} Prioridad {r.prioridad}</span>
                          <span style={{ fontSize:11, color:"#9E9E9E" }}>{r.fecha}</span>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => toggle(r.id, r.estado)} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", background:r.estado==="pendiente"?"linear-gradient(135deg,#2E7D32,#00796B)":"linear-gradient(135deg,#E65100,#F57C00)", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{r.estado==="pendiente"?"✅ Resolver":"↩ Reabrir"}</button>
                          {r.posicion && <button onClick={() => { setSeccion("mapa"); setTimeout(() => { if(map) map.flyTo([r.posicion.lat,r.posicion.lng],17) },300) }} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1.5px solid #E8ECF0", background:"#fff", color:"#1565C0", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>🗺️ Ver en mapa</button>}
                          <button onClick={() => borrar(r.id)} style={{ padding:"8px 14px", borderRadius:8, border:"1.5px solid #FFCDD2", background:"#FFF5F5", color:"#C62828", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {seccion==="mapa" && (
            <div style={{ background:"#fff", borderRadius:18, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:6, height:24, borderRadius:3, background:"linear-gradient(#2E7D32,#00796B)" }}/>
                <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0A1628" }}>Mapa del barrio</h2>
              </div>
              <div style={{ display:"flex", gap:12, marginBottom:16 }}>
                {[["🟠","Pendiente"],["🟢","Resuelto"]].map(([ic,l]) => <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#6B7280" }}>{ic} {l}</div>)}
              </div>
              <div style={{ borderRadius:14, overflow:"hidden", border:"1.5px solid #E8ECF0" }}>
                <MapContainer center={[-38.0055,-57.5426]} zoom={13} style={{ height:520, width:"100%" }} whenCreated={setMap}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                  {reclamos.filter(r=>r.posicion).map(r => (
                    <Marker key={r.id} position={[r.posicion.lat,r.posicion.lng]} icon={r.estado==="pendiente"?iconPendiente:iconResuelto}>
                      <Popup><div style={{ minWidth:160 }}><b style={{ fontSize:14 }}>{r.titulo}</b><p style={{ margin:"6px 0 4px", fontSize:13, color:"#6B7280" }}>{r.descripcion}</p><p style={{ margin:0, fontSize:12, color:"#9E9E9E" }}>📍 {r.ubicacion}</p><p style={{ margin:"4px 0 0", fontSize:12 }}>🚨 Prioridad: {r.prioridad}</p></div></Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}

          {seccion==="socios" && esAdmin && <SeccionSocios usuario={usuario} esAdmin={esAdmin}/>}
          {seccion==="avisos" && <SeccionAvisos usuario={usuario} esAdmin={esAdmin}/>}
          {seccion==="mensajes" && <SeccionMensajes usuario={usuario} esAdmin={esAdmin}/>}

          {seccion==="admin" && esAdmin && (
            <div style={{ background:"#fff", borderRadius:18, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:6, height:24, borderRadius:3, background:"linear-gradient(#2E7D32,#00796B)" }}/>
                <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0A1628" }}>Administración</h2>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                {[
                  { icon:"📋", label:"Total reclamos",  value:reclamos.length,                                  col:"#1565C0" },
                  { icon:"⏳", label:"Pendientes",       value:pendientes.length,                                col:"#E65100" },
                  { icon:"✅", label:"Resueltos",        value:resueltos.length,                                 col:"#2E7D32" },
                  { icon:"🔴", label:"Prioridad alta",   value:reclamos.filter(r=>r.prioridad==="alta").length,  col:"#E53935" },
                  { icon:"🟠", label:"Prioridad media",  value:reclamos.filter(r=>r.prioridad==="media").length, col:"#F57C00" },
                  { icon:"🟢", label:"Prioridad baja",   value:reclamos.filter(r=>r.prioridad==="baja").length,  col:"#2E7D32" },
                ].map((s,i) => (
                  <div key={i} style={{ background:"#F5F7FA", borderRadius:14, padding:"18px 16px", borderTop:`3px solid ${s.col}`, textAlign:"center" }}>
                    <div style={{ fontSize:28 }}>{s.icon}</div>
                    <div style={{ fontSize:28, fontWeight:900, color:s.col, marginTop:8 }}>{s.value}</div>
                    <div style={{ fontSize:12, color:"#9E9E9E", marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:24 }}>
                <div style={{ fontWeight:800, fontSize:15, color:"#0A1628", marginBottom:14 }}>Todos los reclamos</div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#F5F7FA" }}>
                      {["Título","Ubicación","Prioridad","Estado","Fecha","Acción"].map(h => <th key={h} style={{ textAlign:"left", padding:"10px 12px", fontSize:11, color:"#9E9E9E", fontWeight:700 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {reclamos.length===0 && <tr><td colSpan={6} style={{ textAlign:"center", padding:28, color:"#9E9E9E" }}>Sin reclamos</td></tr>}
                    {reclamos.map(r => (
                      <tr key={r.id} style={{ borderBottom:"1px solid #F0F4F8" }}>
                        <td style={{ padding:"11px 12px", fontSize:13, fontWeight:600, color:"#0A1628" }}>{r.titulo}</td>
                        <td style={{ padding:"11px 12px", fontSize:12, color:"#9E9E9E" }}>{r.ubicacion}</td>
                        <td style={{ padding:"11px 12px" }}><span style={{ fontSize:12, fontWeight:700, color:prioColor(r.prioridad) }}>{prioIcon(r.prioridad)} {r.prioridad}</span></td>
                        <td style={{ padding:"11px 12px" }}>{estadoBadge(r.estado)}</td>
                        <td style={{ padding:"11px 12px", fontSize:11, color:"#9E9E9E" }}>{r.fecha}</td>
                        <td style={{ padding:"11px 12px" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => toggle(r.id, r.estado)} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:r.estado==="pendiente"?"#E8F5E9":"#FFF3E0", color:r.estado==="pendiente"?"#2E7D32":"#E65100", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{r.estado==="pendiente"?"Resolver":"Reabrir"}</button>
                            <button onClick={() => borrar(r.id)} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:"#FFEBEE", color:"#C62828", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Borrar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default App
