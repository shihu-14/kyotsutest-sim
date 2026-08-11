import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { structuredExamFixture } from "../test/examFixtures";
import { useBookletNavigation } from "./useBookletNavigation";

describe("useBookletNavigation", () => {
  it("moves between the cover and pages without changing navigation semantics", () => {
    const onChangePage = vi.fn();
    const { result, rerender } = renderHook(
      ({ pageId }) => useBookletNavigation(structuredExamFixture, pageId, true, onChangePage),
      { initialProps: { pageId: structuredExamFixture.pages[0].id } }
    );

    expect(result.current.showCover).toBe(true);
    act(() => result.current.goNext());
    expect(result.current.showCover).toBe(false);
    expect(onChangePage).toHaveBeenLastCalledWith(structuredExamFixture.pages[0].id);

    act(() => result.current.goPrevious());
    expect(result.current.showCover).toBe(true);

    act(() => result.current.selectPage(structuredExamFixture.pages[1].id));
    rerender({ pageId: structuredExamFixture.pages[1].id });
    expect(result.current.showCover).toBe(false);
    expect(result.current.page.id).toBe(structuredExamFixture.pages[1].id);
  });
});
