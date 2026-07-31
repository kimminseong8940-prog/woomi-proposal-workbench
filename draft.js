/** 채운 내용 → 제안서 초안(HTML/Word/인쇄PDF) */

import { CHECKLIST_SECTIONS, CHAPTER_BLOCKS } from "./schema.js";

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function nl(s) {
  return esc(s).replaceAll("\n", "<br>");
}

function filled(s) {
  return String(s ?? "").trim().length > 0;
}

function pageBreak() {
  return `<div class="page-break"></div>`;
}

function block(title, bodyHtml) {
  if (!bodyHtml.trim()) return "";
  return `<section class="doc-sec">
    <h2>${esc(title)}</h2>
    ${bodyHtml}
  </section>`;
}

function kv(label, value) {
  if (!filled(value)) return "";
  return `<div class="kv"><span class="k">${esc(label)}</span><div class="v">${nl(value)}</div></div>`;
}

export function buildDraftBody(p) {
  const site = p.meta?.site?.trim() || "사업장 미정";
  const rivals = p.meta?.rivals?.trim() || "경쟁사 미정";
  const keyword = p.meta?.keyword?.trim() || "—";
  const owner = p.meta?.owner?.trim() || "담당 미정";
  const ch = p.chapters || {};
  const today = new Date().toLocaleDateString("ko-KR");

  const cover = `
    <section class="cover">
      <p class="eyebrow">우미건설 · 도시정비</p>
      <h1>입찰제안서 초안</h1>
      <p class="cover-site">${esc(site)}</p>
      <dl class="cover-meta">
        <div><dt>예상 경쟁사</dt><dd>${esc(rivals)}</dd></div>
        <div><dt>핵심 키워드</dt><dd>${esc(keyword)}</dd></div>
        <div><dt>담당</dt><dd>${esc(owner)}</dd></div>
        <div><dt>작성일</dt><dd>${esc(today)}</dd></div>
      </dl>
      <p class="cover-note">※ 워크벤치에서 자동 생성한 초안입니다. 디자인·도면·최종 문구는 별도 작업이 필요합니다.</p>
    </section>`;

  const introParts = [
    kv("슬로건", ch.slogan),
    kv("헌사", ch.dedication),
    kv("핵심수치", ch.headlines),
  ].join("");

  const careParts = [
    kv("① 이익/수익", ch.care1),
    kv("② 금융", ch.care2),
    kv("③ 품질·속도", ch.care3),
    kv("④ 선택·특전", ch.care4),
  ].join("");

  const baParts = [
    kv("평당 공사비 (원안 → 대안)", ch.ba_cost),
    kv("커뮤니티 세대당 평 (원안 → 대안)", ch.ba_comm),
    kv("천장고 (원안 → 대안)", ch.ba_ceil),
    kv("주차 세대당 (원안 → 대안)", ch.ba_park),
    kv("조합원 추가이익", ch.ba_gain),
  ].join("");

  const designParts = CHAPTER_BLOCKS.find((b) => b.id === "design9")
    .fields.map((f) => kv(f.label, ch[f.id]))
    .join("");

  const bizParts = CHAPTER_BLOCKS.find((b) => b.id === "biz")
    .fields.map((f) => kv(f.label, ch[f.id]))
    .join("");

  let checklistHtml = "";
  for (const sec of CHECKLIST_SECTIONS) {
    const rows = sec.rows
      .map((row) => {
        const cell = p.checklist?.[row.id] || {};
        if (cell.status === "해당없음" && !filled(cell.draft) && !filled(cell.note)) return "";
        return `<tr>
          <td>${esc(row.item)}</td>
          <td>${esc(cell.status || "미정")}</td>
          <td>${esc(cell.nature || "—")}</td>
          <td>${nl(cell.draft || "")}</td>
          <td>${nl(cell.note || "")}</td>
        </tr>`;
      })
      .filter(Boolean)
      .join("");
    if (!rows) continue;
    checklistHtml += `<h3>${esc(sec.title)}</h3>
      <table class="doc-table">
        <thead><tr><th>항목</th><th>상태</th><th>성격</th><th>우미 초안</th><th>메모</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  return [
    cover,
    pageBreak(),
    block("1. 도입", introParts || `<p class="empty">아직 적힌 내용이 없습니다. B탭 도입란을 채워 주세요.</p>`),
    pageBreak(),
    block(`2. ${keyword !== "—" ? keyword + " " : ""}CARE 패키지 4단`, careParts || `<p class="empty">아직 적힌 내용이 없습니다.</p>`),
    pageBreak(),
    block("3. 원안 vs 대안", baParts || `<p class="empty">아직 적힌 내용이 없습니다.</p>`),
    pageBreak(),
    block("4. 디자인 9단", designParts || `<p class="empty">아직 적힌 내용이 없습니다.</p>`),
    pageBreak(),
    block("5. Business Proposal", bizParts || `<p class="empty">아직 적힌 내용이 없습니다.</p>`),
    pageBreak(),
    block("6. 기준선 체크리스트", checklistHtml || `<p class="empty">아직 적힌 내용이 없습니다.</p>`),
  ].join("\n");
}

export function draftStyles() {
  return `
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "KoPubWorld Dotum", "Malgun Gothic", sans-serif;
      font-weight: 300;
      color: #1a221c;
      font-size: 11pt;
      line-height: 1.55;
      background: #fff;
    }
    .cover { min-height: 70vh; display: flex; flex-direction: column; justify-content: center; }
    .eyebrow { letter-spacing: 0.12em; text-transform: uppercase; color: #0d5c4d; font-weight: 700; font-size: 10pt; margin: 0 0 12px; }
    .cover h1 { margin: 0; font-size: 28pt; font-weight: 700; line-height: 1.2; }
    .cover-site { margin: 18px 0 28px; font-size: 18pt; font-weight: 400; }
    .cover-meta { margin: 0; display: grid; gap: 8px; max-width: 28rem; }
    .cover-meta div { display: grid; grid-template-columns: 7rem 1fr; gap: 8px; }
    .cover-meta dt { margin: 0; color: #5c6560; font-weight: 700; font-size: 9pt; }
    .cover-meta dd { margin: 0; font-weight: 400; }
    .cover-note { margin-top: 40px; color: #5c6560; font-size: 9pt; max-width: 36rem; }
    .page-break { page-break-before: always; break-before: page; height: 0; }
    .doc-sec { margin: 0 0 8px; }
    .doc-sec h2 {
      margin: 0 0 16px;
      font-size: 16pt;
      font-weight: 700;
      border-bottom: 2px solid #0d5c4d;
      padding-bottom: 8px;
      color: #0d5c4d;
    }
    .doc-sec h3 { margin: 18px 0 8px; font-size: 12pt; font-weight: 700; }
    .kv { margin: 0 0 12px; }
    .kv .k { display: block; font-size: 9pt; font-weight: 700; color: #5c6560; margin-bottom: 3px; }
    .kv .v { font-weight: 400; white-space: pre-wrap; }
    .empty { color: #8a9390; font-style: italic; }
    .doc-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 12px; }
    .doc-table th, .doc-table td {
      border: 1px solid #d0d0d0;
      padding: 6px 7px;
      vertical-align: top;
      text-align: left;
    }
    .doc-table th { background: #f3f6f5; font-weight: 700; color: #5c6560; }
    @media print {
      .no-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
}

export function buildFullHtml(p, { forWord = false } = {}) {
  const wordNs = forWord
    ? ` xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"`
    : "";
  const site = p.meta?.site?.trim() || "미정";
  return `<!DOCTYPE html>
<html lang="ko"${wordNs}>
<head>
<meta charset="utf-8" />
<title>우미제안서초안_${esc(site)}</title>
<style>${draftStyles()}</style>
</head>
<body>
${buildDraftBody(p)}
</body>
</html>`;
}

export function downloadBlob(filename, blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportWord(p) {
  const site = p.meta?.site?.trim() || "미정";
  const html = buildFullHtml(p, { forWord: true });
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  downloadBlob(`우미제안서초안_${site}.doc`, blob);
}

export function exportHtml(p) {
  const site = p.meta?.site?.trim() || "미정";
  const html = buildFullHtml(p);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  downloadBlob(`우미제안서초안_${site}.html`, blob);
}

export function openPrintPdf(p) {
  const html = buildFullHtml(p);
  const w = window.open("", "_blank");
  if (!w) {
    alert("팝업이 막혀 있습니다. 팝업을 허용한 뒤 다시 눌러 주세요.");
    return;
  }
  w.document.open();
  w.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8" /><title>인쇄 · PDF 저장</title>
<style>${draftStyles()}
.toolbar { position: sticky; top: 0; background: #fff; border-bottom: 1px solid #ddd; padding: 10px 14px; display: flex; gap: 8px; align-items: center; z-index: 2; }
.toolbar button { font: inherit; padding: 8px 12px; border: 1px solid #ccc; background: #0d5c4d; color: #fff; cursor: pointer; }
.toolbar p { margin: 0; color: #5c6560; font-size: 13px; }
.sheet { max-width: 210mm; margin: 24px auto; padding: 0 16px 48px; }
</style></head><body>
<div class="toolbar no-print">
  <button type="button" onclick="window.print()">PDF로 저장 (인쇄)</button>
  <p>인쇄 창에서 프린터를 「PDF로 저장」으로 고르면 됩니다. 장 나눔은 자동입니다.</p>
</div>
<div class="sheet">${buildDraftBody(p)}</div>
</body></html>`);
  w.document.close();
}
