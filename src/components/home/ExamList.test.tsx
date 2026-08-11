import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleExams } from "../../data/sampleExam";
import { ExamList } from "./ExamList";

describe("ExamList", () => {
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

  afterEach(() => vi.unstubAllGlobals());

  it("uses each problem booklet itself as the exam selection control", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const exam = sampleExams[0];

    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole("button", { name: "問題の新規作成" })).toBeDisabled();
    expect(screen.getByLabelText(`${exam.title}の表紙`)).toBeInTheDocument();
    expect(screen.queryByText(exam.subject)).not.toBeInTheDocument();
    expect(screen.queryByText(exam.description)).not.toBeInTheDocument();

    const card = screen.getByRole("article", { name: exam.title });
    expect(card).toHaveAttribute("data-card-structure", "steam-capsule");
    expect(card).toHaveAttribute("data-capsule-theme", "current");
    expect(card).not.toHaveTextContent(`${exam.durationMinutes}分`);
    expect(within(card).queryByText(`${exam.questions.length}問`)).not.toBeInTheDocument();
    expect(card).not.toHaveTextContent(`${exam.totalPoints}点`);
    expect(within(card).queryByRole("heading", { name: exam.title })).not.toBeInTheDocument();
    expect(within(card).queryByText(exam.title)).not.toBeInTheDocument();
    expect(within(card).queryByText("共通テスト形式")).not.toBeInTheDocument();
    expect(within(card).queryByText("公開中")).not.toBeInTheDocument();
    expect(within(card).getByLabelText(`${exam.title}の設定`)).toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: "試験を始める" })).not.toBeInTheDocument();
    expect(card.querySelector(".steam-capsule-overlay")).not.toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: `${exam.title}を選択` }));
    expect(onSelect).toHaveBeenCalledWith(exam);
  });

  it("omits card darkening controls while keeping the card action menu", async () => {
    const user = userEvent.setup();
    const exam = sampleExams[0];
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByText("カード暗さ調整")).not.toBeInTheDocument();
    expect(document.querySelector(".steam-capsule-overlay")).not.toBeInTheDocument();
    const card = screen.getByRole("article", { name: exam.title });
    await user.click(within(card).getByLabelText(`${exam.title}の設定`));
    expect(within(card).getByRole("button", { name: "編集する" })).toBeEnabled();
    expect(within(card).getByRole("button", { name: "削除する" })).toBeEnabled();
    expect(screen.queryByLabelText("試験を始めるボタンの色")).not.toBeInTheDocument();
    ["書き込みを消す", "画面候補", "ホーム候補", "時間候補", "ページ候補", "採点候補", "編集候補"].forEach(
      (name) => expect(screen.queryByRole("button", { name })).not.toBeInTheDocument()
    );
  });

  it("keeps the adopted Steam Capsule card usable without a cover image", () => {
    const examWithoutCover = {
      ...sampleExams[0],
      id: "home-without-cover",
      title: "表紙なしホーム試験",
      coverImageUrl: undefined
    };

    render(
      <ExamList
        exams={[examWithoutCover]}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const card = screen.getByRole("article", { name: examWithoutCover.title });
    expect(within(card).getByRole("img", { name: `${examWithoutCover.title}の表紙画像なし` })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: `${examWithoutCover.title}を選択` })).toBeInTheDocument();
  });

  it("registers the anime TeX exam as a published PDF-page sample", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026");

    expect(animeExam).toMatchObject({
      title: "漫画映画",
      subject: "漫画映画",
      durationMinutes: 40,
      published: true,
      totalPoints: 100
    });
    expect(animeExam?.source).toMatchObject({
      kind: "latex-pdf",
      markPlacement: "manual",
      pdfPath: "src/assets/exams/anime-onlymark-2026/source/kyotutest_anime_onlymark.pdf",
      pdfPageImagesPath: "src/assets/exams/anime-onlymark-2026/pdf-pages"
    });
    expect(animeExam?.pages).toHaveLength(14);
    expect(animeExam?.questions).toHaveLength(21);
    expect(animeExam?.pages.every((page) => page.pageImageUrl)).toBe(true);
    expect(animeExam?.pages[13]?.title).toBe("キャラクター一覧");
    expect(animeExam?.questions.reduce((sum, question) => sum + question.points, 0)).toBe(100);
  });

  it("runs edit and delete actions without selecting the exam", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    const onSelect = vi.fn();
    const exam = sampleExams[0];

    render(
      <ExamList
        exams={sampleExams}
        onDelete={onDelete}
        onEdit={onEdit}
        onOpenEditor={vi.fn()}
        onSelect={onSelect}
      />
    );

    const card = screen.getByRole("article", { name: exam.title });
    await user.click(within(card).getByLabelText(`${exam.title}の設定`));
    await user.click(within(card).getByRole("button", { name: "編集する" }));
    await user.click(within(card).getByRole("button", { name: "削除する" }));

    expect(onEdit).toHaveBeenCalledWith(exam);
    expect(onDelete).toHaveBeenCalledWith(exam.id);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("closes a card action menu when another part of the page is clicked", async () => {
    const user = userEvent.setup();
    const exam = sampleExams[0];
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const settings = screen.getByLabelText(`${exam.title}の設定`);
    const menu = settings.closest("details");
    await user.click(settings);
    expect(menu).toHaveAttribute("open");

    await user.click(screen.getByRole("heading", { name: "共通テスト形式 ウェブ模試" }));
    expect(menu).not.toHaveAttribute("open");
  });
});
