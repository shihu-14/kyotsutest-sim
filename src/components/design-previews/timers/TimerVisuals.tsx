import type { CSSProperties, ComponentType, HTMLAttributes } from "react";

export type TimerVisualState = "normal" | "warning" | "critical";

export interface TimerVisualProps {
  formatted: string;
  remainingMs: number;
  size: "large" | "small";
  state: TimerVisualState;
  totalMs: number;
}

export interface TimerVisualCandidate {
  component: ComponentType<TimerVisualProps>;
  id: string;
  intent: string;
  name: string;
  reference: string;
  shortName: string;
}

type TimerRootAttributes = HTMLAttributes<HTMLElement> & {
  "data-timer-layout": string;
  "data-timer-state": TimerVisualState;
};

function clampRatio(remainingMs: number, totalMs: number) {
  if (totalMs <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, remainingMs / totalMs));
}

function stateText(state: TimerVisualState) {
  if (state === "critical") {
    return "残りわずか";
  }
  if (state === "warning") {
    return "注意";
  }
  return "通常";
}

function visualRootProps(
  layout: string,
  { formatted, remainingMs, size, state, totalMs }: TimerVisualProps
): TimerRootAttributes {
  const ratio = clampRatio(remainingMs, totalMs);
  const percent = Math.round(ratio * 100);
  const style = {
    "--visual-angle": `${ratio * 360}deg`,
    "--visual-percent": `${percent}%`,
    "--visual-ratio": ratio,
    "--visual-used": `${(1 - ratio) * 100}%`
  } as CSSProperties;

  return {
    "aria-label": `残り時間 ${formatted}、${stateText(state)}、残り${percent}%`,
    className: `timer-visual timer-visual-${layout} timer-visual-${size} timer-visual-state-${state}`,
    "data-timer-layout": layout,
    "data-timer-state": state,
    role: "timer",
    style
  };
}

function percentText(remainingMs: number, totalMs: number) {
  return `${Math.round(clampRatio(remainingMs, totalMs) * 100)}%`;
}

function ExamSealTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("exam-seal", props)}>
      <span aria-hidden="true" className="timer-seal-crown" />
      <div className="timer-seal-ring">
        <div className="timer-seal-face">
          <span>{stateText(props.state)}</span>
          <strong>{props.formatted}</strong>
          <small>残り {percentText(props.remainingMs, props.totalMs)}・減少中</small>
        </div>
      </div>
    </div>
  );
}

function AppleRingTimer(props: TimerVisualProps) {
  const ratio = clampRatio(props.remainingMs, props.totalMs);
  return (
    <div {...visualRootProps("apple-ring", props)}>
      <svg aria-hidden="true" className="timer-apple-ring" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="51" />
        <circle cx="60" cy="60" r="51" pathLength="1" strokeDasharray={`${ratio} 1`} />
      </svg>
      <div className="timer-apple-copy">
        <small>残り時間</small>
        <strong>{props.formatted}</strong>
        <span>{stateText(props.state)}・{percentText(props.remainingMs, props.totalMs)}・減少中</span>
      </div>
    </div>
  );
}

function MaterialLinearTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("material-linear", props)}>
      <header><span>残り時間</span><em>{stateText(props.state)}</em></header>
      <div className="timer-material-value">
        <strong>{props.formatted}</strong>
        <span>{percentText(props.remainingMs, props.totalMs)}</span>
      </div>
      <div aria-hidden="true" className="timer-linear-track"><span /></div>
      <small>左から右へ残量が減少中</small>
    </div>
  );
}

function FluentProgressTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("fluent-card", props)}>
      <aside><span>状態</span><strong>{stateText(props.state)}</strong></aside>
      <main>
        <span>残り時間</span>
        <strong>{props.formatted}</strong>
        <small>{percentText(props.remainingMs, props.totalMs)} remaining</small>
      </main>
      <footer><div aria-hidden="true"><span /></div><small>減少中</small></footer>
    </div>
  );
}

function CasioLcdTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("casio-lcd", props)}>
      <div className="timer-lcd-frame">
        <header><span>COUNT DOWN</span><span>{percentText(props.remainingMs, props.totalMs)}</span></header>
        <div className="timer-lcd-screen"><strong>{props.formatted}</strong></div>
        <footer><span>{stateText(props.state)}</span><span>残り時間・減少中</span></footer>
      </div>
    </div>
  );
}

function GarminRadialTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("garmin-radial", props)}>
      <div aria-hidden="true" className="timer-garmin-ticks">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
      <div className="timer-garmin-arc" />
      <div className="timer-garmin-copy">
        <span>{stateText(props.state)}</span>
        <strong>{props.formatted}</strong>
        <small>{percentText(props.remainingMs, props.totalMs)}・減少中</small>
      </div>
    </div>
  );
}

function BraunDialTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("braun-dial", props)}>
      <div aria-hidden="true" className="timer-braun-marks"><i /><i /><i /><i /></div>
      <div className="timer-braun-center">
        <small>残り時間</small>
        <strong>{props.formatted}</strong>
        <span>{stateText(props.state)}</span>
      </div>
      <footer><b>{percentText(props.remainingMs, props.totalMs)}</b><span>時計回りに減少中</span></footer>
    </div>
  );
}

function ChessClockTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("chess-clock", props)}>
      <div aria-hidden="true" className="timer-chess-fill" />
      <header><span>EXAM CLOCK</span><em>{stateText(props.state)}</em></header>
      <strong>{props.formatted}</strong>
      <footer><span>残り {percentText(props.remainingMs, props.totalMs)}</span><span>面が右から減少中</span></footer>
    </div>
  );
}

function PomodoroDiscTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("focus-disc", props)}>
      <div aria-hidden="true" className="timer-focus-disc-fill" />
      <div className="timer-focus-disc-copy">
        <span>残り時間</span>
        <strong>{props.formatted}</strong>
        <small>{stateText(props.state)}</small>
      </div>
      <footer>{percentText(props.remainingMs, props.totalMs)}・円周が減少中</footer>
    </div>
  );
}

function SplitFlapTimer(props: TimerVisualProps) {
  const [minutes, seconds] = props.formatted.split(":");
  return (
    <div {...visualRootProps("split-flap", props)}>
      <header><span>残り時間</span><em>{stateText(props.state)}</em></header>
      <div className="timer-flap-digits" aria-hidden="true">
        {[...minutes].map((digit, index) => <b key={`m-${index}`}>{digit}</b>)}
        <i>:</i>
        {[...seconds].map((digit, index) => <b key={`s-${index}`}>{digit}</b>)}
      </div>
      <span className="timer-flap-readable">{props.formatted}</span>
      <footer>{percentText(props.remainingMs, props.totalMs)}・数字が減少中</footer>
    </div>
  );
}

function RaceTimingTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("race-timing", props)}>
      <header><span>TIME REMAINING</span><em>{stateText(props.state)}</em></header>
      <main><strong>{props.formatted}</strong><b>{percentText(props.remainingMs, props.totalMs)}</b></main>
      <div aria-hidden="true" className="timer-race-sectors">
        {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
      </div>
      <footer>左からセクターが減少中</footer>
    </div>
  );
}

function HourglassGaugeTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("hourglass-gauge", props)}>
      <aside>
        <span>100%</span>
        <div aria-hidden="true" className="timer-hourglass-track"><i /></div>
        <span>0%</span>
      </aside>
      <main>
        <span>残り時間</span>
        <strong>{props.formatted}</strong>
        <b>{stateText(props.state)}</b>
        <small>{percentText(props.remainingMs, props.totalMs)}・上から下へ減少中</small>
      </main>
    </div>
  );
}

function ExamRulerTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("exam-ruler", props)}>
      <div className="timer-ruler-heading"><span>残り時間</span><em>{stateText(props.state)}</em></div>
      <div className="timer-ruler-scale" aria-hidden="true">
        {Array.from({ length: 11 }, (_, index) => <i key={index} />)}
        <b />
      </div>
      <footer><strong>{props.formatted}</strong><span>{percentText(props.remainingMs, props.totalMs)}・右から左へ減少中</span></footer>
    </div>
  );
}

function QuietTextTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("quiet-text", props)}>
      <header><span>残り時間</span><em>{stateText(props.state)}</em></header>
      <strong>{props.formatted}</strong>
      <footer><div aria-hidden="true"><span /></div><small>{percentText(props.remainingMs, props.totalMs)}・減少中</small></footer>
    </div>
  );
}

function LiveActivityTimer(props: TimerVisualProps) {
  return (
    <div {...visualRootProps("live-activity", props)}>
      <div aria-hidden="true" className="timer-live-ring"><i /></div>
      <div className="timer-live-time"><span>残り時間</span><strong>{props.formatted}</strong></div>
      <div className="timer-live-status"><b>{stateText(props.state)}</b><span>{percentText(props.remainingMs, props.totalMs)}・減少中</span></div>
    </div>
  );
}

export const timerVisualCandidates: TimerVisualCandidate[] = [
  { id: "exam-seal", name: "01 Exam Seal Stopwatch", shortName: "検印時計", reference: "現在のStopwatchTimer", intent: "検印を思わせる竜頭付き円形ストップウォッチ", component: ExamSealTimer },
  { id: "apple-ring", name: "02 Apple Progress Ring", shortName: "細円リング", reference: "Apple Progress Indicators", intent: "装飾を抑えた細い円形トラックと中央時間", component: AppleRingTimer },
  { id: "material-linear", name: "03 Material Linear Strip", shortName: "横長バー", reference: "Material Progress", intent: "問題面を圧迫しない横長パネルと下端バー", component: MaterialLinearTimer },
  { id: "fluent-card", name: "04 Fluent Progress Card", shortName: "状態カード", reference: "Fluent Progress Controls", intent: "状態・時間・進捗を境界と余白で分離", component: FluentProgressTimer },
  { id: "casio-lcd", name: "05 Casio LCD", shortName: "LCD機器", reference: "CASIO HS-3C", intent: "等幅数字を機器フレーム内に収めたLCD表示", component: CasioLcdTimer },
  { id: "garmin-radial", name: "06 Garmin Radial Watch", shortName: "目盛時計", reference: "Garmin Timer", intent: "外周目盛りと太い円弧を持つスポーツウォッチ型", component: GarminRadialTimer },
  { id: "braun-dial", name: "07 Braun Minimal Dial", shortName: "最小文字盤", reference: "Braun Clock", intent: "白黒灰と一点アクセントで整理した文字盤", component: BraunDialTimer },
  { id: "chess-clock", name: "08 Chess Clock", shortName: "面残量", reference: "Lichess Clock", intent: "大きな数字と縮む背景面で瞬時に読む時計", component: ChessClockTimer },
  { id: "focus-disc", name: "09 Pomodoro Focus Disc", shortName: "集中円盤", reference: "Focus Timer", intent: "落ち着いた円盤面と中央時間で残量を示す", component: PomodoroDiscTimer },
  { id: "split-flap", name: "10 Split-Flap Digits", shortName: "分割数字", reference: "Splitflap", intent: "各桁を独立パネルへ分けた反転表示板型", component: SplitFlapTimer },
  { id: "race-timing", name: "11 Race Timing Tower", shortName: "セクター", reference: "F1 Live Timing", intent: "高密度パネルとセクター状残量バー", component: RaceTimingTimer },
  { id: "hourglass-gauge", name: "12 Hourglass Gauge", shortName: "縦ゲージ", reference: "物理的な砂時計", intent: "縦方向の残量ゲージと大きな時間を左右分割", component: HourglassGaugeTimer },
  { id: "exam-ruler", name: "13 Exam Margin Ruler", shortName: "紙面定規", reference: "共通テスト問題冊子", intent: "紙面の余白になじむ目盛りと位置マーカー", component: ExamRulerTimer },
  { id: "quiet-text", name: "14 Text-Only Quiet", shortName: "静かな文字", reference: "Accessible minimal", intent: "円・影・アイコンを使わない最小表示", component: QuietTextTimer },
  { id: "live-activity", name: "15 Live Activity Pill", shortName: "小型ピル", reference: "Apple Live Activities", intent: "円形進捗・時間・状態を横一列に圧縮", component: LiveActivityTimer }
];
