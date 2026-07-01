import { useMemo, useState } from "react";
import type { Exam, QuestionSlot } from "../../types";

interface ScoringDesignPreviewProps {
  exam: Exam;
}

interface ScoringCandidate {
  id: string;
  name: string;
  shortName: string;
  reference: string;
  themeClass: string;
  intent: string;
}

const scoringCandidates: ScoringCandidate[] = [
  {
    id: "ledger-dashboard",
    name: "01 Ledger Dashboard",
    shortName: "Ledger",
    reference: "Stripe Dashboard",
    themeClass: "scoring-ledger-dashboard",
    intent: "会計ダッシュボードのように得点と明細を分ける"
  },
  {
    id: "stamp-desk",
    name: "02 Stamp Desk",
    shortName: "Desk",
    reference: "Paper workflow",
    themeClass: "scoring-stamp-desk",
    intent: "紙の採点済み答案を机の上で確認する"
  },
  {
    id: "kanban-verdict",
    name: "03 Kanban Verdict",
    shortName: "Kanban",
    reference: "Linear board",
    themeClass: "scoring-kanban-verdict",
    intent: "正誤をカード単位で横断的に確認する"
  },
  {
    id: "transcript-sheet",
    name: "04 Transcript Sheet",
    shortName: "Transcript",
    reference: "School transcript",
    themeClass: "scoring-transcript-sheet",
    intent: "成績表として罫線と列情報を強く見せる"
  },
  {
    id: "command-console",
    name: "05 Command Console",
    shortName: "Console",
    reference: "Developer console",
    themeClass: "scoring-command-console",
    intent: "ログ確認のように採点結果を高速に読む"
  },
  {
    id: "bento-report",
    name: "06 Bento Report",
    shortName: "Bento",
    reference: "Apple dashboards",
    themeClass: "scoring-bento-report",
    intent: "大きな得点面と小さな結果面を組み合わせる"
  },
  {
    id: "audit-trail",
    name: "07 Audit Trail",
    shortName: "Audit",
    reference: "GitHub timeline",
    themeClass: "scoring-audit-trail",
    intent: "採点の履歴を上から順番に追う"
  },
  {
    id: "scoreboard",
    name: "08 Scoreboard",
    shortName: "Board",
    reference: "Sports scoreboard",
    themeClass: "scoring-scoreboard",
    intent: "最終点を競技場のスコアボードのように強調する"
  },
  {
    id: "certificate",
    name: "09 Certificate",
    shortName: "Cert",
    reference: "Completion certificate",
    themeClass: "scoring-certificate",
    intent: "結果通知書として余白と中央配置を重視する"
  },
  {
    id: "answer-sheet",
    name: "10 Answer Sheet",
    shortName: "Sheet",
    reference: "Common test sheet",
    themeClass: "scoring-answer-sheet",
    intent: "答案欄と同じ罫線感で採点結果を出す"
  }
];

const correctnessPattern = [true, false, true, true, false, true];

function trimPrompt(question: QuestionSlot) {
  return question.prompt.replaceAll("$", "").slice(0, 42);
}

function getWrongAnswer(question: QuestionSlot) {
  return question.options.find((option) => !question.correct.includes(option.value))?.label ?? "未";
}

export function ScoringDesignPreview({ exam }: ScoringDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState(scoringCandidates[0].id);
  const activeCandidate =
    scoringCandidates.find((candidate) => candidate.id === activeCandidateId) ?? scoringCandidates[0];
  const previewRows = useMemo(
    () =>
      exam.questions.slice(0, 6).map((question, index) => {
        const isCorrect = correctnessPattern[index % correctnessPattern.length];
        const correctLabels = question.options
          .filter((option) => question.correct.includes(option.value))
          .map((option) => option.label);
        return {
          question,
          correctLabels,
          isCorrect,
          userAnswer: isCorrect ? correctLabels.join(", ") : getWrongAnswer(question),
          earnedPoints: isCorrect ? question.points : 0
        };
      }),
    [exam.questions]
  );
  const totalPoints = exam.totalPoints;
  const totalScore = Math.round(totalPoints * 0.76);
  const visibleCorrectCount = previewRows.filter((row) => row.isCorrect).length;

  return (
    <section className="exam-design-mode scoring-design-mode" aria-label="採点画面デザイン候補">
      <header className="design-mode-heading">
        <div>
          <p className="eyebrow">Scoring candidates</p>
          <h2>採点画面デザイン候補</h2>
        </div>
        <div className="design-reference-pill">{activeCandidate.reference}</div>
      </header>

      <div className="design-candidate-tabs" role="tablist" aria-label="採点画面デザイン候補">
        {scoringCandidates.map((candidate) => (
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

      <article
        className={`scoring-design-canvas ${activeCandidate.themeClass}`}
        aria-label={`${activeCandidate.name}のプレビュー`}
      >
        <header className="scoring-preview-header">
          <div>
            <p>{activeCandidate.intent}</p>
            <h3>{activeCandidate.name}</h3>
          </div>
          <span>{exam.title}</span>
        </header>

        <div className="scoring-preview-stage">
          <section className="scoring-preview-summary" aria-label="得点サマリー">
            <span>最終得点</span>
            <strong>
              {totalScore}
              <small>/{totalPoints}</small>
            </strong>
            <p>
              正答 {visibleCorrectCount}/{previewRows.length} ・ {exam.questions.length}問
            </p>
          </section>

          <section className="scoring-preview-rows" aria-label="採点明細">
            {previewRows.map((row) => (
              <article
                className={`scoring-preview-row ${row.isCorrect ? "correct" : "wrong"}`}
                key={row.question.id}
              >
                <div className="scoring-preview-question">
                  <span>{row.question.label}</span>
                  <div>
                    <strong>{row.question.section}</strong>
                    <p>{trimPrompt(row.question)}</p>
                  </div>
                </div>
                <div className="scoring-preview-answer">
                  <span>解答 {row.userAnswer}</span>
                  <span>正解 {row.correctLabels.join(", ")}</span>
                </div>
                <div className="scoring-preview-verdict" aria-label={row.isCorrect ? "正解" : "不正解"}>
                  {row.isCorrect ? "○" : "×"}
                </div>
                <strong className="scoring-preview-points">{row.earnedPoints}点</strong>
              </article>
            ))}
          </section>

          <div className="scoring-preview-actions">
            <button type="button">復習する</button>
            <button type="button">一覧へ戻る</button>
          </div>
        </div>
      </article>
    </section>
  );
}
