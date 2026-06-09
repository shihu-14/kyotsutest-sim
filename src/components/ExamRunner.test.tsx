import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
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

    render(
      <ExamRunner
        answers={{}}
        currentPageId="p1"
        deadline={Date.now() + 60_000}
        exam={sampleExams[0]}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={onFinish}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(document.querySelector('input[type="range"][aria-label="問題表示倍率"]')).not.toBeInTheDocument();
    expect(screen.getByLabelText("問題表示領域")).toBeInTheDocument();
    expect(screen.getByRole("timer", { name: /残り時間/ })).toHaveTextContent(/^\d{2}:\d{2}$/);
    expect(screen.getByRole("timer", { name: /残り時間/ })).toHaveClass("timer-color-stadium-alert");
    expect(screen.queryByText("解答済み")).not.toBeInTheDocument();
    expect(screen.queryByText("中断")).not.toBeInTheDocument();

    await user.click(screen.getByText("採点へ進む"));

    expect(onFinish).not.toHaveBeenCalled();
    expect(screen.getByText("採点へ進みますか")).toBeInTheDocument();
    expect(screen.getByText("試験一覧には戻らず、このまま採点を開始します。解答はこれ以上変更できません。")).toBeInTheDocument();

    await user.click(screen.getByText("解答を続ける"));
    expect(onFinish).not.toHaveBeenCalled();

    await user.click(screen.getByText("採点へ進む"));
    await user.click(screen.getByText("採点を開始"));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("customizes the finish action color from the debug controls", () => {
    render(
      <ExamRunner
        answers={{}}
        currentPageId="p1"
        deadline={Date.now() + 60_000}
        exam={sampleExams[0]}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    const finishButton = document.querySelector<HTMLButtonElement>(".finish-button")!;
    const colorInput = document.querySelector<HTMLInputElement>('input[aria-label="採点へ進むボタン色"]')!;

    expect(finishButton.style.getPropertyValue("--finish-color")).toBe("#e85f3a");

    fireEvent.change(colorInput, { target: { value: "#123456" } });

    expect(finishButton.style.getPropertyValue("--finish-color")).toBe("#123456");
  });

  it("zooms only from the problem display area when using a modified wheel", () => {
    render(
      <ExamRunner
        answers={{}}
        currentPageId="p1"
        deadline={Date.now() + 60_000}
        exam={sampleExams[0]}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    const stage = screen.getByLabelText("問題表示領域");
    fireEvent.wheel(stage, { ctrlKey: true, deltaY: -80 });

    expect(stage).toHaveStyle({ "--booklet-zoom": "1.08" });
    fireEvent.wheel(stage, { ctrlKey: true, deltaY: 80 });

    expect(stage).toHaveStyle({ "--booklet-zoom": "1" });
    fireEvent.wheel(stage, { ctrlKey: true, deltaY: 80 });

    expect(stage).toHaveStyle({ "--booklet-zoom": "1" });
    expect(document.querySelector(".booklet-scroll-surface")).toBeInTheDocument();
  });

  it("uses the common exact scroll surface for generated and reproduced exam pages", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;

    const firstRender = render(
      <ExamRunner
        answers={{}}
        currentPageId="p1"
        deadline={Date.now() + 60_000}
        exam={sampleExams[0]}
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
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;
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

    await user.click(screen.getByRole("button", { name: "次のページへ" }));

    expect(onChangePage).toHaveBeenCalledWith(animeExam.pages[0].id);
    expect(screen.queryByRole("article", { name: "漫画映画の表紙" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "前のページへ" }));

    expect(screen.getByRole("article", { name: "漫画映画の表紙" })).toBeInTheDocument();
  });

  it("fits short page tabs and smoothly follows overflow page changes", async () => {
    const user = userEvent.setup();
    const pageTabLayout = installPageTabLayoutMocks();
    const baseExam = sampleExams[0];
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

      expect(screen.getByLabelText("問題ページ")).toHaveStyle("--visible-page-tabs: 3");

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
