<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>لوحة الإدارة — جرد معدات سلسلة التبريد</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0b3d3a">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="سلسلة التبريد">
</head>
<body>
  <div class="topbar">
    <div class="brand"><span class="dot"></span> منصة جرد معدات سلسلة التبريد — لوحة الإدارة</div>
    <div class="meta">
      <span>عرض جميع البلديات</span>
    </div>
  </div>

  <div class="container">

    <div class="grid grid-3" style="margin-bottom:6px;">
      <div class="stat"><div class="num" id="statMunicipalities">0</div><div class="lbl">بلديات لديها بيانات</div></div>
      <div class="stat"><div class="num" id="statCenters">0</div><div class="lbl">مراكز صحية</div></div>
      <div class="stat"><div class="num" id="statEquip">0</div><div class="lbl">إجمالي المعدات</div></div>
    </div>
    <div class="grid grid-3" style="margin-bottom:20px;">
      <div class="stat"><div class="num" id="statCapacity">0</div><div class="lbl">إجمالي السعة التخزينية (لتر)</div></div>
      <div class="stat"><div class="num" id="statOk">0</div><div class="lbl">معدات تعمل بكفاءة</div></div>
      <div class="stat"><div class="num" id="statBad">0</div><div class="lbl">تحتاج صيانة / خارج الخدمة</div></div>
    </div>

    <div class="card">
      <h2>تصفية وعرض البيانات</h2>
      <div class="toolbar">
        <div class="field">
          <label>البلدية</label>
          <select id="filterMunicipality"><option value="">كل البلديات</option></select>
        </div>
        <div class="field">
          <label>نوع المعدة</label>
          <select id="filterType"><option value="">كل الأنواع</option></select>
        </div>
        <div class="field">
          <label>حالة المعدة</label>
          <select id="filterStatus"><option value="">كل الحالات</option></select>
        </div>
        <div class="field">
          <label>بحث (مركز / ماركة / رقم تسلسلي)</label>
          <input id="filterSearch" placeholder="اكتب للبحث...">
        </div>
        <div>
          <button class="btn btn-primary" id="exportBtn">⬇ تصدير إلى Excel</button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>البلدية</th><th>المركز الصحي</th><th>نوع المعدة</th><th>الماركة/الموديل</th>
              <th>الرقم التسلسلي</th><th>السعة (لتر)</th><th>الحالة</th><th>ملاحظات</th>
            </tr>
          </thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>
      <div class="empty-state" id="emptyState" style="display:none;">لا توجد بيانات مطابقة لمعايير البحث.</div>
    </div>

    <footer class="note">منصة وزارة الصحة — جرد معدات سلسلة التبريد لبرنامج التطعيم</footer>
  </div>

<script type="module">
import {
  auth, db, signInAnonymously, onAuthStateChanged,
  collection, onSnapshot
} from "./firebase-config.js";
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS } from "./data.js";

let allEquipment = [];

const fType = document.getElementById("filterType");
EQUIPMENT_TYPES.forEach(t => fType.add(new Option(t, t)));
const fStatus = document.getElementById("filterStatus");
EQUIPMENT_STATUS.forEach(s => fStatus.add(new Option(s, s)));

signInAnonymously(auth).catch(() => {});
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  listenAll();
});

function listenAll() {
  onSnapshot(collection(db, "equipment"), (snap) => {
    allEquipment = [];
    snap.forEach(d => allEquipment.push({ id: d.id, ...d.data() }));
    populateMunicipalityFilter();
    renderStats();
    renderTable();
  });
}

function populateMunicipalityFilter() {
  const sel = document.getElementById("filterMunicipality");
  const current = sel.value;
  const set = new Set(allEquipment.map(e => e.municipality));
  sel.innerHTML = '<option value="">كل البلديات</option>';
  [...set].sort().forEach(m => sel.add(new Option(m, m)));
  sel.value = current;
}

function renderStats() {
  const municipalities = new Set(allEquipment.map(e => e.municipality));
  const centers = new Set(allEquipment.map(e => e.centerId));
  const totalCapacity = allEquipment.reduce((s, e) => s + (Number(e.capacity) || 0), 0);
  const ok = allEquipment.filter(e => e.status === "تعمل بكفاءة").length;
  const bad = allEquipment.filter(e => e.status === "تحتاج صيانة" || e.status === "متوقفة عن العمل" || e.status === "خارج الخدمة نهائياً").length;

  document.getElementById("statMunicipalities").textContent = municipalities.size;
  document.getElementById("statCenters").textContent = centers.size;
  document.getElementById("statEquip").textContent = allEquipment.length;
  document.getElementById("statCapacity").textContent = totalCapacity.toLocaleString("en-US");
  document.getElementById("statOk").textContent = ok;
  document.getElementById("statBad").textContent = bad;
}

function getFiltered() {
  const m = document.getElementById("filterMunicipality").value;
  const t = document.getElementById("filterType").value;
  const s = document.getElementById("filterStatus").value;
  const q = document.getElementById("filterSearch").value.trim().toLowerCase();

  return allEquipment.filter(e => {
    if (m && e.municipality !== m) return false;
    if (t && e.type !== t) return false;
    if (s && e.status !== s) return false;
    if (q) {
      const hay = `${e.centerName || ""} ${e.brand || ""} ${e.serial || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function statusBadge(status) {
  if (status === "تعمل بكفاءة") return `<span class="badge badge-ok">${status}</span>`;
  if (status === "تحتاج صيانة") return `<span class="badge badge-warn">${status}</span>`;
  return `<span class="badge badge-bad">${status || "غير محدد"}</span>`;
}

function renderTable() {
  const rows = getFiltered();
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  document.getElementById("emptyState").style.display = rows.length ? "none" : "block";
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.municipality || ""}</td>
      <td>${r.centerName || ""}</td>
      <td>${r.type || ""}</td>
      <td>${r.brand || "-"}</td>
      <td>${r.serial || "-"}</td>
      <td>${r.capacity ?? "-"}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${r.notes || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

["filterMunicipality", "filterType", "filterStatus", "filterSearch"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderTable);
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const rows = getFiltered().map(r => ({
    "البلدية": r.municipality || "",
    "المركز الصحي": r.centerName || "",
    "نوع المعدة": r.type || "",
    "الماركة/الموديل": r.brand || "",
    "الرقم التسلسلي": r.serial || "",
    "السعة التخزينية (لتر)": r.capacity ?? "",
    "حالة المعدة": r.status || "",
    "ملاحظات": r.notes || ""
  }));
  if (rows.length === 0) return alert("لا توجد بيانات لتصديرها");

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{wch:16},{wch:22},{wch:24},{wch:20},{wch:18},{wch:18},{wch:18},{wch:28}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "جرد المعدات");
  const dateStr = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `جرد_معدات_سلسلة_التبريد_${dateStr}.xlsx`);
});
</script>
<script>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
</script>
</body>
</html>
