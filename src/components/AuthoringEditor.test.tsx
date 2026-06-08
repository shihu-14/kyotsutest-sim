import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import type { AuthoringMeta } from "../types";
import { AuthoringEditor } from "./AuthoringEditor";

vi.mock("@monaco-editor/react", () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea aria-label="TeXコード入力" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
  )
}));

describe("AuthoringEditor", () => {
  const authorSourceKey = "kyotsu-test-sim:author-source";
  const authorMetaKey = "kyotsu-test-sim:author-meta";

  beforeEach(() => {
    window.localStorage.clear();
  });

  function primeAuthoringState(source: string, overrides: Partial<AuthoringMeta> = {}) {
    const points = Array.from(source.matchAll(/points=(\d+)/g)).reduce((sum, match) => sum + Number(match[1]), 0);
    const questionCount = source.match(/\\mark/g)?.length ?? 0;
    window.localStorage.setItem(authorSourceKey, source);
    window.localStorage.setItem(
      authorMetaKey,
      JSON.stringify({
        title: overrides.title ?? "Parsed",
        subject: overrides.subject ?? "Parsed",
        description: overrides.description ?? "",
        questionCount,
        totalPoints: points,
        durationMinutes: overrides.durationMinutes ?? 60,
        ...overrides
      })
    );
  }

  async function openSectionTex(user: ReturnType<typeof userEvent.setup>) {
    await user.click(getButtonByText("大問TeX"));
  }

  function getButtonsByText(name: string) {
    return screen.getAllByText(name).filter((element): element is HTMLButtonElement => element.tagName === "BUTTON");
  }

  function getButtonByText(name: string) {
    const button = getButtonsByText(name)[0];
    expect(button).toBeDefined();
    return button;
  }

  function getButtonContainingText(name: string) {
    const element = screen.getAllByText(name).find((candidate) => candidate.closest("button"));
    const button = element?.closest("button");
    expect(button).not.toBeNull();
    return button as HTMLButtonElement;
  }

  it("edits metadata in the center panel and publishes edits for the selected exam", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const exam = sampleExams[1];

    render(<AuthoringEditor initialExam={exam} onBack={vi.fn()} onPublish={onPublish} />);

    expect(screen.queryByLabelText("試験メタ情報")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "設定" })).not.toBeInTheDocument();
    expect(screen.queryByText("Edit exam")).not.toBeInTheDocument();
    expect(screen.getByText("大問数")).toBeInTheDocument();
    expect(screen.getAllByText("問題数").length).toBeGreaterThan(0);
    expect(screen.getAllByText("配点").length).toBeGreaterThan(0);
    expect(within(screen.getByLabelText("大問一覧")).queryByLabelText("環境TeX")).not.toBeInTheDocument();

    await user.click(getButtonContainingText("環境設定"));
    const titleInput = screen.getByLabelText("タイトル");
    await user.clear(titleInput);
    await user.type(titleInput, "編集済み漫画映画");
    await user.click(getButtonByText("投稿"));

    expect(onPublish).toHaveBeenCalledWith(expect.objectContaining({ id: exam.id, title: "編集済み漫画映画" }));
    expect(onPublish.mock.calls[0][0].pages[0].pageImageUrl).toBeUndefined();
    expect(onPublish.mock.calls[0][0].pages[0].blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: expect.stringContaining("以下の連立方程式"), type: "paragraph" }),
        expect.objectContaining({ questionId: "anime-q01", type: "question" })
      ])
    );
  });

  it("previews the selected exam from the editable TeX and writes guided comments", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const exam = sampleExams[1];

    render(<AuthoringEditor initialExam={exam} onBack={vi.fn()} onPublish={onPublish} />);

    expect(screen.getByRole("heading", { name: exam.title })).toBeInTheDocument();
    expect(screen.getByLabelText("大問一覧")).toBeInTheDocument();
    const preview = screen.getByLabelText("第1問のプレビュー");
    expect(preview).toBeInTheDocument();
    expect(within(preview).getByText(/以下の連立方程式/)).toBeInTheDocument();

    await openSectionTex(user);
    const source = (screen.getByLabelText("TeXコード入力") as HTMLTextAreaElement).value;
    expect(source).toContain("% === 大問本文: 第1問 ===");
    expect(source).toContain("% --- 解答番号 1: 正解 4 / 配点 10 / 選択肢 4 ---");
    expect(source).toContain("\\includegraphics[width=0.86\\linewidth]{");
    expect(source).toContain("anime-onlymark-2026/crops/page-01-figures.jpg");
    expect(source).toContain("\\choice{1}{4}{【推しの子】}");
  });

  it("blocks publishing and shows red validation errors when marks do not match metadata", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Bad}
\sectiontitle{第1問}
\mark[answer=1,points=5,choices=4]{1}`;

    primeAuthoringState(source, { questionCount: 2, totalPoints: 5 });
    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await user.click(getButtonByText("投稿"));

    expect(onPublish).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("投稿できません");
    expect(screen.getByRole("alert")).toHaveTextContent("設定された問題数");
  });

  it("publishes parsed major and subquestion sections from mark commands", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\sectiontitle{第1問}
\subsectiontitle{問1}
\mark[answer=1,points=4,choices=4]{1}
\subsectiontitle{問2}
\mark[answer=2,points=6,choices=4]{2}`;

    primeAuthoringState(source);
    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await user.click(getButtonContainingText("環境設定"));
    const [questionCountInput, totalPointsInput] = screen.getAllByRole("spinbutton");
    await user.clear(questionCountInput);
    await user.type(questionCountInput, "2");
    await user.clear(totalPointsInput);
    await user.type(totalPointsInput, "10");
    await user.click(getButtonByText("投稿"));

    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [
          expect.objectContaining({ label: "1", section: "第1問 問1", points: 4 }),
          expect.objectContaining({ label: "2", section: "第1問 問2", points: 6 })
        ]
      })
    );
  });

  it("keeps TeX subsection title edits as the source of truth", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\sectiontitle{第1問}
\subsectiontitle{問1}
\mark[answer=1,points=4,choices=4]{1}`;

    primeAuthoringState(source);
    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await openSectionTex(user);
    fireEvent.change(screen.getByLabelText("TeXコード入力"), {
      target: { value: source.replace("\\subsectiontitle{問1}", "\\subsectiontitle{問A}") }
    });
    await user.click(getButtonByText("フォーム"));
    expect(screen.getAllByText("問A").length).toBeGreaterThan(0);
    await user.click(getButtonByText("投稿"));

    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [expect.objectContaining({ section: "第1問 問A" })]
      })
    );
  });

  it("adds subquestions and marks from the structured editor", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\sectiontitle{第1問}
\mark[answer=1,points=4,choices=4]{1}`;

    primeAuthoringState(source);
    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    expect(screen.queryByLabelText("大問 1 タイトル")).not.toBeInTheDocument();
    expect(screen.getByLabelText("第1問 本文")).toBeInTheDocument();
    await user.click(getButtonByText("選択肢を編集"));
    fireEvent.change(screen.getByLabelText("1 マーク内容"), {
      target: { value: "Alpha\nBeta\nGamma\nDelta" }
    });
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    await user.click(getButtonByText("追加"));
    expect(screen.getByLabelText("第2問 本文")).toBeInTheDocument();
    await user.click(getButtonsByText("小問追加")[0]);
    await user.click(getButtonsByText("解答欄追加")[0]);
    await user.click(getButtonByText("投稿"));

    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        totalPoints: 5,
        questions: [
          expect.objectContaining({
            label: "1",
            section: "第1問",
            points: 4,
            options: [
              expect.objectContaining({ content: "Alpha" }),
              expect.objectContaining({ content: "Beta" }),
              expect.objectContaining({ content: "Gamma" }),
              expect.objectContaining({ content: "Delta" })
            ]
          }),
          expect.objectContaining({ label: "2", section: "第2問", points: 1 })
        ]
      })
    );
  });

  it("uploads an image into the selected section body", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\sectiontitle{第1問}
\mark[answer=1,points=4,choices=4]{1}`;

    primeAuthoringState(source);
    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await user.click(getButtonContainingText("環境設定"));
    const uploadInput = screen.getByLabelText("共通画像アップロード");
    const file = new File(["sample"], "figure.png", { type: "image/png" });
    await user.upload(uploadInput, file);

    expect(await screen.findByText("アップロード画像")).toBeInTheDocument();
    await user.click(getButtonContainingText("第1問"));
    await openSectionTex(user);
    expect((screen.getByLabelText("TeXコード入力") as HTMLTextAreaElement).value).toContain(
      "\\includegraphics{data:image/png;base64,"
    );
  });

  it("applies TeX preview layout and includegraphics options", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\pagecolor[RGB]{240,241,242}
\linespread{1.4}
\geometry{inner=1in,outer=0.7in,top=40pt,bottom=30pt}
\sectiontitle{第1問}
\includegraphics[width=12.8em,trim=0cm 1cm 2cm 3cm,clip]{data:image/png;base64,abc}
\mark[answer=1,points=4,choices=4]{1}`;

    primeAuthoringState(source);
    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await user.click(getButtonByText("投稿"));

    const page = onPublish.mock.calls[0][0].pages[0];
    expect(page.layout).toMatchObject({
      pageColor: "rgb(240, 241, 242)",
      paddingTop: "40pt",
      paddingRight: "0.7in",
      paddingBottom: "30pt",
      paddingLeft: "1in"
    });
    expect(page.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          imageOptions: "width=12.8em,trim=0cm 1cm 2cm 3cm,clip",
          imageStyle: expect.objectContaining({
            clipPath: "inset(3cm 2cm 1cm 0cm)",
            width: "12.8em"
          }),
          type: "figure"
        })
      ])
    );
  });

  it("publishes environment and cover TeX edits from the environment panel", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\sectiontitle{第1問}
\mark[answer=1,points=4,choices=4]{1}`;

    primeAuthoringState(source);
    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    expect(screen.queryByLabelText("環境TeX")).not.toBeInTheDocument();
    await user.click(getButtonContainingText("環境設定"));
    fireEvent.change(screen.getByLabelText("環境TeX"), {
      target: { value: "\\pagecolor[RGB]{240,241,242}\n\\geometry{top=44pt}" }
    });
    fireEvent.change(screen.getByLabelText("表紙注意事項TeX"), {
      target: { value: "\\item 新しい注意事項" }
    });
    await user.click(getButtonByText("投稿"));

    expect(onPublish.mock.calls[0][0].instructions).toEqual(["新しい注意事項"]);
    expect(onPublish.mock.calls[0][0].pages[0].layout).toMatchObject({
      pageColor: "rgb(240, 241, 242)",
      paddingTop: "44pt"
    });
  });

  it("edits global settings through detailed TeX", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\sectiontitle{第1問}
\mark[answer=1,points=4,choices=4]{1}`;

    primeAuthoringState(source);
    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await user.click(getButtonContainingText("環境設定"));
    await user.click(getButtonByText("詳細TeX"));
    fireEvent.change(screen.getByLabelText("TeXコード入力"), {
      target: {
        value: String.raw`\examtitle{Detailed}
\examsubject{詳細科目}
\examdescription{詳細TeXから更新}
\questioncount{1}
\totalpoints{4}
\durationminutes{45}
\pagecolor[RGB]{244,245,246}
\newgeometry{inner=1in,outer=0.8in,top=42pt,bottom=30pt}
\begin{coverinstructions}
\item 詳細TeX注意事項
\end{coverinstructions}`
      }
    });
    await user.click(getButtonByText("投稿"));

    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Detailed",
        subject: "詳細科目",
        description: "詳細TeXから更新",
        durationMinutes: 45,
        instructions: ["詳細TeX注意事項"]
      })
    );
    expect(onPublish.mock.calls[0][0].pages[0].layout).toMatchObject({
      pageColor: "rgb(244, 245, 246)",
      paddingTop: "42pt"
    });
  });

  it("omits a singleton 問1 heading in preview and serialized TeX", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\sectiontitle{第1問}
\subsectiontitle{問1}
単独小問の本文。
\mark[answer=1,points=4,choices=4]{1}`;

    primeAuthoringState(source);
    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    const preview = screen.getByLabelText("第1問のプレビュー");
    expect(within(preview).queryByRole("heading", { name: "問1" })).not.toBeInTheDocument();

    await openSectionTex(user);
    const editedSource = (screen.getByLabelText("TeXコード入力") as HTMLTextAreaElement).value;
    expect(editedSource).not.toContain("\\subsectiontitle{問1}");
    expect(editedSource).toContain("% === 小問本文: 第1問 ===");
    await user.click(getButtonByText("投稿"));

    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [expect.objectContaining({ section: "第1問" })]
      })
    );
  });

  it("edits answer mark settings and publishes multiple answers", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\sectiontitle{第1問}
\mark[answer=1,points=100,choices=4]{1}`;

    primeAuthoringState(source);
    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await user.click(screen.getByLabelText("1 複数回答"));
    await user.click(within(screen.getByLabelText("1 正解番号")).getByText("3"));
    await user.click(getButtonByText("投稿"));

    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [expect.objectContaining({ correct: ["1", "3"], multi: true })]
      })
    );
  });
});
