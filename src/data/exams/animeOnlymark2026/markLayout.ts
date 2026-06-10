import type { CoverMarkArea, PageGradeAnchor, PageMarkArea } from "../../../types";

export const animePageId = (pageNumber: number) => `anime-p${String(pageNumber).padStart(2, "0")}`;

const animePageWidth = 1247;
const animePageHeight = 1772;
const animeQuestionId = (questionNumber: number) => `anime-q${String(questionNumber).padStart(2, "0")}`;

function imageMarkArea(
  questionNumber: number,
  value: string,
  x: number,
  y: number,
  width = 36,
  height = 42
): PageMarkArea {
  return {
    questionId: animeQuestionId(questionNumber),
    value,
    xPercent: Number(((x / animePageWidth) * 100).toFixed(3)),
    yPercent: Number(((y / animePageHeight) * 100).toFixed(3)),
    widthPercent: Number(((width / animePageWidth) * 100).toFixed(3)),
    heightPercent: Number(((height / animePageHeight) * 100).toFixed(3))
  };
}

function imageMarkRow(questionNumber: number, y: number, values: string[], xs: number[]): PageMarkArea[] {
  return values.map((value, index) => imageMarkArea(questionNumber, value, xs[index], y));
}

function imageGradeAnchor(questionNumber: number, x: number, y: number, width = 120): PageGradeAnchor {
  return {
    questionId: animeQuestionId(questionNumber),
    xPercent: Number(((x / animePageWidth) * 100).toFixed(3)),
    yPercent: Number(((y / animePageHeight) * 100).toFixed(3)),
    widthPercent: Number(((width / animePageWidth) * 100).toFixed(3))
  };
}

function coverMarkArea(value: string, x: number, y: number, width = 34, height = 38): CoverMarkArea {
  return {
    id: `cover-mark-${value}`,
    label: "10",
    value,
    xPercent: Number(((x / animePageWidth) * 100).toFixed(3)),
    yPercent: Number(((y / animePageHeight) * 100).toFixed(3)),
    widthPercent: Number(((width / animePageWidth) * 100).toFixed(3)),
    heightPercent: Number(((height / animePageHeight) * 100).toFixed(3))
  };
}

const animeSmallChoices = ["1", "2", "3"];
const animeFourChoices = ["1", "2", "3", "4"];
const animeEightChoices = ["1", "2", "3", "4", "5", "6", "7", "8"];
const animeNineChoices = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const animeCoverMarkAreas: CoverMarkArea[] = [
  coverMarkArea("1", 506, 1229),
  coverMarkArea("2", 556, 1229),
  coverMarkArea("3", 597, 1229),
  coverMarkArea("4", 642, 1229),
  coverMarkArea("5", 692, 1229),
  coverMarkArea("6", 733, 1229),
  coverMarkArea("7", 778, 1229),
  coverMarkArea("8", 828, 1229),
  coverMarkArea("9", 869, 1229)
];

export const animePageMarkAreas: Record<number, PageMarkArea[]> = {
  1: [
    imageMarkArea(1, "1", 183.2, 1492.9),
    imageMarkArea(1, "2", 638.5, 1492.9),
    imageMarkArea(1, "3", 185.4, 1575.8),
    imageMarkArea(1, "4", 644, 1575.8)
  ],
  2: [imageMarkArea(2, "1", 226.1, 637.3), imageMarkArea(2, "2", 219.5, 1074.7)],
  3: [imageMarkArea(2, "3", 219.5, 147.7), imageMarkArea(2, "4", 226.1, 871.9)],
  4: [
    ...imageMarkRow(3, 873.2, animeNineChoices, [657.2, 703.5, 749.7, 791.5, 844.2, 889.4, 929, 974.1, 1020.2]),
    ...imageMarkRow(4, 946.3, animeNineChoices, [662.8, 703.5, 747.5, 795.9, 844.2, 878.4, 929, 975.2, 1013.7]),
    ...imageMarkRow(5, 1024.3, animeNineChoices, [659.5, 707.9, 749.7, 791.5, 844.2, 886.1, 929, 977.4, 1013.7]),
    ...imageMarkRow(6, 1098.9, animeNineChoices, [662.8, 701.2, 747.5, 791.5, 833.2, 879.5, 929, 971.9, 1017])
  ],
  5: imageMarkRow(7, 1531.1, ["1", "2", "3", "4", "5"], [193.1, 385.6, 567, 748.5, 930.1]),
  6: imageMarkRow(8, 1298.6, animeEightChoices, [401, 471.4, 542.9, 617.7, 681.5, 755.2, 827.8, 896]),
  7: [
    ...imageMarkRow(9, 1117.3, animeFourChoices, [732, 771.7, 814.5, 858.6]),
    ...imageMarkRow(10, 1206.2, animeFourChoices, [726.5, 771.7, 822.2, 867.4]),
    ...imageMarkRow(11, 1289.1, animeFourChoices, [732, 771.7, 819, 865.2])
  ],
  8: [
    ...imageMarkRow(12, 705.2, animeSmallChoices, [236, 544, 852]),
    ...imageMarkRow(13, 1114.9, animeSmallChoices, [238.2, 539.5, 852]),
    ...imageMarkRow(14, 1522.4, animeSmallChoices, [238.2, 539.5, 848.7])
  ],
  9: [
    ...imageMarkRow(15, 436.5, animeSmallChoices, [694.7, 732, 782.7]),
    ...imageMarkRow(16, 514.4, animeSmallChoices, [687, 743, 781.5])
  ],
  10: imageMarkRow(17, 1546.4, animeFourChoices, [198.6, 425.2, 649.5, 875.1]),
  11: [
    ...imageMarkRow(18, 799.5, animeFourChoices, [219.5, 454.9, 650.7, 951]),
    ...imageMarkRow(19, 1484.4, animeFourChoices, [230.5, 467, 698, 927.9])
  ],
  12: imageMarkRow(20, 707.9, animeFourChoices, [236, 465.9, 698, 932.2]),
  13: imageMarkRow(21, 936.5, animeFourChoices, [202.9, 418.6, 650.7, 844.2])
};

export const animePageGradeAnchors: Record<number, PageGradeAnchor[]> = {
  1: [imageGradeAnchor(1, 832, 318.5)],
  2: [imageGradeAnchor(2, 416, 495.5)],
  4: [
    imageGradeAnchor(3, 443, 873.5),
    imageGradeAnchor(4, 443, 949.5),
    imageGradeAnchor(5, 443, 1025.5),
    imageGradeAnchor(6, 443, 1101)
  ],
  5: [imageGradeAnchor(7, 703, 263.5)],
  6: [imageGradeAnchor(8, 1079, 312.5)],
  7: [
    imageGradeAnchor(9, 479.5, 1121.5),
    imageGradeAnchor(10, 479.5, 1205.5),
    imageGradeAnchor(11, 479.5, 1289.5)
  ],
  8: [
    imageGradeAnchor(12, 349, 392.5),
    imageGradeAnchor(13, 349, 805.5),
    imageGradeAnchor(14, 349, 1218.5)
  ],
  9: [imageGradeAnchor(15, 456, 436.5), imageGradeAnchor(16, 454.5, 515.5)],
  10: [imageGradeAnchor(17, 516, 262.5)],
  11: [imageGradeAnchor(18, 350, 447), imageGradeAnchor(19, 350, 983)],
  12: [imageGradeAnchor(20, 350, 146)],
  13: [imageGradeAnchor(21, 976, 207)]
};
