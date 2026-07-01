import { useRef } from "react";
import type { AuthoringMeta } from "../../types";

export type TextMetaKey = "title" | "subject" | "description";
export type NumberMetaKey = "questionCount" | "totalPoints" | "durationMinutes";

const textFields: Array<{ key: TextMetaKey; label: string; multiline?: boolean }> = [
  { key: "title", label: "タイトル" },
  { key: "subject", label: "科目名" },
  { key: "description", label: "説明", multiline: true }
];

const numberFields: Array<{ key: NumberMetaKey; label: string; suffix: string }> = [
  { key: "questionCount", label: "問題数", suffix: "問" },
  { key: "totalPoints", label: "配点", suffix: "点" },
  { key: "durationMinutes", label: "制限時間", suffix: "分" }
];

interface BasicSettingsPanelProps {
  meta: AuthoringMeta;
  onTextChange: (key: TextMetaKey, value: string) => void;
  onNumberChange: (key: NumberMetaKey, value: string) => void;
}

interface EnvironmentSettingsPanelProps extends BasicSettingsPanelProps {
  environmentSource: string;
  coverSource: string;
  onChangeEnvironment: (source: string) => void;
  onChangeCover: (source: string) => void;
  onUploadImage: (imageSource: string) => void;
}

export function EnvironmentSettingsPanel({
  meta,
  environmentSource,
  coverSource,
  onTextChange,
  onNumberChange,
  onChangeEnvironment,
  onChangeCover,
  onUploadImage
}: EnvironmentSettingsPanelProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const uploadImage = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        onUploadImage(reader.result);
      }
    });
    reader.readAsDataURL(file);
  };

  return (
    <div className="center-form-scroll environment-settings-scroll">
      <BasicSettingsPanel meta={meta} onNumberChange={onNumberChange} onTextChange={onTextChange} />
      <section className="environment-editor-panel" aria-label="環境と表紙">
        <label>
          <span>環境TeX</span>
          <textarea
            aria-label="環境TeX"
            rows={7}
            value={environmentSource}
            onChange={(event) => onChangeEnvironment(event.currentTarget.value)}
          />
        </label>
        <label>
          <span>表紙注意事項TeX</span>
          <textarea
            aria-label="表紙注意事項TeX"
            rows={8}
            value={coverSource}
            onChange={(event) => onChangeCover(event.currentTarget.value)}
          />
        </label>
        <button className="secondary-button compact" type="button" onClick={() => imageInputRef.current?.click()}>
          画像追加
        </button>
        <input
          accept="image/*"
          aria-label="共通画像アップロード"
          className="visually-hidden-file"
          ref={imageInputRef}
          type="file"
          onChange={(event) => {
            uploadImage(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </section>
    </div>
  );
}

function BasicSettingsPanel({ meta, onTextChange, onNumberChange }: BasicSettingsPanelProps) {
  return (
    <section className="basic-settings-panel" aria-label="基本設定">
      <div className="meta-form compact-meta-form">
        {textFields.map((field) => (
          <label className={field.multiline ? "wide" : ""} key={field.key}>
            <span>{field.label}</span>
            {field.multiline ? (
              <textarea
                rows={2}
                value={meta[field.key]}
                onChange={(event) => onTextChange(field.key, event.currentTarget.value)}
              />
            ) : (
              <input
                type="text"
                value={meta[field.key]}
                onChange={(event) => onTextChange(field.key, event.currentTarget.value)}
              />
            )}
          </label>
        ))}
        {numberFields.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <div className="number-input">
              <input
                min={0}
                type="number"
                value={meta[field.key]}
                onChange={(event) => onNumberChange(field.key, event.currentTarget.value)}
              />
              <small>{field.suffix}</small>
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}
