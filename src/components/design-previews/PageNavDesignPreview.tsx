import { useState } from "react";
import type { Exam } from "../../types";

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
    id: "fine-outline",
    name: "01 Fine Outline",
    shortName: "Fine",
    themeClass: "page-nav-fine-outline",
    intent: "10番を基準にした細い白線のアウトライン"
  },
  {
    id: "glass-outline",
    name: "02 Glass Outline",
    shortName: "Glass",
    themeClass: "page-nav-glass-outline",
    intent: "透明面と白線を重ねるアウトライン"
  },
  {
    id: "compact-outline",
    name: "03 Compact Outline",
    shortName: "Compact",
    themeClass: "page-nav-compact-outline",
    intent: "高さを抑えたアウトライン"
  },
  {
    id: "ticket-outline",
    name: "04 Ticket Outline",
    shortName: "Ticket",
    themeClass: "page-nav-ticket-outline",
    intent: "切符形状を線だけで見せるアウトライン"
  },
  {
    id: "dark-outline",
    name: "05 Dark Outline",
    shortName: "Dark",
    themeClass: "page-nav-dark-outline",
    intent: "暗い半透明バーに白線を乗せるアウトライン"
  },
  {
    id: "paper-outline",
    name: "06 Paper Outline",
    shortName: "Paper",
    themeClass: "page-nav-paper-outline",
    intent: "紙片の縁取りだけを残すアウトライン"
  },
  {
    id: "progress-outline",
    name: "07 Progress Outline",
    shortName: "Progress",
    themeClass: "page-nav-progress-outline",
    intent: "進行量を薄い線で示すアウトライン"
  },
  {
    id: "index-outline",
    name: "08 Index Outline",
    shortName: "Index",
    themeClass: "page-nav-index-outline",
    intent: "PAGE見出しだけ濃くしたアウトライン"
  },
  {
    id: "orange-outline",
    name: "09 Orange Outline",
    shortName: "Orange",
    themeClass: "page-nav-orange-outline",
    intent: "答案欄色の線で揃えるアウトライン"
  },
  {
    id: "bold-outline",
    name: "10 Bold Outline",
    shortName: "Bold",
    themeClass: "page-nav-bold-outline",
    intent: "少し太めの線で視認性を上げるアウトライン"
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
