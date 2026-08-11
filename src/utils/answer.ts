import type { AnswerValue, Exam, GradeSummary, GradedQuestion, QuestionSlot, UserAnswers } from "../types";

export function getOptionOrder(question: QuestionSlot): AnswerValue[] {
  return question.options.map((option) => option.value);
}

export function normalizeAnswer(values: AnswerValue[], optionOrder: AnswerValue[]): AnswerValue[] {
  const unique = Array.from(new Set(values));
  return unique.sort((left, right) => optionOrder.indexOf(left) - optionOrder.indexOf(right));
}

export function toggleAnswer(
  question: QuestionSlot,
  currentValues: AnswerValue[] | undefined,
  nextValue: AnswerValue
): AnswerValue[] {
  const current = currentValues ?? [];
  if (!question.multi) {
    return current.includes(nextValue) ? [] : [nextValue];
  }

  const toggled = current.includes(nextValue)
    ? current.filter((value) => value !== nextValue)
    : [...current, nextValue];

  return normalizeAnswer(toggled, getOptionOrder(question));
}

export function answersEqual(
  left: AnswerValue[],
  right: AnswerValue[],
  optionOrder: AnswerValue[]
): boolean {
  const normalizedLeft = normalizeAnswer(left, optionOrder);
  const normalizedRight = normalizeAnswer(right, optionOrder);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}

export function gradeQuestion(question: QuestionSlot, userAnswer: AnswerValue[] | undefined): GradedQuestion {
  const answer = userAnswer ?? [];
  const isUnanswered = answer.length === 0;
  const isCorrect = answersEqual(answer, question.correct, getOptionOrder(question));

  return {
    question,
    userAnswer: normalizeAnswer(answer, getOptionOrder(question)),
    correctAnswer: normalizeAnswer(question.correct, getOptionOrder(question)),
    isCorrect,
    earnedPoints: isCorrect ? question.points : 0,
    status: isUnanswered ? "unanswered" : isCorrect ? "correct" : "incorrect"
  };
}

export function gradeExam(exam: Exam, answers: UserAnswers): GradeSummary {
  const gradedQuestions = exam.questions.map((question) => gradeQuestion(question, answers[question.id]));

  return {
    totalScore: gradedQuestions.reduce((sum, item) => sum + item.earnedPoints, 0),
    totalPoints: exam.totalPoints,
    gradedQuestions
  };
}
