import { useState } from "react";
import type { Exam } from "../types";

interface PageNavDesignPreviewProps {
  exam: Exam;
}

interface PageNavCandidate {
  id: string;
  name: string;
  shortName: string;
  themeClass: string;
  intent: string;
}

const pageNavCandidates: PageNavCandidate[] = [
  {
    id: "round-dots",
    name: "01 Round Dots",
    shortName: "Dots",
    themeClass: "page-nav-round-dots",
    intent: "現在の丸ボタンを基準にした最小案"
  },
  {
    id: "segmented-rail",
    name: "02 Segmented Rail",
    shortName: "Rail",
    themeClass: "page-nav-segmented-rail",
    intent: "横長レールでページ全体を一覧する案"
  },
  {
    id: "timeline",
    name: "03 Timeline",
    shortName: "Line",
    themeClass: "page-nav-timeline",
    intent: "進行状況を一本線で見せる案"
  },
  {
    id: "thumbnail-strip",
    name: "04 Thumbnail Strip",
    shortName: "Thumb",
    themeClass: "page-nav-thumbnail-strip",
    intent: "紙面サムネイルとして選ぶ案"
  },
  {
    id: "vertical-index",
    name: "05 Vertical Index",
    shortName: "Index",
    themeClass: "page-nav-vertical-index",
    intent: "左側の索引で素早く移動する案"
  },
  {
    id: "breadcrumb-chips",
    name: "06 Breadcrumb Chips",
    shortName: "Crumb",
    themeClass: "page-nav-breadcrumb-chips",
    intent: "パンくず風に現在位置を追う案"
  },
  {
    id: "command-palette",
    name: "07 Command Palette",
    shortName: "Cmd",
    themeClass: "page-nav-command-palette",
    intent: "暗いコマンドバーとしてまとめる案"
  },
  {
    id: "minimal-stepper",
    name: "08 Minimal Stepper",
    shortName: "Step",
    themeClass: "page-nav-minimal-stepper",
    intent: "必要な前後関係だけを出す案"
  },
  {
    id: "map-pins",
    name: "09 Map Pins",
    shortName: "Pins",
    themeClass: "page-nav-map-pins",
    intent: "木目上にピンを置いたように示す案"
  },
  {
    id: "exam-ticket",
    name: "10 Exam Ticket",
    shortName: "Ticket",
    themeClass: "page-nav-exam-ticket",
    intent: "受験票の切符片のように並べる案"
  }
];

export function PageNavDesignPreview({ exam }: PageNavDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState(pageNavCandidates[0].id);
  const activeCandidate =
    pageNavCandidates.find((candidate) => candidate.id === activeCandidateId) ?? pageNavCandidates[0];
  const pageItems = [
    ...(exam.coverImageUrl ? [{ id: "cover", label: "表紙" }] : []),
    ...exam.pages.map((page) => ({ id: page.id, label: String(page.pageNumber) }))
  ];

  return (
    <section className="exam-design-mode page-nav-design-mode" aria-label="ページ遷移UI候補">
      <header className="design-mode-heading">
        <div>
          <p className="eyebrow">Page candidates</p>
          <h2>ページ遷移UI候補</h2>
        </div>
        <div className="design-reference-pill">Wood background</div>
      </header>

      <div className="design-candidate-tabs" role="tablist" aria-label="ページ遷移UI候補">
        {pageNavCandidates.map((candidate) => (
          <button
            aria-selected={candidate.id === activeCandidate.id}
            className="design-candidate-tab"
            key={candidate.id}
            role="tab"
            type="button"
            onClick={() => setActiveCandidateId(candidate.id)}
          >
            <span>{candidate.name}</span>
            <small>{candidate.shortName}</small>
          </button>
        ))}
      </div>

      <article className="page-nav-design-canvas" aria-label={`${activeCandidate.name}のプレビュー`}>
        <header className="timer-candidate-header">
          <div>
            <p>{activeCandidate.intent}</p>
            <h3>{activeCandidate.name}</h3>
          </div>
          <span>{pageItems.length}ページ</span>
        </header>

        <div className="page-nav-stage">
          <div className={`page-nav-preview ${activeCandidate.themeClass}`}>
            <nav className="page-nav-sample" aria-label="候補のページ遷移">
              {pageItems.map((item, index) => (
                <button className={index === 1 ? "active" : ""} key={item.id} type="button">
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="page-nav-sample-workspace">
              <button className="page-nav-sample-arrow" type="button">
                ‹
              </button>
              <div className="page-nav-paper-sample">
                <strong>第 1 問</strong>
                <p />
                <p />
                <div />
              </div>
              <button className="page-nav-sample-arrow" type="button">
                ›
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
