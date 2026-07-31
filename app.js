import {
  CHECKLIST_SECTIONS,
  CHAPTER_BLOCKS,
  STATUS_OPTIONS,
  NATURE_OPTIONS,
  createProject,
  calcProgress,
} from "./schema.js";
import {
  buildDraftBody,
  draftStyles,
  exportWord,
  openPrintPdf,
} from "./draft.js";
import {
  loadSettings,
  saveSettings,
  fetchTeamManifest,
  fetchTeamProject,
  publishProject,
} from "./teamSync.js";
import { cloneSample } from "./sampleData.js";

const STORAGE_KEY = "woomi-proposal-workbench-v1";

const el = {
  metaName: document.getElementById("meta-name"),
  metaWorkflow: document.getElementById("meta-workflow"),
  metaSite: document.getElementById("meta-site"),
  metaRivals: document.getElementById("meta-rivals"),
  metaKeyword: document.getElementById("meta-keyword"),
  metaOwner: document.getElementById("meta-owner"),
  saveHint: document.getElementById("save-hint"),
  panelA: document.getElementById("panel-a"),
  panelB: document.getElementById("panel-b"),
  panelSummary: document.getElementById("panel-summary"),
  panelDraft: document.getElementById("panel-draft"),
  sideLocal: document.getElementById("side-local"),
  sideTeam: document.getElementById("side-team"),
  sideRef: document.getElementById("side-ref"),
  teamStatus: document.getElementById("team-sync-status"),
  btnNew: document.getElementById("btn-new"),
  btnExport: document.getElementById("btn-export"),
  btnDeleteProject: document.getElementById("btn-delete-project"),
  btnPublish: document.getElementById("btn-publish"),
  btnTeamRefresh: document.getElementById("btn-team-refresh"),
  btnSettings: document.getElementById("btn-settings"),
  btnSidebarToggle: document.getElementById("btn-sidebar-toggle"),
  btnSidebarClose: document.getElementById("btn-sidebar-close"),
  shell: document.getElementById("shell"),
  importFile: document.getElementById("import-file"),
  settingsDialog: document.getElementById("settings-dialog"),
  settingsForm: document.getElementById("settings-form"),
  setOwner: document.getElementById("set-owner"),
  setRepo: document.getElementById("set-repo"),
  setBranch: document.getElementById("set-branch"),
  setToken: document.getElementById("set-token"),
};

const SIDEBAR_KEY = "woomi-sidebar-open-v1";

function isSidebarOpen() {
  const saved = localStorage.getItem(SIDEBAR_KEY);
  // 첫 실행(값 없음) → 목록 연 상태
  if (saved == null) return true;
  return saved === "1";
}

function setSidebarOpen(open) {
  localStorage.setItem(SIDEBAR_KEY, open ? "1" : "0");
  el.shell?.classList.toggle("sidebar-collapsed", !open);
  if (el.btnSidebarToggle) {
    el.btnSidebarToggle.setAttribute("aria-expanded", open ? "true" : "false");
    el.btnSidebarToggle.title = open ? "진행 중 프로젝트 목록 닫기" : "진행 중 프로젝트 목록 열기";
  }
}

function toggleSidebar() {
  setSidebarOpen(!isSidebarOpen());
}

let state = loadState();
let activeId = state.activeId;
let saveTimer = null;
let teamManifest = { projects: [] };
let teamTimer = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.projects?.length) {
        if (!parsed.projects.some((p) => p.id === parsed.activeId)) {
          parsed.activeId = parsed.projects[0].id;
        }
        return parsed;
      }
    }
  } catch (_) { /* ignore */ }
  const p = createProject("기본 프로젝트 (사업장 미정)");
  return { activeId: p.id, projects: [p] };
}

function persist() {
  const project = current();
  if (project) project.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  el.saveHint.textContent = "자동 저장됨 " + new Date().toLocaleTimeString("ko-KR");
  renderSidebar();
}

function scheduleSave() {
  el.saveHint.textContent = "자동 저장 중…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 250);
}

function current() {
  let p = state.projects.find((x) => x.id === activeId);
  if (!p) {
    if (!state.projects.length) {
      const created = createProject("기본 프로젝트 (사업장 미정)");
      state.projects = [created];
    }
    p = state.projects[0];
    activeId = p.id;
    state.activeId = activeId;
  }
  return p;
}

function ensureProjectShape(p) {
  if (!p || typeof p !== "object") p = createProject("복구된 프로젝트");
  if (!p.meta) p.meta = { site: "", rivals: "", keyword: "", owner: "" };
  if (!p.workflowStatus) p.workflowStatus = "진행중";
  if (!p.name) p.name = "이름 없음";
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

function bindMeta() {
  const p = ensureProjectShape(current());
  el.metaName.value = p.name || "";
  el.metaWorkflow.value = p.workflowStatus || "진행중";
  el.metaSite.value = p.meta.site || "";
  el.metaRivals.value = p.meta.rivals || "";
  el.metaKeyword.value = p.meta.keyword || "";
  el.metaOwner.value = p.meta.owner || "";
}

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    return "";
  }
}

function sideCard({ id, title, sub, progress, status, active, when, badge, canDelete }) {
  const del = canDelete
    ? `<button type="button" class="side-del" data-del="${escapeAttr(id)}" title="이 프로젝트 삭제">삭제</button>`
    : "";
  return `<div class="side-card-wrap ${active ? "active" : ""}">
    <button type="button" class="side-card" data-open="${escapeAttr(id)}">
      <div class="side-card-top">
        <span class="side-card-title">${escapeHtml(title)}</span>
        <span class="side-badge status-${escapeAttr(status || "진행중")}">${escapeHtml(status || "진행중")}</span>
      </div>
      <p class="side-card-sub">${escapeHtml(sub || "사업장 미정")}</p>
      <div class="side-progress" aria-hidden="true"><i style="width:${progress || 0}%"></i></div>
      <div class="side-card-meta">
        <span>${progress || 0}%</span>
        <span>${escapeHtml(badge || when || "")}</span>
      </div>
    </button>
    ${del}
  </div>`;
}

function renderSidebar() {
  const locals = [...state.projects].sort((a, b) =>
    String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
  );
  el.sideLocal.innerHTML = locals.length
    ? locals
        .map((p) =>
          sideCard({
            id: `local:${p.id}`,
            title: p.name || "이름 없음",
            sub: [p.meta?.owner, p.meta?.site].filter(Boolean).join(" · ") || "사업장 미정",
            progress: calcProgress(p),
            status: p.workflowStatus || "진행중",
            active: p.id === activeId,
            when: formatWhen(p.updatedAt),
            canDelete: true,
          })
        )
        .join("")
    : `<p class="side-empty">아직 없습니다. 「새 프로젝트」를 눌러 주세요.</p>`;

  const team = teamManifest.projects || [];
  el.sideTeam.innerHTML = team.length
    ? team
        .map((t) =>
          sideCard({
            id: `team:${t.id}`,
            title: t.name || "이름 없음",
            sub: [t.owner, t.site].filter(Boolean).join(" · ") || "사업장 미정",
            progress: t.progress || 0,
            status: t.workflowStatus || "진행중",
            active: false,
            badge: formatWhen(t.updatedAt),
          })
        )
        .join("")
    : `<p class="side-empty">팀 공유에 올라온 프로젝트가 없습니다.</p>`;

  const sample = cloneSample();
  el.sideRef.innerHTML = sideCard({
    id: "ref:sample",
    title: sample.name,
    sub: `${sample.meta.owner} · 경쟁사수치 혼합`,
    progress: calcProgress(sample),
    status: "참고",
    active: activeId === sample.id,
    badge: "예시",
  });

  el.sideLocal.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => openFromSidebar(btn.dataset.open));
  });
  el.sideLocal.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      deleteLocalProject(btn.dataset.del.replace(/^local:/, ""));
    });
  });
  el.sideTeam.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => openFromSidebar(btn.dataset.open));
  });
  el.sideRef.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => openFromSidebar(btn.dataset.open));
  });
}

function deleteLocalProject(id) {
  const p = state.projects.find((x) => x.id === id);
  if (!p) return;
  const label = p.name || p.meta?.site || id;
  if (!confirm(`「${label}」프로젝트를 삭제할까요?\n이 PC에서만 지워집니다. (팀 공유에 올린 건 그대로 남을 수 있습니다)`)) {
    return;
  }
  state.projects = state.projects.filter((x) => x.id !== id);
  if (!state.projects.length) {
    const created = createProject("기본 프로젝트 (사업장 미정)");
    state.projects = [created];
    activeId = created.id;
  } else if (activeId === id) {
    activeId = state.projects[0].id;
  }
  state.activeId = activeId;
  persist();
  renderAll();
}

async function openFromSidebar(key) {
  if (key.startsWith("local:")) {
    activeId = key.slice(6);
    state.activeId = activeId;
    persist();
    renderAll();
    return;
  }
  if (key === "ref:sample") {
    const data = cloneSample();
    data.updatedAt = new Date().toISOString();
    upsertProject(data);
    // 채워진 내용이 바로 보이게 초안 탭으로
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    document.querySelector('.tab[data-tab="draft"]')?.classList.add("active");
    document.getElementById("panel-draft")?.classList.add("active");
    renderDraft();
    alert("샘플을 열었습니다. 숫자·멘트는 경쟁사 관측치를 섞은 가상 예시입니다. A/B 탭에서도 확인하세요.");
    return;
  }
  if (key.startsWith("team:")) {
    const id = key.slice(5);
    el.teamStatus.textContent = "팀 프로젝트 여는 중…";
    try {
      const data = await fetchTeamProject(id);
      const shaped = ensureProjectShape(data);
      const existing = state.projects.find((p) => p.id === shaped.id);
      if (existing && existing.updatedAt && shaped.updatedAt && existing.updatedAt > shaped.updatedAt) {
        const ok = confirm(
          "이 PC에 더 최근 수정본이 있습니다.\n팀 버전으로 덮을까요?\n(취소하면 내 버전을 그대로 엽니다)"
        );
        if (!ok) {
          activeId = existing.id;
          state.activeId = activeId;
          persist();
          renderAll();
          el.teamStatus.textContent = "내 버전으로 열림";
          return;
        }
      }
      upsertProject(shaped);
      el.teamStatus.textContent = "팀 프로젝트 열림 · 수정 후 「팀에 올리기」";
    } catch (e) {
      el.teamStatus.textContent = "열기 실패";
      alert("팀 프로젝트 열기 실패: " + e.message);
    }
  }
}

function upsertProject(data) {
  const shaped = ensureProjectShape(data);
  const idx = state.projects.findIndex((p) => p.id === shaped.id);
  if (idx >= 0) state.projects[idx] = shaped;
  else state.projects.unshift(shaped);
  activeId = shaped.id;
  state.activeId = activeId;
  persist();
  renderAll();
}

async function refreshTeamList() {
  el.teamStatus.textContent = "팀 목록 불러오는 중…";
  try {
    teamManifest = await fetchTeamManifest();
    const n = teamManifest.projects?.length || 0;
    el.teamStatus.textContent = n
      ? `팀 공유 ${n}건 · ${formatWhen(teamManifest.updatedAt) || "방금"}`
      : "팀 공유 비어 있음 · 「팀에 올리기」로 공유";
    renderSidebar();
  } catch (e) {
    el.teamStatus.textContent = "목록 불러오기 실패(배포·설정 확인)";
    console.warn(e);
    renderSidebar();
  }
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
      if (field === "status") node.className = `row-select status-${node.value}`;
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
    node.addEventListener("input", () => {
      p.chapters[node.dataset.ch] = node.value;
      scheduleSave();
    });
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
      if (sec.id === "abs" && (st === "미포함" || st === "미정")) absMissing.push(row.item);
    }
  }
  const site = p.meta.site?.trim() || "사업장 미정";
  const rivals = p.meta.rivals?.trim() || "경쟁사 미정";
  const prog = calcProgress(p);

  el.panelSummary.innerHTML = `
    <div class="summary-grid">
      <div class="stat"><p class="n">${prog}%</p><p class="l">진행률</p></div>
      <div class="stat"><p class="n">${counts["포함"]}</p><p class="l">포함</p></div>
      <div class="stat"><p class="n" style="color:var(--danger)">${counts["미포함"]}</p><p class="l">미포함</p></div>
      <div class="stat"><p class="n" style="color:var(--muted)">${counts["미정"]}</p><p class="l">미정</p></div>
    </div>
    <article class="section">
      <div class="section-head"><h2>프로젝트 요약</h2><p></p></div>
      <div class="stack">
        <p style="margin:0"><strong>${escapeHtml(site)}</strong> · ${escapeHtml(rivals)} · 키워드 ${escapeHtml(p.meta.keyword || "—")} · ${escapeHtml(p.meta.owner || "담당 미정")}</p>
        <p style="margin:0;color:var(--muted);font-size:0.9rem">절대 기준선 미정/미포함: ${
          absMissing.length ? absMissing.map(escapeHtml).join(", ") : "없음 (좋음)"
        }</p>
        <p style="margin:0;color:var(--muted);font-size:0.9rem">팀원 참고용으로 공유하려면 왼쪽 「지금 프로젝트를 팀에 올리기」.</p>
      </div>
    </article>`;
}

function renderDraft() {
  const p = ensureProjectShape(current());
  el.panelDraft.innerHTML = `
    <article class="section">
      <div class="section-head">
        <h2>제안서 초안 내보내기</h2>
        <p>A·B에 적은 내용으로 초안을 만듭니다</p>
      </div>
      <div class="stack">
        <p style="margin:0;color:var(--muted);font-size:0.9rem">
          표지 → 도입 → 케어 4단 → 원안/대안 → 디자인 9단 → Business → 체크리스트 순으로 장이 나뉩니다.
        </p>
        <div class="draft-actions">
          <button type="button" class="btn" id="btn-draft-word">워드로 받기 (.doc)</button>
          <button type="button" class="btn ghost" id="btn-draft-pdf">PDF로 저장 (인쇄)</button>
        </div>
      </div>
    </article>
    <article class="section">
      <div class="section-head"><h2>미리보기</h2><p>아래가 내보내질 내용입니다</p></div>
      <div class="draft-preview">
        <style>${draftStyles()}
          .draft-preview .cover { min-height: auto; padding: 8px 0 24px; }
          .draft-preview .page-break {
            page-break-before: auto; break-before: auto; height: auto;
            margin: 28px 0; border-top: 1px dashed var(--line);
          }
          .draft-preview .page-break::after {
            content: "— 여기서 다음 장 —"; display: block; text-align: center;
            color: var(--muted); font-size: 0.75rem; font-weight: 700; padding-top: 8px;
          }
        </style>
        ${buildDraftBody(p)}
      </div>
    </article>`;
  el.panelDraft.querySelector("#btn-draft-word")?.addEventListener("click", () => exportWord(p));
  el.panelDraft.querySelector("#btn-draft-pdf")?.addEventListener("click", () => openPrintPdf(p));
}

function renderAll() {
  try {
    ensureProjectShape(current());
    bindMeta();
    renderSidebar();
    renderA();
    renderB();
    renderSummary();
    if (document.querySelector('.tab[data-tab="draft"].active')) renderDraft();
  } catch (err) {
    console.error(err);
    el.saveHint.textContent = "화면 복구 중…";
    const p = createProject("기본 프로젝트 (사업장 미정)");
    state = { activeId: p.id, projects: [p] };
    activeId = p.id;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    bindMeta();
    renderSidebar();
    renderA();
    renderB();
    renderSummary();
  }
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

/* meta */
[
  [el.metaName, (p, v) => { p.name = v; }],
  [el.metaWorkflow, (p, v) => { p.workflowStatus = v; }],
  [el.metaSite, (p, v) => { p.meta.site = v; }],
  [el.metaRivals, (p, v) => { p.meta.rivals = v; }],
  [el.metaKeyword, (p, v) => { p.meta.keyword = v; }],
  [el.metaOwner, (p, v) => { p.meta.owner = v; }],
].forEach(([node, apply]) => {
  const ev = node.tagName === "SELECT" ? "change" : "input";
  node.addEventListener(ev, () => {
    const p = current();
    apply(p, node.value);
    if (node === el.metaKeyword && document.querySelector('.tab[data-tab="b"].active')) renderB();
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
    if (tab.dataset.tab === "draft") renderDraft();
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

el.btnDeleteProject?.addEventListener("click", () => {
  deleteLocalProject(activeId);
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
    const data = JSON.parse(await file.text());
    if (!data.id || !data.checklist) throw new Error("형식이 올바르지 않습니다.");
    upsertProject(data);
    alert("파일 불러오기 완료");
  } catch (e) {
    alert("파일 불러오기 실패: " + e.message);
  } finally {
    el.importFile.value = "";
  }
});

el.btnPublish.addEventListener("click", async () => {
  const p = ensureProjectShape(current());
  if (!loadSettings().token?.trim()) {
    alert("먼저 「팀 공유 설정」에서 GitHub 토큰을 저장해 주세요.");
    el.settingsDialog.showModal();
    return;
  }
  el.btnPublish.disabled = true;
  el.teamStatus.textContent = "팀에 올리는 중…";
  try {
    teamManifest = await publishProject(p, calcProgress);
    el.teamStatus.textContent = "팀에 올림 · 다른 사람도 왼쪽에서 볼 수 있습니다";
    renderSidebar();
    alert("팀에 올렸습니다. 잠시 후 다른 사람 화면의 「팀 새로고침」을 누르면 보입니다.");
  } catch (e) {
    el.teamStatus.textContent = "올리기 실패";
    alert("팀에 올리기 실패: " + e.message);
  } finally {
    el.btnPublish.disabled = false;
  }
});

el.btnTeamRefresh.addEventListener("click", () => refreshTeamList());

el.btnSettings.addEventListener("click", () => {
  const s = loadSettings();
  el.setOwner.value = s.owner;
  el.setRepo.value = s.repo;
  el.setBranch.value = s.branch;
  el.setToken.value = s.token;
  el.settingsDialog.showModal();
});

el.settingsForm.addEventListener("submit", (ev) => {
  const val = ev.submitter?.value;
  if (val === "save") {
    saveSettings({
      owner: el.setOwner.value.trim() || "kimminseong8940-prog",
      repo: el.setRepo.value.trim() || "woomi-proposal-workbench",
      branch: el.setBranch.value.trim() || "main",
      token: el.setToken.value.trim(),
    });
    refreshTeamList();
  }
});

el.btnSidebarToggle?.addEventListener("click", toggleSidebar);
el.btnSidebarClose?.addEventListener("click", () => setSidebarOpen(false));

setSidebarOpen(isSidebarOpen());
renderAll();
refreshTeamList();
teamTimer = setInterval(refreshTeamList, 60000);
