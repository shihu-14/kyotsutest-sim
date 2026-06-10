import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts a fresh exam without stale default marks", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("kyotsu-test-sim:answers:anime-onlymark-2026", JSON.stringify({ "anime-q01": ["4"] }));

    render(<App />);

    const animeCard = screen.getByRole("heading", { name: "漫画映画" }).closest("article");
    expect(animeCard).not.toBeNull();
    await user.click(within(animeCard as HTMLElement).getByRole("button", { name: "試験を始める" }));
    await user.click(screen.getByRole("button", { name: "試験開始" }));

    expect(screen.getAllByRole("button", { name: "1 4" }).every((button) => !button.classList.contains("selected"))).toBe(
      true
    );
    expect(window.localStorage.getItem("kyotsu-test-sim:answers:anime-onlymark-2026")).toBe("{}");
  });

  it("confirms returning home and discards the current answers", async () => {
    const user = userEvent.setup();

    render(<App />);

    const animeCard = screen.getByRole("heading", { name: "漫画映画" }).closest("article");
    expect(animeCard).not.toBeNull();
    await user.click(within(animeCard as HTMLElement).getByRole("button", { name: "試験を始める" }));
    await user.click(screen.getByRole("button", { name: "試験開始" }));

    await user.click(screen.getAllByRole("button", { name: "1 4" })[0]);
    await waitFor(() =>
      expect(window.localStorage.getItem("kyotsu-test-sim:answers:anime-onlymark-2026")).toContain("anime-q01")
    );

    await user.click(screen.getByRole("button", { name: "ホームに戻る" }));
    const homeDialog = screen.getByRole("dialog", { name: "ホームに戻る確認" });
    expect(within(homeDialog).getByText("試験を中断してホームへ戻りますか(現在の解答は保存されません)")).toBeInTheDocument();

    await user.click(within(homeDialog).getByRole("button", { name: "ホームに戻る" }));

    expect(screen.getByRole("heading", { name: "共通テスト形式 ウェブ模試" })).toBeInTheDocument();
    expect(window.localStorage.getItem("kyotsu-test-sim:answers:anime-onlymark-2026")).toBeNull();
  });
});
