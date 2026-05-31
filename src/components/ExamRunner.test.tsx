import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import { ExamRunner } from "./ExamRunner";

describe("ExamRunner", () => {
  it("asks for confirmation before finishing an active exam", async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    const onPause = vi.fn();

    render(
      <ExamRunner
        answers={{}}
        currentPageId="p1"
        deadline={Date.now() + 60_000}
        exam={sampleExams[0]}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={onFinish}
        onPause={onPause}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(document.querySelector('input[type="range"][aria-label="問題表示倍率"]')).not.toBeInTheDocument();
    expect(screen.getByLabelText("問題表示領域")).toBeInTheDocument();
    expect(screen.getByRole("timer", { name: /残り時間/ })).toBeInTheDocument();

    await user.click(screen.getByText("試験終了"));

    expect(onFinish).not.toHaveBeenCalled();
    expect(screen.getByText("試験を終了しますか")).toBeInTheDocument();

    await user.click(screen.getByText("戻る"));
    expect(onFinish).not.toHaveBeenCalled();

    await user.click(screen.getByText("試験終了"));
    await user.click(screen.getByText("採点へ進む"));

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onPause).not.toHaveBeenCalled();
  });

  it("asks for confirmation before pausing an active exam", async () => {
    const user = userEvent.setup();
    const onPause = vi.fn();

    render(
      <ExamRunner
        answers={{}}
        currentPageId="p1"
        deadline={Date.now() + 60_000}
        exam={sampleExams[0]}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onPause={onPause}
        onToggleAnswer={vi.fn()}
      />
    );

    await user.click(screen.getByText("中断"));

    expect(screen.getByText("試験を中断しますか")).toBeInTheDocument();

    await user.click(screen.getByText("中断する"));

    expect(onPause).toHaveBeenCalledTimes(1);
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
        onPause={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    const stage = screen.getByLabelText("問題表示領域");
    fireEvent.wheel(stage, { ctrlKey: true, deltaY: -80 });

    expect(stage).toHaveStyle({ "--booklet-zoom": "1.08" });
    expect(document.querySelector(".booklet-scroll-surface")).toBeInTheDocument();
  });

  it("uses the exact image scroll surface for reproduced exam pages", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;

    render(
      <ExamRunner
        answers={{}}
        currentPageId={animeExam.pages[0].id}
        deadline={Date.now() + 60_000}
        exam={animeExam}
        onChangePage={vi.fn()}
        onExpire={vi.fn()}
        onFinish={vi.fn()}
        onPause={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(document.querySelector(".booklet-scroll-surface.exact-scroll-surface")).toBeInTheDocument();
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
        onPause={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "表紙" }));

    expect(screen.getByRole("article", { name: "漫画映画の表紙" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "前のページへ" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "次のページ" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "次のページへ" }));

    expect(onChangePage).toHaveBeenCalledWith(animeExam.pages[0].id);
    expect(screen.queryByRole("article", { name: "漫画映画の表紙" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "前のページへ" }));

    expect(screen.getByRole("article", { name: "漫画映画の表紙" })).toBeInTheDocument();
  });
});
