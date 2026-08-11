import type { AuthoringMeta } from "../types";
import animeFigure01 from "../assets/exams/anime-onlymark-2026/crops/page-01-figures.jpg";
import animeFigure04 from "../assets/exams/anime-onlymark-2026/crops/page-04-figure.jpg";
import animeFigure05 from "../assets/exams/anime-onlymark-2026/crops/page-05-figures.jpg";
import animeFigure06 from "../assets/exams/anime-onlymark-2026/crops/page-06-figure.jpg";
import animeFigure07 from "../assets/exams/anime-onlymark-2026/crops/page-07-figure.jpg";
import animeFigure09 from "../assets/exams/anime-onlymark-2026/crops/page-09-figures.jpg";
import animeFigure10 from "../assets/exams/anime-onlymark-2026/crops/page-10-figure.jpg";

export const defaultAuthoringMeta: AuthoringMeta = {
  title: "漫画映画",
  subject: "漫画映画",
  description: "漫画・映画に関する題材を共通テスト形式で解くサンプル問題冊子。",
  questionCount: 21,
  totalPoints: 100,
  durationMinutes: 40
};

export const defaultEnvironmentSource = String.raw`\usepackage[inner=0.9in,outer=0.9in,top=80pt,bottom=0.76in]{geometry}
\usepackage{adjustbox,tcolorbox,ulem,soul,setspace,letterspace,subfig,ifthen,multicol,tabularx,booktabs,enumitem,relsize,mathtools,mathcomp,siunitx,pifont,graphicx,caption,fancyhdr,titlesec,parskip,array,transparent,changepage}
\graphicspath{{Images/}}
\captionsetup{justification=raggedright,singlelinecheck=false,font=scriptsize}
\definecolor{beige}{RGB}{252,252,252}
\pagecolor{beige}
\linespread{1.5}
\setmainfont[Scale=1.1]{Times New Roman}
\setmainjfont[Scale=1.0,Weight=2,Renderer=Harfbuzz,LetterSpace=11]{Hiragino Mincho ProN}
\setsansjfont{Hiragino Kaku Gothic ProN W3}
\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\newgeometry{inner=0.9in,outer=0.9in,top=50pt,bottom=0.76in}`;

export const defaultCoverSource = String.raw`\item 解答用紙に正しくマークされていない場合は, 採点されないことがあります。
\item この問題冊子は, 全14ページで構成されています。問題は第1問から第9問まであり, 一部の問題には小問が含まれます。配点は各問題ごとに明記されています。
\item 試験中に問題冊子の印刷不鮮明，ページの落丁・乱丁及び問題の不備等に気付いた場合は教えてください。
\item 解答は，各問題にある所定の記号をクリックまたはタップをしマークしなさい。
\item 試験中の他のウェブサイトおよび書籍等の閲覧は禁止します。
\item 試験終了後, 問題冊子は持ち帰りなさい。`;

export const defaultAuthoringSource = String.raw`\examtitle{漫画映画}
\sectiontitle{第1問}
以下の連立方程式において, 各式 ① から ③ がそれぞれ画像 I から III に示されたアニメの名称の一部を表している。
このとき, 式 \(n_d\:g'' atf-\) が表すアニメの名称として最も適当なものを選べ。
$$\left\{\begin{aligned} y-x_n&=ci \\ fg''&=c \\ pb\times abq^\circ&={}_d t \end{aligned}\right.$$
\includegraphics[width=0.86\linewidth]{${animeFigure01}}
\mark[answer=1,points=10,choices=4]{1}
\choice{1}{1}{オッドタクシー}
\choice{1}{2}{おねがい☆ティーチャー}
\choice{1}{3}{オーバーロード}
\choice{1}{4}{【推しの子】}

\sectiontitle{第2問}
暗殺教室に関する次の問いに答えよ。
\subsectiontitle{問1}
第2期第十二話において, 赤羽業と浅野学秀が学期末テストで対決した。
その勝敗を分けることとなったこの試験の最終問題として最も適当なものを選べ。
\mark[answer=3,points=4,choices=4]{2}
\choice{2}{1}{実数上の非負値可測関数に関する極限等式の証明}
\choice{2}{2}{食塩水の濃度計算}
\choice{2}{3}{体心立方格子構造の領域体積}
\choice{2}{4}{放物線と面積二等分線}
\subsectiontitle{問2}
第2期第四話において登場人物同士がコードネームで呼び合う場面について, A から D に示す登場人物の本名に対応するコードネームを選べ。
\includegraphics[width=0.58\linewidth]{${animeFigure04}}
\mark[answer=4,points=2,choices=9]{3}
\choice{3}{1}{野球バカ}
\choice{3}{2}{鷹岡もどき}
\choice{3}{3}{コロコロ上がり}
\choice{3}{4}{中二半}
\choice{3}{5}{すごいサル}
\choice{3}{6}{女たらしクソ野郎}
\choice{3}{7}{性別}
\choice{3}{8}{ホームベース}
\choice{3}{9}{変態終末期}
\mark[answer=7,points=2,choices=9]{4}
\choice{4}{1}{野球バカ}
\choice{4}{2}{鷹岡もどき}
\choice{4}{3}{コロコロ上がり}
\choice{4}{4}{中二半}
\choice{4}{5}{すごいサル}
\choice{4}{6}{女たらしクソ野郎}
\choice{4}{7}{性別}
\choice{4}{8}{ホームベース}
\choice{4}{9}{変態終末期}
\mark[answer=2,points=2,choices=9]{5}
\choice{5}{1}{野球バカ}
\choice{5}{2}{鷹岡もどき}
\choice{5}{3}{コロコロ上がり}
\choice{5}{4}{中二半}
\choice{5}{5}{すごいサル}
\choice{5}{6}{女たらしクソ野郎}
\choice{5}{7}{性別}
\choice{5}{8}{ホームベース}
\choice{5}{9}{変態終末期}
\mark[answer=8,points=2,choices=9]{6}
\choice{6}{1}{野球バカ}
\choice{6}{2}{鷹岡もどき}
\choice{6}{3}{コロコロ上がり}
\choice{6}{4}{中二半}
\choice{6}{5}{すごいサル}
\choice{6}{6}{女たらしクソ野郎}
\choice{6}{7}{性別}
\choice{6}{8}{ホームベース}
\choice{6}{9}{変態終末期}

\sectiontitle{第3問}
以下のグラフおよび図は, あるアニメに関するものである。
これらの内容に基づいて \(X\) に入る最も適当な記号を選べ。
\includegraphics[width=0.88\linewidth]{${animeFigure05}}
\mark[answer=3,points=10,choices=5]{7}
\choice{7}{1}{\(\Omega\)}
\choice{7}{2}{\(\alpha\)}
\choice{7}{3}{\(\beta\)}
\choice{7}{4}{\(\gamma\)}
\choice{7}{5}{\(\delta\)}

\sectiontitle{第4問}
集合に関する以下の問いに答えよ。
\subsectiontitle{問1}
ベン図が与えられたとき, 要素 I から III の分類として最も適当なものを選べ。
I: 綾小路清隆, II: 竈門禰豆子, III: 御坂美琴。
\includegraphics[width=0.88\linewidth]{${animeFigure06}}
\mark[answer=6,points=7,choices=8]{8}
\choice{8}{1}{AAA}
\choice{8}{2}{AAĀ}
\choice{8}{3}{AĀA}
\choice{8}{4}{AĀĀ}
\choice{8}{5}{ĀAA}
\choice{8}{6}{ĀAĀ}
\choice{8}{7}{ĀĀA}
\choice{8}{8}{ĀĀĀ}
\subsectiontitle{問2}
ベン図が与えられたとき, 要素 I から III の分類として最も適当なものを選べ。
I: 椎名真昼, II: 西森柚咲, III: 楪いのり。
\includegraphics[width=0.86\linewidth]{${animeFigure07}}
\mark[answer=4,points=3,choices=4]{9}
\choice{9}{1}{A∩B}
\choice{9}{2}{Ā∩B}
\choice{9}{3}{A∩B̄}
\choice{9}{4}{Ā∩B̄}
\mark[answer=2,points=3,choices=4]{10}
\choice{10}{1}{A∩B}
\choice{10}{2}{Ā∩B}
\choice{10}{3}{A∩B̄}
\choice{10}{4}{Ā∩B̄}
\mark[answer=1,points=3,choices=4]{11}
\choice{11}{1}{A∩B}
\choice{11}{2}{Ā∩B}
\choice{11}{3}{A∩B̄}
\choice{11}{4}{Ā∩B̄}

\sectiontitle{第5問}
以下の問1から問3の下線部の漢字に相当する読みとして最も適当なものを選べ。
問1: 『水素爆弾』の直撃にも堪えた序列第六位「天翼種」。
\mark[answer=3,points=3,choices=3]{12}
\choice{12}{1}{イマニティ}
\choice{12}{2}{フリューゲル}
\choice{12}{3}{ファンタズマ}
問2: 「智慧之王」の声に従い暴食之王を起動。
\mark[answer=3,points=3,choices=3]{13}
\choice{13}{1}{ラファエル}
\choice{13}{2}{メタトロン}
\choice{13}{3}{ガブリエル}
問3: 「超能力者」用の付帯施設は学校敷地内にまとまっているとは限らない。
\mark[answer=2,points=4,choices=3]{14}
\choice{14}{1}{レベル1}
\choice{14}{2}{レベル5}
\choice{14}{3}{レベル6}

\sectiontitle{第6問}
画像 I から VI について関係式「I < II = III < IV < V << VI」が成り立っているとき, A と B, C と D に当てはまる記号として最も適当なものを選べ。
\includegraphics[width=0.86\linewidth]{${animeFigure09}}
\mark[answer=1,points=5,choices=3]{15}
\choice{15}{1}{<}
\choice{15}{2}{=}
\choice{15}{3}{>}
\mark[answer=2,points=5,choices=3]{16}
\choice{16}{1}{<}
\choice{16}{2}{=}
\choice{16}{3}{>}

\sectiontitle{第7問}
以下の文章は, あるアニメに関する口コミである。この内容に該当するアニメとして最も適当なものを選べ。
長ゼリフや会話劇, 妖怪のような存在に苦しめられる少女達, 独特な作画や演出に言及した複数の口コミが示されている。
\includegraphics[width=0.86\linewidth]{${animeFigure10}}
\mark[answer=1,points=10,choices=4]{17}
\choice{17}{1}{化物語}
\choice{17}{2}{虚構推理}
\choice{17}{3}{呪術廻戦}
\choice{17}{4}{モブサイコ100}

\sectiontitle{第8問}
以下の英文は, 英語版 Wikipedia にも掲載されているアニメに関する単語の説明である。
問1, 問2, 問3の説明が意味する単語を選べ。
問1: A genre of science or fantasy fiction featuring a protagonist who is transported to or reincarnated in a different, strange, or unfamiliar world.
\mark[answer=2,points=4,choices=4]{18}
\choice{18}{1}{historical}
\choice{18}{2}{isekai}
\choice{18}{3}{post-apocalyptic}
\choice{18}{4}{supernatural}
問2: A genre in Japanese anime and manga focuses on romantic or deeply emotional relationships between female characters.
\mark[answer=4,points=4,choices=4]{19}
\choice{19}{1}{catgirl}
\choice{19}{2}{romcom}
\choice{19}{3}{shojo}
\choice{19}{4}{yuri}
問3: A type of self-published work, often in manga or novel format, created by independent artists or groups.
\mark[answer=2,points=4,choices=4]{20}
\choice{20}{1}{comiket}
\choice{20}{2}{doujinshi}
\choice{20}{3}{lightnovel}
\choice{20}{4}{manga}

\sectiontitle{第9問}
以下は「ノーゲーム・ノーライフ」に登場するあるゲームが行われている場面を描いたものである。
空欄に当てはまる単語として最も適当なものを選べ。
Sora and dreadless Siro overwhelmed driven native executing gods since enemies ___ feeblish humanity.
\mark[answer=3,points=10,choices=4]{21}
\choice{21}{1}{despise}
\choice{21}{2}{overcome}
\choice{21}{3}{scoff}
\choice{21}{4}{underestimate}
`;

