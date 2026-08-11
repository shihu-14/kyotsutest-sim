import { useMemo, useState } from "react";
import type { Exam } from "../../types";
import {
  EnvironmentSettingsPanel,
  type NumberMetaKey,
  type TextMetaKey
} from "./EnvironmentSettingsPanel";
import { SectionEditor } from "./SectionEditor";
import { SectionNavigator } from "./SectionNavigator";
import { EnvironmentTexEditor, PublishedSectionPreview, SectionTexEditor } from "./TexEditors";
import {
  countDraftMarks,
  cloneDraft,
  createDraftSection,
  normalizeFormDraft,
  normalizeSourceDraft,
  parseAuthoringDraft,
  sectionMarkCount,
  sectionPointTotal,
  serializeAuthoringDraft,
  sumDraftPoints,
  type ExamDraft
} from "../../utils/authoringDraft";
import {
  buildPublishedExam,
  buildSectionCompileSource,
  coverSourceFromExam,
  environmentFromExam,
  metaFromExam,
  parseEnvironmentEditorSource,
  sameMeta,
  serializeEnvironmentEditorSource,
  serializeSectionSource,
  sourceFromExam,
  validateAuthoring
} from "../../utils/authoringExam";
import { parseAuthoringLatex } from "../../utils/authoringPreview";
import { saveAuthorCover, saveAuthorEnvironment, saveAuthorMeta, saveAuthorSource } from "../../utils/storage";

interface AuthoringEditorProps {
  initialExam?: Exam | null;
  onBack: () => void;
  onPublish: (exam: Exam) => void;
}

type CenterTab = "form" | "tex";
type EditorSelection = "environment" | "section";

export function AuthoringEditor({ initialExam = null, onBack, onPublish }: AuthoringEditorProps) {
  const [source, setSource] = useState(() => sourceFromExam(initialExam));
  const [meta, setMeta] = useState(() => metaFromExam(initialExam));
  const [environmentSource, setEnvironmentSource] = useState(() => environmentFromExam(initialExam));
  const [coverSource, setCoverSource] = useState(() => coverSourceFromExam(initialExam));
  const [savedSource, setSavedSource] = useState(source);
  const [savedMeta, setSavedMeta] = useState(meta);
  const [savedEnvironmentSource, setSavedEnvironmentSource] = useState(environmentSource);
  const [savedCoverSource, setSavedCoverSource] = useState(coverSource);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [publishState, setPublishState] = useState<"idle" | "published">("idle");
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [selectedPanel, setSelectedPanel] = useState<EditorSelection>("section");
  const [centerTab, setCenterTab] = useState<CenterTab>("form");
  const validationErrors = useMemo(() => validateAuthoring(source, meta), [source, meta]);
  const draft = useMemo(() => normalizeSourceDraft(parseAuthoringDraft(source)), [source]);
  const previewExam = useMemo(
    () => buildPublishedExam(meta, source, initialExam, environmentSource, coverSource),
    [coverSource, environmentSource, initialExam, meta, source]
  );
  const environmentEditorSource = useMemo(
    () => serializeEnvironmentEditorSource(meta, environmentSource, coverSource),
    [coverSource, environmentSource, meta]
  );
  const isEnvironmentSelected = selectedPanel === "environment";
  const selectedSection = isEnvironmentSelected
    ? null
    : draft.sections[Math.min(selectedSectionIndex, Math.max(0, draft.sections.length - 1))] ?? null;
  const selectedPage = previewExam.pages[Math.min(selectedSectionIndex, Math.max(0, previewExam.pages.length - 1))] ?? null;
  const selectedSectionSource = selectedSection ? serializeSectionSource(selectedSection) : "";
  const selectedCompileSize = selectedSection ? buildSectionCompileSource(meta, selectedSection, environmentSource).length : 0;
  const centerTitle = isEnvironmentSelected ? "環境設定" : selectedSection?.title ?? "大問";
  const texTabLabel = isEnvironmentSelected ? "詳細TeX" : "大問TeX";
  const sectionTotals = useMemo(
    () =>
      draft.sections.map((section) => ({
        marks: sectionMarkCount(section),
        points: sectionPointTotal(section)
      })),
    [draft.sections]
  );
  const sourceStats = useMemo(() => {
    const parsed = parseAuthoringLatex(source);
    return {
      lines: source.split("\n").length,
      marks: parsed.marks.length,
      sections: draft.sections.length,
      subsections: draft.sections.reduce((sum, section) => sum + section.subsections.length, 0),
      answerSlots: source.match(/\\counterbox/g)?.length ?? 0
    };
  }, [draft, source]);
  const isDirty =
    source !== savedSource ||
    !sameMeta(meta, savedMeta) ||
    environmentSource !== savedEnvironmentSource ||
    coverSource !== savedCoverSource;

  const saveDraft = () => {
    saveAuthorSource(source);
    saveAuthorMeta(meta);
    saveAuthorEnvironment(environmentSource);
    saveAuthorCover(coverSource);
    setSavedSource(source);
    setSavedMeta(meta);
    setSavedEnvironmentSource(environmentSource);
    setSavedCoverSource(coverSource);
  };

  const publishDraft = () => {
    if (validationErrors.length) {
      setShowValidationErrors(true);
      return;
    }

    saveDraft();
    setPublishState("published");
    onPublish(buildPublishedExam(meta, source, initialExam, environmentSource, coverSource));
  };

  const requestBack = () => {
    if (isDirty) {
      setShowLeaveDialog(true);
      return;
    }

    onBack();
  };

  const updateTextMeta = (key: TextMetaKey, value: string) => {
    setMeta((current) => ({ ...current, [key]: value }));
  };

  const updateNumberMeta = (key: NumberMetaKey, value: string) => {
    const numericValue = Number(value);
    setMeta((current) => ({ ...current, [key]: Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0 }));
  };

  const applyDraft = (nextDraft: ExamDraft) => {
    const normalizedDraft = normalizeFormDraft(nextDraft);
    const nextQuestionCount = countDraftMarks(normalizedDraft);
    const nextTotalPoints = sumDraftPoints(normalizedDraft);
    const nextMeta = {
      ...meta,
      questionCount: nextQuestionCount || meta.questionCount,
      totalPoints: nextQuestionCount ? nextTotalPoints : meta.totalPoints
    };
    setMeta(nextMeta);
    setSource(serializeAuthoringDraft(nextMeta, normalizedDraft));
  };

  const applySourceDraft = (nextDraft: ExamDraft) => {
    const normalizedDraft = normalizeSourceDraft(nextDraft);
    const nextQuestionCount = countDraftMarks(normalizedDraft);
    const nextTotalPoints = sumDraftPoints(normalizedDraft);
    const nextMeta = {
      ...meta,
      questionCount: nextQuestionCount || meta.questionCount,
      totalPoints: nextQuestionCount ? nextTotalPoints : meta.totalPoints
    };
    setMeta(nextMeta);
    setSource(serializeAuthoringDraft(nextMeta, normalizedDraft));
  };

  const applySelectedSectionSource = (nextSectionSource: string) => {
    if (!selectedSection) {
      return;
    }

    const parsed = normalizeSourceDraft(parseAuthoringDraft(nextSectionSource));
    const nextSection = parsed.sections[0] ?? createDraftSection(selectedSectionIndex);
    const nextDraft = cloneDraft(draft);
    nextDraft.sections[selectedSectionIndex] = {
      ...nextSection,
      id: selectedSection.id
    };
    applySourceDraft(nextDraft);
  };

  const appendImageToSelectedSection = (imageSource: string) => {
    const selectedIndex = Math.min(selectedSectionIndex, Math.max(0, draft.sections.length - 1));
    const section = draft.sections[selectedIndex];
    if (!section) {
      return;
    }

    const nextDraft = cloneDraft(draft);
    const nextLine = `\\includegraphics{${imageSource}}`;
    nextDraft.sections[selectedIndex] = {
      ...section,
      body: section.body.trim() ? `${section.body.trim()}\n${nextLine}` : nextLine
    };
    applySourceDraft(nextDraft);
  };

  const applyEnvironmentEditorSource = (nextSource: string) => {
    const parsed = parseEnvironmentEditorSource(nextSource, meta, environmentSource, coverSource);
    setMeta(parsed.meta);
    setEnvironmentSource(parsed.environmentSource);
    setCoverSource(parsed.coverSource);
  };

  return (
    <main className="author-layout">
      <header className="author-topbar">
        <div>
          <h1>{initialExam ? meta.title || initialExam.title : "新規作成"}</h1>
        </div>
        <dl className="author-summary" aria-label="編集サマリー">
          <div>
            <dt>大問数</dt>
            <dd>{draft.sections.length}問</dd>
          </div>
          <div>
            <dt>問題数</dt>
            <dd>{sourceStats.marks}問</dd>
          </div>
          <div className={sumDraftPoints(draft) === meta.totalPoints ? "" : "mismatch"}>
            <dt>配点</dt>
            <dd>{sumDraftPoints(draft)}点</dd>
          </div>
        </dl>
        <div className="author-actions">
          <span className={`save-state ${isDirty ? "dirty" : ""}`}>
            {publishState === "published" ? "投稿済み" : isDirty ? "未保存" : "保存済み"}
          </span>
          <button className="primary-button" type="button" onClick={saveDraft}>
            一時保存
          </button>
          <button className="primary-button" type="button" onClick={publishDraft}>
            投稿
          </button>
          <button className="secondary-button" type="button" onClick={requestBack}>
            戻る
          </button>
        </div>
      </header>

      <section className="author-workspace">
        <SectionNavigator
          draft={draft}
          sectionTotals={sectionTotals}
          selectedPanel={selectedPanel}
          selectedSectionIndex={selectedSectionIndex}
          totalMarks={sourceStats.marks}
          totalPoints={sumDraftPoints(draft)}
          onAddSection={() => {
            applyDraft({ sections: [...draft.sections, createDraftSection(draft.sections.length)] });
            setSelectedSectionIndex(draft.sections.length);
            setSelectedPanel("section");
          }}
          onSelectEnvironment={() => {
            setSelectedPanel("environment");
            setCenterTab("form");
          }}
          onSelectSection={(sectionIndex) => {
            setSelectedSectionIndex(sectionIndex);
            setSelectedPanel("section");
            setCenterTab("form");
          }}
        />

        <section className="section-editor-pane" aria-label="選択中の大問編集">
          <div className="center-pane-heading">
            <div>
              <h2>{centerTitle}</h2>
            </div>
            <div className="center-tabs" role="tablist" aria-label="中央編集モード">
              <button
                aria-selected={centerTab === "form"}
                className={centerTab === "form" ? "active" : ""}
                role="tab"
                type="button"
                onClick={() => setCenterTab("form")}
              >
                フォーム
              </button>
              <button
                aria-selected={centerTab === "tex"}
                className={centerTab === "tex" ? "active" : ""}
                role="tab"
                type="button"
                onClick={() => setCenterTab("tex")}
              >
                {texTabLabel}
              </button>
            </div>
          </div>
          {isEnvironmentSelected && centerTab === "form" ? (
            <EnvironmentSettingsPanel
              coverSource={coverSource}
              environmentSource={environmentSource}
              meta={meta}
              onChangeCover={setCoverSource}
              onChangeEnvironment={setEnvironmentSource}
              onNumberChange={updateNumberMeta}
              onTextChange={updateTextMeta}
              onUploadImage={appendImageToSelectedSection}
            />
          ) : null}
          {isEnvironmentSelected && centerTab === "tex" ? (
            <EnvironmentTexEditor source={environmentEditorSource} onChange={applyEnvironmentEditorSource} />
          ) : null}
          {!isEnvironmentSelected && centerTab === "form" && selectedSection ? (
            <div className="center-form-scroll">
              <SectionEditor
                section={selectedSection}
                sectionIndex={selectedSectionIndex}
                onChange={(nextSection) => {
                  const nextDraft = cloneDraft(draft);
                  nextDraft.sections[selectedSectionIndex] = nextSection;
                  applyDraft(nextDraft);
                }}
              />
            </div>
          ) : null}
          {!isEnvironmentSelected && centerTab === "tex" && selectedSection ? (
            <SectionTexEditor
              compileSize={selectedCompileSize}
              source={selectedSectionSource}
              onChange={applySelectedSectionSource}
            />
          ) : null}
        </section>

        <aside className="inspector-pane">
          <section className="inspector-shell" aria-label="大問プレビュー">
            <div className="inspector-heading">
              <div>
                <h2>{selectedPage?.title ?? "プレビュー"}</h2>
              </div>
            </div>
            {selectedPage ? (
              <PublishedSectionPreview exam={previewExam} page={selectedPage} />
            ) : null}
            {showValidationErrors && validationErrors.length ? (
              <div className="validation-errors" role="alert">
                <strong>投稿できません</strong>
                <ul>
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </aside>
      </section>

      {showLeaveDialog ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-dialog-title">
            <h2 id="leave-dialog-title">未保存の変更があります</h2>
            <p>保存して戻るか、保存せずに戻るかを選んでください。</p>
            <div className="dialog-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  saveDraft();
                  onBack();
                }}
              >
                保存して戻る
              </button>
              <button className="danger-button" type="button" onClick={onBack}>
                保存せず戻る
              </button>
              <button className="secondary-button" type="button" onClick={() => setShowLeaveDialog(false)}>
                キャンセル
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
