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

  it("opens metadata in settings and publishes edits for the selected exam", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    const exam = sampleExams[1];

    render(<AuthoringEditor initialExam={exam} onBack={vi.fn()} onPublish={onPublish} />);

    expect(screen.queryByLabelText("試験メタ情報")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "設定" }));

    const settingsDialog = screen.getByRole("dialog", { name: "設定" });
    const titleInput = within(settingsDialog).getByLabelText("タイトル");
    await user.clear(titleInput);
    await user.type(titleInput, "編集済み漫画映画");
    await user.click(screen.getByRole("button", { name: "閉じる" }));
    await user.click(screen.getByRole("button", { name: "投稿" }));

    expect(onPublish).toHaveBeenCalledWith(expect.objectContaining({ id: exam.id, title: "編集済み漫画映画" }));
  });

  it("blocks publishing and shows red validation errors when marks do not match metadata", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();

    render(<AuthoringEditor onBack={vi.fn()} onPublish={onPublish} />);

    await user.click(screen.getByRole("button", { name: "投稿" }));

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

    fireEvent.change(screen.getByLabelText("TeXコード入力"), { target: { value: source } });
    await user.click(screen.getByRole("button", { name: "設定" }));

    const settingsDialog = screen.getByRole("dialog", { name: "設定" });
    const [questionCountInput, totalPointsInput] = within(settingsDialog).getAllByRole("spinbutton");
    await user.clear(questionCountInput);
    await user.type(questionCountInput, "2");
    await user.clear(totalPointsInput);
    await user.type(totalPointsInput, "10");
    await user.click(screen.getByRole("button", { name: "閉じる" }));
    await user.click(screen.getByRole("button", { name: "投稿" }));

    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [
          expect.objectContaining({ label: "1", section: "第1問 問1", points: 4 }),
          expect.objectContaining({ label: "2", section: "第1問 問2", points: 6 })
        ]
      })
    );
  });
});
