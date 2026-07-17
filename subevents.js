// ======================================================
// サブイベント（選手同士の話）
//
// メインストーリーが赤星の話なら、こちらは「その他の全員」の話。
// 2人の関係が3段階で進んでいく。
//
// 起こり方の設計:
//   ・月間イベント（メインストーリー）とも、週間イベント（特殊イベント）とも
//     別枠で判定する。同じ抽選に混ぜると、他に押し出されて一生出ない。
//     特殊戦術の習得で同じ失敗をしたので、最初から分けてある。
//   ・1週に出るのは1つまで。まとめて来ると読み飛ばされる。
//   ・同じ週にメインストーリーとぶつかったら、メインを読んでから出す。
//
// 確率の設計:
//   完走率は、発生率も込みで10%程度。
//   ステップ1が出た後の完走率は30%程度。
//
//   最初は各段に「何週目以降」という条件を置いていたが、それだと失敗した。
//   ステップ1がいつ出るかは運なので、遅く出た年は先に進む週が残らない。
//   実測で完走3%、発生後10%しかなかった。
//   そこで、段の間隔は「前の段から2週あける」だけにして、
//   絶対的な週の条件は物語上どうしても必要なところにしか置かない。
//
//   ステップ1 … 1.3%/週。30週で約33%。
//   ステップ2 … 6%/週。 ステップ1の後の残り週で約55%。
//   ステップ3 … 8%/週。 ステップ2の後の残り週で約55%。
//   → 完走 0.33 × 0.55 × 0.55 ≈ 10%、発生後は約30%。
//   後の段ほど上がるのは、一度動き出した関係は転がるから。
const SUB_RATE = [0.013, 0.06, 0.08];

// 段と段の間は最低これだけあける。
// 続きが翌週に来ると、関係が進んだ感じがしない。
const SUB_COOLDOWN = 2;


// ---- 便利な条件 ---------------------------------------

// 通算の勝利数
function totalWins() {
  return state.history.filter(h => h.win).length;
}

// その選手が1試合で出した最高記録
function careerBest(name, key) {
  let best = 0;
  for (const h of state.history) {
    const box = h.box?.[name];
    if (box && box[key] > best) best = box[key];
  }
  return best;
}

// 部にいるか（退部していないか）
function inClub(name) {
  return Boolean(getPlayer(name));
}


// ---- サブイベント本体 ---------------------------------
//
// steps は3つ。上から順に進む。
//   when()   … その段が起きうる条件
//   text()   … 本文
//   effect() … 効果（無くてもいい。話だけのイベントがあっていい）
const SUB_EVENTS = [
  // --- 三宅 × 灰谷：幼馴染の話 ---
  // このゲームでいちばん長く、いちばん静かな話。効果はほとんど無い。
  // 数字が動かない話があっていいと思う。
  {
    key: "promise",
    title: "いつかの約束",
    cast: ["灰谷 悠"],
    withManager: true,
    steps: [
      {
        when: () => state.week >= 4 && inClub("灰谷 悠"),
        title: "第1話 帰り道",
        text: () => `部活が終わって、家が隣なので、当たり前のように一緒に帰る。
          小学校からずっとそうなので、今さらどちらも何とも思っていない。

          「ゆうちゃん、最近ちょっと上手くなったよね」
          「そうかな」
          「そうだよ。私、記録つけてるから分かるの」

          灰谷は少し笑って、それきり何も言わなかった。
          この人は昔からそうだ。嬉しいときほど、何も言わない。`,
      },
      {
        when: () => inClub("灰谷 悠"),
        title: "第2話 憶えていないふり",
        text: () => `「小3のとき、なんて言ったか憶えてる？」
          唐突に聞かれて、三宅は足を止めた。

          憶えている。近所の公園で、日が暮れるまでシュートを打っていた頃。
          いつか大きい体育館でやるから見に来て、とこの人は言った。
          私は「うん」と言った。それだけの話だ。

          「……憶えてないなあ」と三宅は答えた。
          灰谷は「だよな」と言って、少し笑った。
          ……この人、絶対に気づいてる。`,
      },
      {
        // 最終話だけは冬に置く。「大きい体育館へ行く」話なので。
        when: () => state.week >= 20 && inClub("灰谷 悠"),
        title: "第3話 いつかの約束",
        text: () => `冬の入り口。体育館の窓が白く曇っている。

          「三宅」と、灰谷が名字で呼んだ。珍しかった。
          「大きい体育館、行くから。ちゃんと見に来て」

          10年越しの続きだった。
          言い直した、ということは、この人はずっと憶えていたということだ。

          「……最初から見てるよ、私」
          そう言うのが精一杯だった。`,
        // 10年ぶんの重みは、数字にすると軽くなる。少しだけにする。
        effect: () => {
          const p = getPlayer("灰谷 悠");
          if (!p) return null;
          p.growth.iq = Math.min(1.5, p.growth.iq + 0.15);
          p.growth.tech = Math.min(1.5, p.growth.tech + 0.1);
          return "灰谷 悠 の成長率が上がった（バスケIQ・テクニック）";
        },
      },
    ],
  },

  // --- 白石 × 緑川：言葉のいらない二人 ---
  // 条件は「白石が実際にリバウンドを取ったこと」。
  // 話が数字から始まるので、プレイヤーの行動と噛み合う。
  {
    key: "wall",
    title: "言葉のいらない二人",
    cast: ["白石 大河", "緑川 壮真"],
    steps: [
      {
        when: () => careerBest("白石 大河", "reb") >= 6
          && inClub("白石 大河") && inClub("緑川 壮真"),
        title: "第1話 指",
        text: () => `試合中、緑川が白石の肩を叩いて、黙って指をさした。
          白石は「あっ」と言って、その場所に走った。ボールが落ちてきた。

          ベンチで見ていた三宅は、ノートに書いた。
          「緑川くん、指だけで喋る」`,
      },
      {
        when: () => inClub("白石 大河") && inClub("緑川 壮真"),
        title: "第2話 通訳",
        text: () => `緑川が何か言うと、なぜか白石だけが理解する。
          周りには「……」としか聞こえていない。

          「今、なんて言ったんですか」
          「『もっと前』って」
          そんな長さの音は出ていなかったと思う。`,
        effect: () => {
          const p = getPlayer("白石 大河");
          if (!p) return null;
          p.base.iq = Math.min(100, p.base.iq + 4);
          return "白石 大河 のバスケIQ +4";
        },
      },
      {
        when: () => inClub("白石 大河") && inClub("緑川 壮真"),
        title: "第3話 二枚の壁",
        text: () => `ゴール下に二人が並ぶと、相手が入ってこなくなった。
          誰も声を出していない。ただ、立っている位置が正しい。

          「あの二人、どうやって合わせてるんですか」と紫藤が聞いた。
          分からない。私が見ていても分からない。

          白石が言うには、「なんとなく分かる」らしい。
          緑川に至っては、何も言わなかった。`,
        effect: () => {
          const w = getPlayer("白石 大河");
          const m = getPlayer("緑川 壮真");
          if (!w || !m) return null;
          if (!w.skills.includes("REBOUNDER")) w.skills.push("REBOUNDER");
          m.base.iq = Math.min(100, m.base.iq + 5);
          return "白石 大河 が「リバウンド職人」を習得／緑川 壮真 のバスケIQ +5";
        },
      },
    ],
  },

  // --- 黒田 × 赤星：主将の資格 ---
  // 勝った数が条件。勝つほど話が進む。
  {
    key: "captain",
    title: "背中",
    cast: ["黒田 迅", "赤星 蓮"],
    steps: [
      {
        when: () => totalWins() >= 1 && inClub("黒田 迅"),
        title: "第1話 口じゃなくて",
        text: () => `勝った日の帰り、黒田が赤星に言った。
          「調子に乗るなよ」
          「乗ってません」
          「乗ってる顔だ」

          そう言った黒田のほうが、少しだけ機嫌が良かった。`,
      },
      {
        when: () => totalWins() >= 2 && inClub("黒田 迅"),
        title: "第2話 見ている",
        text: () => `黒田はいつも、赤星の1歩後ろに立っている。
          気づいたのは私だけかもしれない。

          赤星が抜かれたら、必ずそこに黒田がいる。
          赤星は気づいていない。気づかせないようにやっている。

          「なんでそこまでやるんですか」と聞いたら、
          「1年に全部やらせたら、2年の立場がねえだろ」と言われた。`,
        effect: () => {
          const p = getPlayer("黒田 迅");
          if (!p) return null;
          p.base.iq = Math.min(100, p.base.iq + 3);
          p.base.speed = Math.min(100, p.base.speed + 2);
          return "黒田 迅 のバスケIQ +3・スピード +2";
        },
      },
      {
        // 年間の試合数は9前後。9勝を条件にすると全勝が要るので届かない。
        // 4勝でも「勝ち続けたチーム」の話として十分成立する。
        when: () => totalWins() >= 4 && inClub("黒田 迅"),
        title: "第3話 背中",
        text: () => `「お前さ」と黒田が言った。「4月に、ウィンターカップ行くって言ったろ」
          「言いました」
          「あれ、俺は正直、無理だと思ってた」

          少し黙って、黒田は続けた。
          「今は思ってない」

          それだけ言って、先に体育館を出ていった。
          赤星はしばらく、その背中を見ていた。`,
        effect: () => {
          const p = getPlayer("黒田 迅");
          if (!p) return null;
          if (!p.skills.includes("CLUTCH")) p.skills.push("CLUTCH");
          return "黒田 迅 が「勝負強さ」を習得";
        },
      },
    ],
  },

  // --- 青木 × 桃井：才能と努力 ---
  // 青木のシュート力が条件。育てた結果として話が始まる。
  {
    key: "talent",
    title: "才能と、そうでないもの",
    cast: ["青木 樹", "桃井 隼"],
    steps: [
      {
        when: () => {
          const p = getPlayer("青木 樹");
          return p && calcDerived(p, DERIVED_STATS.find(d => d.key === "shoot")) >= 58
            && inClub("桃井 隼");
        },
        title: "第1話 入る人",
        text: () => `桃井が青木のシュートをじっと見ている。
          「なんで入るんですか、それ」
          「知らない。入るから入る」

          いちばん残酷な答えだった。本人に悪気はない。`,
      },
      {
        when: () => inClub("青木 樹") && inClub("桃井 隼"),
        title: "第2話 走る人",
        text: () => `桃井は誰よりも走る。それしかできないからだ、と本人は言う。

          「青木さんは走らないじゃないですか」
          「走らなくても入るからな」
          「……ムカつくなあ」

          その日、桃井は練習後に200本打って帰った。1本も入らなかった。`,
        effect: () => {
          const p = getPlayer("桃井 隼");
          if (!p) return null;
          p.base.tech = Math.min(100, p.base.tech + 3);
          p.fatigue = Math.min(100, p.fatigue + 12);
          return "桃井 隼 のテクニック +3（疲労 +12）";
        },
      },
      {
        when: () => inClub("青木 樹") && inClub("桃井 隼"),
        title: "第3話 教える人",
        text: () => `青木が桃井のフォームを直していた。珍しいこともあるものだ。

          「なんで教えてくれるんですか」
          「うるさいから。毎日200本の音が聞こえてくる」

          しばらくして、青木が小さく付け足した。
          「……あと、俺には走れないから」

          才能のある人が、そうでない人を羨むこともある。
          それを知ったのは、たぶん桃井のほうだった。`,
        effect: () => {
          const a = getPlayer("青木 樹");
          const m = getPlayer("桃井 隼");
          if (!a || !m) return null;
          m.growth.tech = Math.min(1.5, m.growth.tech + 0.2);
          a.base.stamina = Math.min(100, a.base.stamina + 4);
          return "桃井 隼 のテクニック成長率が上がった／青木 樹 のスタミナ +4";
        },
      },
    ],
  },

  // --- 紫藤 × 赤星：二人目のポイントガード ---
  // 同じポジションの、出られない側の話。
  {
    key: "second",
    title: "二人目",
    cast: ["紫藤 圭", "赤星 蓮"],
    steps: [
      {
        when: () => state.week >= 4 && inClub("紫藤 圭"),
        title: "第1話 ノート",
        text: () => `紫藤のノートを見せてもらった。相手校の分析がびっしり書いてある。
          最後のページに、小さく書いてあった。

          「赤星のパス、3歩先」

          分析されている側は、たぶん気づいていない。`,
      },
      {
        when: () => inClub("紫藤 圭") && inClub("赤星 蓮"),
        title: "第2話 同じポジション",
        text: () => `「悔しくないの」と聞いてしまってから、失敗したと思った。

          紫藤は少し考えて、言った。
          「悔しいですよ。でも、あいつのパスを見るの、面白いんです」

          悔しいと面白いは、同時に成立するらしい。
          私はノートにそう書いた。`,
        effect: () => {
          const p = getPlayer("紫藤 圭");
          if (!p) return null;
          p.base.iq = Math.min(100, p.base.iq + 5);
          return "紫藤 圭 のバスケIQ +5";
        },
      },
      {
        when: () => inClub("紫藤 圭") && inClub("赤星 蓮"),
        title: "第3話 二人目",
        text: () => `赤星が紫藤のノートを勝手に読んでいた。

          「これ、俺の弱点も書いてあるじゃないですか」
          「書いてありますよ。毎日見てるので」
          「……教えてくださいよ」
          「言ったら直しちゃうでしょう。それはつまらない」

          紫藤が初めて、赤星に勝った瞬間だったと思う。
          言葉で、だけど。`,
        effect: () => {
          const p = getPlayer("紫藤 圭");
          if (!p) return null;
          if (!p.skills.includes("GENERAL")) p.skills.push("GENERAL");
          return "紫藤 圭 が「司令塔」を習得";
        },
      },
    ],
  },
];


// ---- 進行 ---------------------------------------------

// そのイベントが今どこまで進んでいるか（0 = まだ始まっていない）
function subProgress(key) {
  return state.subs[key] ?? 0;
}

// 前の段から何週たったか。まだ始まっていなければ十分あいている扱い。
function subWaited(key) {
  const last = state.subLast?.[key];
  if (last === undefined) return 99;
  return state.week - last;
}

// 今週、サブイベントが1つ進むか judgeする。
// メインストーリーとも特殊イベントとも別枠。
// 同じ抽選に混ぜると、他に押し出されて一生出なくなる。
function rollSubEvent() {
  // 進められる段を集める
  const ready = [];
  for (const sub of SUB_EVENTS) {
    const done = subProgress(sub.key);
    if (done >= sub.steps.length) continue; // 完走済み

    // 前の段から少し間をあける。翌週に続きが来ると、進んだ感じがしない。
    if (subWaited(sub.key) < SUB_COOLDOWN) continue;

    const step = sub.steps[done];
    if (!step.when()) continue;

    ready.push({ sub, step, index: done });
  }
  if (!ready.length) return null;

  // 1週に出るのは1つまで。まとめて来ると読み飛ばされる。
  // 進んでいる話を優先する。始まった話が放置されるほうが気持ち悪い。
  ready.sort((a, b) => b.index - a.index);

  for (const entry of ready) {
    if (Math.random() >= SUB_RATE[entry.index]) continue;

    state.subs[entry.sub.key] = entry.index + 1;
    if (!state.subLast) state.subLast = {};
    state.subLast[entry.sub.key] = state.week;

    const gained = entry.step.effect ? entry.step.effect() : null;

    return {
      key: entry.sub.key,
      title: entry.sub.title,
      stepTitle: entry.step.title,
      step: entry.index + 1,
      total: entry.sub.steps.length,
      text: entry.step.text(),
      cast: entry.sub.cast,
      withManager: entry.sub.withManager,
      gained,
      finished: entry.index + 1 === entry.sub.steps.length,
    };
  }
  return null;
}
