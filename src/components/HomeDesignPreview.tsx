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
    id: "command-slate",
    name: "01 Command Slate",
    shortName: "Slate",
    themeClass: "home-preview-command-slate",
    intent: "3番の運用ダッシュボードを基準にした濃色案"
  },
  {
    id: "vercel-grid",
    name: "02 Vercel Grid",
    shortName: "Vercel",
    themeClass: "home-preview-vercel-grid",
    intent: "余白と細線で試験を管理する白基調案"
  },
  {
    id: "linear-board",
    name: "03 Linear Board",
    shortName: "Linear",
    themeClass: "home-preview-linear-board",
    intent: "一覧性と状態表示を優先する暗色ボード案"
  },
  {
    id: "github-issues",
    name: "04 GitHub Issues",
    shortName: "Issues",
    themeClass: "home-preview-github-issues",
    intent: "行動ボタンを抑えて状態確認を前面に出す案"
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
    id: "figma-canvas",
    name: "07 Figma Canvas",
    shortName: "Canvas",
    themeClass: "home-preview-figma-canvas",
    intent: "操作バーと作業面をはっきり分ける案"
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
    id: "wood-terminal",
    name: "10 Wood Terminal",
    shortName: "Wood",
    themeClass: "home-preview-wood-terminal",
    intent: "木の背景上に管理端末を置く案"
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
