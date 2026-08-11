export function parseAuthoringAttributes(input: string | undefined): Record<string, string> {
  if (!input) {
    return {};
  }

  return input.split(",").reduce<Record<string, string>>((attrs, pair) => {
    const [rawKey, ...rawValue] = pair.split("=");
    const key = rawKey?.trim();
    if (!key) {
      return attrs;
    }

    attrs[key] = rawValue.join("=").trim();
    return attrs;
  }, {});
}

export function positiveChoiceCount(count: number): number {
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
}

interface AuthoringMarkSyntax {
  answer: string;
  choices: number;
  label: string;
  multi: boolean;
  points: number;
}

interface AuthoringChoiceSyntax {
  content: string;
  value: string;
}

export function serializeMarkCommand(mark: AuthoringMarkSyntax): string {
  const attrs = [
    `answer=${mark.answer}`,
    `points=${Math.max(0, mark.points)}`,
    `choices=${positiveChoiceCount(mark.choices)}`,
    mark.multi ? "multi=true" : ""
  ].filter(Boolean);

  return `\\mark[${attrs.join(",")}]{${mark.label}}`;
}

export function serializeChoiceCommand(mark: Pick<AuthoringMarkSyntax, "label">, choice: AuthoringChoiceSyntax) {
  return `\\choice{${mark.label}}{${choice.value}}{${choice.content}}`;
}

export function authoringBodyComment(label: string, hasBody: boolean): string {
  return hasBody ? `% === ${label} ===` : `% === ${label}: ここに問題文を記述 ===`;
}

export function authoringMarkComment(mark: AuthoringMarkSyntax): string {
  const answer = mark.answer.trim() || "未設定";
  return `% --- 解答番号 ${mark.label}: 正解 ${answer} / 配点 ${Math.max(0, mark.points)} / 選択肢 ${positiveChoiceCount(mark.choices)} ---`;
}

export function authoringLayoutCommentLines(): string[] {
  return [
    "% --- preview設定: 必要なら次の行を有効化して調整 ---",
    "% \\pagecolor{beige}",
    "% \\linespread{1.5}",
    "% \\geometry{inner=0.9in,outer=0.9in,top=50pt,bottom=0.76in}"
  ];
}

export interface ParsedMarkCommand {
  answer: string[];
  answerSource: string;
  choices: number;
  errors: string[];
  label: string;
  multi: boolean;
  points: number;
}

export function parseMarkCommand(attrsRaw: string | undefined, label: string): ParsedMarkCommand {
  const attrs = parseAuthoringAttributes(attrsRaw);
  const rawPoints = Number(attrs.points ?? 0);
  const rawChoices = Number(attrs.choices ?? 4);
  const answerSource = attrs.answer ?? "";
  const answer = attrs.answer ? attrs.answer.split("|").filter(Boolean) : [];
  const errors: string[] = [];

  if (!attrs.answer) {
    errors.push(`${label}: 正解値 answer が未設定です。`);
  }
  if (!Number.isFinite(rawPoints) || rawPoints <= 0) {
    errors.push(`${label}: 配点 points は正の数で指定してください。`);
  }
  if (!Number.isInteger(rawChoices) || rawChoices <= 0) {
    errors.push(`${label}: choices は正の整数で指定してください。`);
  }

  return {
    answer,
    answerSource,
    choices: Number.isInteger(rawChoices) && rawChoices > 0 ? rawChoices : 4,
    errors,
    label,
    multi: attrs.multi === "true" || answer.length > 1,
    points: Number.isFinite(rawPoints) ? rawPoints : 0
  };
}
