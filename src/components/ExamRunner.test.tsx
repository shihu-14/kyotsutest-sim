import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import { ExamRunner } from "./ExamRunner";

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

    expect(document.querySelector('input[type="range"][aria-label="問題表示倍率"]')).toBeInTheDocument();

    await user.click(screen.getByText("試験終了"));

    expect(onFinish).not.toHaveBeenCalled();
    expect(screen.getByText("試験を終了しますか")).toBeInTheDocument();

    await user.click(screen.getByText("戻る"));
    expect(onFinish).not.toHaveBeenCalled();

    await user.click(screen.getByText("試験終了"));
    await user.click(screen.getByText("採点へ進む"));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
