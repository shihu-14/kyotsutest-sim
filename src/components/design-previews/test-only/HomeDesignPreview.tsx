import { useState, type ComponentType, type ReactNode } from "react";
import type { Exam } from "../../../types";
import {
  SteamCapsuleCard,
  steamCapsuleThemes,
  type SteamCapsuleThemeId
} from "../../home/SteamCapsuleCard";

interface HomeDesignPreviewProps {
  exams: Exam[];
}

interface HomeLayoutProps {
  exams: Exam[];
}

interface HomeCandidate {
  component: ComponentType<HomeLayoutProps>;
  id: string;
  intent: string;
  name: string;
  shortName: string;
}

function examMetrics(exam: Exam) {
  return {
    duration: `${exam.durationMinutes}分`,
    points: `${exam.totalPoints}点`,
    questions: `${exam.questions.length}問`
  };
}

function ExamCover({ className, exam }: { className: string; exam: Exam }) {
  return (
    <div className={className}>
      {exam.coverImageUrl ? (
        <img alt={`${exam.title}の表紙`} draggable={false} src={exam.coverImageUrl} />
      ) : (
        <div aria-label={`${exam.title}の表紙画像なし`} className="home-card-cover-placeholder" role="img">
          <span>{exam.subject}</span>
        </div>
      )}
    </div>
  );
}

function SettingsButton({ exam }: { exam: Exam }) {
  return (
    <button aria-label={`${exam.title}の設定`} className="home-card-menu" type="button">
      ⋮
    </button>
  );
}

function StartButton({ children, className, exam }: { children: ReactNode; className: string; exam: Exam }) {
  return (
    <button aria-label={`${exam.title}を始める`} className={className} type="button">
      {children}
    </button>
  );
}

function OfficialBookletCard({ exam, index }: { exam: Exam; index: number }) {
  const metrics = examMetrics(exam);
  return (
    <article className="home-official-card" data-card-structure="booklet">
      <SettingsButton exam={exam} />
      <div className="home-official-paper">
        <p className="home-official-number">第 {String(index + 1).padStart(2, "0")} 冊</p>
        <ExamCover className="home-official-cover" exam={exam} />
        <div className="home-official-copy">
          <p>{exam.subject}</p>
          <h4 title={exam.title}>{exam.title}</h4>
          <table aria-label={`${exam.title}の試験情報`}>
            <tbody>
              <tr>
                <th scope="row">時間</th>
                <td>{metrics.duration}</td>
              </tr>
              <tr>
                <th scope="row">設問</th>
                <td>{metrics.questions}</td>
              </tr>
              <tr>
                <th scope="row">配点</th>
                <td>{metrics.points}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <StartButton className="home-official-start" exam={exam}>受験開始</StartButton>
    </article>
  );
}

function OfficialBookletLayout({ exams }: HomeLayoutProps) {
  return (
    <div className="home-candidate-grid home-layout-official" data-layout="official-booklet">
      {exams.map((exam, index) => (
        <OfficialBookletCard exam={exam} index={index} key={`${exam.id}-official-${index}`} />
      ))}
    </div>
  );
}

function ClassroomBannerCard({ exam }: { exam: Exam }) {
  const metrics = examMetrics(exam);
  return (
    <article className="home-classroom-card" data-card-structure="banner">
      <header className="home-classroom-banner">
        <div>
          <p>{exam.subject}</p>
          <h4 title={exam.title}>{exam.title}</h4>
        </div>
        <SettingsButton exam={exam} />
        <ExamCover className="home-classroom-cover" exam={exam} />
      </header>
      <div className="home-classroom-body">
        <dl>
          <div><dt>時間</dt><dd>{metrics.duration}</dd></div>
          <div><dt>設問</dt><dd>{metrics.questions}</dd></div>
          <div><dt>配点</dt><dd>{metrics.points}</dd></div>
        </dl>
        <StartButton className="home-classroom-start" exam={exam}>試験を始める</StartButton>
      </div>
    </article>
  );
}

function ClassroomBannerLayout({ exams }: HomeLayoutProps) {
  return (
    <div className="home-candidate-grid home-layout-classroom" data-layout="classroom-banner">
      {exams.map((exam, index) => (
        <ClassroomBannerCard exam={exam} key={`${exam.id}-classroom-${index}`} />
      ))}
    </div>
  );
}

function NotionGalleryCard({ exam }: { exam: Exam }) {
  const metrics = examMetrics(exam);
  return (
    <article className="home-notion-card" data-card-structure="gallery-properties">
      <ExamCover className="home-notion-cover" exam={exam} />
      <div className="home-notion-content">
        <header>
          <h4 title={exam.title}>{exam.title}</h4>
          <SettingsButton exam={exam} />
        </header>
        <ul className="home-notion-properties">
          <li><span>時間</span><strong>{metrics.duration}</strong></li>
          <li><span>設問</span><strong>{metrics.questions}</strong></li>
          <li><span>配点</span><strong>{metrics.points}</strong></li>
        </ul>
        <StartButton className="home-notion-start" exam={exam}>この模試を開く</StartButton>
      </div>
    </article>
  );
}

function NotionGalleryLayout({ exams }: HomeLayoutProps) {
  return (
    <div className="home-candidate-grid home-layout-notion" data-layout="notion-gallery">
      {exams.map((exam, index) => (
        <NotionGalleryCard exam={exam} key={`${exam.id}-notion-${index}`} />
      ))}
    </div>
  );
}

function CourseCatalogCard({ exam }: { exam: Exam }) {
  const metrics = examMetrics(exam);
  return (
    <article className="home-course-card" data-card-structure="catalog">
      <ExamCover className="home-course-cover" exam={exam} />
      <div className="home-course-content">
        <div className="home-course-labels"><span>{exam.subject}</span><strong>公開中</strong></div>
        <div className="home-course-title-row">
          <h4 title={exam.title}>{exam.title}</h4>
          <SettingsButton exam={exam} />
        </div>
        <p>{metrics.duration}・{metrics.questions}・{metrics.points}</p>
        <StartButton className="home-course-start" exam={exam}>試験を始める</StartButton>
      </div>
    </article>
  );
}

function CourseCatalogLayout({ exams }: HomeLayoutProps) {
  return (
    <div className="home-candidate-grid home-layout-course" data-layout="course-catalog">
      {exams.map((exam, index) => (
        <CourseCatalogCard exam={exam} key={`${exam.id}-course-${index}`} />
      ))}
    </div>
  );
}

function FigmaFileCard({ exam }: { exam: Exam }) {
  const metrics = examMetrics(exam);
  return (
    <article className="home-figma-card" data-card-structure="file-tile">
      <div className="home-figma-frame">
        <ExamCover className="home-figma-cover" exam={exam} />
        <SettingsButton exam={exam} />
      </div>
      <footer className="home-figma-footer">
        <h4 title={exam.title}>{exam.title}</h4>
        <p>{metrics.duration} · {metrics.questions} · {metrics.points}</p>
        <StartButton className="home-figma-start" exam={exam}>開く <span aria-hidden="true">→</span></StartButton>
      </footer>
    </article>
  );
}

function FigmaFileLayout({ exams }: HomeLayoutProps) {
  return (
    <div className="home-candidate-grid home-layout-figma" data-layout="figma-file-tile">
      {exams.map((exam, index) => (
        <FigmaFileCard exam={exam} key={`${exam.id}-figma-${index}`} />
      ))}
    </div>
  );
}

function WalletTicketCard({ exam }: { exam: Exam }) {
  const metrics = examMetrics(exam);
  return (
    <article className="home-wallet-card" data-card-structure="ticket">
      <header>
        <div><span>{exam.subject}</span><h4 title={exam.title}>{exam.title}</h4></div>
        <SettingsButton exam={exam} />
      </header>
      <div className="home-wallet-hero">
        <div><small>試験時間</small><strong>{metrics.duration}</strong></div>
        <ExamCover className="home-wallet-cover" exam={exam} />
      </div>
      <dl className="home-wallet-fields">
        <div><dt>設問</dt><dd>{metrics.questions}</dd></div>
        <div><dt>配点</dt><dd>{metrics.points}</dd></div>
        <div><dt>状態</dt><dd>公開中</dd></div>
      </dl>
      <StartButton className="home-wallet-start" exam={exam}>受験を開始</StartButton>
    </article>
  );
}

function WalletTicketLayout({ exams }: HomeLayoutProps) {
  return (
    <div className="home-candidate-grid home-layout-wallet" data-layout="wallet-ticket">
      {exams.map((exam, index) => (
        <WalletTicketCard exam={exam} key={`${exam.id}-wallet-${index}`} />
      ))}
    </div>
  );
}

function SteamCapsuleLayout({ exams, theme = "current" }: HomeLayoutProps & { theme?: SteamCapsuleThemeId }) {
  return (
    <div className="home-candidate-grid home-layout-steam" data-layout="steam-capsule">
      {exams.map((exam, index) => (
        <SteamCapsuleCard
          exam={exam}
          key={`${exam.id}-steam-${theme}-${index}`}
          settingsControl={<SettingsButton exam={exam} />}
          startControl={<StartButton className="steam-capsule-start-button" exam={exam}>試験を始める</StartButton>}
          theme={theme}
        />
      ))}
    </div>
  );
}

function GitHubRepositoryCard({ exam }: { exam: Exam }) {
  const metrics = examMetrics(exam);
  return (
    <article className="home-github-card" data-card-structure="repository">
      <header>
        <ExamCover className="home-github-cover" exam={exam} />
        <div><h4 title={exam.title}>{exam.title}</h4><span>{exam.subject}</span></div>
        <SettingsButton exam={exam} />
      </header>
      {exam.description ? <p className="home-github-description">{exam.description}</p> : null}
      <ul className="home-github-stats" aria-label={`${exam.title}の試験情報`}>
        <li><strong>{metrics.duration}</strong><span>時間</span></li>
        <li><strong>{metrics.questions}</strong><span>設問</span></li>
        <li><strong>{metrics.points}</strong><span>配点</span></li>
      </ul>
      <footer><span>共通テスト形式</span><StartButton className="home-github-start" exam={exam}>開始</StartButton></footer>
    </article>
  );
}

function GitHubRepositoryLayout({ exams }: HomeLayoutProps) {
  return (
    <div className="home-candidate-grid home-layout-github" data-layout="github-repository">
      {exams.map((exam, index) => (
        <GitHubRepositoryCard exam={exam} key={`${exam.id}-github-${index}`} />
      ))}
    </div>
  );
}

function QuizletSetCard({ exam }: { exam: Exam }) {
  const metrics = examMetrics(exam);
  return (
    <article className="home-quizlet-card" data-card-structure="study-set">
      <header><h4 title={exam.title}>{exam.title}</h4><SettingsButton exam={exam} /></header>
      <div className="home-quizlet-primary">
        <div><strong>{metrics.questions}</strong><span>設問セット</span></div>
        <ExamCover className="home-quizlet-cover" exam={exam} />
      </div>
      <p><span>時間 {metrics.duration}</span><span>配点 {metrics.points}</span></p>
      <StartButton className="home-quizlet-start" exam={exam}>この模試を始める</StartButton>
    </article>
  );
}

function QuizletSetLayout({ exams }: HomeLayoutProps) {
  return (
    <div className="home-candidate-grid home-layout-quizlet" data-layout="quizlet-study-set">
      {exams.map((exam, index) => (
        <QuizletSetCard exam={exam} key={`${exam.id}-quizlet-${index}`} />
      ))}
    </div>
  );
}

function MaterialBentoCard({ exam }: { exam: Exam }) {
  const metrics = examMetrics(exam);
  return (
    <article className="home-bento-card" data-card-structure="bento-grid">
      <ExamCover className="home-bento-cover" exam={exam} />
      <div className="home-bento-title"><span>{exam.subject}</span><h4 title={exam.title}>{exam.title}</h4></div>
      <div className="home-bento-menu"><SettingsButton exam={exam} /></div>
      <div className="home-bento-metric home-bento-duration"><span>時間</span><strong>{metrics.duration}</strong></div>
      <div className="home-bento-metric home-bento-questions"><span>設問</span><strong>{metrics.questions}</strong></div>
      <div className="home-bento-metric home-bento-points"><span>配点</span><strong>{metrics.points}</strong></div>
      <StartButton className="home-bento-start" exam={exam}>試験を始める</StartButton>
    </article>
  );
}

function MaterialBentoLayout({ exams }: HomeLayoutProps) {
  return (
    <div className="home-candidate-grid home-layout-bento" data-layout="material-bento">
      {exams.map((exam, index) => (
        <MaterialBentoCard exam={exam} key={`${exam.id}-bento-${index}`} />
      ))}
    </div>
  );
}

const homeCandidates: HomeCandidate[] = [
  { id: "official-booklet", name: "01 Official Booklet", shortName: "冊子", intent: "問題冊子の罫線・表組み・押印風の開始操作", component: OfficialBookletLayout },
  { id: "classroom-banner", name: "02 Classroom Banner", shortName: "バナー", intent: "科目バナーと白い情報面を上下に分けた構成", component: ClassroomBannerLayout },
  { id: "notion-gallery", name: "03 Notion Gallery", shortName: "ギャラリー", intent: "画像プレビューと順序づけたプロパティ一覧", component: NotionGalleryLayout },
  { id: "course-catalog", name: "04 Course Catalog", shortName: "講座一覧", intent: "分類・状態・タイトル・一行メタデータの階層", component: CourseCatalogLayout },
  { id: "figma-file", name: "05 Figma File Tile", shortName: "ファイル", intent: "大きなキャンバス面と独立したファイル情報", component: FigmaFileLayout },
  { id: "wallet-ticket", name: "06 Wallet Ticket", shortName: "チケット", intent: "切り取り線と構造化フィールドを持つ縦長券面", component: WalletTicketLayout },
  { id: "steam-capsule", name: "07 Steam Capsule", shortName: "ポスター・採用", intent: "表紙全面と常時見えるオーバーレイ情報", component: SteamCapsuleLayout },
  { id: "github-repository", name: "08 GitHub Repository", shortName: "情報一覧", intent: "小さな表紙と統計を中心にした高密度カード", component: GitHubRepositoryLayout },
  { id: "quizlet-set", name: "09 Quizlet Study Set", shortName: "学習セット", intent: "設問数を主役にした画像非依存の構成", component: QuizletSetLayout },
  { id: "material-bento", name: "10 Material Bento", shortName: "Bento", intent: "画像・題名・数値・操作を独立面へ分割", component: MaterialBentoLayout }
];

function createPreviewExams(exams: Exam[]) {
  if (exams.length === 0) {
    return [];
  }
  return Array.from({ length: 3 }, (_, index) => exams[index % exams.length]);
}

export function HomeDesignPreview({ exams }: HomeDesignPreviewProps) {
  const [comparisonMode, setComparisonMode] = useState<"structures" | "capsule-themes">("structures");
  const [activeCandidateId, setActiveCandidateId] = useState(homeCandidates[0].id);
  const [activeThemeId, setActiveThemeId] = useState<SteamCapsuleThemeId>(steamCapsuleThemes[0].id);
  const activeCandidate =
    homeCandidates.find((candidate) => candidate.id === activeCandidateId) ?? homeCandidates[0];
  const activeTheme = steamCapsuleThemes.find((theme) => theme.id === activeThemeId) ?? steamCapsuleThemes[0];
  const previewExams = createPreviewExams(exams.slice(0, 3));
  const ActiveLayout = activeCandidate.component;

  return (
    <section className="exam-design-mode home-design-mode" aria-label="ホーム画面デザイン候補">
      <header className="design-mode-heading">
        <div>
          <p className="eyebrow">ホーム候補</p>
          <h2>ホーム画面デザイン候補</h2>
        </div>
        <div className="design-reference-pill">カード部分を比較</div>
      </header>

      <div aria-label="ホーム候補の比較方法" className="home-comparison-switch">
        <button
          aria-pressed={comparisonMode === "structures"}
          type="button"
          onClick={() => setComparisonMode("structures")}
        >
          構造候補
        </button>
        <button
          aria-pressed={comparisonMode === "capsule-themes"}
          type="button"
          onClick={() => setComparisonMode("capsule-themes")}
        >
          Steam Capsule 配色候補
        </button>
      </div>

      {comparisonMode === "structures" ? (
        <>
          <div className="design-candidate-tabs" role="tablist" aria-label="ホーム画面デザイン候補">
            {homeCandidates.map((candidate) => (
              <button
                aria-controls={`home-panel-${candidate.id}`}
                aria-selected={candidate.id === activeCandidate.id}
                className="design-candidate-tab"
                id={`home-tab-${candidate.id}`}
                key={candidate.id}
                role="tab"
                type="button"
                onClick={() => setActiveCandidateId(candidate.id)}
              >
                <span>{candidate.name}</span>
                <small>{candidate.shortName}</small>
                {candidate.id === "steam-capsule" ? <em className="home-selected-badge">採用</em> : null}
              </button>
            ))}
          </div>

          <article
            aria-label={`${activeCandidate.name}のプレビュー`}
            className="home-design-canvas"
            data-active-layout={activeCandidate.id}
          >
            <header className="timer-candidate-header">
              <div>
                <p>{activeCandidate.intent}</p>
                <h3>{activeCandidate.name}</h3>
              </div>
              <span>{activeCandidate.id === "steam-capsule" ? "採用" : `${previewExams.length}件`}</span>
            </header>

            <div
              aria-labelledby={`home-tab-${activeCandidate.id}`}
              className="home-preview"
              id={`home-panel-${activeCandidate.id}`}
              role="tabpanel"
            >
              {previewExams.length > 0 ? (
                <ActiveLayout exams={previewExams} />
              ) : (
                <p className="empty-state">公開中の試験がありません。</p>
              )}
            </div>
          </article>
        </>
      ) : (
        <>
          <div className="design-candidate-tabs" role="tablist" aria-label="Steam Capsule 配色候補">
            {steamCapsuleThemes.map((theme) => (
              <button
                aria-controls={`capsule-theme-panel-${theme.id}`}
                aria-selected={theme.id === activeTheme.id}
                className="design-candidate-tab"
                id={`capsule-theme-tab-${theme.id}`}
                key={theme.id}
                role="tab"
                type="button"
                onClick={() => setActiveThemeId(theme.id)}
              >
                <span>{theme.name}</span>
                <small>{theme.shortName}</small>
              </button>
            ))}
          </div>

          <article
            aria-label={`${activeTheme.name}のプレビュー`}
            className="home-design-canvas"
            data-active-capsule-theme={activeTheme.id}
          >
            <header className="timer-candidate-header">
              <div>
                <p>採用構造を固定し、オーバーレイ・文字・バッジ・操作色を比較</p>
                <h3>{activeTheme.name}</h3>
              </div>
              <span>Steam Capsule</span>
            </header>
            <div
              aria-labelledby={`capsule-theme-tab-${activeTheme.id}`}
              className="home-preview"
              id={`capsule-theme-panel-${activeTheme.id}`}
              role="tabpanel"
            >
              {previewExams.length > 0 ? (
                <SteamCapsuleLayout exams={previewExams} theme={activeTheme.id} />
              ) : (
                <p className="empty-state">公開中の試験がありません。</p>
              )}
            </div>
          </article>
        </>
      )}
    </section>
  );
}
