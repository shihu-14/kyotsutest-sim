import type { CSSProperties, RefObject, WheelEvent } from "react";
import type { Exam, ExamPage } from "../../types";

interface PageNavigationTabsProps {
  exam: Exam;
  page: ExamPage;
  showCover: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  style: CSSProperties;
  onPageTabsWheel: (event: WheelEvent<HTMLElement>) => void;
  onSelectCover: () => void;
  onSelectPage: (pageId: string) => void;
}

export function PageNavigationTabs({
  exam,
  page,
  showCover,
  scrollRef,
  style,
  onPageTabsWheel,
  onSelectCover,
  onSelectPage
}: PageNavigationTabsProps) {
  return (
    <nav className="page-tabs" aria-label="問題ページ" style={style}>
      {exam.coverImageUrl ? (
        <button className={showCover ? "active cover-tab" : "cover-tab"} type="button" onClick={onSelectCover}>
          表紙
        </button>
      ) : null}
      <div className="page-tab-scroll" ref={scrollRef} onWheel={onPageTabsWheel}>
        {exam.pages.map((item) => (
          <button
            className={!showCover && item.id === page.id ? "active" : ""}
            key={item.id}
            type="button"
            onClick={() => onSelectPage(item.id)}
          >
            {item.pageNumber}
          </button>
        ))}
      </div>
    </nav>
  );
}
