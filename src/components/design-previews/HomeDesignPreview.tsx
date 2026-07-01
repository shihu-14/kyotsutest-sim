import { useState } from "react";
import type { Exam } from "../../types";

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
    id: "rail-mint",
    name: "01 Rail Mint",
    shortName: "Mint",
    themeClass: "home-preview-rail-mint",
    intent: "06 Cover Railを基準にした青緑系の案"
  },
  {
    id: "rail-ink",
    name: "02 Rail Ink",
    shortName: "Ink",
    themeClass: "home-preview-rail-ink",
    intent: "白地に黒い線を効かせた案"
  },
  {
    id: "rail-sky",
    name: "03 Rail Sky",
    shortName: "Sky",
    themeClass: "home-preview-rail-sky",
    intent: "淡い青で試験カードを軽く見せる案"
  },
  {
    id: "rail-amber",
    name: "04 Rail Amber",
    shortName: "Amber",
    themeClass: "home-preview-rail-amber",
    intent: "机上の紙に近い暖色案"
  },
  {
    id: "rail-lilac",
    name: "05 Rail Lilac",
    shortName: "Lilac",
    themeClass: "home-preview-rail-lilac",
    intent: "柔らかい紫で候補画面らしくする案"
  },
  {
    id: "rail-forest",
    name: "06 Rail Forest",
    shortName: "Forest",
    themeClass: "home-preview-rail-forest",
    intent: "採用方向の青緑を少し濃くした基準案"
  },
  {
    id: "rail-coral",
    name: "07 Rail Coral",
    shortName: "Coral",
    themeClass: "home-preview-rail-coral",
    intent: "開始ボタンを暖色で強調する案"
  },
  {
    id: "rail-steel",
    name: "08 Rail Steel",
    shortName: "Steel",
    themeClass: "home-preview-rail-steel",
    intent: "少し硬い管理画面寄りの案"
  },
  {
    id: "rail-paper",
    name: "09 Rail Paper",
    shortName: "Paper",
    themeClass: "home-preview-rail-paper",
    intent: "共通テスト紙面に合わせた白紙系の案"
  },
  {
    id: "rail-wood",
    name: "10 Rail Wood",
    shortName: "Wood",
    themeClass: "home-preview-rail-wood",
    intent: "木の背景になじむ半透明紙面の案"
  }
];

function metricItems(exam: Exam) {
  return [
    { label: "時間", value: `${exam.durationMinutes}分` },
    { label: "設問", value: `${exam.questions.length}問` },
    { label: "配点", value: `${exam.totalPoints}点` }
  ];
}

function MetricStrip({ exam }: { exam: Exam }) {
  return (
    <dl className="home-metric-strip">
      {metricItems(exam).map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Cover({ exam }: { exam: Exam }) {
  return (
    <div className="home-cover-preview">
      {exam.coverImageUrl ? <img src={exam.coverImageUrl} alt="" /> : <div className="cover-placeholder" />}
    </div>
  );
}

function MiniCard({ exam }: { exam: Exam }) {
  return (
    <article className="home-mini-card">
      <Cover exam={exam} />
      <div>
        <strong>{exam.title}</strong>
        <MetricStrip exam={exam} />
      </div>
    </article>
  );
}

function renderHomeLayout(exams: Exam[]) {
  const [featured, second = featured, third = second] = exams;
  const cards = [featured, second, third].filter((exam): exam is Exam => Boolean(exam));

  if (!featured) {
    return <p className="empty-state">公開中の試験がありません。</p>;
  }

  return (
    <div className="home-layout-rail">
      {cards.map((exam, index) => (
        <article className="home-rail-card" key={`${exam.id}-rail-${index}`}>
          <Cover exam={exam} />
          <strong>{exam.title}</strong>
          <MetricStrip exam={exam} />
        </article>
      ))}
    </div>
  );
}

export function HomeDesignPreview({ exams }: HomeDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState("rail-forest");
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

        <div className={`home-preview ${activeCandidate.themeClass}`}>{renderHomeLayout(previewExams)}</div>
      </article>
    </section>
  );
}
