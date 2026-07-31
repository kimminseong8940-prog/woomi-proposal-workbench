/** 우미 제안서 워크벤치 — 항목 스키마 (마스터 v9 §9·§10·§4 기반) */

export const STATUS_OPTIONS = ["미정", "포함", "미포함", "해당없음", "차별화카드"];
export const NATURE_OPTIONS = ["미정", "증여", "대여", "해당없음"];

export const CHECKLIST_SECTIONS = [
  {
    id: "abs",
    title: "1. 절대 기준선 (빠지면 치명)",
    hint: "2021~2026 관측상 사실상 필수",
    rows: [
      { id: "a1", item: "미분양 100% 대물변제/인수", baseline: "2021부터 공통 → 최소 5년 기준선", nature: true },
      { id: "a2", item: "이주비 LTV 100% 또는 동급+α", baseline: "100% 표준 / DL150% / GS 최저20억 보장", nature: true },
      { id: "a3", item: "착공 후 물가상승 조정 없음", baseline: "2017~ 업계 최고참 표준", nature: false },
      { id: "a4", item: "확정공사비(인상 없음 범위 명시)", baseline: "전사 공통 프레임", nature: false },
      { id: "a5", item: "필수사업비 책임조달 + 금리", baseline: "CD+0%대 이하가 2026 표준선", nature: true },
    ],
  },
  {
    id: "trust",
    title: "2. 신뢰·확약 (헤드라인화 권장)",
    hint: "금액·실명을 전면에",
    rows: [
      { id: "t1", item: "계약이행보증 금액 헤드라인", baseline: "2023 이후 금액 공개 관측(롯데 예외 사례)", nature: false },
      { id: "t2", item: "책임준공 확약서", baseline: "포스코·현대·GS 등 패키지화", nature: false },
      { id: "t3", item: "대안설계 인허가 비용부담 확약", baseline: "GS 30억 등", nature: false },
      { id: "t4", item: "영업정지 피해방지 확약", baseline: "다수사 채택", nature: false },
      { id: "t5", item: "법률 파트너 실명", baseline: "김앤장 등 헤드라인화", nature: false },
      { id: "t6", item: "신용등급 + 부채비율", baseline: "AA-급+부채% 병기 표준(투명 공개=우위)", nature: false },
      { id: "t7", item: "시공능력·정비 준공실적", baseline: "숫자 헤드라인", nature: false },
    ],
  },
  {
    id: "product",
    title: "3. 상품·공간 헤드라인",
    hint: "조합원이 바로 비교하는 숫자",
    rows: [
      { id: "p1", item: "커뮤니티 면적(세대당 평)", baseline: "현대11.26 / 포스코6.02 / 컬리넌5.6 / GS5.53", nature: false },
      { id: "p2", item: "천장고(기준층)", baseline: "2.9~3.0m대 경쟁", nature: false },
      { id: "p3", item: "주차(세대당)·전기차", baseline: "원안↔대안으로 강조", nature: false },
      { id: "p4", item: "특별제공 리스트", baseline: "번호형 17개± 또는 제도형", nature: false },
      { id: "p5", item: "마감재 브랜드 확정 표기", baseline: "독일창호·주방 국룰 / '~급'만 쓰면 약점", nature: false },
      { id: "p6", item: "분양 방식 고유명칭", baseline: "골든타임 등 + 우미 고유명", nature: false },
    ],
  },
  {
    id: "design",
    title: "4. 디자인·컨소시엄",
    hint: "보유보다 관계 스토리",
    rows: [
      { id: "d1", item: "Top Alliance 최소 1분야", baseline: "카드: 회사/인물/대표작/수상", nature: false },
      { id: "d2", item: "파트너 관계 스토리", baseline: "동일사 동시기용 가능 → 장기협업 스토리", nature: false },
      { id: "d3", item: "공간·존 고유 네이밍", baseline: "영문고유명+한글부연", nature: false },
      { id: "d4", item: "생활권 프레이밍", baseline: "교육/문화/교통 카테고리", nature: false },
    ],
  },
  {
    id: "service",
    title: "5. 선택·서비스 (표준화 중)",
    hint: "있다/없다보다 구체성",
    rows: [
      { id: "s1", item: "로보틱스/스마트", baseline: "2026: 현대·GS·롯데 구체화", nature: false },
      { id: "s2", item: "가전 소유 vs 구독", baseline: "GS·현대", nature: false },
      { id: "s3", item: "선택형(포인트/마감/층)", baseline: "배점·물량 로직이 핵심", nature: false },
      { id: "s4", item: "장기 사후관리", baseline: "품질5년·10년 리뉴얼 등", nature: false },
    ],
  },
  {
    id: "money",
    title: "6. 금전 혜택 (성격 강제)",
    hint: "액수만 쓰면 오독 — 증여/대여 필수",
    rows: [
      { id: "m1", item: "이사비", baseline: "한양 500만=대여 사례 주의", nature: true },
      { id: "m2", item: "사업추진비·촉진비", baseline: "관양 성격 미확인 사례 있음", nature: true },
      { id: "m3", item: "기타 금전 혜택", baseline: "항목명·금액·성격", nature: true },
    ],
  },
  {
    id: "gate",
    title: "7. 제출 전 품질 게이트",
    hint: "PDF·단위·인용 검증",
    rows: [
      { id: "g1", item: "단위 일관(세대당/총액, 평/㎡)", baseline: "혼용 금지", nature: false },
      { id: "g2", item: "PDF 폰트·다수 뷰어 테스트", baseline: "DL 라벨 깨짐 반면교사", nature: false },
      { id: "g3", item: "경쟁사 인용 1차 원문 대조", baseline: "축소인용 방지(롯데 사례)", nature: false },
      { id: "g4", item: "불리지표 대응 대안지표 세트", baseline: "재무 or 스펙 축 전환", nature: false },
    ],
  },
];

export const CHAPTER_BLOCKS = [
  {
    id: "intro",
    title: "도입 (표지~핵심수치)",
    fields: [
      { id: "slogan", label: "슬로건 (한 줄)", type: "text" },
      { id: "dedication", label: "헌사", type: "textarea" },
      { id: "headlines", label: "핵심수치 3~5개 (단위 포함)", type: "textarea" },
    ],
  },
  {
    id: "care",
    title: "케어 패키지 4단 (사업조건 뼈대)",
    fields: [
      { id: "care1", label: "① 이익/수익 — 넣을 약속", type: "textarea" },
      { id: "care2", label: "② 금융 — 조달·이주·분담 (성격 표기)", type: "textarea" },
      { id: "care3", label: "③ 품질·속도 — 확약·보증·하자", type: "textarea" },
      { id: "care4", label: "④ 선택·특전 — 제도·로보틱스·리뉴얼", type: "textarea" },
    ],
  },
  {
    id: "ba",
    title: "원안 vs 대안 표",
    fields: [
      { id: "ba_cost", label: "평당 공사비 (원안 → 대안)", type: "text" },
      { id: "ba_comm", label: "커뮤니티 세대당 평 (원안 → 대안)", type: "text" },
      { id: "ba_ceil", label: "천장고 (원안 → 대안)", type: "text" },
      { id: "ba_park", label: "주차 세대당 (원안 → 대안)", type: "text" },
      { id: "ba_gain", label: "조합원 추가이익", type: "text" },
    ],
  },
  {
    id: "design9",
    title: "디자인 9단 (고유 네이밍)",
    fields: [
      { id: "n1", label: "1 Landmark", type: "text" },
      { id: "n2", label: "2 View", type: "text" },
      { id: "n3", label: "3 Site/Architecture", type: "text" },
      { id: "n4", label: "4 Landscape 존 이름", type: "text" },
      { id: "n5", label: "5 Unit", type: "text" },
      { id: "n6", label: "6 Community", type: "text" },
      { id: "n7", label: "7 Public Space", type: "text" },
      { id: "n8", label: "8 Arcade/Commercial", type: "text" },
      { id: "n9", label: "9 System / 스마트", type: "text" },
    ],
  },
  {
    id: "biz",
    title: "Business Proposal 5단 메모",
    fields: [
      { id: "biz_overview", label: "사업개요", type: "textarea" },
      { id: "biz_units", label: "세대구성", type: "textarea" },
      { id: "biz_terms", label: "사업참여조건 (A체크리스트 이관)", type: "textarea" },
      { id: "biz_finish", label: "공사비포함항목·마감", type: "textarea" },
      { id: "biz_schedule", label: "사업일정 (없앨지 결정)", type: "textarea" },
    ],
  },
];

export function emptyChecklistState() {
  const cells = {};
  for (const sec of CHECKLIST_SECTIONS) {
    for (const row of sec.rows) {
      cells[row.id] = {
        status: "미정",
        draft: "",
        nature: row.nature ? "미정" : "해당없음",
        note: "",
      };
    }
  }
  return cells;
}

export function emptyChapterState() {
  const fields = {};
  for (const block of CHAPTER_BLOCKS) {
    for (const f of block.fields) fields[f.id] = "";
  }
  return fields;
}

export function createProject(name = "새 프로젝트") {
  const now = new Date().toISOString();
  return {
    id: `p_${Date.now().toString(36)}`,
    name,
    createdAt: now,
    updatedAt: now,
    workflowStatus: "진행중",
    meta: {
      site: "",
      rivals: "",
      keyword: "",
      owner: "",
    },
    checklist: emptyChecklistState(),
    chapters: emptyChapterState(),
  };
}

/** 0~100 진행률 (체크 응답 + 챕터 기입) */
export function calcProgress(p) {
  let done = 0;
  let total = 0;
  const checklist = p?.checklist || {};
  for (const sec of CHECKLIST_SECTIONS) {
    for (const row of sec.rows) {
      total += 1;
      const st = checklist[row.id]?.status;
      if (st && st !== "미정") done += 1;
    }
  }
  const chapters = p?.chapters || {};
  for (const block of CHAPTER_BLOCKS) {
    for (const f of block.fields) {
      total += 1;
      if (String(chapters[f.id] || "").trim()) done += 1;
    }
  }
  if (!total) return 0;
  return Math.round((done / total) * 100);
}
