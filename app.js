const { createClient } = window.supabase || {};
const cfg = window.APP_CONFIG || {};
const hasSupabase = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY);
const supabase = hasSupabase && createClient ? createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;

const state = { points: [], markers: new Map(), selected: null, localComments: {}, picking: false };
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmtDate = v => v ? v : "No especificada";
const categoryClass = c => c === "Acopio" ? "acopio" : "";

async function loadSeed() {
  const r = await fetch("seed-data.json");
  return await r.json();
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
  catch(e){ console.error(e); $("#list").innerHTML=`<div class="empty">No se pudieron cargar los puntos.</div>`; }
})();
