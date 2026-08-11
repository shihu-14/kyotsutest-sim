import { useEffect, useRef, useState, type CSSProperties, type WheelEvent } from "react";
import type { Exam } from "../types";

const visiblePageTabCount = 12;

export function useBookletNavigation(
  exam: Exam,
  currentPageId: string,
  initialShowCover: boolean,
  onChangePage: (pageId: string) => void
) {
  const [showCover, setShowCover] = useState(() => initialShowCover && Boolean(exam.coverImageUrl));
  const pageTabsRef = useRef<HTMLDivElement | null>(null);
  const pageNavigationSourceRef = useRef<"arrow" | "tab" | null>(null);
  const previousPagePositionRef = useRef<number | null>(null);
  const page = exam.pages.find((candidate) => candidate.id === currentPageId) ?? exam.pages[0];
  const pageIndex = exam.pages.findIndex((candidate) => candidate.id === page.id);
  const pageTabsStyle = {
    "--visible-page-tabs": String(Math.min(exam.pages.length, visiblePageTabCount)),
    "--has-cover-tab": exam.coverImageUrl ? "1" : "0"
  } as CSSProperties;
  const canGoPrevious = showCover ? false : pageIndex > 0 || Boolean(exam.coverImageUrl);
  const canGoNext = showCover ? exam.pages.length > 0 : pageIndex < exam.pages.length - 1;

  useEffect(() => {
    setShowCover(initialShowCover && Boolean(exam.coverImageUrl));
  }, [exam.coverImageUrl, exam.id, initialShowCover]);

  useEffect(() => {
    const nav = pageTabsRef.current;
    const activeTab = nav?.querySelector<HTMLButtonElement>(".active");
    const currentPosition = showCover ? -1 : pageIndex;
    const previousPosition = previousPagePositionRef.current;
    const navigationSource = pageNavigationSourceRef.current;
    pageNavigationSourceRef.current = null;
    previousPagePositionRef.current = currentPosition;

    if (!nav || !activeTab || nav.scrollWidth <= nav.clientWidth) {
      return;
    }

    const leftEdge = activeTab.offsetLeft - nav.offsetLeft;
    const rightEdge = leftEdge + activeTab.offsetWidth;
    const visibleLeft = nav.scrollLeft;
    const visibleRight = nav.scrollLeft + nav.clientWidth;
    const maxScrollLeft = Math.max(0, nav.scrollWidth - nav.clientWidth);
    const scrollTo = (left: number) => {
      nav.scrollTo({ left: Math.min(maxScrollLeft, Math.max(0, left)), behavior: "smooth" });
    };

    if (navigationSource === "arrow" && previousPosition !== null && currentPosition > previousPosition) {
      scrollTo(rightEdge - nav.clientWidth);
      return;
    }

    if (navigationSource === "arrow" && previousPosition !== null && currentPosition < previousPosition) {
      scrollTo(rightEdge - nav.clientWidth);
      return;
    }

    if (rightEdge > visibleRight) {
      scrollTo(rightEdge - nav.clientWidth);
      return;
    }

    if (leftEdge < visibleLeft) {
      scrollTo(leftEdge);
    }
  }, [currentPageId, exam.pages.length, pageIndex, showCover]);

  const goPrevious = () => {
    if (showCover) {
      return;
    }

    if (pageIndex === 0 && exam.coverImageUrl) {
      setShowCover(true);
      return;
    }

    const previousPage = exam.pages[Math.max(0, pageIndex - 1)];
    pageNavigationSourceRef.current = "arrow";
    onChangePage(previousPage.id);
  };

  const goNext = () => {
    if (showCover) {
      setShowCover(false);
      onChangePage(exam.pages[0]?.id ?? currentPageId);
      return;
    }

    const nextPage = exam.pages[Math.min(exam.pages.length - 1, pageIndex + 1)];
    pageNavigationSourceRef.current = "arrow";
    onChangePage(nextPage.id);
  };

  const selectCover = () => setShowCover(true);
  const selectPage = (pageId: string) => {
    pageNavigationSourceRef.current = "tab";
    setShowCover(false);
    onChangePage(pageId);
  };
  const jumpToPage = (pageId: string) => {
    setShowCover(false);
    onChangePage(pageId);
  };
  const handlePageTabsWheel = (event: WheelEvent<HTMLElement>) => {
    const nav = pageTabsRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      return;
    }

    event.preventDefault();
    nav.scrollLeft += event.deltaY;
  };

  return {
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
    handlePageTabsWheel,
    jumpToPage,
    page,
    pageTabsRef,
    pageTabsStyle,
    selectCover,
    selectPage,
    showCover
  };
}
