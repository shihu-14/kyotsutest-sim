import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import { AuthoringEditor } from "./AuthoringEditor";

vi.mock("@monaco-editor/react", () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea aria-label="TeXコード入力" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
  )
}));

describe("AuthoringEditor", () => {
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
});
