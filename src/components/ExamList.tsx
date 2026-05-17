import type { Exam } from "../types";

interface ExamListProps {
  exams: Exam[];
  onDelete: (examId: string) => void;
  onEdit: (exam: Exam) => void;
  onSelect: (exam: Exam) => void;
  onOpenEditor: () => void;
}

export function ExamList({ exams, onDelete, onEdit, onSelect, onOpenEditor }: ExamListProps) {
  return (
    <main className="screen screen-narrow">
      <header className="screen-heading">
        <div>
          <p className="eyebrow">Published exams</p>
          <h1>共通テスト形式 ウェブ模試</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onOpenEditor}>
          新規作成
        </button>
      </header>

      <section className="exam-grid" aria-label="公開中の試験一覧">
        {exams
          .filter((exam) => exam.published)
          .map((exam) => (
            <article className="exam-tile" key={exam.id}>
              <div className="exam-card-main">
                <div className="exam-card-copy">
                  <div className="exam-title-row">
                    <div>
                      <p className="eyebrow">{exam.subject}</p>
                      <h2>{exam.title}</h2>
                    </div>
                    <details className="exam-actions">
                      <summary aria-label={`${exam.title}の設定`}>⋮</summary>
                      <div className="exam-action-menu">
                        <button type="button" onClick={() => onEdit(exam)}>
                          編集する
                        </button>
                        <button type="button" onClick={() => onDelete(exam.id)}>
                          削除する
                        </button>
                      </div>
                    </details>
                  </div>
                  <p>{exam.description}</p>
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
                    試験を始める
                  </button>
                </div>
                <div className="exam-cover-thumb" aria-label={`${exam.title}の表紙`}>
                  {exam.coverImageUrl ? <img src={exam.coverImageUrl} alt="" /> : <div className="cover-placeholder" />}
                </div>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}
