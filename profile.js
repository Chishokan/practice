// ======================================================
// 選手詳細ページ（マネージャーの手帳）
//
// 性格は「明るい」「努力家」のようには書かない。
// マネージャーが見た一場面だけを書いて、読む人が勝手に想像する。
// 「努力家です」より「体育館の鍵、いつも最後に返すのこの人です」のほうが、
// その選手のことが伝わる。
//
// notes は上から順に when() を試し、当てはまったものを全部並べる。
// 育て方・選択・大会結果で中身が変わるので、同じ選手でも
// プレイヤーによって手帳の内容が違う。
// ======================================================

const MANAGER = {
  name: "三宅 詩織",
  year: 2,
  img: "images/miyake.png",
  profile: `2年。記録魔。選手の練習量を全部ノートに取っている。
    人を観察するのが好きで、本人が気づいていないことに、いちばん先に気づく。`,
};

// マネージャーが選手をどう呼ぶか。
// 基本は君付け。灰谷だけは家が隣の幼馴染なので、昔のまま。
const NICKNAMES = {
  "灰谷 悠": "ゆうちゃん",
};

function callName(player) {
  if (NICKNAMES[player.name]) return NICKNAMES[player.name];
  return `${player.name.split(" ")[0]}くん`; // 苗字＋くん
}


// 手帳が参照する小道具
function played(player) {
  return player.career.min > 0;
}

function isStarter(player) {
  const sorted = players.slice().sort((a, b) => calcOvr(b) - calcOvr(a));
  return sorted.slice(0, 5).includes(player);
}

function derivedOf(player, key) {
  return calcDerived(player, DERIVED_STATS.find(d => d.key === key));
}


// ---- 選手ごとの手帳 -----------------------------------
// core  : いつでも出る、その選手の芯
// notes : 条件に当てはまったときだけ出る
const PROFILES = {
  "赤星 蓮": {
    core: `入部初日に「ウィンターカップ行きましょう」って言った子です。
      正直、みんな引いてました。私も引きました。
      でもあの日から、朝いちばんに体育館の鍵を開けてるのは赤星くんです。
      言っちゃった以上やらなきゃ、って思ってるんだと思います。`,
    notes: [
      {
        when: () => state.choicesMade.captain === "akaboshi",
        text: `1年生なのに2年の先輩へ指示を出してます。見ててハラハラします。
          でも先輩たち、ちゃんと聞くんですよね。それがまた、すごいというか。`,
      },
      {
        when: () => state.choicesMade.captain === "kuroda",
        text: `主将は黒田くんなんですけど、コートで声を出してる回数は赤星くんのほうが多いかも。
          黒田くんは何も言いません。たぶん、分かっててやらせてます。`,
      },
      {
        when: () => state.choicesMade.usage === "ace",
        text: `最近、苦しい場面のボールは全部赤星くんに行きます。
          重くないのかな、って思うんですけど……たぶん、嬉しいんだと思います。あの顔は。`,
      },
      {
        when: () => state.choicesMade.usage === "general",
        text: `パス、見てて気持ちいいですよ。味方が走る先に、もう置いてあるんです。
          「なんで分かるの」って聞いたら「見えるから」って。`,
      },
      {
        when: p => p.base.power < 50,
        text: `体、細いんですよね。当たられると普通に飛ばされます。
          本人は絶対に認めませんけど。`,
      },
      {
        when: p => p.base.power >= 65,
        text: `4月の頃、当たり負けして転がってたのが嘘みたいです。
          いつの間に、こんな体になったんだろう。`,
      },
      {
        when: () => state.tournaments.kengun === "lost",
        text: `県大会で負けた日、ひとりで体育館に残ってシュートを打ってました。
          声、かけられませんでした。`,
      },
      {
        when: () => state.week >= 32,
        text: `4月にあの台詞を聞いたとき、誰も笑わなかったけど、誰も本気にしてなかったんです。
          ……今は、みんな本気にしてます。`,
      },
    ],
  },

  "紫藤 圭": {
    core: `ノートを取ってます。私より詳しいです、うちのチームのこと。
      相手校の分析も勝手にやってて、監督がこっそり参考にしてます。`,
    notes: [
      {
        when: p => !played(p) && state.week >= 12,
        text: `試合、まだ出てないんです。
          何も言いませんけど、紫藤くんのノートだけがどんどん厚くなってます。`,
      },
      {
        when: p => played(p),
        text: `初めて試合に出た日、手が震えてました。
          コートに入ったら普通の顔をしてたので、あれは私しか見てないと思います。`,
      },
      {
        when: p => isStarter(p),
        text: `いつの間にか、控えじゃなくなってました。
          「頭がいいだけじゃ勝てない」って本人が言ってたの、まだ半年前です。`,
      },
    ],
  },

  "青木 樹": {
    core: `シュート練習だけは誰にも譲りません。
      体育館の鍵を返しに来るの、いつも青木くんです。赤星くんが開けて、青木くんが閉める。`,
    notes: [
      {
        when: p => derivedOf(p, "defense") < 50,
        text: `守りの話になると急に静かになります。
          分かってはいるみたいです。分かってはいるんですけど。`,
      },
      {
        when: p => derivedOf(p, "defense") >= 60,
        text: `この前、守備練習を自分から居残ってやってました。
          「らしくないですね」って言ったら、めちゃくちゃ怒られました。`,
      },
      {
        when: p => p.career.pts >= 60,
        text: `点が入り出すと止まらないんです。ベンチがいちばん驚いてます。`,
      },
    ],
  },

  "桃井 隼": {
    core: `走ってます。いつ見ても走ってます。
      「疲れないの」って聞いたら「疲れますよ」って。走るのはやめないんですけど。`,
    notes: [
      {
        when: p => p.base.stamina >= 85,
        text: `もう誰も、桃井くんに走り勝てません。
          練習後にひとりでダッシュしてるのを見て、ちょっと引きました。`,
      },
      {
        when: p => !played(p) && state.week >= 16,
        text: `出番、ないんですよね。あんなに走ってるのに。
          最近、練習中の声が小さくなった気がします。`,
      },
    ],
  },

  "黒田 迅": {
    core: `口は悪いです。「口じゃなくて足でやれ」が口癖です。
      でも、いちばんチームのことを考えてるのはたぶん黒田くんです。たぶん、ですけど。`,
    notes: [
      {
        when: () => state.choicesMade.captain === "kuroda",
        text: `主将になってから口数が減りました。
          代わりに、来るのが早くなりました。赤星くんの次に早いです。`,
      },
      {
        when: () => state.choicesMade.captain === "akaboshi",
        text: `1年が主将に決まった日、黒田くんだけ「妥当だろ」って言ってました。
          あとで聞いたら、監督に推したのこの人らしいです。本人は否定しますけど。`,
      },
      {
        when: p => p.injuryCount === 0 && state.week >= 20,
        text: `一度もケガしてないの、黒田くんだけです。
          「頑丈なのも才能だ」って自分で言ってました。たしかに。`,
      },
    ],
  },

  // 幼馴染。ここだけ、書いている人の距離が違う。
  "灰谷 悠": {
    core: `ゆうちゃんは、地味って言われるのを気にしてます。幼稚園の頃からそうでした。
      家が隣なので、私はこの人が昔から何も変わってないのを知ってます。
      でも、ゆうちゃんが出てる試合ってなぜか崩れないんですよ。昔から、そういう子なんです。`,
    notes: [
      {
        when: p => played(p) && p.career.games >= 3,
        text: `スタッツに出ないんです、ゆうちゃんの仕事。
          でも監督が最後まで残すのは、だいたいこの人です。`,
      },
      {
        when: () => state.week >= 28,
        text: `「俺、来年もいるんで」って言ってました。
          ……2年生ですもんね。そうか、まだ来年があるのか。
          こういうこと言うから、この人ずるいんです。`,
      },
      {
        when: p => p.fatigue > 60,
        text: `疲れてるのに「大丈夫」って言うところ、昔から変わってません。
          小2のとき熱があるのに公園でずっと遊んでて、次の日に倒れた人です。`,
      },
    ],
  },

  "鷲尾 陣": {
    core: `転校初日に「ここでやりたくて来ました」って言ったんです。
      かっこよくないですか？ 本人は真顔でしたけど。`,
    notes: [
      {
        when: () => state.tournaments.national === "lost",
        text: `全国での試合、客席で見てたそうです。
          「負けてたけど、あの1年の目が良かった」って言ってました。赤星くんのことです。`,
      },
      {
        when: p => p.career.games >= 2,
        text: `もう何年もいるみたいな顔で馴染んでます。
          緑川くんと二人で黙々とリバウンド練習してるの、なんだか良いです。`,
      },
    ],
  },

  "白石 大河": {
    core: `跳びます。びっくりするくらい跳びます。
      そのかわり、それ以外は何も分かってません。
      この前、試合中に自陣のゴールに走っていきました。本気で。`,
    notes: [
      {
        when: p => p.base.iq < 35,
        text: `作戦ボード見ながら、ずっと首をかしげてます。
          緑川くんが横で指をさして教えてました。あの二人、会話してるんですかね。`,
      },
      {
        when: p => p.base.jump >= 85,
        text: `もう誰も競り合えません。リングの上から手が出てきます。
          相手チームが白石くんを見て「え」って言うの、何回か見ました。`,
      },
      {
        when: p => p.injuryCount >= 2,
        text: `また離脱です。もう何度目か、数えるのをやめました。
          痛いって言わないんですよ、白石くん。だから気づくのが遅れるんです。`,
      },
      {
        when: p => p.base.tech >= 55,
        text: `あんなに不器用だったのに、最近シュートが入るようになりました。
          誰も褒めないので、私だけ褒めてます。`,
      },
      {
        when: p => p.base.tech < 40 && state.week >= 16,
        text: `シュートは、まあ、うん。
          リバウンドは誰にも負けないので、それでいいと思います。`,
      },
    ],
  },

  "緑川 壮真": {
    core: `喋りません。ほんとうに喋りません。
      跳びません。走れません。それなのに、誰もあの人の前を通れないんです。
      なんでですか、って聞いたら「来る場所が分かる」とだけ言われました。`,
    notes: [
      {
        when: () => state.storySeen.includes(8),
        text: `県大会の前に一度だけ「やるしかない」って言ったの、たぶん全員が覚えてます。
          この1年で聞いた中で、いちばん長い台詞かもしれません。`,
      },
      {
        when: p => p.career.reb >= 30,
        text: `ゴール下、緑川くんがいるだけで相手が入ってこなくなります。
          何もしてないように見えて、いちばん仕事してます。`,
      },
      {
        when: p => p.base.iq >= 70,
        text: `最近、味方の位置まで指で直すようになりました。喋らないまま。
          白石くんだけは、なぜかそれで通じてます。`,
      },
      {
        when: p => p.injuryCount === 0 && state.week >= 24,
        text: `一度も休んでません。一度も。
          この人がいなくなったらどうなるんだろう、って考えるのが怖いです。`,
      },
    ],
  },
};


// ---- 手帳を組み立てる ---------------------------------

function collectNotes(player) {
  const profile = PROFILES[player.name];
  if (!profile) {
    return { core: "まだよく知りません。これから見ていきます。", notes: [] };
  }
  const notes = (profile.notes ?? []).filter(n => n.when(player)).map(n => n.text);
  return { core: profile.core, notes };
}

// 誰にでも起きる「今この瞬間」のこと。手帳の最後に付く。
function conditionNotes(player) {
  const call = callName(player);
  const notes = [];

  if (player.injuryWeeks > 0) {
    notes.push(`今は離脱中です。焦ってるのが見てて分かります。
      「まだですか」って毎日聞いてきます。まだです。`);
  } else if (player.fatigue > 70) {
    notes.push(`最近、${call}の顔が疲れてます。本人は大丈夫って言うんですけど、
      大丈夫って言う人がいちばん危ないんですよ。休ませたほうがいいと思います。`);
  } else if (player.fatigue <= 20 && state.week > 2) {
    notes.push(`調子は良さそうです。動きが軽い。`);
  }

  return notes;
}


// ---- 顔画像 -------------------------------------------
// images/ に置けば出る。なければ頭文字で代用する。
// 画像がなくても遊べる状態を保つ。

// 名前からファイル名を引く表
const PORTRAITS = {
  "赤星 蓮": "akaboshi",
  "紫藤 圭": "shido",
  "青木 樹": "aoki",
  "桃井 隼": "momoi",
  "黒田 迅": "kuroda",
  "灰谷 悠": "haitani",
  "鷲尾 陣": "washio",
  "白石 大河": "shiraishi",
  "緑川 壮真": "midorikawa",
};

// 名前だけで顔を出せるようにしておく。
// 退部した選手はもう players にいないが、ストーリーには顔を出したい。
// （夏に去った男が、冬の決勝に現れる場面など）
function portraitByName(name, size = "", title = "") {
  const file = PORTRAITS[name];
  const initial = name.charAt(0);
  return `
    <div class="portrait ${size}" ${title ? `title="${title}"` : ""}>
      <span class="portrait-initial">${initial}</span>
      ${file ? `<img src="images/${file}.png" alt="${name}"
        onerror="this.style.display='none'">` : ""}
    </div>`;
}

// 画像がなければ img を消して頭文字だけ残す（onerror）
function portrait(player, size = "") {
  return portraitByName(player.name, size, player.name);
}


// ---- 今週の一言 ---------------------------------------
//
// 活動記録の脇で、三宅が毎週ひとこと言う。
//
// 大事なのは Math.random() を使わないこと。
// 画面は描き直されるたびにこの関数を呼ぶので、乱数だと
// ドロップダウンを触っただけで台詞が変わってしまう。
// 「その週の状態」だけから決めれば、同じ週なら必ず同じことを言う。

// いま最も疲れている選手（誰もいなければ null）
function mostTired() {
  const list = players.filter(p => p.injuryWeeks === 0);
  if (!list.length) return null;
  const worst = list.reduce((a, b) => (a.fatigue > b.fatigue ? a : b));
  return worst.fatigue > 65 ? worst : null;
}

// 絶好調の選手
function freshest() {
  const list = players.filter(p => p.injuryWeeks === 0 && p.fatigue <= 15);
  if (!list.length) return null;
  // 週によって話題にする子が変わる（乱数を使わずに散らす）
  return list[state.week % list.length];
}

// 何も起きていない週の雑談。週ごとに順番に回る。
const SMALL_TALK = [
  `今日も普通の練習でした。普通っていちばん難しいんですけど。`,
  `ボール、また1個空気が抜けてました。誰も言わないので私が入れてます。`,
  `体育館の時計、5分進んでるの、まだ誰も直してません。もう1年このままです。`,
  `監督、最近ちょっと機嫌がいいです。理由は聞いてません。`,
  `記録つけてると、伸びてる子ってすぐ分かるんですよ。本人がいちばん気づいてないです。`,
  `今週も全員来ました。当たり前みたいですけど、けっこうすごいことだと思います。`,
];

function weeklyComment() {
  const injured = players.find(p => p.injuryWeeks > 0);
  const tired = mostTired();
  const fresh = freshest();

  const nowEvent = getSchoolEvent(state.week);
  const nextEvent = getSchoolEvent(state.week + 1);
  const nowCup = getTournament(state.week);
  const nextCup = getTournament(state.week + 1);

  // --- 今週の行事・大会 ---
  if (nowCup) {
    return canEnter(nowCup)
      ? `${nowCup.name}、今日です。
         私にできるのは記録を取ることだけなので……行ってらっしゃい。`
      : `${nowCup.name}、テレビで見ましょうか。
         ……いえ、やっぱり見なくていいです。来年見ればいいです。`;
  }
  if (nowEvent?.type === "test") {
    return `テスト期間です。体育館、静かですね。
      私も勉強しないと……ノート取るのは得意なんですけど、自分のは別なんですよね。`;
  }
  if (nowEvent?.name === "文化祭") {
    return `文化祭です。うちのクラス、お化け屋敷になりました。
      黒田くん、脅かし役の候補から真っ先に外されてました。怖すぎるからって。`;
  }
  if (nowEvent?.name === "体育祭") {
    return `体育祭でした。桃井くんがリレーで大暴れして、監督が青い顔してました。
      「本番前に何やってんだ」って。楽しそうでしたけど。`;
  }
  if (nowEvent?.type === "camp") {
    return `合宿です。毎年ここで誰かが化けます。
      あと、毎年ここで誰かがケガをします。……見てますからね、私。`;
  }

  // --- 来週の予告 ---
  if (nextCup) {
    return `来週、${nextCup.name}です。
      そろそろ疲れを抜いたほうがいいと思います。……差し出がましいですけど。`;
  }
  if (nextEvent?.type === "test") {
    return `テストが近いですねー。私も勉強しないと……。
      みんな、赤点だけは取らないでくださいね。部活動停止になるので。`;
  }
  if (nextEvent?.type === "camp") {
    return `来週から合宿ですね。買い出しリスト、もう作ってあります。
      去年の反省を活かして、経口補水液を倍にしました。`;
  }
  if (nextEvent?.name === "文化祭") {
    return `来週、文化祭です。練習はお休みですね。
      たまには部活以外のことしてください。……とか言うと、赤星くん来ちゃうんですけど。`;
  }

  // --- 選手のこと ---
  if (injured) {
    return `${callName(injured)}、まだ戻れません。あと${injured.injuryWeeks}週です。
      毎日「まだですか」って聞いてきます。焦る気持ちは分かるんですけど。`;
  }
  if (tired) {
    return `${callName(tired)}、疲れてるみたいです。顔に出てます。
      本人は大丈夫って言うと思いますけど、休ませたほうがいいと思います。`;
  }
  if (state.buff && state.buff.mult < 1) {
    return `なんか、部の空気が重いです。理由は分かりません。
      こういう時期もあります。たぶん、そのうち抜けます。`;
  }
  if (fresh) {
    return `${callName(fresh)}、調子良さそうです。動きが違います。
      こういうの見つけるの、けっこう得意なんですよ、私。`;
  }

  // --- 何もない週 ---
  return SMALL_TALK[state.week % SMALL_TALK.length];
}

// 活動記録の脇に置く三宅
function renderManagerComment() {
  const box = document.getElementById("manager-comment");
  if (!box) return;

  box.innerHTML = `
    <div class="portrait mid">
      <span class="portrait-initial">三</span>
      <img src="${MANAGER.img}" alt="${MANAGER.name}" onerror="this.style.display='none'">
    </div>
    <div class="intro-bubble">
      <div class="intro-name">三宅<span class="intro-role">今週のひとこと</span></div>
      <div class="intro-text">${weeklyComment()}</div>
    </div>`;
}


// ---- ページの切り替え ---------------------------------
//
// 一覧 ⇄ 個人ページを、同じ枠の中で差し替える。
// ただ innerHTML を入れ替えるだけだと、切り替わったことが目に見えない。
// アニメーションを付けて「ページがめくられた」感じを出す。
function showPage(html) {
  const panel = document.getElementById("profile-panel");

  panel.classList.remove("page-enter");
  panel.innerHTML = html;

  // これがないとアニメーションが再生されない。
  // クラスを外して即つけ直しても、ブラウザは「変わっていない」と判断するため。
  // offsetWidth を読むと再計算が強制され、変化として認識される。
  void panel.offsetWidth;

  panel.classList.add("page-enter");
  panel.scrollTop = 0;
}


// ---- 一覧ページ（手帳の目次）--------------------------

// 三宅の挨拶。シーズンの進み方で少し変わる。
function managerIntro() {
  if (state.week >= 32) {
    return `いよいよですね。
      この手帳、4月からずっと付けてます。読み返すと、みんな変わってて笑えます。
      最後まで見ますよ、私。`;
  }
  if (state.tournaments.kengun === "lost") {
    return `……県大会、残念でした。
      でも、負けた日のことも書いてあります。書かないと、なかったことになるので。
      冬まで、まだあります。`;
  }
  if (state.week >= 16) {
    return `マネージャーの三宅です。2年です。
      夏を越えると、みんな顔つきが変わるんですよね。毎年そうなんですけど、今年は特に。
      気になる子がいたら、名前を押してください。`;
  }
  return `マネージャーの三宅詩織です。2年です。
      この手帳、部員のことを勝手に書いてます。監督には見せてません。
      名前を押すと、その子のページに飛びます。`;
}

// 一覧に出す、その選手の「いま」の一行。
// 上から順に、気になる度合いが高いものを優先する。
function teaser(player) {
  if (player.injuryWeeks > 0) return `離脱中（残り${player.injuryWeeks}週）`;
  if (player.fatigue > 70) return `かなり疲れてます`;

  // 「まだ出ていない」は、チームが試合をしているのに出番がない場合だけ。
  // 誰も試合をしていない時期に出すと、全員に同じ行が並んで意味がなくなる。
  if (!played(player) && state.history.length > 0) return `まだ試合に出ていません`;

  if (player.skills.length) return `${SKILLS[player.skills[0]].name}を持ってます`;
  if (isStarter(player) && calcOvr(player) >= 60) return `今、頼りになります`;
  if (player.fatigue <= 20 && state.week > 2) return `調子は良さそうです`;
  if (player.year === 1 && state.week < 8) return `まだ何者でもないです`;
  return `見ています`;
}

function renderNotebookIndex() {
  const cards = players.map(player => {
    const condition = getCondition(player);
    return `
      <button class="index-card" data-open="${player.name}">
        ${portrait(player, "mid")}
        <div class="index-body">
          <div class="index-head">
            <span class="index-name">${player.name}</span>
            <span class="player-pos">${player.pos}</span>
            <span class="player-year">${player.year}年</span>
            <span class="player-ovr">${calcOvr(player)}</span>
          </div>
          <div class="index-sub">
            <span class="cond-badge ${condition.cls}">${condition.label}</span>
            ${player.skills.map(k =>
              `<span title="${SKILLS[k].name}">${SKILLS[k].icon}</span>`).join("")}
          </div>
          <div class="index-teaser">${teaser(player)}</div>
        </div>
      </button>`;
  }).join("");

  const html = `
    <div class="match-head">
      <h2>📔 三宅の手帳</h2>
      <button class="close-btn" id="profile-close">✕ 閉じる</button>
    </div>

    <div class="manager-intro">
      <div class="portrait mid">
        <span class="portrait-initial">三</span>
        <img src="${MANAGER.img}" alt="${MANAGER.name}" onerror="this.style.display='none'">
      </div>
      <div class="intro-bubble">
        <div class="intro-name">${MANAGER.name}<span class="intro-role">2年・マネージャー</span></div>
        <div class="intro-text">${managerIntro()}</div>
      </div>
    </div>

    <div class="section-label">部員 ${players.length}人<span class="section-note">ポジション順</span></div>
    <div class="index-grid">${cards}</div>`;

  showPage(html);

  document.getElementById("profile-close").addEventListener("click", closeProfile);
  document.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => openProfile(btn.dataset.open));
  });
}


// ---- 画面 ---------------------------------------------

function renderProfile(player) {
  const derived = calcAllDerived(player);
  const { core, notes } = collectNotes(player);
  const extra = conditionNotes(player);
  const condition = getCondition(player);

  const baseRows = BASE_STATS.map(s => {
    const value = Math.floor(player.base[s.key]);
    const rate = player.growth[s.key];
    const mark = rate >= 1.3 ? "◎" : rate >= 1.1 ? "○" : rate <= 0.8 ? "▲" : "";
    return `
      <div class="stat" title="成長率 ${rate.toFixed(2)} — ${s.desc}">
        <span class="stat-name">${s.label}<span class="growth-mark">${mark}</span></span>
        <div class="stat-track"><div class="stat-fill" style="width:${value}%"></div></div>
        <span class="stat-value">${value}</span>
      </div>`;
  }).join("");

  const derivedRows = DERIVED_STATS.map(d => `
    <div class="stat" title="${d.label} = ${describeFormula(d)}">
      <span class="stat-name">${d.label}</span>
      <div class="stat-track">
        <div class="stat-fill derived" style="width:${derived[d.key]}%"></div>
      </div>
      <span class="stat-value">${derived[d.key]}</span>
    </div>`).join("");

  // 特殊技能。効果の説明と、マネージャーが見た一場面をセットで出す。
  const skillBlocks = player.skills.map(key => {
    const skill = SKILLS[key];
    return `
      <div class="skill-block">
        <div class="skill-head">${skill.icon} ${skill.name}</div>
        <div class="skill-effect">${skill.desc}</div>
        ${skill.episode ? `<div class="note note-skill">${skill.episode(callName(player))}</div>` : ""}
      </div>`;
  }).join("");

  const c = player.career;

  const html = `
    <div class="match-head">
      <button class="back-btn" id="profile-back">← 手帳の一覧</button>
      <h2>${player.name}
        <span class="player-pos">${player.pos}</span>
        <span class="head-sub">${player.year}年</span>
        <span class="cond-badge ${condition.cls}">${condition.label}</span>
      </h2>
      <button class="close-btn" id="profile-close">✕ 閉じる</button>
    </div>

    <div class="profile-cols">
      <div>
        <div class="profile-top">
          ${portrait(player, "big")}
          <div class="notebook">
            <div class="notebook-head">
              <div class="portrait manager" title="${MANAGER.profile}">
                <span class="portrait-initial">三</span>
                <img src="${MANAGER.img}" alt="${MANAGER.name}"
                     onerror="this.style.display='none'">
              </div>
              📔 ${MANAGER.name} の手帳
              <span class="notebook-sub">${MANAGER.year}年・マネージャー</span>
            </div>
            <div class="note note-core">${core}</div>
          </div>
        </div>

        ${notes.map(n => `<div class="note">${n}</div>`).join("")}
        ${extra.map(n => `<div class="note note-now">${n}</div>`).join("")}

        ${player.skills.length ? `
          <div class="section-label">特殊技能</div>
          ${skillBlocks}` : ""}
      </div>

      <div>
        <div class="section-label">基礎パラメータ<span class="section-note">◎○▲は成長率</span></div>
        ${baseRows}

        <div class="section-label">試合能力<span class="section-note">基礎から自動計算</span></div>
        ${derivedRows}

        <div class="section-label">
          通算成績<span class="section-note">上段が合計、下段が平均</span>
        </div>
        <table class="box-table stat-table">
          <tr>
            <th>出場</th><th class="num">得点</th><th class="num">R</th>
            <th class="num">A</th><th class="num">S</th>
          </tr>
          <tr>
            <td>${c.games}試合 ${c.min}Q</td>
            ${statCell(c.pts, c.games)}
            ${statCell(c.reb, c.games)}
            ${statCell(c.ast, c.games)}
            ${statCell(c.stl, c.games)}
          </tr>
        </table>
        ${player.injuryCount > 0 ? `<div class="cond-note">故障 ${player.injuryCount}回</div>` : ""}
      </div>
    </div>`;

  showPage(html);

  document.getElementById("profile-close").addEventListener("click", closeProfile);
  document.getElementById("profile-back").addEventListener("click", renderNotebookIndex);
}


// ---- 出入り口 -----------------------------------------

// 手帳を開く（一覧から）
function openNotebook() {
  document.getElementById("profile-overlay").classList.remove("hidden");
  renderNotebookIndex();
}

// 特定の選手のページを開く（部員カードの名前からも、一覧からも）
function openProfile(name) {
  const player = getPlayer(name);
  if (!player) return;
  document.getElementById("profile-overlay").classList.remove("hidden");
  renderProfile(player);
}

function closeProfile() {
  document.getElementById("profile-overlay").classList.add("hidden");
}
