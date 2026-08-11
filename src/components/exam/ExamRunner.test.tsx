import { useState } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import gradeCircleStamp from "../../assets/stamps/grade-circle.png";
import { animeOnlymarkExam } from "../../data/exams/animeOnlymark2026";
import { structuredExamFixture } from "../../test/examFixtures";
import { ExamRunner } from "./ExamRunner";

function installPageTabLayoutMocks() {
  const scrollToDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTo");
  const pageWidth = 50 * 1.45;
  const coverWidth = 46 * 1.8;
  const visiblePageCount = 12;
  const scrollTo = vi.fn(function scrollToPageTab(this: HTMLElement, options: ScrollToOptions) {
    this.scrollLeft = options.left ?? 0;
  });

  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: scrollTo
  });

  const mockNavMetrics = (nav: HTMLElement) => {
    const pageCount = [...nav.querySelectorAll("button")].length;
    Object.defineProperties(nav, {
      clientWidth: {
        configurable: true,
        value: visiblePageCount * pageWidth
      },
      scrollLeft: {
        configurable: true,
        value: 0,
        writable: true
      },
      scrollWidth: {
        configurable: true,
        value: pageCount * pageWidth
      },
      offsetLeft: {
        configurable: true,
        value: coverWidth
      }
    });

    nav.querySelectorAll("button").forEach((button) => {
      const pageNumber = Number(button.textContent?.trim());
      Object.defineProperties(button, {
        offsetLeft: {
          configurable: true,
          value: Number.isFinite(pageNumber) && pageNumber > 0 ? coverWidth + (pageNumber - 1) * pageWidth : 0
        },
        offsetWidth: {
          configurable: true,
          value: pageWidth
        }
      });
    });
  };

  return {
    mockNavMetrics,
    restore: () => {
      if (scrollToDescriptor) {
        Object.defineProperty(HTMLElement.prototype, "scrollTo", scrollToDescriptor);
        return;
      }

      delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollTo;
    },
    scrollTo
  };
}

describe("ExamRunner", () => {
  it("asks for confirmation before finishing an active exam", async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    const onReturnHome = vi.fn();

    render(
      <ExamRunner
        answers={{}}
        currentPageId={structuredExamFixture.pages[0].id}
        deadline={Date.now() + 60_000}
        exam={structuredExamFixture}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={onFinish}
        onReturnHome={onReturnHome}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(document.querySelector('input[type="range"][aria-label="問題表示倍率"]')).not.toBeInTheDocument();
    expect(screen.getByLabelText("問題表示領域")).toBeInTheDocument();
    expect(screen.getByRole("timer", { name: /残り時間/ })).toHaveTextContent(/^\d{2}:\d{2}$/);
    expect(screen.getByRole("timer", { name: /残り時間/ })).toHaveClass("stopwatch-timer");
    expect(screen.getByText("ホームに戻る")).toBeInTheDocument();
    expect(screen.queryByText("解答済み")).not.toBeInTheDocument();
    expect(screen.queryByText("中断")).not.toBeInTheDocument();

    await user.click(screen.getByText("採点へ進む"));

    expect(onFinish).not.toHaveBeenCalled();
    const finishDialog = screen.getByRole("dialog", { name: "採点へ進む確認" });
    expect(within(finishDialog).getByText("残り時間がありますが，解答を終了し採点へ進みますか")).toBeInTheDocument();
    expect(within(finishDialog).queryByRole("heading")).not.toBeInTheDocument();
    expect(finishDialog).toHaveStyle({ width: "min(550px, calc(100vw - 40px))" });
    expect(within(finishDialog).getByText("残り時間がありますが，解答を終了し採点へ進みますか")).toHaveStyle({
      whiteSpace: "nowrap"
    });
    expect(finishDialog.querySelector(".dialog-actions")).toHaveStyle({ gap: "16px" });

    fireEvent.click(document.querySelector(".dialog-backdrop")!);
    expect(screen.queryByRole("dialog", { name: "採点へ進む確認" })).not.toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();

    await user.click(screen.getByText("採点へ進む"));
    const reopenedFinishDialog = screen.getByRole("dialog", { name: "採点へ進む確認" });

    await user.click(within(reopenedFinishDialog).getByText("解答を続ける"));
    expect(onFinish).not.toHaveBeenCalled();

    await user.click(screen.getByText("採点へ進む"));
    await user.click(within(screen.getByRole("dialog", { name: "採点へ進む確認" })).getByText("採点へ進む"));

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onReturnHome).not.toHaveBeenCalled();
  });

  it("uses default action widths without color debug controls", () => {
    const onReturnHome = vi.fn();

    render(
      <ExamRunner
        answers={{}}
        currentPageId={structuredExamFixture.pages[0].id}
        deadline={Date.now() + 60_000}
        exam={structuredExamFixture}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onReturnHome={onReturnHome}
        onToggleAnswer={vi.fn()}
      />
    );

    const finishButton = document.querySelector<HTMLButtonElement>(".finish-button")!;
    const homeButton = document.querySelector<HTMLButtonElement>(".home-return-button")!;

    expect(finishButton.style.getPropertyValue("--finish-color")).toBe("#ff4d00");
    expect(finishButton.style.color).toBe("rgb(255, 255, 255)");
    expect(finishButton.style.width).toBe("");
    expect(homeButton.style.getPropertyValue("--home-action-color")).toBe("#fffaf1");
    expect(homeButton.style.width).toBe("");
    expect(screen.queryByText("ホーム色")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("ホームに戻るボタン色")).not.toBeInTheDocument();

    fireEvent.click(homeButton);
    const homeDialog = screen.getByRole("dialog", { name: "ホームに戻る確認" });
    expect(onReturnHome).not.toHaveBeenCalled();
    expect(within(homeDialog).getByText("試験を中断してホームへ戻りますか（現在の解答は保存されません）")).toBeInTheDocument();
    expect(within(homeDialog).queryByRole("heading")).not.toBeInTheDocument();
    expect(homeDialog).toHaveStyle({ width: "min(550px, calc(100vw - 40px))" });
    expect(within(homeDialog).getByText("試験を中断してホームへ戻りますか（現在の解答は保存されません）")).toHaveStyle({
      whiteSpace: "nowrap"
    });
    expect(homeDialog.querySelector(".dialog-actions")).toHaveStyle({ gap: "16px" });

    fireEvent.click(document.querySelector(".dialog-backdrop")!);
    expect(screen.queryByRole("dialog", { name: "ホームに戻る確認" })).not.toBeInTheDocument();
    expect(onReturnHome).not.toHaveBeenCalled();

    fireEvent.click(homeButton);
    fireEvent.click(within(screen.getByRole("dialog", { name: "ホームに戻る確認" })).getByText("ホームに戻る"));
    expect(onReturnHome).toHaveBeenCalledTimes(1);
  });

  it("shows the score in the timer position during review and returns home without confirmation", async () => {
    const user = userEvent.setup();
    const onExitReview = vi.fn();

    render(
      <ExamRunner
        answers={{ "fixture-q1": ["2"] }}
        currentPageId={structuredExamFixture.pages[0].id}
        deadline={null}
        exam={structuredExamFixture}
        reviewMode
        onChangePage={vi.fn()}
        onExitReview={onExitReview}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(document.querySelector('[role="timer"]')).not.toBeInTheDocument();
    const reviewScore = document.querySelector('[role="status"][aria-label="得点 4/12"]');
    expect(reviewScore).toHaveClass("review-score-badge");
    expect(reviewScore?.querySelector("span")).not.toBeInTheDocument();
    expect(document.querySelector(".exam-layout")).toHaveClass("exam-review-mode");
    expect((document.querySelector(".exam-layout") as HTMLElement).style.getPropertyValue("--exam-timer-accent")).toBe(
      "#ff4d00"
    );
    expect(screen.queryByText("結果へ戻る")).not.toBeInTheDocument();

    await user.click(screen.getByText("ホームに戻る"));

    expect(onExitReview).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="dialog"][aria-label="ホームに戻る確認"]')).not.toBeInTheDocument();
  });

  it("keeps grading stamps on problem numbers in review mode", () => {
    const animeExam = animeOnlymarkExam;

    render(
      <ExamRunner
        answers={{ "anime-q01": ["1"] }}
        currentPageId={animeExam.pages[0].id}
        deadline={null}
        exam={animeExam}
        reviewMode
        onChangePage={vi.fn()}
        onExitReview={vi.fn()}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(document.querySelector(".page-image-grade-stamp")).toBeInTheDocument();
    expect(screen.getByLabelText("正解")).toHaveClass("grade-stamp", "red-pen", "circle");
    expect(screen.getByLabelText("正解")).not.toHaveClass("is-drawing");
    expect(screen.getByLabelText("正解").querySelector("image.stamp-asset")).toHaveAttribute(
      "href",
      gradeCircleStamp
    );
  });

  it("uses fine zoom steps and caps trackpad wheel bursts to one update per frame", () => {
    const frameCallbacks = new Map<number, FrameRequestCallback>();
    let nextFrameId = 1;
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      const frameId = nextFrameId;
      nextFrameId += 1;
      frameCallbacks.set(frameId, callback);
      return frameId;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((frameId: number) => frameCallbacks.delete(frameId)));

    const flushFrame = () => {
      const callbacks = [...frameCallbacks.values()];
      frameCallbacks.clear();
      act(() => callbacks.forEach((callback) => callback(16)));
    };

    const rendered = render(
      <ExamRunner
        answers={{}}
        currentPageId={structuredExamFixture.pages[0].id}
        deadline={Date.now() + 60_000}
        exam={structuredExamFixture}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    try {
      const stage = screen.getByLabelText("問題表示領域");
      for (let index = 0; index < 40; index += 1) {
        fireEvent.wheel(stage, { ctrlKey: true, deltaY: -1 });
      }

      expect(stage).toHaveStyle({ "--booklet-zoom": "1" });
      flushFrame();
      expect(stage).toHaveStyle({ "--booklet-zoom": "1.03" });

      fireEvent.keyDown(stage, { ctrlKey: true, key: "+" });
      expect(stage).toHaveStyle({ "--booklet-zoom": "1.06" });
      fireEvent.keyDown(stage, { ctrlKey: true, key: "-" });
      expect(stage).toHaveStyle({ "--booklet-zoom": "1.03" });

      for (let index = 0; index < 19; index += 1) {
        fireEvent.wheel(stage, { ctrlKey: true, deltaY: -80 });
        flushFrame();
      }

      expect(stage).toHaveStyle({ "--booklet-zoom": "1.6" });
      fireEvent.wheel(stage, { ctrlKey: true, deltaY: -80 });
      flushFrame();
      expect(stage).toHaveStyle({ "--booklet-zoom": "1.6" });
      expect(document.querySelector(".booklet-scroll-surface")).toBeInTheDocument();
    } finally {
      rendered.unmount();
      vi.unstubAllGlobals();
    }
  });

  it("uses the common exact scroll surface for generated and reproduced exam pages", () => {
    const animeExam = animeOnlymarkExam;

    const firstRender = render(
      <ExamRunner
        answers={{}}
        currentPageId={structuredExamFixture.pages[0].id}
        deadline={Date.now() + 60_000}
        exam={structuredExamFixture}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(document.querySelector(".booklet-scroll-surface.exact-scroll-surface")).toBeInTheDocument();

    firstRender.unmount();

    render(
      <ExamRunner
        answers={{}}
        currentPageId={animeExam.pages[0].id}
        deadline={Date.now() + 60_000}
        exam={animeExam}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(document.querySelector(".booklet-scroll-surface.exact-scroll-surface")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: animeExam.title, level: 1 })).not.toBeInTheDocument();
  });

  it("can show the cover from the first page tab and navigate with side arrows", async () => {
    const user = userEvent.setup();
    const animeExam = animeOnlymarkExam;
    const onChangePage = vi.fn();

    render(
      <ExamRunner
        answers={{}}
        currentPageId={animeExam.pages[0].id}
        deadline={Date.now() + 60_000}
        exam={animeExam}
        onChangePage={onChangePage}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "表紙" }));

    expect(screen.getByRole("article", { name: "漫画映画の表紙" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "前のページへ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "次のページ" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("表紙のマーク欄")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "表紙 10 1" })).toHaveStyle({
      "--mark-x": "40.577%",
      "--mark-y": "69.357%"
    });

    await user.click(screen.getByRole("button", { name: "表紙 10 1" }));
    expect(screen.getByRole("button", { name: "表紙 10 1" })).toHaveClass("selected");

    await user.click(screen.getByRole("button", { name: "表紙 10 2" }));
    expect(screen.getByRole("button", { name: "表紙 10 1" })).not.toHaveClass("selected");
    expect(screen.getByRole("button", { name: "表紙 10 2" })).toHaveClass("selected");

    await user.click(screen.getByRole("button", { name: "次のページへ" }));

    expect(onChangePage).toHaveBeenCalledWith(animeExam.pages[0].id);
    expect(screen.queryByRole("article", { name: "漫画映画の表紙" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "前のページへ" }));

    expect(screen.getByRole("article", { name: "漫画映画の表紙" })).toBeInTheDocument();
  });

  it("fits short page tabs and smoothly follows overflow page changes", async () => {
    const user = userEvent.setup();
    const pageTabLayout = installPageTabLayoutMocks();
    const baseExam = structuredExamFixture;
    const longExam = {
      ...baseExam,
      coverImageUrl: baseExam.coverImageUrl ?? "cover.png",
      pages: Array.from({ length: 30 }, (_, index) => ({
        ...baseExam.pages[0],
        blocks: [],
        id: `long-page-${index + 1}`,
        pageNumber: index + 1,
        title: `Page ${index + 1}`
      })),
      questions: []
    };

    function ControlledRunner() {
      const [currentPageId, setCurrentPageId] = useState("long-page-13");

      return (
        <ExamRunner
          answers={{}}
          currentPageId={currentPageId}
          deadline={Date.now() + 60_000}
          exam={longExam}
          onChangePage={setCurrentPageId}
          onExpire={vi.fn()}
          onFinish={vi.fn()}
          onToggleAnswer={vi.fn()}
        />
      );
    }

    try {
      const shortRender = render(
        <ExamRunner
          answers={{}}
          currentPageId={baseExam.pages[0].id}
          deadline={Date.now() + 60_000}
          exam={baseExam}
          onChangePage={vi.fn()}
          onExpire={vi.fn()}
          onFinish={vi.fn()}
          onToggleAnswer={vi.fn()}
        />
      );

      expect(screen.getByLabelText("問題ページ")).toHaveStyle(
        `--visible-page-tabs: ${baseExam.pages.length}`
      );

      shortRender.unmount();
      render(<ControlledRunner />);

      expect(screen.getByLabelText("問題ページ")).toHaveStyle("--visible-page-tabs: 12");
      pageTabLayout.mockNavMetrics(document.querySelector(".page-tab-scroll")!);

      await user.click(screen.getByRole("button", { name: "次のページへ" }));

      await waitFor(() => expect(screen.getByRole("button", { name: "14" })).toHaveClass("active"));
      expect(pageTabLayout.scrollTo).toHaveBeenLastCalledWith(
        expect.objectContaining({ behavior: "smooth", left: 145 })
      );

      pageTabLayout.mockNavMetrics(document.querySelector(".page-tab-scroll")!);
      pageTabLayout.scrollTo.mockClear();

      await user.click(screen.getByRole("button", { name: "前のページへ" }));

      await waitFor(() => expect(screen.getByRole("button", { name: "13" })).toHaveClass("active"));
      expect(pageTabLayout.scrollTo).toHaveBeenLastCalledWith(
        expect.objectContaining({ behavior: "smooth", left: 72.5 })
      );

      pageTabLayout.mockNavMetrics(document.querySelector(".page-tab-scroll")!);
      pageTabLayout.scrollTo.mockClear();

      await user.click(screen.getByRole("button", { name: "11" }));

      await waitFor(() => expect(screen.getByRole("button", { name: "11" })).toHaveClass("active"));
      expect(pageTabLayout.scrollTo).not.toHaveBeenCalled();
    } finally {
      pageTabLayout.restore();
    }
  });
});
