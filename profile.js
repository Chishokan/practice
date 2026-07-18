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
    core: `入部初日に「ウィンターカップ、優勝しましょう」って、真顔で言った子です。
      正直、みんな引いてました。私も、ちょっと引きました。
      でも、あの日から今日まで、朝いちばんに体育館の鍵を開けてるのは、ずっと赤星くんです。
      言っちゃった以上、やらなきゃいけない。たぶん、いちばんそう思ってるのは、本人なんだと思います。`,
    notes: [
      {
        when: () => state.choicesMade.captain === "akaboshi",
        text: `1年生なのに、2年の先輩に平気で指示を出してます。見ててハラハラします。
          でも、先輩たちがちゃんと聞くんですよね。それが、いちばんすごいのかもしれません。`,
      },
      {
        when: () => state.choicesMade.captain === "kuroda",
        text: `主将は黒田くんなんですけど、コートで声を出してる回数は、たぶん赤星くんのほうが多いです。
          黒田くんは、何も言いません。……あれ、分かっててやらせてますよね。大人だなあ。`,
      },
      {
        when: () => state.choicesMade.usage === "ace",
        text: `最近、苦しい場面のボールは、全部赤星くんに行きます。
          重くないのかな、って心配になるんですけど……あの顔、たぶん、嬉しいんです。困りますね。`,
      },
      {
        when: () => state.choicesMade.usage === "general",
        text: `赤星くんのパス、見てて気持ちいいですよ。味方が走る先に、もう置いてあるんです。
          「なんで分かるの」って聞いたら、「見えるから」って。……見えないですよ、普通。`,
      },
      {
        when: p => p.base.power < 50,
        text: `体、細いんですよね。ぶつかられると、普通に吹っ飛びます。
          本人は絶対に認めませんけど。「今のは滑っただけです」って。滑ってないです、どう見ても。`,
      },
      {
        when: p => p.base.power >= 65,
        text: `4月の頃、当たり負けして床を転がってたのが、嘘みたいです。
          いつの間に、こんな体になったんだろう。記録つけてる私でも、変わり目が分かりませんでした。`,
      },
      {
        when: () => state.tournaments.kengun === "lost",
        text: `県大会で負けた日、ひとりで体育館に残って、シュートを打ってました。
          声、かけられませんでした。……あの背中には、かけちゃいけない気がして。`,
      },
      {
        when: () => state.week >= 32,
        text: `4月にあの台詞を聞いたとき、誰も笑わなかったけど、誰も本気にしてませんでした。
          ……今は、みんな本気にしてます。言葉って、後から本当になることが、あるんですね。`,
      },
    ],
  },

  "紫藤 圭": {
    core: `ノートを取ってます。私より詳しいです、うちのチームのこと。ちょっと悔しいです。
      相手校の分析まで勝手にやってて、監督がこっそり参考にしてるの、私は知ってます。言いませんけど。`,
    notes: [
      {
        when: p => !played(p) && state.week >= 12,
        text: `試合、まだ出てないんです。
          何も言いませんけど、その代わり、紫藤くんのノートだけが、日に日に厚くなっていきます。`,
      },
      {
        when: p => played(p),
        text: `初めて試合に出た日、コートに入る前、手が震えてました。
          でもコートに入った瞬間、普通の顔になったんです。あれ、たぶん、私しか見てません。`,
      },
      {
        when: p => isStarter(p),
        text: `いつの間にか、控えじゃなくなってました。
          「頭がいいだけじゃ勝てない」って本人が言ってたの、まだ半年前なんですけど。`,
      },
    ],
  },

  "青木 樹": {
    core: `シュート練習だけは、誰にも譲りません。列に割り込まれると、静かにキレます。
      体育館の鍵を返しに来るの、いつも青木くんです。赤星くんが開けて、青木くんが閉める。朝と夜の担当が、なんとなく決まってます。`,
    notes: [
      {
        when: p => derivedOf(p, "defense") < 50,
        text: `守りの話になると、急に静かになります。目も、合わせてくれません。
          分かってはいるみたいです。分かってはいるんですけど、ね。`,
      },
      {
        when: p => derivedOf(p, "defense") >= 60,
        text: `この前、守備練習を、自分から居残ってやってました。
          「らしくないですね」って言ったら、めちゃくちゃ怒られました。図星だったみたいです。`,
      },
      {
        when: p => p.career.pts >= 60,
        text: `点が入り出すと、止まらないんです。相手より、ベンチがいちばん驚いてます。`,
      },
    ],
  },

  "桃井 隼": {
    core: `走ってます。いつ見ても、走ってます。
      「疲れないの?」って聞いたら、「疲れますよ」って即答されました。じゃあなんで走るの、って話です。走るのは、やめないんですけど。`,
    notes: [
      {
        when: p => p.base.stamina >= 85,
        text: `もう誰も、桃井くんに走り勝てません。
          練習後、ひとりでダッシュしてるのを見て、ちょっと引きました。……いい意味で、です。`,
      },
      {
        when: p => !played(p) && state.week >= 16,
        text: `出番、ないんですよね。あんなに走ってるのに。
          最近、練習中の声が、少しだけ小さくなった気がします。気のせいだと、いいんですけど。`,
      },
    ],
  },

  "黒田 迅": {
    core: `口は、悪いです。「口じゃなくて足でやれ」が口癖です。1日3回は言ってます。
      でも、いちばんチームのことを考えてるのは、たぶん黒田くんです。……たぶん、ですけど。本人は認めないので。`,
    notes: [
      {
        when: () => state.choicesMade.captain === "kuroda",
        text: `主将になってから、口数が減りました。
          代わりに、来るのが早くなりました。赤星くんの、次に早いです。悔しいんだと思います、たぶん。`,
      },
      {
        when: () => state.choicesMade.captain === "akaboshi",
        text: `1年が主将に決まった日、黒田くんだけ「妥当だろ」って言ってました。
          あとで聞いたら、監督に推したの、この人らしいです。本人は、全力で否定しますけど。`,
      },
      {
        when: p => p.injuryCount === 0 && state.week >= 20,
        text: `一度もケガしてないの、黒田くんだけです。
          「頑丈なのも才能だ」って自分で言ってました。……たしかに、そうかもしれません。`,
      },
    ],
  },

  // 幼馴染。ここだけ、書いている人の距離が違う。
  "灰谷 悠": {
    core: `ゆうちゃんは、「地味」って言われるのを、地味に気にしてます。幼稚園の頃からそうでした。
      家が隣なので、私はこの人が昔から何も変わってないのを知ってます。
      でも、ゆうちゃんが出てる試合って、なぜか崩れないんですよ。昔から、そういう子なんです。`,
    notes: [
      {
        when: p => played(p) && p.career.games >= 3,
        text: `スタッツに出ないんです、ゆうちゃんの仕事は。
          でも、監督が最後まで残すのは、だいたいこの人なんですよね。数字より、監督の目は正直です。`,
      },
      {
        when: () => state.week >= 28,
        text: `「俺、来年もいるんで」って、さらっと言ってました。
          ……2年生ですもんね。そうか、まだ来年があるのか。
          こういうことを、さらっと言うから、この人はずるいんです。`,
      },
      {
        when: p => p.fatigue > 60,
        text: `疲れてても「大丈夫」って言うところ、昔から変わってません。
          小2のとき、熱があるのに公園でずっと遊んでて、次の日に倒れた人です。信用してません、その「大丈夫」。`,
      },
    ],
  },

  "鷲尾 陣": {
    core: `転校初日に、真顔で「ここでやりたくて来ました」って言ったんです。
      かっこよくないですか? ……本人、ずっと真顔でしたけど。逆に、信用できます。`,
    notes: [
      {
        when: () => state.tournaments.national === "lost",
        text: `全国での試合、客席で見てたそうです。
          「負けてたけど、あの1年の目が良かった」って言ってました。赤星くんのことです。人を、目で選ぶ人みたいです。`,
      },
      {
        when: p => p.career.games >= 2,
        text: `もう何年もいるみたいな顔で、馴染んでます。転校して、まだ2ヶ月なのに。
          緑川くんと二人で、黙々とリバウンド練習してるの、なんだか良いんですよ。会話は、たぶんゼロですけど。`,
      },
    ],
  },

  "白石 大河": {
    core: `跳びます。びっくりするくらい、跳びます。
      そのかわり、それ以外は、まだ何も分かってません。
      この前、試合中に、自陣のゴールに向かって全力で走っていきました。本気の顔で。止めるのが、間に合いませんでした。`,
    notes: [
      {
        when: p => p.base.iq < 35,
        text: `作戦ボードを見ながら、ずっと首をかしげてます。
          緑川くんが横で、指をさして教えてました。……あの二人、会話、成立してるんですかね。謎です。`,
      },
      {
        when: p => p.base.jump >= 85,
        text: `もう、誰も競り合えません。リングの上から、白石くんの手が出てきます。
          相手チームが白石くんを見上げて「え」って言うの、もう何回も見ました。`,
      },
      {
        when: p => p.injuryCount >= 2,
        text: `また離脱です。もう何度目か、数えるのを、やめました。
          痛いって言わないんですよ、白石くん。だから、気づくのが、いつも遅れるんです。今度から、私が見張ります。`,
      },
      {
        when: p => p.base.tech >= 55,
        text: `あんなに不器用だったのに、最近、シュートが入るようになりました。
          誰も褒めないので、私だけ、こっそり褒めてます。嬉しそうにするので。`,
      },
      {
        when: p => p.base.tech < 40 && state.week >= 16,
        text: `シュートは、まあ……うん。おいおい、ですね。
          でも、リバウンドは誰にも負けないので。それでいいと思います。得意なことが一つあれば、上等です。`,
      },
    ],
  },

  "緑川 壮真": {
    core: `喋りません。ほんとうに、喋りません。1日の発語数が、片手で足りる日もあります。
      跳びません。走れません。それなのに、誰もあの人の前を通れないんです。
      「なんでですか」って聞いたら、「来る場所が、分かる」とだけ言われました。それ以上は、教えてくれませんでした。`,
    notes: [
      {
        when: () => state.storySeen.includes(8),
        text: `県大会の前に、一度だけ「やるしかない」って言ったの、たぶん全員が覚えてます。
          この1年で聞いた中で、いちばん長い台詞かもしれません。ちょっとした事件でした、あれは。`,
      },
      {
        when: p => p.career.reb >= 30,
        text: `ゴール下、緑川くんが立ってるだけで、相手が入ってこなくなります。
          何もしてないように見えて、いちばん仕事してます。目立たない仕事ほど、消えると困るんですよね。`,
      },
      {
        when: p => p.base.iq >= 70,
        text: `最近、味方の位置まで、指で直すようになりました。相変わらず、喋らないまま。
          白石くんだけは、なぜかそれで通じてます。二人だけの言語が、あるみたいです。`,
      },
      {
        when: p => p.injuryCount === 0 && state.week >= 24,
        text: `一度も休んでません。一度も、です。
          この人がいなくなったら、うち、どうなるんだろう。……考えるのが、ちょっと怖いです。`,
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
  `今日も普通の練習でした。「普通」って、いちばん難しいんですけどね。続けるのが、いちばん。`,
  `ボール、また1個、空気が抜けてました。誰も言わないので、今日も私が入れときました。第7の部員です、この空気入れ。`,
  `体育館の時計、5分進んでるの、まだ誰も直してません。もう1年、このままです。そろそろ、愛着すら湧いてきました。`,
  `監督、最近ちょっと機嫌がいいです。理由は聞いてません。聞かないほうが、いいこともあります。`,
  `記録つけてると、伸びてる子ってすぐ分かるんですよ。だいたい、本人がいちばん気づいてないんですけどね。`,
  `今週も、全員来ました。当たり前みたいですけど、これ、けっこうすごいことだと思ってます。地味に、私の自慢です。`,
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
    return `テスト期間です。体育館、静かですね。ボールの音がしないと、逆に落ち着きません。
      私も勉強しないと……。ノート取るのは得意なんですけど、自分のテスト用のノートだけは、なぜか続かないんですよね。`;
  }
  if (nowEvent?.name === "文化祭") {
    return `文化祭です。うちのクラス、お化け屋敷になりました。
      黒田くん、脅かし役の候補から、真っ先に外されてました。「素で怖いから、逆に台無し」って。ちょっと気の毒でした。`;
  }
  if (nowEvent?.name === "体育祭") {
    return `体育祭でした。桃井くんがリレーで大暴れして、監督が真っ青になってました。
      「本番前に何やってんだ!」って。……でも桃井くん、あんなに楽しそうな顔、久しぶりに見ました。まあ、いいと思います。`;
  }
  if (nowEvent?.type === "camp") {
    return `合宿です。毎年、ここで誰かが化けます。
      あと、毎年ここで誰かがケガをします。……見てますからね、私。無茶した人、全員ノートに書きますからね。`;
  }

  // --- 来週の予告 ---
  if (nextCup) {
    return `来週、いよいよ県大会です。
      そろそろ、疲れを抜いたほうがいいと思います。……差し出がましいですけど、私、それも記録してるので、分かるんです。`;
  }
  if (nextEvent?.type === "test") {
    return `テストが近いですねー。私も勉強しないと……あ、これ、毎回言ってますね。
      みんな、赤点だけは取らないでくださいね。部活動停止になったら、私、記録することがなくなるので。切実です。`;
  }
  if (nextEvent?.type === "camp") {
    return `来週から合宿ですね。買い出しリスト、もう作ってあります。抜かりはありません。
      去年の反省を活かして、経口補水液を倍にしました。あと、白石くん用に絆創膏も倍です。予感がするので。`;
  }
  if (nextEvent?.name === "文化祭") {
    return `来週、文化祭です。練習はお休みですね。
      たまには部活以外のことしてください。……とか言うと、赤星くん来ちゃうんですけど。`;
  }

  // --- 選手のこと ---
  if (injured) {
    return `白石くん、まだ戻れません。あと2週です。
      毎日「まだですか」って聞いてきます。焦る気持ちは分かるんですけど……焦ると、また離脱しますからね。座っててください。`;
  }
  if (tired) {
    return `青木くん、疲れてるみたいです。顔に、はっきり出てます。
      本人は「大丈夫」って言うと思いますけど、休ませたほうがいいと思います。あの「大丈夫」、あてになりません。`;
  }
  if (state.buff && state.buff.mult < 1) {
    return `なんか、部の空気が重いです。理由は、正直、よく分かりません。
      こういう時期も、あります。毎年あります。たぶん、そのうち、ふっと抜けます。……抜けますように。`;
  }
  if (fresh) {
    return `桃井くん、調子良さそうです。動きが、いつもと違います。
      こういうの見つけるの、けっこう得意なんですよ、私。記録係の、数少ない特技です。`;
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
    return `いよいよですね。ここまで、来ました。
    この手帳、4月からずっと付けてます。読み返すと、みんな変わりすぎてて、笑えます。特に、赤星くん。
    最後まで、見届けますよ。私。それが、記録係の仕事なので。`;
  }
  if (state.tournaments.kengun === "lost") {
    return `……県大会、残念でした。かける言葉、まだ見つかってません。
    でも、負けた日のことも、ちゃんと書いてあります。書かないと、なかったことになっちゃうので。
    冬まで、まだあります。まだ、終わってないので。`;
  }
  if (state.week >= 16) {
    return `マネージャーの三宅です。2年です。
    夏を越えると、みんな顔つきが変わるんですよね。毎年そうなんですけど……今年は、特に。
    気になる子がいたら、名前を押してください。私の観察、けっこう当たりますよ。`;
  }
  return `マネージャーの三宅詩織です。2年です。
      この手帳、部員のことを勝手に書いてます。監督には見せてません。
      名前を押すと、その子のページに飛びます。`;
}

// 一覧に出す、その選手の「いま」の一行。
// 上から順に、気になる度合いが高いものを優先する。
function teaser(player) {
  if (player.injuryWeeks > 0) return `離脱中（残り${player.injuryWeeks}週）`;
  if (player.fatigue > 70) return `マネージャーの三宅詩織です。2年です。
      この手帳、部員のことを、勝手にいろいろ書いてます。監督には、見せてません。一生見せません。
      名前を押すと、その子のページに飛びます。……あんまり本人には、言わないでくださいね。`;

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
