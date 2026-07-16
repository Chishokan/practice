// ======================================================
// エンディング
//
// ウィンターカップが終わった瞬間に、1枚絵とともに流れる。
// 分岐は「何を成し遂げたか」だけでなく「何を失ったか」も見る。
// 夏に部員が去ったチームと、そうでないチームでは、
// 同じ優勝でも意味が違うため。
//
// 画像は images/ に置く（画像プロンプト.md 参照）。
// 無ければ文章だけが出る。
// ======================================================

// 上から順に when() を試し、最初に当たったものを流す。
// 条件の厳しいものを上に置くこと。
const ENDINGS = [
  {
    key: "double",
    img: "images/ending_double.png",
    when: () => state.tournaments.national === "won" && state.tournaments.winter === "won",
    title: "二冠",
    lead: "インターハイ優勝・ウィンターカップ優勝",
    text: () => `夏と冬、両方を獲った。

      4月、体育館の隅にあったのは使い古したボールが6つと、8人の部員と、
      去年の県大会1回戦敗退という事実だけだった。

      「ウィンターカップ、行きましょう」

      誰も笑わなかった。誰も頷きもしなかった。
      あの日、あの言葉を本気にしていたのは、たぶん本人だけだった。

      優勝の瞬間、赤星は真っ先に黒田を探した。
      黒田は何も言わず、ただ拳を突き出した。それで足りた。`,
    closing: `……1年間、記録を取り続けてよかったです。
      このノート、卒業しても捨てません。`,
  },
  {
    key: "champion_after_loss",
    img: "images/ending_champion.png",
    when: () => state.tournaments.winter === "won" && state.quitter,
    title: "日本一",
    lead: "ウィンターカップ優勝",
    text: () => `ブザーが鳴っても、赤星はコートに突っ立ったまま動かなかった。
      崩れ落ちる味方の中で、ひとりだけ天井を見上げて泣いていた。

      日本一の垂れ幕が下りてくる。紙吹雪が落ちてくる。
      その向こう、客席のいちばん前に、夏に部を去った${state.quitter.name}が立っていた。

      8人で始まった。夏に1人減った。減ったまま、日本一になった。
      欠けた1人は、今日ここにいる。座って、見ている。

      「見てましたか」と赤星が口の形だけで言う。
      ${state.quitter.name}が、思い切り頷いた。`,
    closing: `${"あの日"}、部室に来なかった人のことも、ちゃんと書いてあります。
      書かないと、なかったことになるので。……来てくれて、よかったです。`,
  },
  {
    // 誰も欠けずに勝った1年。だから全員でひとつの鉄板を囲める。
    // 泣く絵ではなく、笑っている絵にしているのはそのため。
    key: "champion",
    img: "images/ending_uchiage.png",
    when: () => state.tournaments.winter === "won",
    title: "日本一",
    lead: "ウィンターカップ優勝",
    text: () => `優勝から3時間後、駅前のお好み焼き屋。

      日本一になった実感は、まだ誰にもない。
      白石が5枚目を焼いていて、桃井が必死に止めようとしていて、
      緑川が何も言わずに6枚目の生地をひっくり返していた。

      優勝トロフィーは、座敷の隅に無造作に置かれている。
      誰も見ていない。今はお好み焼きのほうが大事だった。

      「お前ら、日本一だぞ」と黒田が言った。
      「知ってます」と赤星がソースまみれの顔で答えた。

      8ヶ月前、この店に来る理由なんて何もなかった。`,
    closing: `写真、100枚くらい撮りました。
      1枚も使えないです。全員ぶれてるので。
      ……ノートの今日のページ、一行だけ書きました。「みんな、よく食べた」`,
  },
  {
    key: "final",
    img: "images/ending_final.png",
    when: () => {
      // 決勝まで行って負けた（＝3勝している）
      const games = state.history.filter(h => h.kind === "winter");
      return state.tournaments.winter === "lost" && games.filter(h => h.win).length >= 3;
    },
    title: "あと一歩",
    lead: "ウィンターカップ 準優勝",
    text: () => `決勝で負けた。

      表彰式の銀メダルを、赤星は最後まで首にかけなかった。
      握りしめたまま、コートを見ていた。

      悔しさは、たぶん一生消えない。
      ただ、4月にこの光景を想像できた者は、この部に一人もいなかった。

      「来年」と灰谷が言った。
      「来年です」と赤星が返した。1年生の返事だった。`,
    closing: `負けたんですけど、なんでしょうね。
      悪くない顔してるんですよ、みんな。……来年、また書きます。`,
  },
  {
    key: "journey",
    img: "images/ending_journey.png",
    when: () => true,
    title: "終わらない",
    lead: () => {
      const wins = state.history.filter(h => h.kind === "winter" && h.win).length;
      return `ウィンターカップ ${wins > 0 ? `${wins}回戦突破` : "1回戦敗退"}`;
    },
    text: () => `冬が終わった。

      日本一にはなれなかった。宣言した場所には、届かなかった。

      それでも4月、この部にあったのはボール6つと、諦めきった空気だけだった。
      今、体育館には8ヶ月ぶんの何かが確かに残っている。

      赤星はまだ1年生だ。来年がある。再来年もある。
      「まだ2回あります」と、あいつは平気な顔で言った。

      ……本当に、口だけは達者な男だ。`,
    closing: `終わりました。
      でも、この手帳はまだ続きます。だって、まだ途中じゃないですか。`,
  },
];

function pickEnding() {
  return ENDINGS.find(e => e.when());
}


// ---- 画面 ---------------------------------------------

function openEnding() {
  const ending = pickEnding();
  if (!ending) return;

  const panel = document.getElementById("ending-panel");
  const lead = typeof ending.lead === "function" ? ending.lead() : ending.lead;

  // チームの1年間の記録
  const record = countRecord();
  const top = players.slice().sort((a, b) => b.career.pts - a.career.pts)[0];

  panel.innerHTML = `
    <div class="ending-art">
      <img src="${ending.img}" alt="${ending.title}" onerror="this.parentElement.classList.add('no-art')">
      <div class="ending-overlay-text">
        <div class="ending-lead">${lead}</div>
        <div class="ending-title">${ending.title}</div>
      </div>
    </div>

    <div class="ending-body">
      <div class="story-text ending-text">${ending.text()}</div>

      <div class="ending-stats">
        <div class="ending-stat">
          <span class="ending-stat-label">通算</span>
          <span class="ending-stat-value">${record.wins}勝 ${record.loses}敗</span>
        </div>
        <div class="ending-stat">
          <span class="ending-stat-label">県大会</span>
          <span class="ending-stat-value">${resultLabel(state.tournaments.kengun)}</span>
        </div>
        <div class="ending-stat">
          <span class="ending-stat-label">全国</span>
          <span class="ending-stat-value">${resultLabel(state.tournaments.national)}</span>
        </div>
        <div class="ending-stat">
          <span class="ending-stat-label">最多得点</span>
          <span class="ending-stat-value">${top ? `${top.name} ${top.career.pts}点` : "—"}</span>
        </div>
      </div>

      <div class="manager-intro ending-closing">
        <div class="portrait mid">
          <span class="portrait-initial">三</span>
          <img src="${MANAGER.img}" alt="${MANAGER.name}" onerror="this.style.display='none'">
        </div>
        <div class="intro-bubble">
          <div class="intro-name">${MANAGER.name}</div>
          <div class="intro-text">${ending.closing}</div>
        </div>
      </div>

      <div class="ending-cast">
        ${players.map(p => portraitByName(p.name, "mid", p.name)).join("")}
        ${state.quitter ? portraitByName(state.quitter.name, "mid", `${state.quitter.name}（夏に退部）`) : ""}
      </div>

      <button class="next-btn" id="ending-close">記録を見る</button>
    </div>`;

  document.getElementById("ending-overlay").classList.remove("hidden");
  document.getElementById("ending-close").addEventListener("click", () => {
    document.getElementById("ending-overlay").classList.add("hidden");
    openHistory();
  });
}

function resultLabel(result) {
  if (result === "won") return "優勝";
  if (result === "lost") return "敗退";
  if (result === "skipped") return "不出場";
  return "—";
}


// ---- 確認用 -------------------------------------------
//
// エンディングは12月まで進めないと見られない。
// 絵や文章を直すたびに36週プレイするのは現実的でないので、
// ブラウザのアドレスに ?ending=champion と付けたら
// そのエンディングだけを表示できるようにしておく。
//
//   index.html?ending=double
//   index.html?ending=champion
//   index.html?ending=champion_after_loss
//   index.html?ending=final
//   index.html?ending=journey
function previewEnding() {
  const key = new URLSearchParams(location.search).get("ending");
  if (!key) return;

  const target = ENDINGS.find(e => e.key === key);
  if (!target) return;

  // その結末になる状況を、無理やり作る
  if (key === "double") state.tournaments = { national: "won", winter: "won" };
  if (key === "champion") { state.tournaments = { winter: "won" }; state.quitter = null; }
  if (key === "champion_after_loss") {
    state.tournaments = { winter: "won" };
    state.quitter = { name: "桃井 隼", pos: "SG", year: 1 };
  }
  if (key === "final") {
    state.tournaments = { winter: "lost" };
    state.history = [
      { kind: "winter", win: true }, { kind: "winter", win: true },
      { kind: "winter", win: true }, { kind: "winter", win: false },
    ];
  }
  if (key === "journey") {
    state.tournaments = { winter: "lost" };
    state.history = [{ kind: "winter", win: false }];
  }

  openEnding();
}
