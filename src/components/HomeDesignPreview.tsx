import { useState } from "react";
import type { Exam } from "../types";

interface HomeDesignPreviewProps {
  exams: Exam[];
}

interface HomeCandidate {
  id: string;
  name: string;
  shortName: string;
  themeClass: string;
  intent: string;
}

const homeCandidates: HomeCandidate[] = [
  {
    id: "exam-cards",
    name: "01 Exam Cards",
    shortName: "Cards",
    themeClass: "home-preview-exam-cards",
    intent: "現在のカード一覧を整理して見せる基準案"
  },
  {
    id: "desk-hero",
    name: "02 Desk Hero",
    shortName: "Desk",
    themeClass: "home-preview-desk-hero",
    intent: "木の机上に試験を置いた導入画面"
  },
  {
    id: "command-dashboard",
    name: "03 Command Dashboard",
    shortName: "Command",
    themeClass: "home-preview-command-dashboard",
    intent: "運用画面として密度高く管理する案"
  },
  {
    id: "cover-gallery",
    name: "04 Cover Gallery",
    shortName: "Gallery",
    themeClass: "home-preview-cover-gallery",
    intent: "表紙を大きく並べるギャラリー案"
  },
  {
    id: "minimal-table",
    name: "05 Minimal Table",
    shortName: "Table",
    themeClass: "home-preview-minimal-table",
    intent: "余白を削って表形式で選ぶ案"
  },
  {
    id: "bento-board",
    name: "06 Bento Board",
    shortName: "Bento",
    themeClass: "home-preview-bento-board",
    intent: "機能単位のタイルで入口を分ける案"
  },
  {
    id: "kanban-shelves",
    name: "07 Kanban Shelves",
    shortName: "Kanban",
    themeClass: "home-preview-kanban-shelves",
    intent: "公開中・編集中・分析を列で分ける案"
  },
  {
    id: "kiosk-launch",
    name: "08 Kiosk Launch",
    shortName: "Kiosk",
    themeClass: "home-preview-kiosk-launch",
    intent: "試験開始だけを強く出す端末風の案"
  },
  {
    id: "library-split",
    name: "09 Library Split",
    shortName: "Library",
    themeClass: "home-preview-library-split",
    intent: "左に分類、右に試験を置く資料室風の案"
  },
  {
    id: "mobile-stack",
    name: "10 Mobile Stack",
    shortName: "Stack",
    themeClass: "home-preview-mobile-stack",
    intent: "スマホ幅でもそのまま使える縦積み案"
  }
];

export function HomeDesignPreview({ exams }: HomeDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState(homeCandidates[0].id);
  const activeCandidate =
    homeCandidates.find((candidate) => candidate.id === activeCandidateId) ?? homeCandidates[0];
  const previewExams = exams.slice(0, 3);

  return (
    <section className="exam-design-mode home-design-mode" aria-label="ホーム画面デザイン候補">
      <header className="design-mode-heading">
        <div>
          <p className="eyebrow">Home candidates</p>
          <h2>ホーム画面デザイン候補</h2>
        </div>
        <div className="design-reference-pill">Entry screen</div>
      </header>

      <div className="design-candidate-tabs" role="tablist" aria-label="ホーム画面デザイン候補">
        {homeCandidates.map((candidate) => (
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

      <article className="home-design-canvas" aria-label={`${activeCandidate.name}のプレビュー`}>
        <header className="timer-candidate-header">
          <div>
            <p>{activeCandidate.intent}</p>
            <h3>{activeCandidate.name}</h3>
          </div>
          <span>{previewExams.length} exams</span>
        </header>

        <div className={`home-preview ${activeCandidate.themeClass}`}>
          <header className="home-sample-header">
            <div>
              <small>共通テスト形式</small>
              <strong>ウェブ模試</strong>
            </div>
            <nav aria-label="ホーム操作サンプル">
              <button type="button">画面候補</button>
              <button type="button">時間候補</button>
              <button type="button">新規作成</button>
            </nav>
          </header>

          <div className="home-sample-content">
            <aside className="home-sample-side">
              <span>公開中</span>
              <span>編集</span>
              <span>履歴</span>
            </aside>
            <div className="home-sample-list">
              {previewExams.map((exam, index) => (
                <article className="home-sample-card" key={exam.id}>
                  <div className="home-sample-cover">
                    {exam.coverImageUrl ? <img src={exam.coverImageUrl} alt="" /> : null}
                  </div>
                  <div>
                    <small>{exam.subject}</small>
                    <strong>{exam.title}</strong>
                    <p>{exam.durationMinutes}分 / {exam.questions.length}問 / {exam.totalPoints}点</p>
                  </div>
                  <button type="button">{index === 0 ? "開始" : "選択"}</button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
