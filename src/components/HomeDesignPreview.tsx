import { useState, type CSSProperties } from "react";
import type { Exam } from "../types";

interface HomeDesignPreviewProps {
  exams: Exam[];
}

type HomeLayout =
  | "spotlight"
  | "grid"
  | "table"
  | "kanban"
  | "calendar"
  | "rail"
  | "command"
  | "analytics"
  | "shelf"
  | "mobile";

interface HomeCandidate {
  id: string;
  name: string;
  shortName: string;
  themeClass: string;
  intent: string;
  layout: HomeLayout;
}

const homeCandidates: HomeCandidate[] = [
  {
    id: "spotlight-launch",
    name: "01 Spotlight Launch",
    shortName: "Spotlight",
    themeClass: "home-preview-spotlight-launch",
    intent: "表紙を大きく出して、右側で開始判断する案",
    layout: "spotlight"
  },
  {
    id: "vercel-grid",
    name: "02 Vercel Grid",
    shortName: "Grid",
    themeClass: "home-preview-vercel-grid",
    intent: "余白のある3列カードで比較する案",
    layout: "grid"
  },
  {
    id: "airtable-table",
    name: "03 Airtable Table",
    shortName: "Table",
    themeClass: "home-preview-airtable-table",
    intent: "試験を表形式で素早く比較する案",
    layout: "table"
  },
  {
    id: "trello-board",
    name: "04 Trello Board",
    shortName: "Board",
    themeClass: "home-preview-trello-board",
    intent: "公開中、準備中、確認中を列で分ける案",
    layout: "kanban"
  },
  {
    id: "calendar-plan",
    name: "05 Calendar Plan",
    shortName: "Calendar",
    themeClass: "home-preview-calendar-plan",
    intent: "日程と試験を同時に見る案",
    layout: "calendar"
  },
  {
    id: "cover-rail",
    name: "06 Cover Rail",
    shortName: "Rail",
    themeClass: "home-preview-cover-rail",
    intent: "横長の表紙レールから選ぶ案",
    layout: "rail"
  },
  {
    id: "command-search",
    name: "07 Command Search",
    shortName: "Search",
    themeClass: "home-preview-command-search",
    intent: "検索とキーボード選択を主軸にする案",
    layout: "command"
  },
  {
    id: "metrics-hub",
    name: "08 Metrics Hub",
    shortName: "Metrics",
    themeClass: "home-preview-metrics-hub",
    intent: "指標と試験一覧を同時に出す案",
    layout: "analytics"
  },
  {
    id: "library-shelf",
    name: "09 Library Shelf",
    shortName: "Shelf",
    themeClass: "home-preview-library-shelf",
    intent: "資料室の棚のように表紙を分類する案",
    layout: "shelf"
  },
  {
    id: "mobile-stack",
    name: "10 Mobile Stack",
    shortName: "Mobile",
    themeClass: "home-preview-mobile-stack",
    intent: "スマホでも同じ優先順位で選べる案",
    layout: "mobile"
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

function renderHomeLayout(layout: HomeLayout, exams: Exam[]) {
  const [featured, second = featured, third = second] = exams;
  const cards = [featured, second, third].filter((exam): exam is Exam => Boolean(exam));

  if (!featured) {
    return <p className="empty-state">公開中の試験がありません。</p>;
  }

  if (layout === "spotlight") {
    return (
      <div className="home-layout-spotlight">
        <Cover exam={featured} />
        <section>
          <span>次に開始</span>
          <h3>{featured.title}</h3>
          <MetricStrip exam={featured} />
          <div className="home-stack-list">
            {cards.slice(1).map((exam, index) => (
              <MiniCard exam={exam} key={`${exam.id}-stack-${index}`} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div className="home-layout-grid">
        {cards.map((exam, index) => (
          <MiniCard exam={exam} key={`${exam.id}-grid-${index}`} />
        ))}
      </div>
    );
  }

  if (layout === "table") {
    return (
      <div className="home-layout-table" role="table">
        <div className="home-table-head" role="row">
          <span>試験</span>
          <span>時間</span>
          <span>設問</span>
          <span>配点</span>
        </div>
        {cards.map((exam, index) => (
          <div className="home-table-row" key={`${exam.id}-row-${index}`} role="row">
            <strong>{exam.title}</strong>
            <span>{exam.durationMinutes}分</span>
            <span>{exam.questions.length}問</span>
            <span>{exam.totalPoints}点</span>
          </div>
        ))}
      </div>
    );
  }

  if (layout === "kanban") {
    return (
      <div className="home-layout-kanban">
        {["公開中", "確認中", "準備中"].map((column, index) => (
          <section key={column}>
            <h3>{column}</h3>
            <MiniCard exam={cards[index % cards.length]} />
          </section>
        ))}
      </div>
    );
  }

  if (layout === "calendar") {
    return (
      <div className="home-layout-calendar">
        {["月", "火", "水", "木", "金"].map((day, index) => (
          <section className={index === 2 ? "active" : ""} key={day}>
            <strong>{day}</strong>
            {index === 1 || index === 2 || index === 4 ? <MiniCard exam={cards[index % cards.length]} /> : <span />}
          </section>
        ))}
      </div>
    );
  }

  if (layout === "rail") {
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

  if (layout === "command") {
    return (
      <div className="home-layout-command">
        <div className="home-command-box">試験名で検索...</div>
        <div className="home-command-results">
          {cards.map((exam, index) => (
            <article className={index === 0 ? "active" : ""} key={`${exam.id}-command-${index}`}>
              <strong>{exam.title}</strong>
              <span>
                {exam.durationMinutes}分 / {exam.questions.length}問 / {exam.totalPoints}点
              </span>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (layout === "analytics") {
    return (
      <div className="home-layout-analytics">
        <div className="home-stat-row">
          <strong>{cards.length}</strong>
          <strong>{cards.reduce((sum, exam) => sum + exam.questions.length, 0)}</strong>
          <strong>{cards.reduce((sum, exam) => sum + exam.totalPoints, 0)}</strong>
        </div>
        <div className="home-bars">
          {cards.map((exam, index) => (
            <span
              key={`${exam.id}-bar-${index}`}
              style={{ "--bar-value": `${Math.max(18, exam.durationMinutes)}%` } as CSSProperties}
            >
              {exam.title}
            </span>
          ))}
        </div>
        <MiniCard exam={featured} />
      </div>
    );
  }

  if (layout === "shelf") {
    return (
      <div className="home-layout-shelf">
        <aside>
          <span>公開中</span>
          <span>最近</span>
          <span>高配点</span>
        </aside>
        <section>
          {cards.map((exam, index) => (
            <MiniCard exam={exam} key={`${exam.id}-shelf-${index}`} />
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="home-layout-mobile">
      <div className="home-phone-frame">
        <header>ウェブ模試</header>
        {cards.map((exam, index) => (
          <MiniCard exam={exam} key={`${exam.id}-mobile-${index}`} />
        ))}
      </div>
    </div>
  );
}

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

        <div className={`home-preview ${activeCandidate.themeClass}`}>{renderHomeLayout(activeCandidate.layout, previewExams)}</div>
      </article>
    </section>
  );
}
