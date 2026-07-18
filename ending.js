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
    text: () => `夏と冬、両方を獲った。二冠。この部の歴史に、そんな言葉が並ぶ日が来るなんて。
      
      4月、体育館の隅にあったのは、使い古したボールが6つと、8人の部員と、「県大会1回戦敗退」という去年の事実だけだった。それが、全部だった。
      
      「ウィンターカップ、優勝しましょう」
      あの日、そう言った1年生を、誰も笑わなかった。笑う元気もなかった。本気にしていたのは、たぶん本人だけだった。
      
      優勝の瞬間、赤星は真っ先に、人混みの中の黒田を探した。
      黒田は何も言わなかった。ただ、拳を一つ、赤星の前に突き出した。
      赤星がそれに、自分の拳を合わせる。言葉は、いらなかった。それで、足りた。`,
    closing: `……1年間、記録を取り続けて、よかったです。
      二冠なんて、私の手帳の想定を、完全に超えてます。正直、ページが足りませんでした。
      このノート、卒業しても捨てません。……たぶん、私の一生の自慢になるので。`,
  },
  {
    key: "champion_after_loss",
    img: "images/ending_champion.png",
    when: () => state.tournaments.winter === "won" && state.quitter,
    title: "日本一",
    lead: "ウィンターカップ優勝",
    text: () => `ブザーが鳴っても、赤星はコートに突っ立ったまま、動かなかった。
      崩れ落ちる味方の輪の中で、ひとりだけ天井を見上げて、声もなく泣いていた。
      
      日本一の垂れ幕が、ゆっくりと下りてくる。紙吹雪が、照明の光を受けて落ちてくる。
      その向こう、客席のいちばん前に、夏に部を去った桃井 隼が立っていた。私服のまま、少し痩せて。
      
      8人で始まった。夏に、1人減った。減ったまま、7人で、日本一になった。
      欠けたはずの1人は、今日、たしかにここにいる。座って、こっちを見ている。
      
      「……見てましたか」と、赤星が声を出さず、口の形だけで言う。
      桃井 隼が、思い切り、何度も頷いた。泣きそうな顔で、笑っていた。`,
    closing: `あの日、部室に来なかった人のことも、この手帳には、ちゃんと書いてあります。
      書かないと、なかったことになっちゃうので。いた人を、いなかったことには、したくなかったんです。
      ……戻ってきてくれて、よかった。ほんとに。今日のページ、少しにじみました。すみません。`,
  },
  {
    // 誰も欠けずに勝った1年。だから全員でひとつの鉄板を囲める。
    // 泣く絵ではなく、笑っている絵にしているのはそのため。
    key: "champion",
    img: "images/ending_uchiage.png",
    when: () => state.tournaments.winter === "won",
    title: "日本一",
    lead: "ウィンターカップ優勝",
    text: () => `優勝から3時間後。駅前の、古いお好み焼き屋の座敷。
      
      日本一になった実感なんて、まだ誰にもない。
      白石が、もう5枚目を焼こうとしていて、桃井が「食べてから! 食べてから焼いて!」と必死に止めていて、緑川が何も言わずに、6枚目の生地を淡々とひっくり返している。
      青木は寝転がってラムネを飲み、灰谷が困り笑いで皿を配り、紫藤はなぜかレシートで店の回転率を計算していた。分析癖は、日本一になっても直らないらしい。
      
      優勝トロフィーは、座敷の隅に、無造作に置きっぱなしだ。誰も見ていない。今この瞬間だけは、お好み焼きのほうが、日本一より大事だった。
      
      「お前ら。……日本一だぞ、いちおう」と黒田が言った。
      「知ってますよ」と、赤星がソースまみれの顔で答えた。
      
      8ヶ月前、この店に、みんなで来る理由なんて、何一つなかった。`,
    closing: `写真、100枚くらい撮りました。
      ……1枚も、使えないです。全員ぶれてるか、口にソースついてるかの、どっちかなので。
      ノートの今日のページ、一行だけ書きました。「みんな、本当によく食べた。会計、監督持ち」`,
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
    text: () => `決勝で、負けた。あと一歩だった。その一歩が、どうしても遠かった。
      
      表彰式の銀メダルを、赤星は最後まで首にかけなかった。ぎゅっと握りしめたまま、無人になっていくコートを、ずっと見ていた。
      この悔しさは、たぶん一生消えない。
      ただ——4月に、この決勝の景色を想像できた者は、この部に、一人もいなかった。届かなかった。けれど、届くところまでは、来たのだ。
      
      「来年」と灰谷が、隣で静かに言った。
      「来年です」と赤星が返した。まだあどけない、1年生の返事だった。来年がある。それだけが、今は救いだった。`,
    closing: `負けたんですけど、……なんでしょうね。
      みんな、悪くない顔してるんですよ。負けた直後なのに。
      私、こういう顔は初めて見ました。だから、ちゃんと書いておきます。……来年、また、続きを書きます。`,
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
    text: () => `冬が、終わった。
      日本一には、なれなかった。あの日、体育館の壁に貼った場所には、届かなかった。
      
      それでも、思い出してほしい。4月、この部にあったのは、空気の抜けたボール6つと、諦めきった重い空気だけだった。
      今、この体育館には、8ヶ月ぶんの何かが、確かに残っている。それは、点数にも順位にも出ないものだ。
      
      それに、赤星はまだ1年生だ。来年がある。再来年もある。
      「まだ、あと2回あります」と、あいつは平気な顔で言った。悔しいくせに、もう前を向いている。
      ……本当に、口だけは達者な男だ。4月から、そこだけは何も変わらない。`,
    closing: `終わりました。……いえ、終わってないのか。
      この手帳、まだ半分も埋まってません。だって、まだ途中じゃないですか。この人たち。
      続きは、来年のノートに書きます。新しいの、もう買ってあります。`,
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
