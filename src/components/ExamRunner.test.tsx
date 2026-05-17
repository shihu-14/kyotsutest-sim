import { render, screen } from "@testing-library/react";
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
});
