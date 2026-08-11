import { useState } from "react";
import {
  createDraftMark,
  createDraftSubsection,
  normalizeMarkChoices,
  sectionMarkCount,
  type DraftChoice,
  type DraftMark,
  type DraftSection,
  type DraftSubsection
} from "../../utils/authoring/authoringDraft";

interface SectionEditorProps {
  section: DraftSection;
  sectionIndex: number;
  onChange: (section: DraftSection) => void;
}

export function SectionEditor({ section, sectionIndex, onChange }: SectionEditorProps) {
  const updateSection = (updates: Partial<DraftSection>) => {
    onChange({ ...section, ...updates });
  };
  const updateSubsection = (
    subsectionIndex: number,
    updates: Partial<DraftSubsection>
  ) => {
    const subsections = section.subsections.map((subsection, index) =>
      index === subsectionIndex ? { ...subsection, ...updates } : subsection
    );
    updateSection({ subsections });
  };

  const updateMark = (
    subsectionIndex: number | null,
    markIndex: number,
    updates: Partial<DraftMark>
  ) => {
    if (subsectionIndex === null) {
      const marks = section.marks.map((mark, index) => (index === markIndex ? { ...mark, ...updates } : mark));
      updateSection({ marks });
      return;
    }

    const subsections = section.subsections.map((subsection, index) => {
      if (index !== subsectionIndex) {
        return subsection;
      }

      return {
        ...subsection,
        marks: subsection.marks.map((mark, itemIndex) =>
          itemIndex === markIndex ? { ...mark, ...updates } : mark
        )
      };
    });
    updateSection({ subsections });
  };

  const addSubsection = () => {
    const firstSubsection = createDraftSubsection(sectionIndex, section.subsections.length);
    if (!section.subsections.length && section.marks.length) {
      updateSection({
        marks: [],
        subsections: [
          {
            ...firstSubsection,
            marks: section.marks
          }
        ]
      });
      return;
    }

    updateSection({
      subsections: [...section.subsections, firstSubsection]
    });
  };

  const addMark = (subsectionIndex: number | null) => {
    const mark = createDraftMark(String(sectionMarkCount(section) + 1));
    if (subsectionIndex === null) {
      updateSection({ marks: [...section.marks, mark] });
      return;
    }

    const subsections = section.subsections.map((subsection, index) =>
      index === subsectionIndex ? { ...subsection, marks: [...subsection.marks, mark] } : subsection
    );
    updateSection({ subsections });
  };

  const removeMark = (subsectionIndex: number | null, markIndex: number) => {
    if (subsectionIndex === null) {
      updateSection({ marks: section.marks.filter((_mark, index) => index !== markIndex) });
      return;
    }

    const subsections = section.subsections.map((subsection, index) =>
      index === subsectionIndex
        ? { ...subsection, marks: subsection.marks.filter((_mark, itemIndex) => itemIndex !== markIndex) }
        : subsection
    );
    updateSection({ subsections });
  };

  return (
    <div className="section-editor">
      <div className="section-editor-head">
        <div className="section-editor-actions">
          <button className="secondary-button compact" type="button" onClick={addSubsection}>
            小問追加
          </button>
          {!section.subsections.length ? (
            <button className="primary-button compact" type="button" onClick={() => addMark(null)}>
              解答欄追加
            </button>
          ) : null}
        </div>
      </div>
      <label className="section-body-field">
        <span>本文</span>
        <textarea
          aria-label={`${section.title} 本文`}
          rows={6}
          value={section.body}
          onChange={(event) => updateSection({ body: event.currentTarget.value })}
        />
      </label>
      {!section.subsections.length ? (
        <section className="answer-editor-group" aria-label={`${section.title} 解答欄`}>
          <div className="answer-editor-head">
            <h3>解答欄</h3>
            <small>{section.marks.length}件</small>
          </div>
          <MarkList
            marks={section.marks}
            prefix={section.title}
            onRemove={(markIndex) => removeMark(null, markIndex)}
            onUpdate={(markIndex, updates) => updateMark(null, markIndex, updates)}
          />
        </section>
      ) : null}
      {section.subsections.map((subsection, subsectionIndex) => (
        <section className="subsection-editor" key={subsection.id}>
          <div className="subsection-editor-head">
            <div className="subsection-title-chip" aria-label={`${section.title} 小問 ${subsectionIndex + 1}`}>
              <span>小問</span>
              <strong>{subsection.title}</strong>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => addMark(subsectionIndex)}>
              解答欄追加
            </button>
          </div>
          <label className="section-body-field">
            <span>本文</span>
            <textarea
              aria-label={`${section.title} ${subsection.title} 本文`}
              rows={4}
              value={subsection.body}
              onChange={(event) => updateSubsection(subsectionIndex, { body: event.currentTarget.value })}
            />
          </label>
          <MarkList
            marks={subsection.marks}
            prefix={`${section.title} ${subsection.title}`}
            onRemove={(markIndex) => removeMark(subsectionIndex, markIndex)}
            onUpdate={(markIndex, updates) => updateMark(subsectionIndex, markIndex, updates)}
          />
        </section>
      ))}
    </div>
  );
}

interface MarkListProps {
  marks: DraftMark[];
  prefix: string;
  onRemove: (markIndex: number) => void;
  onUpdate: (markIndex: number, updates: Partial<DraftMark>) => void;
}

function choiceText(mark: DraftMark): string {
  return normalizeMarkChoices(mark)
    .map((choice) => choice.content)
    .join("\n");
}

function choicesFromText(text: string): DraftChoice[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const contents = lines.length ? lines : ["1"];
  return contents.map((content, index) => ({ value: String(index + 1), content }));
}

function resizeChoices(mark: DraftMark, choices: number): DraftChoice[] {
  return normalizeMarkChoices({ ...mark, choices });
}

function positiveInputNumber(value: string): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(1, numericValue) : 1;
}

function answerValuesFromMark(mark: DraftMark): string[] {
  return mark.answer.split("|").map((value) => value.trim()).filter(Boolean);
}

function MarkList({ marks, prefix, onRemove, onUpdate }: MarkListProps) {
  const [expandedChoices, setExpandedChoices] = useState<Set<string>>(() => new Set());

  if (!marks.length) {
    return <p className="empty-answer-list">この範囲には解答欄がありません。</p>;
  }

  const toggleChoiceEditor = (markId: string) => {
    setExpandedChoices((current) => {
      const next = new Set(current);
      if (next.has(markId)) {
        next.delete(markId);
      } else {
        next.add(markId);
      }
      return next;
    });
  };

  const updateCorrectAnswer = (markIndex: number, mark: DraftMark, value: string) => {
    if (!mark.multi) {
      onUpdate(markIndex, { answer: value });
      return;
    }

    const currentValues = answerValuesFromMark(mark);
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((candidate) => candidate !== value)
      : [...currentValues, value];
    onUpdate(markIndex, { answer: nextValues.join("|") });
  };

  return (
    <div className="structure-mark-list">
      {marks.map((mark, markIndex) => (
        <div className="structure-mark-row" key={mark.id}>
          <div className="structure-mark-number" aria-label={`解答番号 ${mark.label}`}>
            <span>解答番号</span>
            <strong>{mark.label}</strong>
          </div>
          <label>
            <span>配点</span>
            <input
              aria-label={`${mark.label} 配点`}
              min={0}
              type="number"
              value={mark.points}
              onChange={(event) => onUpdate(markIndex, { points: Number(event.currentTarget.value) })}
            />
          </label>
          <label>
            <span>選択肢数</span>
            <input
              aria-label={`${mark.label} 選択肢数`}
              min={1}
              type="number"
              value={mark.choices}
              onChange={(event) => {
                const choices = positiveInputNumber(event.currentTarget.value);
                onUpdate(markIndex, { choices, optionContents: resizeChoices(mark, choices) });
              }}
            />
          </label>
          <label>
            <span>正解番号</span>
            <div className="answer-choice-buttons" aria-label={`${mark.label} 正解番号`}>
              {normalizeMarkChoices(mark).map((choice) => {
                const selected = answerValuesFromMark(mark).includes(choice.value);
                return (
                  <button
                    aria-pressed={selected}
                    className={selected ? "selected" : ""}
                    key={choice.value}
                    type="button"
                    onClick={() => updateCorrectAnswer(markIndex, mark, choice.value)}
                  >
                    {choice.value}
                  </button>
                );
              })}
            </div>
          </label>
          <label className="structure-check">
            <input
              aria-label={`${mark.label} 複数回答`}
              checked={mark.multi}
              type="checkbox"
              onChange={(event) => {
                const multi = event.currentTarget.checked;
                const firstAnswer = answerValuesFromMark(mark)[0] ?? "1";
                onUpdate(markIndex, { multi, answer: multi ? mark.answer : firstAnswer });
              }}
            />
            <span>複数</span>
          </label>
          <button className="secondary-button" type="button" onClick={() => onRemove(markIndex)}>
            削除
          </button>
          <button className="text-button compact" type="button" onClick={() => toggleChoiceEditor(mark.id)}>
            選択肢を編集
          </button>
          <span className="structure-mark-context">{prefix}</span>
          {expandedChoices.has(mark.id) ? (
            <label className="structure-choice-contents">
              <span>選択肢内容</span>
              <textarea
                aria-label={`${mark.label} マーク内容`}
                rows={Math.min(6, Math.max(2, mark.choices))}
                value={choiceText(mark)}
                onChange={(event) => {
                  const optionContents = choicesFromText(event.currentTarget.value);
                  onUpdate(markIndex, { choices: optionContents.length, optionContents });
                }}
              />
            </label>
          ) : null}
        </div>
      ))}
    </div>
  );
}
