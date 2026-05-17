import type { Exam } from "../types";

interface CoverPageProps {
  exam: Exam;
  onStart: () => void;
  onBack: () => void;
}

export function CoverPage({ exam, onStart, onBack }: CoverPageProps) {
  return (
    <main className="screen screen-narrow">
      <button className="text-button" type="button" onClick={onBack}>
        試験一覧へ戻る
      </button>

      <section className="cover-sheet">
        <div className={exam.coverImageUrl ? "cover-layout" : ""}>
          {exam.coverImageUrl ? (
            <figure className="cover-preview-image">
              <img src={exam.coverImageUrl} alt={`${exam.title}の表紙`} />
            </figure>
          ) : null}
          <div>
            <p className="eyebrow">{exam.subject}</p>
            <h1>{exam.title}</h1>
            <dl className="cover-meta">
              <div>
                <dt>試験時間</dt>
                <dd>{exam.durationMinutes}分</dd>
              </div>
              <div>
                <dt>設問数</dt>
                <dd>{exam.questions.length}問</dd>
              </div>
              <div>
                <dt>満点</dt>
                <dd>{exam.totalPoints}点</dd>
              </div>
            </dl>
            <ol className="instruction-list">
              {exam.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ol>
            <button className="primary-button large-button" type="button" onClick={onStart}>
              試験開始
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
