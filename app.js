const { createClient } = window.supabase || {};
const cfg = window.APP_CONFIG || {};
const hasSupabase = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY);
const supabase = hasSupabase && createClient ? createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;

const state = { points: [], markers: new Map(), selected: null, localComments: {}, picking: false };
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmtDate = v => v ? v : "No especificada";
const categoryClass = c => c === "Acopio" ? "acopio" : "";

const EMBEDDED_SEED_DATA = [
  {
    "legacy_id": "1",
    "category": "Voluntariado",
    "name": "Parque La Reforma",
    "address": "Cl. 69f Sur #20, Bogotá",
    "lat": 4.513733244311091,
    "lon": -74.06457822550036,
    "start_time": "11:00",
    "end_time": "18:00",
    "dates": "Hasta el 14 de agosto",
    "contact": "30169834353022500000",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "2",
    "category": "Voluntariado",
    "name": "Centro Comercial Multiplaza - Sotano 2",
    "address": "Cra. 72 #17a-63, Bogotá",
    "lat": 4.662942194288313,
    "lon": -74.08929746261934,
    "start_time": "14:00",
    "end_time": "21:00",
    "dates": "Del 10 hasta el 17 de agosto",
    "contact": "IG @multiplazabogota",
    "people_needed": "5/5",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "3",
    "category": "Voluntariado",
    "name": "SAMU Norte Calle 134 Cruz Roja",
    "address": "Cra. 7b Bis #132 31, Usaquén, Bogotá, Cundinamarca",
    "lat": 4.7279545894257495,
    "lon": -74.00964658745828,
    "start_time": "08:00",
    "end_time": "21:00",
    "dates": "",
    "contact": "IG @cruzrojabogota",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "4",
    "category": "Voluntariado",
    "name": "Galería Aborigen",
    "address": "Cra. 6a #116-17, Usaquén, Bogotá, Cundinamarca",
    "lat": 4.704003359719706,
    "lon": -74.0020934872275,
    "start_time": "10:00",
    "end_time": "20:00",
    "dates": "",
    "contact": "IG @galeriaaborigen",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "5",
    "category": "Voluntariado",
    "name": "Palacio de Los Deportes - Cruz Roja",
    "address": "Ac 63 #59a-06, Bogotá",
    "lat": 4.66841715548629,
    "lon": -74.04054563385698,
    "start_time": "08:00",
    "end_time": "21:00",
    "dates": "",
    "contact": "IG @cruzrojabogota",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "6",
    "category": "Voluntariado",
    "name": "Estadio Nemesio Camacho El Campín",
    "address": "Carrera 30 y Calle 57, Teusaquillo, Bogotá",
    "lat": 4.646097056945061,
    "lon": -74.07636515017782,
    "start_time": "08:00",
    "end_time": "21:00",
    "dates": "12, 13 y 14 de Agosto",
    "contact": "3107859941",
    "people_needed": "1/5",
    "requirements": "Camisa blanca o amarilla y contactarse antes de llegar",
    "description": "Entrada por la carrera 30 al lado de la tienda de Millonarios",
    "status": "approved"
  },
  {
    "legacy_id": "7",
    "category": "Voluntariado",
    "name": "Banco de Alimentos de Bogotá",
    "address": "Cl. 19A #32-50, Bogotá",
    "lat": 4.6210385407143715,
    "lon": -74.08851254395788,
    "start_time": "09:00",
    "end_time": "17:00",
    "dates": "12, 13 y 14 de Agosto",
    "contact": "3115763645",
    "people_needed": "1/5",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "8",
    "category": "Voluntariado",
    "name": "Cruz roja Bodega",
    "address": "Dg. 79b #62-53, Barrios Unidos, Bogotá",
    "lat": 4.679545755648608,
    "lon": -74.07695569576242,
    "start_time": "08:00",
    "end_time": "21:00",
    "dates": "",
    "contact": "IG @cruzrojabogota",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "9",
    "category": "Voluntariado",
    "name": "SAMU Alqueria Cruz Roja Bogotá",
    "address": "Av. 68 #31, Bogotá",
    "lat": 4.607313637363723,
    "lon": -74.12993351962776,
    "start_time": "08:00",
    "end_time": "21:00",
    "dates": "",
    "contact": "IG @cruzrojabogota",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "10",
    "category": "Voluntariado",
    "name": "Universidad de Bogotá Jorge Tadeo Lozano",
    "address": "Cra. 4 #22-61, Bogotá",
    "lat": 4.607962588895463,
    "lon": -74.0662506832623,
    "start_time": "08:00",
    "end_time": "18:00",
    "dates": "",
    "contact": "IG @utadeo.edu.co",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "11",
    "category": "Voluntariado",
    "name": "Uniminuto",
    "address": "Tv. 73a #82 61, Bogotá",
    "lat": 4.702581054977111,
    "lon": -74.09029540804349,
    "start_time": "08:00",
    "end_time": "16:00",
    "dates": "",
    "contact": "3174321703",
    "people_needed": "5/5",
    "requirements": "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=1hktZcHt20OiTp6UP97jlZ5x13KKd9FLmDdE5QCDthVURE5BWlEwVFUyNVlDS1lXN0NCWk40WFI4OS4u",
    "description": "Banco de ropa",
    "status": "approved"
  },
  {
    "legacy_id": "12",
    "category": "Voluntariado",
    "name": "Salón Comunal Barrio Casa Rey",
    "address": "Cra. 14 R, Bogotá",
    "lat": 4.5196675866370315,
    "lon": -74.12082222682845,
    "start_time": "10:00",
    "end_time": "18:00",
    "dates": "13 y 14 de agosto",
    "contact": "3132539126",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "13",
    "category": "Voluntariado",
    "name": "Fundación Catalina Muñoz",
    "address": "Dg. 48 #19-16, Bogotá",
    "lat": 4.636938433848099,
    "lon": -74.07103513083017,
    "start_time": "08:00",
    "end_time": "18:00",
    "dates": "12, 13 y 14 de Agosto",
    "contact": "3002618537",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "14",
    "category": "Voluntariado",
    "name": "Cruz Roja Colombiana Seccional Cundinamarca y Bogotá",
    "address": "Cra. 23 #N° 73 - 19, Barrios Unidos, Bogotá, Cundinamarca",
    "lat": 4.664268397406716,
    "lon": -74.06525043893232,
    "start_time": "24 h",
    "end_time": "24 h",
    "dates": "",
    "contact": "IG @cruzrojabogota",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "15",
    "category": "Voluntariado",
    "name": "Centro de Salvamento Acuático Cruz Roja",
    "address": "Av. La Esmeralda #63-81, Bogotá",
    "lat": 4.666358518859422,
    "lon": -74.08507174038226,
    "start_time": "08:00",
    "end_time": "21:00",
    "dates": "",
    "contact": "IG @cruzrojabogota",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "16",
    "category": "Voluntariado",
    "name": "Vive Claro Distrito Cultural",
    "address": "Av. La Esmeralda #42-41, Bogotá",
    "lat": 4.649531077228136,
    "lon": -74.09630188082595,
    "start_time": "09:00",
    "end_time": "17:00",
    "dates": "del 12 hasta el 31 de agosto",
    "contact": "https://forms.cloud.microsoft/pages/responsepage.aspx?id=VHyXFlpS7Ey9K8HEea7b6wSRScHkLPtFsicCOZ0Y3u1UOUlMOUNDMDVOSVdaQ0VGRlU1U1AySE1GUi4u&fbclid=PAb21jcATooC1wZG9mAmV4dG4DYWVtAjExAHNydGMGYXBwX2lkDzU2NzA2NzM0MzM1MjQyNwABp7C18_rw90XfFhzqKdrVAqOGqumjWFe6viGoIahPl8BGpEp2Ys7tnJWmZTBr_aem_ulxRHxpIiPCCbp520Ji5hA&route=shorturl",
    "people_needed": "5/5",
    "requirements": "Inscripción",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "17",
    "category": "Voluntariado",
    "name": "Human Construction - Local 1",
    "address": "Cra. 52a #134d-23, Bogotá",
    "lat": 4.722714098865295,
    "lon": -74.05686794512334,
    "start_time": "08:00",
    "end_time": "18:00",
    "dates": "12, 13 y 14 de Agosto",
    "contact": "3016441221",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "18",
    "category": "Voluntariado",
    "name": "Unicentro Bogotá Centro Comercial",
    "address": "Ak 15 #124-30, Usaquén, Bogotá",
    "lat": 4.703556811078048,
    "lon": -74.04134232833567,
    "start_time": "08:00",
    "end_time": "18:00",
    "dates": "12, 13 y 14 de Agosto",
    "contact": "IG @unicentrobogota",
    "people_needed": "1/5",
    "requirements": "Inscripción en administración, queda abajo en Banderas por la rampa.",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "19",
    "category": "Voluntariado",
    "name": "Scientology fundacion",
    "address": "Cra 19 #100-21, Bogotá",
    "lat": 4.686633691725093,
    "lon": -74.05218220500069,
    "start_time": "09:30",
    "end_time": "21:00",
    "dates": "12, 13 y 14 de Agosto",
    "contact": "",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "20",
    "category": "Voluntariado",
    "name": "Punto por identificar (#20)",
    "address": "Cra. 6b Este #89-14",
    "lat": 4.500817910154906,
    "lon": -74.10229806995473,
    "start_time": "",
    "end_time": "",
    "dates": "",
    "contact": "",
    "people_needed": "",
    "requirements": "",
    "description": "El nombre no estaba registrado en el Excel original.",
    "status": "approved"
  },
  {
    "legacy_id": "21",
    "category": "Voluntariado",
    "name": "Cruz roja SAMU Sur",
    "address": "Av. 68 #31-41, Bogotá",
    "lat": 4.607555618409338,
    "lon": -74.1312687301233,
    "start_time": "08:00",
    "end_time": "21:00",
    "dates": "",
    "contact": "IG @cruzrojabogota",
    "people_needed": "",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "22",
    "category": "Voluntariado",
    "name": "CRIC Nacional",
    "address": "Cra. 29 #39-92, Teusaquillo, Bogotá, Cundinamarca",
    "lat": 4.629206411271491,
    "lon": -74.07919251073949,
    "start_time": "09:00",
    "end_time": "21:00",
    "dates": "12 de Agosto",
    "contact": "",
    "people_needed": "5/5",
    "requirements": "",
    "description": "",
    "status": "approved"
  },
  {
    "legacy_id": "23",
    "category": "Voluntariado",
    "name": "Punto por identificar (#23)",
    "address": "Av. Ciudad de Lima #32-50, Bogotá",
    "lat": 4.6203999005121315,
    "lon": -74.09007415921913,
    "start_time": "",
    "end_time": "",
    "dates": "",
    "contact": "",
    "people_needed": "",
    "requirements": "",
    "description": "El nombre no estaba registrado en el Excel original.",
    "status": "approved"
  },
  {
    "legacy_id": "24",
    "category": "Voluntariado",
    "name": "Casa de la memoria",
    "address": "Cl. 161a #7 F 55, Bogotá",
    "lat": 4.737304681832439,
    "lon": -74.02573674929404,
    "start_time": "07:00",
    "end_time": "21:00",
    "dates": "",
    "contact": "",
    "people_needed": "",
    "requirements": "",
    "description": "Por favor llevar cajas",
    "status": "approved"
  },
  {
    "legacy_id": "25",
    "category": "Voluntariado",
    "name": "Fundación FUNSAR",
    "address": "Cl. 59 Sur #80C-4, Bogotá",
    "lat": 4.610602242727065,
    "lon": -74.18079097609326,
    "start_time": "",
    "end_time": "",
    "dates": "",
    "contact": "https://docs.google.com/forms/d/e/1FAIpQLSdB_abs3mHI0QTLiUk48HRkFKoupTEBDHUWqrNbatKoIK-WwA/viewform",
    "people_needed": "5/5",
    "requirements": "Inscripción",
    "description": "",
    "status": "approved"
  }
];

function loadSeed() {
  return Promise.resolve(EMBEDDED_SEED_DATA);
}

async function loadPoints() {
  if (supabase) {
    const { data, error } = await supabase.from("points")
      .select("*").eq("status","approved").order("created_at",{ascending:true});
    if (!error && data) return data;
    console.warn(error);
  }
  const seed = await loadSeed();
  return seed.map((x,i)=>({ ...x, id:`seed-${i+1}`, status:"approved" }));
}

function initMap() {
  if (!window.L) {
    console.error("Leaflet no se pudo cargar.");
    const mapEl = document.getElementById("map");
    if (mapEl) mapEl.innerHTML = `<div style="padding:24px;font:600 16px system-ui;color:#475149">No se pudo cargar el mapa. Recarga la página o revisa tu conexión a internet.</div>`;
    return false;
  }
  state.map = L.map("map", { zoomControl:true }).setView([4.65,-74.08], 12);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(state.map);

  state.map.on("click", e => {
    if (!state.picking) return;
    $("#lat").value = e.latlng.lat.toFixed(7);
    $("#lon").value = e.latlng.lng.toFixed(7);
    state.picking = false;
    $("#pick-location").textContent = "Seleccionar en mapa";
    showToast("Ubicación seleccionada");
  });
  return true;
}

function markerIcon(category) {
  return L.divIcon({ className:"", html:`<div class="marker-label ${categoryClass(category)}">${category==="Acopio"?"A":"V"}</div>`, iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[0,-14] });
}

function render() {
  state.markers.forEach(m => m.remove());
  state.markers.clear();

  const q = ($("#search").value || "").toLowerCase().trim();
  const cat = $("#category").value;
  const items = state.points.filter(p => {
    const hay = [p.name,p.address,p.contact,p.description,p.requirements].join(" ").toLowerCase();
    return (!q || hay.includes(q)) && (cat==="all" || p.category===cat);
  });

  $("#point-count").textContent = state.points.length;
  $("#vol-count").textContent = state.points.filter(p=>p.category==="Voluntariado").length;
  $("#acopio-count").textContent = state.points.filter(p=>p.category==="Acopio").length;

  const list = $("#list");
  list.innerHTML = items.length ? items.map(p => `
    <article class="point-card" data-id="${esc(p.id)}">
      <span class="badge ${categoryClass(p.category)}">${esc(p.category)}</span>
      <h3>${esc(p.name)}</h3>
      <div class="meta">${esc(p.address || "Dirección no disponible")}</div>
      <div class="meta">${p.start_time&&p.end_time?esc(p.start_time)+"–"+esc(p.end_time):"Horario no especificado"}${p.dates?` · ${esc(p.dates)}`:""}</div>
    </article>
  `).join("") : `<div class="empty">No hay puntos que coincidan con la búsqueda.</div>`;

  list.querySelectorAll(".point-card").forEach(card => {
    card.addEventListener("click", () => selectPoint(card.dataset.id));
  });

  items.forEach(p => {
    if (typeof p.lat !== "number" || typeof p.lon !== "number") return;
    if (!state.map) return;
    const marker = L.marker([p.lat,p.lon], { icon: markerIcon(p.category) }).addTo(state.map);
    marker.bindPopup(`
      <div class="popup-title">${esc(p.name)}</div>
      <div class="popup-meta">${esc(p.address || "")}</div>
      <div class="popup-meta">${p.category==="Acopio"?"Acopio":"Voluntariado"} · ${p.start_time&&p.end_time?esc(p.start_time)+"–"+esc(p.end_time):"Horario sin especificar"}</div>
      <a href="#" class="popup-link" data-open="${esc(p.id)}">Ver detalles →</a>
    `);
    marker.on("popupopen", e => e.popup.getElement().querySelector("[data-open]")?.addEventListener("click", ev => { ev.preventDefault(); selectPoint(p.id); }));
    state.markers.set(String(p.id), marker);
  });
}

async function loadComments(pointId) {
  if (supabase) {
    const { data, error } = await supabase.from("comments")
      .select("*").eq("point_id", pointId).eq("status","approved").order("created_at",{ascending:false});
    if (!error && data) return data;
  }
  return state.localComments[pointId] || [];
}

async function openPoint(p) {
  state.selected = p;
  $("#point-dialog").showModal();
  $("#point-content").innerHTML = `
    <span class="badge ${categoryClass(p.category)}">${esc(p.category)}</span>
    <h2>${esc(p.name)}</h2>
    <p style="color:var(--muted)">${esc(p.address || "")}</p>
    <div class="detail-grid">
      <div class="detail"><div class="k">Horario</div><div class="v">${p.start_time&&p.end_time?esc(p.start_time)+"–"+esc(p.end_time):"No especificado"}</div></div>
      <div class="detail"><div class="k">Fechas</div><div class="v">${esc(fmtDate(p.dates))}</div></div>
      <div class="detail"><div class="k">Contacto</div><div class="v">${esc(p.contact || "No especificado")}</div></div>
      <div class="detail"><div class="k">Personas</div><div class="v">${esc(p.people_needed || "No especificado")}</div></div>
      <div class="detail"><div class="k">Requisitos</div><div class="v">${esc(p.requirements || "No especificados")}</div></div>
      <div class="detail"><div class="k">Descripción</div><div class="v">${esc(p.description || "Sin descripción")}</div></div>
    </div>
    <div class="comments">
      <h3>Comentarios</h3>
      <div id="comments-list"><div class="empty">Cargando comentarios…</div></div>
      <form id="comment-form" class="comment-form">
        <input name="author_name" maxlength="80" placeholder="Tu nombre (opcional)">
        <textarea name="body" rows="3" required maxlength="600" placeholder="Comparte una actualización, recomendación o dato útil…"></textarea>
        <button class="btn btn-primary" type="submit">Comentar</button>
        <div id="comment-status" class="form-status"></div>
      </form>
    </div>`;
  renderComments(p.id);
  $("#comment-form").addEventListener("submit", submitComment);
}

async function renderComments(pointId) {
  const comments = await loadComments(pointId);
  $("#comments-list").innerHTML = comments.length ? comments.map(c => `
    <div class="comment">
      <div class="who">${esc(c.author_name || "Anónimo")} <span class="when">${c.created_at?`· ${new Date(c.created_at).toLocaleDateString("es-CO")}`:""}</span></div>
      <div class="body">${esc(c.body)}</div>
    </div>`).join("") : `<div class="empty">Todavía no hay comentarios publicados.</div>`;
}

async function submitComment(ev) {
  ev.preventDefault();
  const f = new FormData(ev.currentTarget), body = String(f.get("body")||"").trim();
  if (!body || !state.selected) return;
  const payload = { point_id: state.selected.id, author_name:String(f.get("author_name")||"").trim().slice(0,80), body:body.slice(0,600) };

  if (supabase) {
    const { error } = await supabase.from("comments").insert({ ...payload, status:"pending" });
    if (error) { $("#comment-status").textContent = "No se pudo enviar. Intenta de nuevo."; return; }
  } else {
    const item = {...payload, id:crypto.randomUUID(), created_at:new Date().toISOString()};
    state.localComments[state.selected.id] = [item, ...(state.localComments[state.selected.id]||[])];
    $("#comment-status").textContent = "Comentario guardado localmente en este navegador.";
    await renderComments(state.selected.id);
    ev.currentTarget.reset(); return;
  }
  ev.currentTarget.reset();
  $("#comment-status").textContent = "Gracias. El comentario quedó enviado para revisión.";
}

async function submitPoint(ev) {
  ev.preventDefault();
  const f = new FormData(ev.currentTarget);
  if (String(f.get("website")||"").trim()) return;
  const payload = {
    category:String(f.get("category")),
    name:String(f.get("name")||"").trim(),
    address:String(f.get("address")||"").trim(),
    lat:Number(f.get("lat")), lon:Number(f.get("lon")),
    start_time:String(f.get("start_time")||""), end_time:String(f.get("end_time")||""),
    dates:String(f.get("dates")||"").trim(), contact:String(f.get("contact")||"").trim(),
    people_needed:String(f.get("people_needed")||"").trim(),
    requirements:String(f.get("requirements")||"").trim(),
    description:String(f.get("description")||"").trim(),
    submitted_by:String(f.get("submitted_by")||"").trim()
  };
  if (!payload.name || !payload.address || !Number.isFinite(payload.lat) || !Number.isFinite(payload.lon)) {
    $("#add-status").textContent = "Completa nombre, dirección y una ubicación válida."; return;
  }

  if (supabase) {
    const { error } = await supabase.from("points").insert({ ...payload, status:"pending" });
    if (error) { $("#add-status").textContent = "No se pudo enviar el punto. Revisa la configuración."; return; }
  } else {
    const item = {...payload, id:crypto.randomUUID(), status:"pending"};
    const pending = JSON.parse(localStorage.getItem("pendingPoints")||"[]");
    pending.push(item); localStorage.setItem("pendingPoints",JSON.stringify(pending));
  }
  ev.currentTarget.reset();
  $("#add-status").textContent = "¡Listo! El punto fue enviado para revisión.";
  setTimeout(() => $("#add-dialog").close(), 1100);
}

function selectPoint(id) {
  const p = state.points.find(x => String(x.id)===String(id));
  if (!p) return;
  if (typeof p.lat==="number") state.map.setView([p.lat,p.lon], Math.max(state.map.getZoom(),14));
  state.markers.get(String(id))?.openPopup();
  openPoint(p);
}

function showToast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200); }

function setupDialogs(){
  document.querySelectorAll(".close-dialog").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
  document.querySelectorAll(".cancel-dialog").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
  $("#open-add").addEventListener("click",()=>$("#add-dialog").showModal());
  $("#add-form").addEventListener("submit",submitPoint);
  $("#pick-location").addEventListener("click",()=>{
    state.picking = !state.picking;
    $("#pick-location").textContent = state.picking ? "Haz clic en el mapa…" : "Seleccionar en mapa";
    $("#add-status").textContent = state.picking ? "Ahora haz clic sobre el mapa para fijar la ubicación." : "";
  });
  $("#search").addEventListener("input",render); $("#category").addEventListener("change",render);
}

(async function(){
  initMap(); setupDialogs();
  try { state.points = await loadPoints(); render(); }
  catch(e){ console.error(e); $("#list").innerHTML=`<div class="empty">No se pudieron cargar los puntos. Revisa la consola del navegador.</div>`; }
})();
