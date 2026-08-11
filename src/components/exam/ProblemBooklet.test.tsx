import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import gradeCircleStamp from "../../assets/stamps/grade-circle.png";
import { sampleExams } from "../../data/sampleExam";
import { ProblemBooklet } from "./ProblemBooklet";

describe("ProblemBooklet", () => {
  it("syncs clickable marks on exact anime pages with the shared answer state", async () => {
    const user = userEvent.setup();
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;
    const page = animeExam.pages[0];
    const question = animeExam.questions[0];
    const onToggleAnswer = vi.fn();

    render(
      <ProblemBooklet
        answers={{}}
        page={page}
        questionsById={new Map(animeExam.questions.map((item) => [item.id, item]))}
        onToggleAnswer={onToggleAnswer}
      />
    );

    expect(screen.queryByLabelText("問題ページ内の解答マーク")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "1 4" }));

    expect(onToggleAnswer).toHaveBeenCalledWith(question, "4");
    expect(screen.getByRole("button", { name: "1 4" })).toHaveStyle("--mark-y: 88.928%");
    expect(screen.getByRole("button", { name: "1 4" })).not.toHaveStyle("--mark-y-correction: -200%");
  });

  it("renders selected exact-page marks as filled in review state", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;
    const page = animeExam.pages[0];
    const question = animeExam.questions[0];

    render(
      <ProblemBooklet
        answers={{ [question.id]: ["1"] }}
        page={page}
        questionsById={new Map(animeExam.questions.map((item) => [item.id, item]))}
        reviewMode
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "1 1" })).toHaveClass("selected");
    expect(screen.getByRole("button", { name: "1 1" })).toHaveClass("review-correct");
    expect(screen.getByRole("button", { name: "1 4" })).not.toHaveClass("review-correct");
  });

  it("renders multiple selected marks on an exact page when the question allows it", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;
    const page = animeExam.pages[0];
    const question = { ...animeExam.questions[0], multi: true };

    render(
      <ProblemBooklet
        answers={{ [question.id]: ["1", "3"] }}
        page={page}
        questionsById={new Map([[question.id, question]])}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "1 1" })).toHaveClass("selected");
    expect(screen.getByRole("button", { name: "1 3" })).toHaveClass("selected");
  });

  it("marks the correct answer in red during review without a separate mark panel", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;
    const page = animeExam.pages[0];
    const question = animeExam.questions[0];

    render(
      <ProblemBooklet
        answers={{ [question.id]: ["4"] }}
        page={page}
        questionsById={new Map(animeExam.questions.map((item) => [item.id, item]))}
        reviewMode
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "1 4" })).toHaveClass("selected");
    expect(screen.getByRole("button", { name: "1 1" })).toHaveClass("review-correct");
  });

  it("places exact-page grading stamps on the TeX answer-number box", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;
    const page = animeExam.pages[0];
    const question = animeExam.questions[0];

    render(
      <ProblemBooklet
        answers={{ [question.id]: ["4"] }}
        gradeStates={
          new Map([
            [
              question.id,
              {
                question,
                userAnswer: ["4"],
                correctAnswer: ["4"],
                isCorrect: true,
                earnedPoints: 10,
                status: "correct"
              }
            ]
          ])
        }
        page={page}
        questionsById={new Map(animeExam.questions.map((item) => [item.id, item]))}
        reviewMode
        onToggleAnswer={vi.fn()}
      />
    );

    expect(document.querySelector(".page-image-grade-stamp")).toHaveStyle({
      "--grade-x": "66.72%",
      "--grade-y": "17.974%"
    });
    expect(screen.getByLabelText("正解")).toHaveClass("grade-stamp", "red-pen", "circle");
    expect(screen.getByLabelText("正解")).not.toHaveClass("is-drawing");
    expect(screen.getByLabelText("正解").querySelector("image.stamp-asset")).toHaveAttribute(
      "href",
      gradeCircleStamp
    );
    expect(screen.getByLabelText("正解").querySelector("mask")).toBeNull();
  });

  it("reveals exact-page red corrections only for questions whose stamp has started", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;
    const page = animeExam.pages[3];
    const firstQuestion = animeExam.questions.find((question) => question.id === "anime-q03")!;
    const nextQuestion = animeExam.questions.find((question) => question.id === "anime-q04")!;
    const firstCorrectOption = firstQuestion.options.find((option) => option.value === firstQuestion.correct[0])!;
    const nextCorrectOption = nextQuestion.options.find((option) => option.value === nextQuestion.correct[0])!;

    render(
      <ProblemBooklet
        answers={{}}
        gradeStates={
          new Map([
            [
              firstQuestion.id,
              {
                question: firstQuestion,
                userAnswer: [],
                correctAnswer: firstQuestion.correct,
                isCorrect: false,
                earnedPoints: 0,
                status: "unanswered" as const
              }
            ]
          ])
        }
        page={page}
        questionsById={new Map(animeExam.questions.map((item) => [item.id, item]))}
        reviewMode
        onToggleAnswer={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: `${firstQuestion.label} ${firstCorrectOption.label}` })
    ).toHaveClass("review-correct");
    expect(
      screen.getByRole("button", { name: `${nextQuestion.label} ${nextCorrectOption.label}` })
    ).not.toHaveClass("review-correct");
  });
});
