import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the pre-start confirmation before starting a fresh exam", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("kyotsu-test-sim:answers:anime-onlymark-2026", JSON.stringify({ "anime-q01": ["4"] }));

    render(<App />);

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.queryByRole("article", { name: /数学I・A/ })).not.toBeInTheDocument();
    const animeCard = screen.getByRole("article", { name: "漫画映画" });
    await user.click(within(animeCard).getByRole("button", { name: "漫画映画を選択" }));

    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("exam-mode-background", "prestart-page");
    expect(screen.getByRole("img", { name: "漫画映画の表紙" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "漫画映画" })).not.toBeInTheDocument();
    expect(screen.queryByText("試験時間")).not.toBeInTheDocument();
    expect(screen.queryByText("40分")).not.toBeInTheDocument();
    expect(screen.queryByText("設問数")).not.toBeInTheDocument();
    expect(screen.queryByText("21問")).not.toBeInTheDocument();
    expect(screen.queryByText("配点")).not.toBeInTheDocument();
    expect(screen.queryByText("100点")).not.toBeInTheDocument();
    expect(screen.queryByText("注意事項")).not.toBeInTheDocument();
    expect(screen.queryByText(/解答は右側のマークシート/)).not.toBeInTheDocument();
    const coverDocument = screen.getByRole("article", { name: "漫画映画の表紙" });
    const prestartActions = within(coverDocument).getByRole("navigation", { name: "試験開始前の操作" });
    const backButton = within(prestartActions).getByRole("button", { name: "ホームに戻る" });
    expect(backButton).toHaveClass("secondary-button", "home-return-button", "prestart-home-return-button");
    expect(within(prestartActions).getByRole("button", { name: "試験を始める" })).toBeInTheDocument();
    expect(window.localStorage.getItem("kyotsu-test-sim:deadline:anime-onlymark-2026")).toBeNull();
    expect(window.localStorage.getItem("kyotsu-test-sim:answers:anime-onlymark-2026")).toContain("anime-q01");

    const prestartMark = screen.getByRole("button", { name: "表紙 10 1" });
    await user.click(prestartMark);
    expect(prestartMark).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    await user.click(prestartMark);
    expect(prestartMark).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem("kyotsu-test-sim:answers:anime-onlymark-2026")).toContain("anime-q01");

    const prestartStage = screen.getByLabelText("試験開始前の表紙");
    const zoomWheelEvent = new WheelEvent("wheel", { bubbles: true, cancelable: true, ctrlKey: true, deltaY: -80 });
    prestartStage.dispatchEvent(zoomWheelEvent);
    const zoomKeyEvent = new KeyboardEvent("keydown", { cancelable: true, ctrlKey: true, key: "+" });
    window.dispatchEvent(zoomKeyEvent);
    expect(zoomWheelEvent.defaultPrevented).toBe(true);
    expect(zoomKeyEvent.defaultPrevented).toBe(true);
    expect(prestartStage).not.toHaveClass("booklet-stage");
    expect(prestartStage.getAttribute("style")).toBeNull();

    await user.click(screen.getByRole("button", { name: "ホームに戻る" }));
    expect(screen.getByRole("article", { name: "漫画映画" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "漫画映画を選択" }));

    await user.click(screen.getByRole("button", { name: "試験を始める" }));

    expect(screen.getByRole("timer")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "1 4" }).every((button) => !button.classList.contains("selected"))).toBe(
      true
    );
    expect(window.localStorage.getItem("kyotsu-test-sim:answers:anime-onlymark-2026")).toBe("{}");
    expect(window.localStorage.getItem("kyotsu-test-sim:deadline:anime-onlymark-2026")).not.toBeNull();
  });

  it("confirms returning home and discards the current answers", async () => {
    const user = userEvent.setup();

    render(<App />);

    const animeCard = screen.getByRole("article", { name: "漫画映画" });
    await user.click(within(animeCard).getByRole("button", { name: "漫画映画を選択" }));
    await user.click(screen.getByRole("button", { name: "試験を始める" }));

    await user.click(screen.getAllByRole("button", { name: "1 4" })[0]);
    await waitFor(() =>
      expect(window.localStorage.getItem("kyotsu-test-sim:answers:anime-onlymark-2026")).toContain("anime-q01")
    );

    await user.click(screen.getByRole("button", { name: "ホームに戻る" }));
    const homeDialog = screen.getByRole("dialog", { name: "ホームに戻る確認" });
    expect(within(homeDialog).getByText("試験を中断してホームへ戻りますか（現在の解答は保存されません）")).toBeInTheDocument();

    await user.click(within(homeDialog).getByRole("button", { name: "ホームに戻る" }));

    expect(screen.getByRole("heading", { name: "共通テスト形式 ウェブ模試" })).toBeInTheDocument();
    expect(window.localStorage.getItem("kyotsu-test-sim:answers:anime-onlymark-2026")).toBeNull();
    expect(window.localStorage.getItem("kyotsu-test-sim:deadline:anime-onlymark-2026")).toBeNull();
  });

  it("pauses on the score pop instead of entering review in debug mode", async () => {
    vi.useFakeTimers();

    render(<App />);

    const animeCard = screen.getByRole("article", { name: "漫画映画" });
    fireEvent.click(within(animeCard).getByRole("button", { name: "漫画映画を選択" }));
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "試験を始める" }));
    expect(screen.getByRole("timer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "採点へ進む" }));
    const finishDialog = screen.getByRole("dialog", { name: "採点へ進む確認" });
    fireEvent.click(within(finishDialog).getByRole("button", { name: "採点へ進む" }));
    expect(screen.getByLabelText("問題用紙への採点")).toBeInTheDocument();

    for (let step = 0; step < 100 && !document.querySelector(".auto-review-score-pop"); step += 1) {
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
    }

    expect(screen.getByRole("main")).toHaveClass("scoring-screen");
    expect(screen.getByLabelText("採点結果")).toHaveClass("auto-review-score-pop");
    expect(document.querySelector(".review-mode-fade-in-settled")).not.toBeInTheDocument();
    expect(document.querySelector(".review-score-badge")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ホームに戻る" })).not.toBeInTheDocument();
  });
});
