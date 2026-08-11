import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleExams } from "../../../data/sampleExam";
import { HomeDesignPreview } from "./HomeDesignPreview";
import { TimerDesignPreview } from "./TimerDesignPreview";

function tagSignature(element: Element): string {
  return `${element.tagName.toLowerCase()}[${Array.from(element.children)
    .map(tagSignature)
    .join(",")}]`;
}

describe("test-only home and timer design previews", () => {
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

  it("renders fifteen genuinely different timer layouts with all three states", async () => {
    const user = userEvent.setup();
    render(<TimerDesignPreview exam={sampleExams[0]} />);

    const tabs = screen.getAllByRole("tab");
    const layouts = new Set<string>();
    const structures = new Set<string>();
    expect(tabs).toHaveLength(15);

    for (const tab of tabs) {
      await user.click(tab);
      const panel = screen.getByRole("tabpanel");
      const timers = within(panel).getAllByRole("timer", { name: /残り時間/ });
      expect(timers).toHaveLength(4);
      expect(panel).toHaveTextContent("通常・残り82%");
      expect(panel).toHaveTextContent("注意・残り15%");
      expect(panel).toHaveTextContent("危険・残り4%");
      layouts.add(timers[0].getAttribute("data-timer-layout") ?? "");
      structures.add(tagSignature(timers[0]));
    }

    expect(layouts.size).toBe(15);
    expect(structures.size).toBe(15);
  });

  it("switches ten color systems without changing the Steam Capsule structure", async () => {
    const user = userEvent.setup();
    render(<HomeDesignPreview exams={sampleExams} />);

    await user.click(screen.getByRole("button", { name: "Steam Capsule 配色候補" }));
    const tabs = screen.getAllByRole("tab");
    const themes = new Set<string>();
    const structures = new Set<string>();
    expect(tabs).toHaveLength(10);

    for (const tab of tabs) {
      await user.click(tab);
      const panel = screen.getByRole("tabpanel");
      const cards = within(panel).getAllByRole("article");
      expect(cards).toHaveLength(3);
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-card-structure", "steam-capsule");
      });
      themes.add(cards[0].getAttribute("data-capsule-theme") ?? "");
      structures.add(tagSignature(cards[0]));
    }

    expect(themes.size).toBe(10);
    expect(structures.size).toBe(1);
  });
});
