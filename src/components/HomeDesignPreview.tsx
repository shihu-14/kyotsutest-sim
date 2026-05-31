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
    id: "light-command",
    name: "01 Light Command",
    shortName: "Command",
    themeClass: "home-preview-light-command",
    intent: "管理画面の密度を保った明るい基準案"
  },
  {
    id: "vercel-cards",
    name: "02 Vercel Cards",
    shortName: "Vercel",
    themeClass: "home-preview-vercel-cards",
    intent: "余白と細い枠で表紙を見せる白基調案"
  },
  {
    id: "linear-light",
    name: "03 Linear Light",
    shortName: "Linear",
    themeClass: "home-preview-linear-light",
    intent: "一覧性と状態表示を明るく整理する案"
  },
  {
    id: "github-light",
    name: "04 GitHub Light",
    shortName: "Issues",
    themeClass: "home-preview-github-light",
    intent: "行動ボタンを抑えて情報を読みやすくする案"
  },
  {
    id: "notion-desk",
    name: "05 Notion Desk",
    shortName: "Notion",
    themeClass: "home-preview-notion-desk",
    intent: "表紙とメモ情報を静かに整理する白背景案"
  },
  {
    id: "stripe-metrics",
    name: "06 Stripe Metrics",
    shortName: "Metrics",
    themeClass: "home-preview-stripe-metrics",
    intent: "指標とカードを同じ面に置く分析寄り案"
  },
  {
    id: "figma-light",
    name: "07 Figma Light",
    shortName: "Canvas",
    themeClass: "home-preview-figma-light",
    intent: "操作バーと作業面を明るい面で分ける案"
  },
  {
    id: "school-console",
    name: "08 School Console",
    shortName: "School",
    themeClass: "home-preview-school-console",
    intent: "教務システムのように選択しやすい案"
  },
  {
    id: "paper-admin",
    name: "09 Paper Admin",
    shortName: "Paper",
    themeClass: "home-preview-paper-admin",
    intent: "答案用紙色に合わせた紙面管理案"
  },
  {
    id: "wood-paper",
    name: "10 Wood Paper",
    shortName: "Wood",
    themeClass: "home-preview-wood-paper",
    intent: "木の背景上に白い試験カードを置く案"
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
              <span>直近編集</span>
              <span>分析</span>
            </aside>
            <div className="home-sample-list">
              {previewExams.map((exam, index) => (
                <article className="home-sample-card" key={exam.id}>
                  <div className="home-sample-cover">
                    {exam.coverImageUrl ? <img src={exam.coverImageUrl} alt="" /> : null}
                  </div>
                  <div>
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
