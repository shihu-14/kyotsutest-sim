import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { imageExamFixture } from "../../test/examFixtures";
import { useBookletNavigation } from "./useBookletNavigation";

describe("useBookletNavigation", () => {
  it("moves between the cover and pages without changing navigation semantics", () => {
    const onChangePage = vi.fn();
    const { result, rerender } = renderHook(
      ({ pageId }) => useBookletNavigation(imageExamFixture, pageId, onChangePage),
      { initialProps: { pageId: imageExamFixture.pages[0].id } }
    );

    act(() => result.current.selectCover());
    expect(result.current.showCover).toBe(true);
    act(() => result.current.goNext());
    expect(result.current.showCover).toBe(false);
    expect(onChangePage).toHaveBeenLastCalledWith(imageExamFixture.pages[0].id);

    act(() => result.current.goPrevious());
    expect(result.current.showCover).toBe(true);

    act(() => result.current.selectPage(imageExamFixture.pages[1].id));
    rerender({ pageId: imageExamFixture.pages[1].id });
    expect(result.current.showCover).toBe(false);
    expect(result.current.page.id).toBe(imageExamFixture.pages[1].id);
  });
});
