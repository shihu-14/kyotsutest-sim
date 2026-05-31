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
    id: "flat-rail",
    name: "01 Flat Rail",
    shortName: "Flat",
    themeClass: "page-nav-flat-rail",
    intent: "2番を基準にした最も素直な分割レール"
  },
  {
    id: "exam-rail",
    name: "02 Exam Rail",
    shortName: "Exam",
    themeClass: "page-nav-exam-rail",
    intent: "実試験へ採用する答案欄寄せの分割レール"
  },
  {
    id: "compact-rail",
    name: "03 Compact Rail",
    shortName: "Compact",
    themeClass: "page-nav-compact-rail",
    intent: "高さを抑えて問題表示を広く残す分割レール"
  },
  {
    id: "ticket-rail",
    name: "04 Ticket Rail",
    shortName: "Ticket",
    themeClass: "page-nav-ticket-rail",
    intent: "受験票の区切りを思わせる分割レール"
  },
  {
    id: "dark-rail",
    name: "05 Dark Rail",
    shortName: "Dark",
    themeClass: "page-nav-dark-rail",
    intent: "暗色バーで現在ページを強く出す分割レール"
  },
  {
    id: "paper-rail",
    name: "06 Paper Rail",
    shortName: "Paper",
    themeClass: "page-nav-paper-rail",
    intent: "紙片が連なるように見せる分割レール"
  },
  {
    id: "progress-rail",
    name: "07 Progress Rail",
    shortName: "Progress",
    themeClass: "page-nav-progress-rail",
    intent: "左からの進行量を背景で示す分割レール"
  },
  {
    id: "index-rail",
    name: "08 Index Rail",
    shortName: "Index",
    themeClass: "page-nav-index-rail",
    intent: "見出し付きでページ群を索引化する分割レール"
  },
  {
    id: "orange-rail",
    name: "09 Orange Rail",
    shortName: "Orange",
    themeClass: "page-nav-orange-rail",
    intent: "答案欄のオレンジに寄せた分割レール"
  },
  {
    id: "outline-rail",
    name: "10 Outline Rail",
    shortName: "Outline",
    themeClass: "page-nav-outline-rail",
    intent: "線だけで軽く見せる分割レール"
  }
];

export function PageNavDesignPreview({ exam }: PageNavDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState(pageNavCandidates[1].id);
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
