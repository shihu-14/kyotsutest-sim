import { render, screen, within } from "@testing-library/react";
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
});
