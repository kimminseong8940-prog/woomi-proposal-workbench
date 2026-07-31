/** 팀 공유 — GitHub 저장소의 team-projects/ 폴더로 동기화 */

const SETTINGS_KEY = "woomi-team-sync-settings-v1";

const DEFAULT_SETTINGS = {
  owner: "kimminseong8940-prog",
  repo: "woomi-proposal-workbench",
  branch: "main",
  token: "",
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (_) { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings( partial ) {
  const next = { ...loadSettings(), ...partial };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function pagesManifestUrl() {
  const s = loadSettings();
  return `https://${s.owner}.github.io/${s.repo}/team-projects/manifest.json`;
}

export function rawManifestUrl() {
  const s = loadSettings();
  return `https://raw.githubusercontent.com/${s.owner}/${s.repo}/${s.branch}/team-projects/manifest.json?t=${Date.now()}`;
}

async function gh(path, { method = "GET", body } = {}) {
  const s = loadSettings();
  if (!s.token?.trim()) throw new Error("팀 공유 설정에서 GitHub 토큰을 먼저 넣어 주세요.");
  const res = await fetch(`https://api.github.com/repos/${s.owner}/${s.repo}/contents/${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${s.token.trim()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `GitHub 오류 (${res.status})`);
  }
  return data;
}

async function getContentSha(path) {
  try {
    const data = await gh(path);
    return data.sha || null;
  } catch (e) {
    if (String(e.message).includes("Not Found")) return null;
    throw e;
  }
}

function toBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function fromBase64Utf8(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function fetchTeamManifest() {
  // 공개 Pages/raw 우선 (토큰 없어도 목록 조회)
  const urls = [rawManifestUrl(), pagesManifestUrl() + `?t=${Date.now()}`];
  let lastErr = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`목록을 못 불러왔습니다 (${res.status})`);
      const data = await res.json();
      if (!data || !Array.isArray(data.projects)) {
        return { updatedAt: null, projects: [] };
      }
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  // 토큰 있으면 API로 재시도
  try {
    const file = await gh("team-projects/manifest.json");
    return JSON.parse(fromBase64Utf8(file.content.replace(/\n/g, "")));
  } catch (_) {
    if (lastErr) throw lastErr;
    return { updatedAt: null, projects: [] };
  }
}

export async function fetchTeamProject(id) {
  const path = `team-projects/${id}.json`;
  // raw first
  const s = loadSettings();
  const raw = `https://raw.githubusercontent.com/${s.owner}/${s.repo}/${s.branch}/${path}?t=${Date.now()}`;
  try {
    const res = await fetch(raw, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (_) { /* fall through */ }
  const file = await gh(path);
  return JSON.parse(fromBase64Utf8(file.content.replace(/\n/g, "")));
}

function summarize(p, progressFn) {
  return {
    id: p.id,
    name: p.name || "이름 없음",
    site: p.meta?.site || "",
    owner: p.meta?.owner || "",
    keyword: p.meta?.keyword || "",
    workflowStatus: p.workflowStatus || "진행중",
    progress: progressFn(p),
    updatedAt: p.updatedAt || new Date().toISOString(),
  };
}

export async function publishProject(project, progressFn) {
  const id = project.id;
  const path = `team-projects/${id}.json`;
  const payload = JSON.stringify(project, null, 2);
  const sha = await getContentSha(path);
  await gh(path, {
    method: "PUT",
    body: {
      message: `Update team project ${id}`,
      content: toBase64Utf8(payload),
      branch: loadSettings().branch,
      ...(sha ? { sha } : {}),
    },
  });

  let manifest = { updatedAt: null, projects: [] };
  try {
    manifest = await fetchTeamManifest();
  } catch (_) { /* new */ }
  const summary = summarize(project, progressFn);
  const others = (manifest.projects || []).filter((x) => x.id !== id);
  const next = {
    updatedAt: new Date().toISOString(),
    projects: [summary, ...others].sort((a, b) =>
      String(b.updatedAt).localeCompare(String(a.updatedAt))
    ),
  };
  const msha = await getContentSha("team-projects/manifest.json");
  await gh("team-projects/manifest.json", {
    method: "PUT",
    body: {
      message: "Update team projects manifest",
      content: toBase64Utf8(JSON.stringify(next, null, 2)),
      branch: loadSettings().branch,
      ...(msha ? { sha: msha } : {}),
    },
  });
  return next;
}
