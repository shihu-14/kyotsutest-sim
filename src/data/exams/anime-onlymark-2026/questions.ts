import type { QuestionSlot } from "../../../domain/exam";

const definitions = [
  { section: "第1問", page: 1, points: 10, choices: 4, answer: "1" },
  { section: "第2問 問1", page: 2, points: 4, choices: 4, answer: "3" },
  { section: "第2問 問2", page: 4, points: 2, choices: 9, answer: "4" },
  { section: "第2問 問2", page: 4, points: 2, choices: 9, answer: "7" },
  { section: "第2問 問2", page: 4, points: 2, choices: 9, answer: "2" },
  { section: "第2問 問2", page: 4, points: 2, choices: 9, answer: "8" },
  { section: "第3問", page: 5, points: 10, choices: 5, answer: "3" },
  { section: "第4問 問1", page: 6, points: 7, choices: 8, answer: "6" },
  { section: "第4問 問2", page: 7, points: 3, choices: 4, answer: "4" },
  { section: "第4問 問2", page: 7, points: 3, choices: 4, answer: "2" },
  { section: "第4問 問2", page: 7, points: 3, choices: 4, answer: "1" },
  { section: "第5問", page: 8, points: 3, choices: 3, answer: "3" },
  { section: "第5問", page: 8, points: 3, choices: 3, answer: "3" },
  { section: "第5問", page: 8, points: 4, choices: 3, answer: "2" },
  { section: "第6問", page: 9, points: 5, choices: 3, answer: "1" },
  { section: "第6問", page: 9, points: 5, choices: 3, answer: "2" },
  { section: "第7問", page: 10, points: 10, choices: 4, answer: "1" },
  { section: "第8問", page: 11, points: 4, choices: 4, answer: "2" },
  { section: "第8問", page: 11, points: 4, choices: 4, answer: "4" },
  { section: "第8問", page: 12, points: 4, choices: 4, answer: "2" },
  { section: "第9問", page: 13, points: 10, choices: 4, answer: "3" }
];

export const animeOnlymarkQuestions: QuestionSlot[] = definitions.map((definition, index) => ({
  id: `anime-q${String(index + 1).padStart(2, "0")}`,
  label: String(index + 1),
  section: definition.section,
  pageId: `anime-p${String(definition.page).padStart(2, "0")}`,
  points: definition.points,
  multi: false,
  options: Array.from({ length: definition.choices }, (_, optionIndex) => {
    const value = String(optionIndex + 1);
    return { value, label: value };
  }),
  correct: [definition.answer]
}));
