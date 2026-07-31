import {
  CHECKLIST_SECTIONS,
  CHAPTER_BLOCKS,
  STATUS_OPTIONS,
  NATURE_OPTIONS,
  createProject,
} from "./schema.js";

const STORAGE_KEY = "woomi-proposal-workbench-v1";

const el = {
  projectSelect: document.getElementById("project-select"),
  metaSite: document.getElementById("meta-site"),
  metaRivals: document.getElementById("meta-rivals"),
  metaKeyword: document.getElementById("meta-keyword"),
  metaOwner: document.getElementById("meta-owner"),
  saveHint: document.getElementById("save-hint"),
  panelA: document.getElementById("panel-a"),
  panelB: document.getElementById("panel-b"),
  panelSummary: document.getElementById("panel-summary"),
  btnNew: document.getElementById("btn-new"),
  btnExport: document.getElementById("btn-export"),
  importFile: document.getElementById("import-file"),
};

let state = loadState();
let activeId = state.activeId;
let saveTimer = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.projects?.length) return parsed;
    }
  } catch (_) { /* ignore */ }
  const p = createProject("기본 프로젝트 (사업장 미정)");
  return { activeId: p.id, projects: [p] };
}

function persist() {
  const project = current();
  if (project) project.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  el.saveHint.textContent = "저장됨 " + new Date().toLocaleTimeString("ko-KR");
}

function scheduleSave() {
  el.saveHint.textContent = "저장 중…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 250);
}

function current() {
  return state.projects.find((p) => p.id === activeId);
}

function ensureProjectShape(p) {
  if (!p.meta) p.meta = { site: "", rivals: "", keyword: "", owner: "" };
  if (!p.checklist) p.checklist = {};
  if (!p.chapters) p.chapters = {};
  for (const sec of CHECKLIST_SECTIONS) {
    for (const row of sec.rows) {
      if (!p.checklist[row.id]) {
        p.checklist[row.id] = {
          status: "미정",
          draft: "",
          nature: row.nature ? "미정" : "해당없음",
          note: "",
        };
      }
    }
  }
  for (const block of CHAPTER_BLOCKS) {
    for (const f of block.fields) {
      if (p.chapters[f.id] == null) p.chapters[f.id] = "";
    }
  }
  return p;
}

function refreshProjectSelect() {
  el.projectSelect.innerHTML = state.projects
    .map((p) => {
      const label = p.meta?.site?.trim()
        ? `${p.name} · ${p.meta.site}`
        : p.name;
      return `<option value="${p.id}" ${p.id === activeId ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");
}

function bindMeta() {
  const p = ensureProjectShape(current());
  el.metaSite.value = p.meta.site || "";
  el.metaRivals.value = p.meta.rivals || "";
  el.metaKeyword.value = p.meta.keyword || "";
  el.metaOwner.value = p.meta.owner || "";
}

function renderA() {
  const p = ensureProjectShape(current());
  el.panelA.innerHTML = CHECKLIST_SECTIONS.map((sec) => {
    const rows = sec.rows
      .map((row) => {
        const cell = p.checklist[row.id];
        const natureCell = row.nature
          ? `<select class="row-select" data-cell="${row.id}" data-field="nature">${NATURE_OPTIONS.map(
              (o) => `<option ${cell.nature === o ? "selected" : ""}>${o}</option>`
            ).join("")}</select>`
          : "—";
        return `<tr>
          <td class="item">${escapeHtml(row.item)}</td>
          <td class="baseline">${escapeHtml(row.baseline)}</td>
          <td><input class="row-input" data-cell="${row.id}" data-field="draft" value="${escapeAttr(cell.draft)}" placeholder="우미 초안" /></td>
          <td>${natureCell}</td>
          <td>
            <select class="row-select status-${cell.status}" data-cell="${row.id}" data-field="status">
              ${STATUS_OPTIONS.map((o) => `<option ${cell.status === o ? "selected" : ""}>${o}</option>`).join("")}
            </select>
          </td>
          <td><input class="row-input" data-cell="${row.id}" data-field="note" value="${escapeAttr(cell.note)}" placeholder="메모" /></td>
        </tr>`;
      })
      .join("");
    return `<article class="section">
      <div class="section-head">
        <h2>${escapeHtml(sec.title)}</h2>
        <p>${escapeHtml(sec.hint)}</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>항목</th><th>업계 기준선</th><th>우미 초안</th><th>성격</th><th>상태</th><th>메모</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>`;
  }).join("");

  el.panelA.querySelectorAll("[data-cell]").forEach((node) => {
    const handler = () => {
      const id = node.dataset.cell;
      const field = node.dataset.field;
      p.checklist[id][field] = node.value;
      if (field === "status") {
        node.className = `row-select status-${node.value}`;
      }
      scheduleSave();
      if (document.querySelector('.tab[data-tab="summary"].active')) renderSummary();
    };
    node.addEventListener("input", handler);
    node.addEventListener("change", handler);
  });
}

function renderB() {
  const p = ensureProjectShape(current());
  const kw = p.meta.keyword?.trim() || "KEYWORD";
  el.panelB.innerHTML = `
    <article class="section">
      <div class="section-head">
        <h2>키워드 적용 안내</h2>
        <p>챕터명에 반복할 단어: <strong>${escapeHtml(kw)}</strong> (상단에서 수정)</p>
      </div>
      <div class="stack">
        <p style="margin:0;color:var(--muted);font-size:0.9rem">
          권장 흐름: 표지 → 슬로건 → 헌사 → 핵심수치 → 비전 → 생활권 → Alliance → Partner →
          <strong>${escapeHtml(kw)} CARE 4단</strong> → 특별제공 → 디자인 9단 → Business 5단 → 확약.
        </p>
      </div>
    </article>
    ${CHAPTER_BLOCKS.map((block) => {
      const fields = block.fields
        .map((f) => {
          const val = p.chapters[f.id] || "";
          const control =
            f.type === "textarea"
              ? `<textarea data-ch="${f.id}">${escapeHtml(val)}</textarea>`
              : `<input type="text" data-ch="${f.id}" value="${escapeAttr(val)}" />`;
          return `<div class="field"><label>${escapeHtml(f.label)}${control}</label></div>`;
        })
        .join("");
      return `<article class="section">
        <div class="section-head"><h2>${escapeHtml(block.title)}</h2><p></p></div>
        <div class="stack field-grid">${fields}</div>
      </article>`;
    }).join("")}`;

  el.panelB.querySelectorAll("[data-ch]").forEach((node) => {
    const handler = () => {
      p.chapters[node.dataset.ch] = node.value;
      scheduleSave();
    };
    node.addEventListener("input", handler);
  });
}

function renderSummary() {
  const p = ensureProjectShape(current());
  const counts = { 미정: 0, 포함: 0, 미포함: 0, 해당없음: 0, 차별화카드: 0 };
  const absMissing = [];
  for (const sec of CHECKLIST_SECTIONS) {
    for (const row of sec.rows) {
      const st = p.checklist[row.id].status;
      counts[st] = (counts[st] || 0) + 1;
      if (sec.id === "abs" && (st === "미포함" || st === "미정")) {
        absMissing.push(row.item);
      }
    }
  }
  const site = p.meta.site?.trim() || "사업장 미정";
  const rivals = p.meta.rivals?.trim() || "경쟁사 미정";

  el.panelSummary.innerHTML = `
    <div class="summary-grid">
      <div class="stat"><p class="n">${counts["포함"]}</p><p class="l">포함</p></div>
      <div class="stat"><p class="n" style="color:var(--danger)">${counts["미포함"]}</p><p class="l">미포함</p></div>
      <div class="stat"><p class="n" style="color:var(--muted)">${counts["미정"]}</p><p class="l">미정</p></div>
      <div class="stat"><p class="n" style="color:var(--warn)">${counts["차별화카드"]}</p><p class="l">차별화 카드</p></div>
    </div>
    <article class="section">
      <div class="section-head"><h2>프로젝트 요약</h2><p></p></div>
      <div class="stack">
        <p style="margin:0"><strong>${escapeHtml(site)}</strong> · ${escapeHtml(rivals)} · 키워드 ${escapeHtml(p.meta.keyword || "—")} · ${escapeHtml(p.meta.owner || "담당 미정")}</p>
        <p style="margin:0;color:var(--muted);font-size:0.9rem">절대 기준선에서 미정/미포함: ${
          absMissing.length
            ? absMissing.map(escapeHtml).join(", ")
            : "없음 (좋음)"
        }</p>
        <p style="margin:0;color:var(--muted);font-size:0.9rem">다음 액션: 절대 기준선(§1)을 모두 «포함»으로 만든 뒤, 케어 4단·원안/대안 표를 채우세요. 팀 공유는 «파일로 저장» 후 전달.</p>
      </div>
    </article>`;
}

function renderAll() {
  refreshProjectSelect();
  bindMeta();
  renderA();
  renderB();
  renderSummary();
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll("'", "&#39;");
}

/* events */
el.projectSelect.addEventListener("change", () => {
  activeId = el.projectSelect.value;
  state.activeId = activeId;
  persist();
  renderAll();
});

[
  [el.metaSite, "site"],
  [el.metaRivals, "rivals"],
  [el.metaKeyword, "keyword"],
  [el.metaOwner, "owner"],
].forEach(([node, key]) => {
  node.addEventListener("input", () => {
    const p = current();
    p.meta[key] = node.value;
    if (key === "site" || key === "keyword") {
      refreshProjectSelect();
      if (key === "keyword" && document.querySelector('.tab[data-tab="b"].active')) renderB();
    }
    scheduleSave();
    if (document.querySelector('.tab[data-tab="summary"].active')) renderSummary();
  });
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
    if (tab.dataset.tab === "summary") renderSummary();
    if (tab.dataset.tab === "b") renderB();
  });
});

el.btnNew.addEventListener("click", () => {
  const name = prompt("프로젝트 이름", "새 프로젝트 (사업장 미정)");
  if (name == null) return;
  const p = createProject(name.trim() || "새 프로젝트");
  state.projects.unshift(p);
  activeId = p.id;
  state.activeId = activeId;
  persist();
  renderAll();
});

el.btnExport.addEventListener("click", () => {
  const p = current();
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const site = p.meta.site?.trim() || "미정";
  a.href = URL.createObjectURL(blob);
  a.download = `우미제안서_${site}_${p.id}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

el.importFile.addEventListener("change", async () => {
  const file = el.importFile.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.id || !data.checklist) throw new Error("형식이 올바르지 않습니다.");
    const existing = state.projects.findIndex((p) => p.id === data.id);
    const shaped = ensureProjectShape(data);
    if (existing >= 0) state.projects[existing] = shaped;
    else state.projects.unshift(shaped);
    activeId = shaped.id;
    state.activeId = activeId;
    persist();
    renderAll();
    alert("파일 불러오기 완료");
  } catch (e) {
    alert("파일 불러오기 실패: " + e.message);
  } finally {
    el.importFile.value = "";
  }
});

renderAll();
