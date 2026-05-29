import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import { AuthoringEditor } from "./AuthoringEditor";

vi.mock("@monaco-editor/react", () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea aria-label="TeXコード入力" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
  )
}));

describe("AuthoringEditor", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  async function enterSource(user: ReturnType<typeof userEvent.setup>, source: string) {
    await user.click(screen.getByRole("tab", { name: "詳細TeX" }));
    fireEvent.change(screen.getByLabelText("TeXコード入力"), { target: { value: source } });
  }

  function getSettingsDialog() {
    const dialog = screen.getByText("設定", { selector: "h2" }).closest("section");
    expect(dialog).not.toBeNull();
    return dialog as HTMLElement;
  }

  function getButtonsByText(name: string) {
    return screen.getAllByText(name).filter((element): element is HTMLButtonElement => element.tagName === "BUTTON");
  }

  function getButtonByText(name: string) {
    const button = getButtonsByText(name)[0];
    expect(button).toBeDefined();
    return button;
  }

  it("opens metadata in settings and publishes edits for the selected exam", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const exam = sampleExams[1];

    render(<AuthoringEditor initialExam={exam} onBack={vi.fn()} onPublish={onPublish} />);

    expect(screen.queryByLabelText("試験メタ情報")).not.toBeInTheDocument();

    await user.click(getButtonByText("設定"));

    const settingsDialog = getSettingsDialog();
    const titleInput = within(settingsDialog).getByLabelText("タイトル");
    await user.clear(titleInput);
    await user.type(titleInput, "編集済み漫画映画");
    await user.click(getButtonByText("閉じる"));
    await user.click(getButtonByText("投稿"));

    expect(onPublish).toHaveBeenCalledWith(expect.objectContaining({ id: exam.id, title: "編集済み漫画映画" }));
    expect(onPublish.mock.calls[0][0].pages[0].pageImageUrl).toBeUndefined();
    expect(onPublish.mock.calls[0][0].pages[0].blocks).toEqual(
      expect.arrayContaining([expect.objectContaining({ questionId: "anime-q01", type: "question" })])
    );
  });

  it("previews the selected exam from the editable draft and writes full choice TeX", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const exam = sampleExams[1];

    render(<AuthoringEditor initialExam={exam} onBack={vi.fn()} onPublish={onPublish} />);

    expect(screen.getByRole("heading", { name: exam.title })).toBeInTheDocument();
    expect(screen.getByLabelText(`${exam.title}の表紙プレビュー`)).toBeInTheDocument();
    expect(screen.getByLabelText("第1問のプレビュー")).toBeInTheDocument();
    expect(screen.queryByAltText("第1問 方程式クイズのPDF再現ページ")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "詳細TeX" }));
    expect((screen.getByLabelText("TeXコード入力") as HTMLTextAreaElement).value).toContain(
      "\\choice{1}{4}{【推しの子】}"
    );
  });

  it("blocks publishing and shows red validation errors when marks do not match metadata", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Bad}
\sectiontitle{第1問}
\mark[answer=1,points=5,choices=4]{1}`;

    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await enterSource(user, source);
    await user.click(getButtonByText("投稿"));

    expect(onPublish).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("投稿できません");
    expect(screen.getByRole("alert")).toHaveTextContent("設定された設問数");
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

    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await enterSource(user, source);
    await user.click(getButtonByText("設定"));

    const settingsDialog = getSettingsDialog();
    const [questionCountInput, totalPointsInput] = within(settingsDialog).getAllByRole("spinbutton");
    await user.clear(questionCountInput);
    await user.type(questionCountInput, "2");
    await user.clear(totalPointsInput);
    await user.type(totalPointsInput, "10");
    await user.click(getButtonByText("閉じる"));
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

  it("adds subquestions and marks from the structured editor", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\sectiontitle{第1問}
\mark[answer=1,points=4,choices=4]{1}`;

    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await enterSource(user, source);
    await user.click(screen.getByRole("tab", { name: "フォーム" }));
    expect(screen.queryByLabelText("大問 1 タイトル")).not.toBeInTheDocument();
    expect(screen.getByLabelText("第1問")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("1 マーク内容"), {
      target: { value: "Alpha\nBeta\nGamma\nDelta" }
    });
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    await user.click(getButtonByText("大問追加"));
    expect(screen.getByLabelText("第2問")).toBeInTheDocument();
    await user.click(getButtonsByText("小問追加")[0]);
    await user.click(getButtonsByText("マーク追加")[1]);
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
          expect.objectContaining({ label: "2", section: "第1問 問1", points: 1 })
        ]
      })
    );
  });

  it("edits answer mark settings and publishes multiple answers", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const source = String.raw`\examtitle{Parsed}
\sectiontitle{第1問}
\mark[answer=1,points=100,choices=4]{1}`;

    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await enterSource(user, source);
    await user.click(screen.getByRole("tab", { name: "フォーム" }));
    await user.click(getButtonByText("設定"));

    const settingsDialog = getSettingsDialog();
    const [questionCountInput] = within(settingsDialog).getAllByRole("spinbutton");
    await user.clear(questionCountInput);
    await user.type(questionCountInput, "1");
    await user.click(getButtonByText("閉じる"));

    const answerInput = screen.getByLabelText("1 正解番号");
    await user.clear(answerInput);
    await user.type(answerInput, "1|3");
    await user.click(getButtonByText("投稿"));

    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [expect.objectContaining({ correct: ["1", "3"], multi: true })]
      })
    );
  });
});
