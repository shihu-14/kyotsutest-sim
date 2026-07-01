import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StopwatchTimer } from "./StopwatchTimer";

describe("StopwatchTimer", () => {
  it("exposes remaining and elapsed meter values", () => {
    render(<StopwatchTimer formatted="30:00" remainingMs={30 * 60_000} totalMs={40 * 60_000} />);

    const timer = screen.getByRole("timer", { name: "残り時間 30:00" });

    expect(timer).toHaveTextContent("30:00");
    expect(timer.style.getPropertyValue("--timer-progress")).toBe("75%");
    expect(timer.style.getPropertyValue("--timer-elapsed")).toBe("25%");
    expect(timer.style.getPropertyValue("--timer-crown-angle")).toBe("90deg");
    expect(timer.style.getPropertyValue("--timer-progress-angle")).toBe("270deg");
    expect(timer.style.getPropertyValue("--timer-elapsed-angle")).toBe("90deg");
  });

  it("keeps the same color class when time is almost over", () => {
    render(<StopwatchTimer formatted="00:45" remainingMs={45_000} totalMs={40 * 60_000} />);

    expect(screen.getByRole("timer", { name: "残り時間 00:45" })).not.toHaveClass("urgent");
  });
});
