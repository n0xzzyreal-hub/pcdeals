// ============================================================
//  admin.js — painel de gerenciamento de promoções
// ============================================================

import { db, auth } from "../js/firebase-config.js";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const CATEGORY_LABELS = {
  gpu:"GPU", cpu:"CPU", ram:"RAM", storage:"Armazenamento",
  monitor:"Monitor", keyboard:"Teclado", mouse:"Mouse",
  headset:"Headset", psu:"Fonte", case:"Gabinete",
  cooling:"Cooler", notebook:"Notebook", other:"Outros"
};

// ---- DOM ----
const loginScreen  = document.getElementById("loginScreen");
const adminPanel   = document.getElementById("adminPanel");
const loginError   = document.getElementById("loginError");
const formMsg      = document.getElementById("formMsg");
const formTitle    = document.getElementById("formTitle");
const tableBody    = document.getElementById("dealsTableBody");
const adminSearch  = document.getElementById("adminSearch");
const btnCancelEdit= document.getElementById("btnCancelEdit");

let allDeals   = [];
let editingId  = null;

// ---- AUTH ----
document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const pass  = document.getElementById("loginPassword").value;
  loginError.style.display = "none";
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    loginError.textContent = "E-mail ou senha inválidos.";
    loginError.style.display = "block";
  }
});

document.getElementById("btnLogout").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.style.display  = "none";
    adminPanel.style.display   = "block";
    subscribeDeals();
  } else {
    loginScreen.style.display  = "flex";
    adminPanel.style.display   = "none";
  }
});

// ---- Firestore listener ----
let unsub = null;
function subscribeDeals() {
  if (unsub) unsub();
  const q = query(collection(db, "deals"), orderBy("createdAt", "desc"));
  unsub = onSnapshot(q, (snap) => {
    allDeals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable(allDeals);
    populateStoreDatalist();
  });
}

// ---- Table ----
function renderTable(list) {
  if (!list.length) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">Nenhuma promoção cadastrada ainda.</td></tr>`;
    return;
  }
  tableBody.innerHTML = list.map(d => {
    const disc = d.priceOld && d.priceNew
      ? Math.round((1 - d.priceNew/d.priceOld)*100) : 0;
    const fmtP = v => v ? `R$\u00A0${Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2})}` : "—";
    const date = d.createdAt
      ? new Date(d.createdAt.seconds*1000).toLocaleDateString("pt-BR")
      : "—";
    return `
    <tr>
      <td class="td-title" title="${d.title}">${d.title}</td>
      <td class="td-store">${d.store||"—"}</td>
      <td>${CATEGORY_LABELS[d.category]||d.category||"—"}</td>
      <td class="td-price">${fmtP(d.priceNew)}</td>
      <td class="td-disc">${disc ? `-${disc}%` : "—"}</td>
      <td>${date}</td>
      <td>
        <button class="btn-edit"  onclick="editDeal('${d.id}')">✏️ Editar</button>
        <button class="btn-delete" onclick="deleteDeal('${d.id}','${(d.title||"").replace(/'/g,"\\'")}')">🗑️</button>
      </td>
    </tr>`;
  }).join("");
}

// ---- Search ----
adminSearch.addEventListener("input", e => {
  const t = e.target.value.toLowerCase();
  renderTable(t
    ? allDeals.filter(d =>
        (d.title||"").toLowerCase().includes(t) ||
        (d.store||"").toLowerCase().includes(t))
    : allDeals
  );
});

// ---- Save ----
document.getElementById("btnSave").addEventListener("click", async () => {
  const title    = document.getElementById("fTitle").value.trim();
  const store    = document.getElementById("fStore").value.trim();
  const category = document.getElementById("fCategory").value;
  const priceOld = parseFloat(document.getElementById("fPriceOld").value) || null;
  const priceNew = parseFloat(document.getElementById("fPriceNew").value) || null;
  const installment = document.getElementById("fInstallment").value.trim();
  const url      = document.getElementById("fUrl").value.trim();
  const imageUrl = document.getElementById("fImageUrl").value.trim();

  if (!title || !store || !category || !priceNew || !url) {
    showMsg("Preencha os campos obrigatórios (*)", "error");
    return;
  }

  const data = {
    title, store, category, priceOld, priceNew,
    installment: installment || null,
    url, imageUrl: imageUrl || null
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, "deals", editingId), data);
      showMsg("✅ Promoção atualizada!", "success");
      cancelEdit();
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "deals"), data);
      showMsg("✅ Promoção adicionada!", "success");
      clearForm();
    }
  } catch (e) {
    showMsg("Erro ao salvar: " + e.message, "error");
  }
});

// ---- Edit ----
window.editDeal = function(id) {
  const d = allDeals.find(x => x.id === id);
  if (!d) return;
  editingId = id;
  document.getElementById("fTitle").value       = d.title        || "";
  document.getElementById("fStore").value       = d.store        || "";
  document.getElementById("fCategory").value    = d.category     || "";
  document.getElementById("fPriceOld").value    = d.priceOld     || "";
  document.getElementById("fPriceNew").value    = d.priceNew     || "";
  document.getElementById("fInstallment").value = d.installment  || "";
  document.getElementById("fUrl").value         = d.url          || "";
  document.getElementById("fImageUrl").value    = d.imageUrl     || "";
  formTitle.textContent = "✏️ Editar promoção";
  btnCancelEdit.style.display = "inline-block";
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth" });
};

// ---- Delete ----
window.deleteDeal = async function(id, name) {
  if (!confirm(`Excluir "${name}"?`)) return;
  try {
    await deleteDoc(doc(db, "deals", id));
  } catch (e) {
    alert("Erro ao excluir: " + e.message);
  }
};

// ---- Cancel edit ----
btnCancelEdit.addEventListener("click", cancelEdit);
function cancelEdit() {
  editingId = null;
  formTitle.textContent = "➕ Adicionar promoção";
  btnCancelEdit.style.display = "none";
  clearForm();
}

function clearForm() {
  ["fTitle","fStore","fCategory","fPriceOld","fPriceNew","fInstallment","fUrl","fImageUrl"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}

// ---- Helpers ----
function showMsg(text, type) {
  formMsg.textContent = text;
  formMsg.className = "form-msg " + type;
  formMsg.style.display = "block";
  setTimeout(() => { formMsg.style.display = "none"; }, 4000);
}

function populateStoreDatalist() {
  const dl = document.getElementById("storesList");
  const stores = [...new Set(allDeals.map(d=>d.store).filter(Boolean))];
  dl.innerHTML = stores.map(s => `<option value="${s}">`).join("");
}
