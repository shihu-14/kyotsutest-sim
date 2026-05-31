import { useMemo, useState } from "react";
import type { Exam } from "../types";

interface ExamDesignPreviewProps {
  exam: Exam;
}

interface DesignCandidate {
  id: string;
  name: string;
  shortName: string;
  reference: string;
  themeClass: string;
  intent: string;
}

const designCandidates: DesignCandidate[] = [
  {
    id: "focus-command",
    name: "01 Focus Command",
    shortName: "Focus",
    reference: "Linear",
    themeClass: "theme-focus-command",
    intent: "暗色の作業台で余計な要素を抑える"
  },
  {
    id: "paper-desk",
    name: "02 Paper Desk",
    shortName: "Desk",
    reference: "Physical desk",
    themeClass: "theme-paper-desk",
    intent: "紙と机の実在感を強く出す"
  },
  {
    id: "studio-canvas",
    name: "03 Studio Canvas",
    shortName: "Studio",
    reference: "Figma",
    themeClass: "theme-studio-canvas",
    intent: "キャンバス型の編集感で情報を並べる"
  },
  {
    id: "public-service",
    name: "04 Public Service",
    shortName: "Service",
    reference: "GOV.UK",
    themeClass: "theme-public-service",
    intent: "高コントラストで読みやすさを優先する"
  },
  {
    id: "material-tablet",
    name: "05 Material Tablet",
    shortName: "Material",
    reference: "Material Design",
    themeClass: "theme-material-tablet",
    intent: "タブレット学習アプリの軽さに寄せる"
  },
  {
    id: "carbon-console",
    name: "06 Carbon Console",
    shortName: "Carbon",
    reference: "IBM Carbon",
    themeClass: "theme-carbon-console",
    intent: "密度の高い監視画面として整理する"
  },
  {
    id: "glass-study",
    name: "07 Glass Study",
    shortName: "Glass",
    reference: "Apple HIG",
    themeClass: "theme-glass-study",
    intent: "透明感のあるネイティブ風にする"
  },
  {
    id: "admin-review",
    name: "08 Admin Review",
    shortName: "Admin",
    reference: "Shopify Polaris",
    themeClass: "theme-admin-review",
    intent: "管理画面の明快な区切りで進める"
  },
  {
    id: "primer-review",
    name: "09 Primer Review",
    shortName: "Primer",
    reference: "GitHub Primer",
    themeClass: "theme-primer-review",
    intent: "レビュー画面のように状態を見せる"
  },
  {
    id: "kiosk-focus",
    name: "10 Kiosk Focus",
    shortName: "Kiosk",
    reference: "Immersive reader",
    themeClass: "theme-kiosk-focus",
    intent: "全画面の試験端末として集中させる"
  }
];

const answerRows = Array.from({ length: 10 }, (_, index) => index + 1);
const pageTabs = ["表紙", "1", "2", "3", "4", "5", "6"];

export function ExamDesignPreview({ exam }: ExamDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState(designCandidates[0].id);
  const activeCandidate = designCandidates.find((candidate) => candidate.id === activeCandidateId) ?? designCandidates[0];
  const previewPage = useMemo(() => exam.pages.find((page) => page.pageImageUrl) ?? exam.pages[0], [exam.pages]);
  const previewImageUrl = previewPage?.pageImageUrl ?? exam.coverImageUrl;

  return (
    <section className="exam-design-mode" aria-label="解答画面デザイン候補">
      <header className="design-mode-heading">
        <div>
          <p className="eyebrow">Design candidates</p>
          <h2>解答画面デザイン候補</h2>
        </div>
        <div className="design-reference-pill">{activeCandidate.reference}</div>
      </header>

      <div className="design-candidate-tabs" role="tablist" aria-label="解答画面デザイン候補">
        {designCandidates.map((candidate) => (
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

      <article className={`exam-design-canvas ${activeCandidate.themeClass}`} aria-label={`${activeCandidate.name}のプレビュー`}>
        <header className="candidate-showcase-header">
          <div>
            <p>{activeCandidate.intent}</p>
            <h3>{activeCandidate.name}</h3>
          </div>
          <div className="candidate-clock">39:59</div>
        </header>

        <div className="candidate-frame">
          <aside className="candidate-nav" aria-label="候補内ページ一覧">
            <div className="candidate-brand">KT</div>
            <div className="candidate-page-list">
              {pageTabs.map((tab, index) => (
                <span className={index === 1 ? "active" : ""} key={tab}>
                  {tab}
                </span>
              ))}
            </div>
          </aside>

          <section className="candidate-main" aria-label="試験画面プレビュー">
            <header className="candidate-topbar">
              <div>
                <strong>{exam.title}</strong>
                <span>{previewPage?.title ?? "第1問"}</span>
              </div>
              <div className="candidate-status">
                <span>第1問</span>
              </div>
            </header>

            <div className="candidate-workspace">
              <button className="candidate-arrow previous" aria-label="前のページへ" type="button">
                ‹
              </button>

              <figure className="candidate-paper">
                {previewImageUrl ? (
                  <img src={previewImageUrl} alt={`${previewPage?.title ?? exam.title}の問題ページ`} />
                ) : (
                  <div className="candidate-paper-fallback">
                    <h4>第1問</h4>
                    <p>問題冊子の本文がここに入ります。</p>
                    <p>選択肢 1 2 3 4</p>
                  </div>
                )}
              </figure>

              <aside className="candidate-sheet" aria-label="解答欄プレビュー">
                <div className="candidate-sheet-title">解答欄</div>
                <div className="candidate-answer-grid">
                  {answerRows.map((row) => (
                    <div className="candidate-answer-row" key={row}>
                      <strong>{row}</strong>
                      <span>0</span>
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                    </div>
                  ))}
                </div>
              </aside>

              <button className="candidate-arrow next" aria-label="次のページへ" type="button">
                ›
              </button>
            </div>
          </section>
        </div>
      </article>
    </section>
  );
}
