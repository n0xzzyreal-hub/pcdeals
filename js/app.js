// ============================================================
//  app.js — lógica principal do site de promoções
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection, query, orderBy, onSnapshot, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---- Estado global ----
let allDeals    = [];
let activeStore    = "all";
let activeCategory = "all";
let searchTerm  = "";
let sortMode    = "newest";

// ---- Mapeamento de categorias ----
const CATEGORY_LABELS = {
  gpu: "GPU", cpu: "CPU", ram: "RAM", storage: "Armazenamento",
  monitor: "Monitor", keyboard: "Teclado", mouse: "Mouse",
  headset: "Headset", psu: "Fonte", case: "Gabinete",
  cooling: "Cooler", notebook: "Notebook", other: "Outros"
};

const CATEGORY_ICONS = {
  gpu:"🎮", cpu:"⚙️", ram:"🧠", storage:"💾", monitor:"🖥️",
  keyboard:"⌨️", mouse:"🖱️", headset:"🎧", psu:"🔌",
  case:"📦", cooling:"❄️", notebook:"💻", other:"🔧"
};

// ---- DOM refs ----
const grid        = document.getElementById("dealsGrid");
const emptyState  = document.getElementById("emptyState");
const loadingState= document.getElementById("loadingState");
const countBadge  = document.getElementById("dealsCount");
const searchInput = document.getElementById("searchInput");
const sortSelect  = document.getElementById("sortSelect");
const storeFilter = document.getElementById("filterStores");

// ---- Hamburger ----
document.getElementById("hamburger").addEventListener("click", () => {
  document.getElementById("mobileNav").classList.toggle("open");
});

// ---- Firestore listener ----
function subscribeDeals() {
  const q = query(collection(db, "deals"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    allDeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    buildStoreFilter();
    updateStats();
    render();
    loadingState.style.display = "none";
  }, (err) => {
    console.error("Firestore error:", err);
    loadingState.innerHTML = "<p style='color:var(--accent2)'>Erro ao carregar promoções. Verifique o Firebase.</p>";
  });
}

// ---- Filtro de lojas dinâmico ----
function buildStoreFilter() {
  const stores = [...new Set(allDeals.map(d => d.store).filter(Boolean))];
  storeFilter.innerHTML = `<button class="pill ${activeStore==="all"?"active":""}" data-store="all">Todas</button>`;
  stores.forEach(store => {
    const btn = document.createElement("button");
    btn.className = `pill${activeStore === store ? " active" : ""}`;
    btn.dataset.store = store;
    btn.textContent = store;
    storeFilter.appendChild(btn);
  });
  storeFilter.querySelectorAll(".pill").forEach(btn => {
    btn.addEventListener("click", () => {
      activeStore = btn.dataset.store;
      storeFilter.querySelectorAll(".pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });
}

// ---- Stats ----
function updateStats() {
  document.getElementById("statDeals").textContent  = allDeals.length;
  const stores = new Set(allDeals.map(d => d.store).filter(Boolean));
  document.getElementById("statStores").textContent = stores.size;
  const discounts = allDeals
    .filter(d => d.priceOld && d.priceNew)
    .map(d => d.priceOld - d.priceNew);
  const avg = discounts.length
    ? Math.round(discounts.reduce((a,b)=>a+b,0)/discounts.length)
    : 0;
  document.getElementById("statSaved").textContent = `R$${avg}`;
}

// ---- Filtrar + ordenar ----
function getFiltered() {
  let list = [...allDeals];
  if (activeStore !== "all")    list = list.filter(d => d.store === activeStore);
  if (activeCategory !== "all") list = list.filter(d => d.category === activeCategory);
  if (searchTerm) {
    const t = searchTerm.toLowerCase();
    list = list.filter(d =>
      (d.title||"").toLowerCase().includes(t) ||
      (d.store||"").toLowerCase().includes(t) ||
      (d.category||"").toLowerCase().includes(t)
    );
  }
  switch (sortMode) {
    case "discount":
      list.sort((a,b) => {
        const dA = a.priceOld ? ((a.priceOld-a.priceNew)/a.priceOld) : 0;
        const dB = b.priceOld ? ((b.priceOld-b.priceNew)/b.priceOld) : 0;
        return dB - dA;
      }); break;
    case "price_asc":  list.sort((a,b) => (a.priceNew||0) - (b.priceNew||0)); break;
    case "price_desc": list.sort((a,b) => (b.priceNew||0) - (a.priceNew||0)); break;
    default:           list.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  }
  return list;
}

// ---- Renderizar cards ----
function render() {
  const list = getFiltered();
  countBadge.textContent = `${list.length} resultado${list.length!==1?"s":""}`;

  if (!list.length) {
    grid.innerHTML = "";
    emptyState.style.display = "flex";
    return;
  }
  emptyState.style.display = "none";

  grid.innerHTML = list.map(deal => buildCard(deal)).join("");
}

function buildCard(d) {
  const pctOff = d.priceOld && d.priceNew
    ? Math.round((1 - d.priceNew/d.priceOld)*100) : 0;
  const fmtPrice = v => v ? `R$\u00A0${Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}` : "";
  const catLabel = CATEGORY_LABELS[d.category] || d.category || "Outros";
  const catIcon  = CATEGORY_ICONS[d.category]  || "🔧";
  const isNew    = d.createdAt && (Date.now()/1000 - d.createdAt.seconds) < 86400;
  const date     = d.createdAt
    ? new Date(d.createdAt.seconds*1000).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})
    : "";
  const imgHTML  = d.imageUrl
    ? `<img src="${d.imageUrl}" alt="${d.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="placeholder-icon" style="display:none">${catIcon}</span>`
    : `<span class="placeholder-icon">${catIcon}</span>`;

  return `
  <article class="deal-card">
    <div class="card-img">
      ${imgHTML}
      ${pctOff > 0 ? `<span class="badge-discount">-${pctOff}%</span>` : ""}
      ${isNew ? `<span class="badge-new">Novo</span>` : ""}
    </div>
    <div class="card-body">
      <span class="card-store">${d.store || "Loja"}</span>
      <h3 class="card-title">${d.title}</h3>
      <span class="card-category">${catLabel}</span>
      <div class="card-prices">
        ${d.priceOld ? `<span class="price-old">${fmtPrice(d.priceOld)}</span>` : ""}
        <span class="price-new">${fmtPrice(d.priceNew)}</span>
      </div>
      ${d.installment ? `<span class="price-installment">${d.installment}</span>` : ""}
    </div>
    <div class="card-footer">
      <span class="card-date">${date}</span>
      <a href="${d.url || "#"}" target="_blank" rel="noopener noreferrer" class="btn-deal">Ver oferta →</a>
    </div>
  </article>`;
}

// ---- Eventos ----
searchInput.addEventListener("input", e => { searchTerm = e.target.value; render(); });
sortSelect.addEventListener("change", e => { sortMode = e.target.value; render(); });

document.getElementById("filterCategories").querySelectorAll(".pill").forEach(btn => {
  btn.addEventListener("click", () => {
    activeCategory = btn.dataset.category;
    document.getElementById("filterCategories").querySelectorAll(".pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

// ---- Reset ----
window.resetFilters = function() {
  activeStore    = "all";
  activeCategory = "all";
  searchTerm     = "";
  sortMode       = "newest";
  searchInput.value = "";
  sortSelect.value  = "newest";
  document.querySelectorAll(".pill").forEach(b => {
    b.classList.toggle("active",
      b.dataset.store==="all" || b.dataset.category==="all");
  });
  render();
};

// ---- Init ----
subscribeDeals();
