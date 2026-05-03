import type { Exam } from "../types";

interface ExamListProps {
  exams: Exam[];
  onSelect: (exam: Exam) => void;
  onOpenEditor: () => void;
}

export function ExamList({ exams, onSelect, onOpenEditor }: ExamListProps) {
  return (
    <main className="screen screen-narrow">
      <header className="screen-heading">
        <div>
          <p className="eyebrow">Published exams</p>
          <h1>共通テスト形式 ウェブ模試</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onOpenEditor}>
          作問エディタ
        </button>
      </header>

      <section className="exam-grid" aria-label="公開中の試験一覧">
        {exams
          .filter((exam) => exam.published)
          .map((exam) => (
            <article className="exam-tile" key={exam.id}>
              <div>
                <p className="eyebrow">{exam.subject}</p>
                <h2>{exam.title}</h2>
                <p>{exam.description}</p>
              </div>
              <dl className="exam-meta">
                <div>
                  <dt>時間</dt>
                  <dd>{exam.durationMinutes}分</dd>
                </div>
                <div>
                  <dt>設問</dt>
                  <dd>{exam.questions.length}問</dd>
                </div>
                <div>
                  <dt>配点</dt>
                  <dd>{exam.totalPoints}点</dd>
                </div>
              </dl>
              <button className="primary-button" type="button" onClick={() => onSelect(exam)}>
                表紙へ進む
              </button>
            </article>
          ))}
      </section>
    </main>
  );
}
