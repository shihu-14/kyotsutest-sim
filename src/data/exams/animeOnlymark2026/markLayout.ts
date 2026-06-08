import type { PageGradeAnchor, PageMarkArea } from "../../../types";

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

const animeSmallChoices = ["1", "2", "3"];
const animeFourChoices = ["1", "2", "3", "4"];
const animeEightChoices = ["1", "2", "3", "4", "5", "6", "7", "8"];
const animeNineChoices = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const animePageMarkAreas: Record<number, PageMarkArea[]> = {
  1: [
    imageMarkArea(1, "1", 184, 1481),
    imageMarkArea(1, "2", 645, 1481),
    imageMarkArea(1, "3", 184, 1562.5),
    imageMarkArea(1, "4", 645, 1562.5)
  ],
  2: [imageMarkArea(2, "1", 222, 639.5), imageMarkArea(2, "2", 222, 1076)],
  3: [imageMarkArea(2, "3", 222, 147), imageMarkArea(2, "4", 222, 873)],
  4: [
    ...imageMarkRow(3, 872.5, animeNineChoices, [658.5, 704, 749, 794, 840, 885, 930, 975.5, 1021]),
    ...imageMarkRow(4, 948.5, animeNineChoices, [658.5, 704, 749, 794, 840, 885, 930, 975.5, 1021]),
    ...imageMarkRow(5, 1024, animeNineChoices, [658.5, 704, 749, 794, 840, 885, 930, 975.5, 1021]),
    ...imageMarkRow(6, 1100, animeNineChoices, [658.5, 704, 749, 794, 840, 885, 930, 975.5, 1021])
  ],
  5: imageMarkRow(7, 1532, ["1", "2", "3", "4", "5"], [213, 397, 582, 766, 950]),
  6: imageMarkRow(8, 1302, animeEightChoices, [402, 473, 544, 615, 686, 756, 827, 897]),
  7: [
    ...imageMarkRow(9, 1121, animeFourChoices, [728, 773, 818, 863.5]),
    ...imageMarkRow(10, 1205, animeFourChoices, [728, 773, 818, 863.5]),
    ...imageMarkRow(11, 1289, animeFourChoices, [728, 773, 818, 863.5])
  ],
  8: [
    ...imageMarkRow(12, 704.5, animeSmallChoices, [237, 545, 852]),
    ...imageMarkRow(13, 1117.5, animeSmallChoices, [237, 545, 852]),
    ...imageMarkRow(14, 1521, animeSmallChoices, [237, 545, 852])
  ],
  9: [
    ...imageMarkRow(15, 438.5, animeSmallChoices, [693, 739, 784]),
    ...imageMarkRow(16, 517, animeSmallChoices, [693, 739, 784])
  ],
  10: imageMarkRow(17, 1563.5, animeFourChoices, [213, 420, 626.5, 833]),
  11: [
    ...imageMarkRow(18, 905, animeFourChoices, [237, 468, 698.5, 929]),
    ...imageMarkRow(19, 1579, animeFourChoices, [237, 468, 698.5, 929])
  ],
  12: imageMarkRow(20, 933.5, animeFourChoices, [204, 419, 635, 850])
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
  11: [imageGradeAnchor(18, 349, 389.5), imageGradeAnchor(19, 349, 1015.5)],
  12: [imageGradeAnchor(20, 976, 208.5)]
};
