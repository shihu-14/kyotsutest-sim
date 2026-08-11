import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleExams } from "../../data/sampleExam";
import { ExamList } from "../home/ExamList";

function tagSignature(element: Element): string {
  return `${element.tagName.toLowerCase()}[${Array.from(element.children)
    .map(tagSignature)
    .join(",")}]`;
}

describe("production design previews", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        removeEventListener: vi.fn()
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the adopted Steam Capsule structure on the real home screen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={onSelect}
      />
    );

    const exam = sampleExams[0];
    const card = screen.getByRole("article", { name: exam.title });
    expect(card).toHaveAttribute("data-card-structure", "steam-capsule");
    expect(card).toHaveAttribute("data-capsule-theme", "current");
    expect(card).not.toHaveTextContent(`${exam.durationMinutes}分`);
    expect(within(card).queryByText(`${exam.questions.length}問`)).not.toBeInTheDocument();
    expect(card).not.toHaveTextContent(`${exam.totalPoints}点`);
    expect(within(card).queryByRole("heading", { name: exam.title })).not.toBeInTheDocument();
    expect(within(card).getByLabelText(`${exam.title}の設定`)).toBeInTheDocument();
    expect(card.querySelector(".steam-capsule-overlay")).not.toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: `${exam.title}を選択` }));
    expect(onSelect).toHaveBeenCalledWith(exam);
  });

  it("switches ten score-only layouts inside the real review screen", async () => {
    const user = userEvent.setup();
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "得点候補" }));

    const tabs = screen.getAllByRole("tab");
    const panel = screen.getByRole("tabpanel");
    const runner = panel.querySelector(".score-display-preview-runner");
    const homeButton = within(panel).getByRole("button", { name: "ホームに戻る" });
    const layouts = new Set<string>();
    const structures = new Set<string>();

    expect(tabs).toHaveLength(10);
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      expect.stringContaining("01 Broadcast Score Bug"),
      expect.stringContaining("02 Exam Margin Grade"),
      expect.stringContaining("03 Report Ledger"),
      expect.stringContaining("04 Toolbar Tab"),
      expect.stringContaining("05 Half Dial"),
      expect.stringContaining("06 Vertical Level"),
      expect.stringContaining("07 LCD Score Window"),
      expect.stringContaining("08 Ten Segment Scale"),
      expect.stringContaining("09 Receipt Score"),
      expect.stringContaining("10 Corner Bracket")
    ]);
    expect(runner).toHaveClass("exam-layout", "exam-mode-background");
    expect(panel.querySelector(".booklet-shell")).toBeInTheDocument();
    expect(panel.querySelector(".mark-sheet")).toBeInTheDocument();

    for (const tab of tabs) {
      await user.click(tab);
      const score = within(panel).getByRole("status", { name: /得点 \d+\/100/ });
      layouts.add(score.getAttribute("data-score-layout") ?? "");
      structures.add(tagSignature(score));
      expect(panel.querySelector(".score-display-preview-runner")).toBe(runner);
      expect(within(panel).getByRole("button", { name: "ホームに戻る" })).toBe(homeButton);
    }

    expect(layouts.size).toBe(10);
    expect(structures.size).toBe(10);

    await user.click(homeButton);
    expect(screen.getByRole("button", { name: "得点候補" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "漫画映画" })).toBeInTheDocument();
  });

  it("switches and replays ten temporary score-pop designs", async () => {
    const user = userEvent.setup();
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "得点ポップ候補" }));

    const expectedNames = [
      "01 Google Forms Plain",
      "02 Kahoot Score Focus",
      "03 Apple Gauge",
      "04 Live Activity Capsule",
      "05 Steam Achievement Toast",
      "06 Fluent Result",
      "07 Broadcast Score Bug",
      "08 Exam Red Stamp",
      "09 Score Slip",
      "10 Number Reveal"
    ];
    const tabs = screen.getAllByRole("tab");
    const panel = screen.getByRole("tabpanel");
    const layouts = new Set<string>();
    const structures = new Set<string>();

    expect(tabs).toHaveLength(10);
    expect(tabs.map((tab) => tab.textContent)).toEqual(
      expectedNames.map((name) => expect.stringContaining(name))
    );
    expect(panel.querySelector(".score-display")).not.toBeInTheDocument();
    expect(panel.querySelector(".review-score-badge")).not.toBeInTheDocument();

    for (const [index, tab] of tabs.entries()) {
      await user.click(tab);
      const pop = within(panel).getByRole("status", { name: "得点 86/100" });
      layouts.add(pop.getAttribute("data-score-pop-layout") ?? "");
      structures.add(tagSignature(pop));
      expect(pop).toHaveTextContent("86");

      const replayButton = within(panel).getByRole("button", { name: `${expectedNames[index]}を再生` });
      await user.click(replayButton);
      expect(within(panel).getByRole("status", { name: "得点 86/100" })).not.toBe(pop);
    }

    expect(layouts.size).toBe(10);
    expect(structures.size).toBe(10);

    await user.click(screen.getByRole("button", { name: "試験一覧" }));
    expect(screen.getByRole("button", { name: "得点ポップ候補" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "漫画映画" })).toBeInTheDocument();
  });

});
