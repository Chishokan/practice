// ======================================================
// 試合システム
//
// game.js の players / calcAllDerived などをそのまま使う。
// 相手校も選手と同じ「6つの基礎パラメータ」で作ってあるので、
// 能力の計算は味方と相手でまったく同じ関数が使える。
// ======================================================


// ---- 1. 学校の作り方 ---------------------------------
// 大会が3つになると相手校が10校以上要る。1校ずつ手で書くと、
// 「この高校だけ数字がおかしい」が起きやすい。
// 「強さ(level)」と「タイプ」の2つから組み立てる形にする。
const SCHOOL_TYPES = {
  BALANCED: { power: 1.00, speed: 1.00, stamina: 1.00, jump: 1.00, tech: 1.00, iq: 1.00 },
  BIG:      { power: 1.15, speed: 0.85, stamina: 1.00, jump: 1.15, tech: 0.90, iq: 0.95 }, // 高さで押す
  RUN:      { power: 0.90, speed: 1.20, stamina: 1.15, jump: 1.00, tech: 0.95, iq: 0.90 }, // 走り勝つ
  SKILL:    { power: 0.90, speed: 1.00, stamina: 0.95, jump: 0.95, tech: 1.20, iq: 1.15 }, // 上手さで崩す
};

// level はだいたいの強さ。40台=格下、50台=互角、60台=強豪、70台=全国上位。
function makeSchool(name, level, type, off, def, tag, desc) {
  const shape = SCHOOL_TYPES[type];
  const base = {};
  for (const stat of BASE_STATS) {
    base[stat.key] = Math.round(level * shape[stat.key]);
  }
  return { name, base, off, def, tag, desc, level };
}


// ---- 2. 練習試合の相手 -------------------------------
// base は選手と同じ形。だから calcAllDerived() がそのまま通る。
const OPPONENTS = [
  {
    name: "城東高校", tag: "格下",
    desc: "1回戦の相手。基礎はまだこれから。",
    base: { power: 42, speed: 42, stamina: 44, jump: 40, tech: 40, iq: 38 },
    off: "MOTION", def: "MAN",
  },
  {
    name: "北嶺高校", tag: "互角",
    desc: "堅実なチーム。リバウンドが強い。",
    base: { power: 51, speed: 44, stamina: 49, jump: 53, tech: 45, iq: 47 },
    off: "POST", def: "ZONE",
  },
  {
    name: "明星学園", tag: "強豪",
    desc: "県上位。走って守る。ミスを見逃さない。",
    base: { power: 55, speed: 62, stamina: 64, jump: 55, tech: 57, iq: 55 },
    off: "FAST", def: "PRESS",
  },
  {
    name: "天王寺学院", tag: "強豪",
    desc: "3Pが当たると止まらない。外を消せるかどうか。",
    base: { power: 50, speed: 56, stamina: 53, jump: 53, tech: 67, iq: 64 },
    off: "OUTSIDE", def: "ZONE",
  },
];
// 帝王実業はここに入れない。
// 最終目標なので、初めて対峙するのは本番の舞台であるべきだ。
// 練習試合で何度も戦えると、決勝で会ったときの「あの帝王だ」が消える。


// ---- 2.5 大会 ----------------------------------------
//
// 難易度は 県大会 < ウィンターカップ < 全国 になっている。
// これは相手の強さだけで作っているのではない。
//   8月の全国は、相手が最強なうえに、こちらがまだ育ちきっていない。
//   12月のウィンターカップは、相手が少し落ちて、こちらは仕上がっている。
// 「いつ当たるか」が難易度の半分を決めている。
//
// expScale は、その大会で得られる経験値の倍率。
// 大きい舞台ほど選手は伸びる。
const TOURNAMENTS = [
  {
    key: "kengun", week: 10, icon: "🥈", name: "県大会",
    desc: "夏の全国への切符。ここを勝ち抜かないと8月の全国はない。",
    expScale: 1.2,
    rounds: [
      { label: "1回戦", school: makeSchool("城東高校", 38, "BALANCED", "MOTION", "MAN", "格下", "1回戦の相手。") },
      { label: "準決勝", school: makeSchool("北嶺高校", 44, "BIG", "POST", "ZONE", "互角", "リバウンドが強い。") },
      { label: "決勝", school: makeSchool("明星学園", 49, "RUN", "FAST", "PRESS", "強豪", "県の王者。走って守る。") },
    ],
  },
  {
    key: "national", week: 19, icon: "🔴", name: "インターハイ（全国）",
    desc: "全国の舞台。相手は各県の王者ばかり。8月のチームでは荷が重い。",
    expScale: 1.5, // 格上との試合ほど得るものは大きい
    requires: "kengun", // 県大会を制していないと出場できない
    rounds: [
      { label: "1回戦", school: makeSchool("米沢工業", 54, "BIG", "POST", "ZONE", "全国級", "東北の高さ。") },
      { label: "2回戦", school: makeSchool("浪速商業", 60, "SKILL", "MOTION", "MAN", "全国級", "関西仕込みの技術。") },
      { label: "準決勝", school: makeSchool("桜坂学園", 65, "RUN", "FAST", "PRESS", "優勝候補", "40分間走り続ける。") },
      { label: "決勝", school: makeSchool("帝王実業", 70, "SKILL", "OUTSIDE", "MAN", "絶対王者", "3年生が揃う最強の姿。高校バスケの頂点。") },
    ],
  },
  {
    key: "winter", week: 35, icon: "🏆", name: "ウィンターカップ",
    desc: "最後の舞台。1年かけて育ててきた全てをぶつける。",
    expScale: 1.4,
    // 夏より相手が弱いのには理由がある。3年生はインターハイで引退するため、
    // 冬の各校は新チーム。こちらは1年かけて仕上がっている。
    // この非対称が「全国のほうが難しい」を自然に作っている。
    rounds: [
      { label: "1回戦", school: makeSchool("城北付属", 48, "BALANCED", "MOTION", "MAN", "格下", "堅実だが決め手に欠ける。") },
      { label: "2回戦", school: makeSchool("天王寺学院", 54, "SKILL", "OUTSIDE", "ZONE", "強豪", "3Pが当たると止まらない。") },
      { label: "準決勝", school: makeSchool("明星学園", 56, "RUN", "FAST", "PRESS", "強豪", "夏から一回り成長している。") },
      { label: "決勝", school: makeSchool("帝王実業", 61, "SKILL", "OUTSIDE", "MAN", "絶対王者", "3年生が抜けてなお王者。ここを倒せば日本一。") },
    ],
  },
];

function getTournament(week) {
  return TOURNAMENTS.find(t => t.week === week) || null;
}

// 相手校のエンブレム。images/ にあれば出る。なければ何も出ない。
// 学校名からファイル名を引く。
const EMBLEMS = {
  "城東高校": "emblem_jouto",
  "北嶺高校": "emblem_hokurei",
  "明星学園": "emblem_myojo",
  "帝王実業": "emblem_teiou",
};

function emblem(name, size = "") {
  const file = EMBLEMS[name];
  if (!file) return "";
  return `<img class="emblem ${size}" src="images/${file}.png" alt=""
    onerror="this.style.display='none'">`;
}

// その大会に出られるか（県大会を勝っていないと全国には行けない）
function canEnter(tournament) {
  if (!tournament.requires) return true;
  return state.tournaments[tournament.requires] === "won";
}


// ---- 3. 戦術 -----------------------------------------
// weights のキーは、試合能力(shoot等)でも基礎パラメータ(speed等)でも書ける。
//   → getStat() が両方を見分けてくれる。
// pace はポゼッション（攻撃回数）の増減。load は試合中の疲労の溜まり方。
// scorer は「2Pを誰が決めるか」の抽選に使う能力。
//   戦術を変えると、点を取る選手そのものが変わる。
const OFF_TACTICS = {
  POST: {
    name: "インサイド攻撃", short: "イン",
    desc: "ゴール下で勝負。大きい選手が点を取る。",
    weights: { rebound: 0.40, shoot: 0.30, power: 0.20, pass: 0.10 },
    scorer: ["rebound", "power", "shoot"], // ビッグマンに集まる
    three: 0.10, // 3Pを狙う割合
    pace: 0, load: 1.0,
  },
  OUTSIDE: {
    name: "アウトサイド中心", short: "アウト",
    desc: "3Pを多投。当たれば大きいが、水物。",
    weights: { shoot: 0.55, pass: 0.25, tech: 0.10, drive: 0.10 },
    scorer: ["shoot"],
    three: 0.50,
    pace: 0, load: 0.9,
  },
  FAST: {
    name: "速攻", short: "速攻",
    desc: "走って走って走り勝つ。攻撃回数が増える。",
    weights: { drive: 0.35, speed: 0.25, pass: 0.20, stamina: 0.20 },
    scorer: ["speed", "drive"], // 走れる選手が決める
    three: 0.25,
    pace: 3, load: 1.4,
  },
  MOTION: {
    name: "ボールムーブ", short: "ムーブ",
    desc: "人とボールを動かす。判断力の勝負。",
    weights: { pass: 0.40, shoot: 0.30, iq: 0.20, drive: 0.10 },
    scorer: ["shoot", "drive"],
    three: 0.35,
    pace: 0, load: 1.0,
  },

  // --- ここから下は特殊戦術。チームが条件を満たすと習得できる ---
  //
  // 特殊戦術は「切り札」。1試合に1クォーターしか使えない代わりに、
  // 通常の戦術より明確に強い（bonus のぶんだけ上乗せされる）。
  // いつ切るかが勝負どころ。競った第4Qに取っておくか、
  // 離される前の第2Qで使うか。
  //
  // unlock は「どう鍛えれば身につくか」。戦術そのものと同じ場所に書いておく。
  //   value … 今のチームの数値
  //   min   … これ未満では絶対に習得できない
  //   full  … ここまで来ると最も習得しやすい
  // 戦術の中身と習得条件が噛み合っていることが大事。
  // アイソレーションは「上手いエースがいるから使える戦術」なので、
  // 条件もチーム平均ではなく、一番上手い1人を見る。
  ISO: {
    name: "アイソレーション", short: "アイソ",
    desc: "エースに預けて1on1。止められる者はいない。",
    locked: true, bonus: 7,
    weights: { drive: 0.40, tech: 0.30, shoot: 0.30 },
    scorer: ["drive", "tech"],
    three: 0.20,
    pace: 0, load: 0.9,
    unlock: {
      label: "エースの1on1能力",
      desc: "ドリブル力とテクニックが最も高い選手を見る",
      value: () => bestOf(p => (getStat(p, "drive") + getStat(p, "tech")) / 2),
      // 4月の時点で0%になるように min を置く。
      // 何も鍛えないうちに習得できてしまっては、特殊戦術の意味がない。
      min: 62, full: 82,
    },
  },
  PICKROLL: {
    name: "ピック＆ロール", short: "P&R",
    desc: "2人で崩す。合わせれば誰にも止められない。",
    locked: true, bonus: 7,
    weights: { pass: 0.35, rebound: 0.25, tech: 0.20, iq: 0.20 },
    scorer: ["rebound", "power"],
    three: 0.15,
    pace: 0, load: 1.0,
    unlock: {
      label: "出し手と飛び込み手の噛み合い",
      desc: "一番パスが上手い選手と、一番リバウンドが強い選手の平均",
      // 2人一組の戦術なので、両方揃わないと数字が伸びない
      value: () => (bestOf(p => getStat(p, "pass")) + bestOf(p => getStat(p, "rebound"))) / 2,
      min: 60, full: 80,
    },
  },
};

// steal はミスを誘う確率。allow は「抜かれたときの失点しやすさ」。
//   プレスは奪える代わりに、剥がされると簡単に決められる。
//   この2つが釣り合っていないと「常にプレス」が正解になってしまう。
const DEF_TACTICS = {
  MAN: {
    name: "マンツーマン", short: "マン",
    desc: "基本。穴がない代わりに、奇襲もない。",
    weights: { defense: 0.60, rebound: 0.25, speed: 0.15 },
    steal: 0.10, allow: 0, pace: 0, load: 1.0,
  },
  ZONE: {
    name: "ゾーン", short: "ゾーン",
    desc: "ゴール下を固める。外は空く。体力は温存できる。",
    weights: { rebound: 0.45, defense: 0.35, iq: 0.20 },
    steal: 0.08, allow: 0, pace: 0, load: 0.7,
  },
  PRESS: {
    name: "プレス", short: "プレス",
    desc: "全面から潰す。奪えるが、剥がされると失点する。消耗も激しい。",
    weights: { defense: 0.40, speed: 0.30, stamina: 0.30 },
    steal: 0.18, allow: 6, pace: 2, load: 1.5,
  },

  // --- 特殊戦術 ---
  BOX1: {
    name: "ボックスワン", short: "B1",
    desc: "1人を専従でエースに張り付ける。相手の生命線を断つ。",
    locked: true, bonus: 7,
    weights: { defense: 0.45, iq: 0.35, speed: 0.20 },
    steal: 0.11, allow: 0, pace: 0, load: 1.2,
    unlock: {
      label: "チーム全体の守備力",
      desc: "上位5人のディフェンス力の平均",
      // 4人でゾーンを組みながら1人が張り付く戦術なので、
      // 一部が上手いだけでは成立しない。チーム全体を見る。
      value: () => topAvg("defense", 5),
      min: 52, full: 72,
    },
  },
};

// ---- 3.5 習得条件のための集計 -------------------------

// いちばん高い選手の値（エース1人が要る戦術のため）
function bestOf(fn) {
  return Math.max(...players.map(fn));
}

// 上位n人の平均（チーム全体の底上げが要る戦術のため）
function topAvg(key, n) {
  const values = players.map(p => getStat(p, key)).sort((a, b) => b - a);
  const top = values.slice(0, n);
  return top.reduce((a, b) => a + b, 0) / top.length;
}


// ---- 3. 戦術の相性 -----------------------------------
// このゲームの駆け引きの中心。攻撃側の評価値に直接足し引きする。
// 「うちの得意」だけでなく「相手が何をしてくるか」を見る必要が生まれる。
// 書かれていない組み合わせは 0（五分）として扱う。
// そうしないと、戦術を1つ足すたびに全マス埋める羽目になる。
const MATCHUP = {
  //          相手マン  ゾーン   プレス   ボックスワン
  POST:    { MAN:  0, ZONE:  -5, PRESS:  +5, BOX1: +4 }, // 中は固められると詰まる／マークが外に1枚割かれる
  OUTSIDE: { MAN:  0, ZONE:  +6, PRESS:  -3, BOX1: -6 }, // ゾーンの外は打ち放題／エースを消されると沈む
  FAST:    { MAN: +3, ZONE:  -3, PRESS:  -6, BOX1:  0 }, // 走る前に潰される
  MOTION:  { MAN: -3, ZONE:  +3, PRESS:  +4, BOX1: +3 }, // 動いて剥がす
  ISO:     { MAN: +2, ZONE:  -4, PRESS:  +3, BOX1: -8 }, // 1人に頼る形は、その1人を消されると終わる
  PICKROLL:{ MAN: +4, ZONE:  -2, PRESS:  +5, BOX1: +2 }, // マンツーマンを2人がかりで崩す
};

function matchupValue(offKey, defKey) {
  return MATCHUP[offKey]?.[defKey] ?? 0;
}

// いま使える戦術だけを返す。特殊戦術は習得するまで出てこない。
function availableTactics(tactics) {
  const result = {};
  for (const [key, tactic] of Object.entries(tactics)) {
    if (!tactic.locked || state.unlocked.includes(key)) result[key] = tactic;
  }
  return result;
}


// ---- 4. 能力の取り出し -------------------------------

// キーが試合能力なら計算し、基礎パラメータならそのまま返す。
// これのおかげで、戦術の weights に両方を混ぜて書ける。
// 特殊技能による上乗せも、ここを通せば全部の計算に自動で効く。
function getStat(unit, key) {
  const derived = DERIVED_STATS.find(d => d.key === key);
  const value = derived ? calcDerived(unit, derived) : unit.base[key];
  return value + skillStatBonus(unit, key);
}

// 特殊技能による能力の上乗せ。相手校は技能を持たないので0になる。
function skillStatBonus(unit, key) {
  if (!unit.skills) return 0;
  let bonus = 0;
  for (const skillKey of unit.skills) {
    const skill = SKILLS[skillKey];
    if (skill.stat?.[key]) bonus += skill.stat[key];
  }
  return bonus;
}

// 抽選のときに重みを何倍にするか（＝ボールが集まる、リバウンドを拾える）
function skillPickMult(unit, keys) {
  if (!unit.skills) return 1;
  let mult = 1;
  for (const skillKey of unit.skills) {
    const skill = SKILLS[skillKey];
    for (const key of keys) {
      if (skill.pickMult?.[key]) mult *= skill.pickMult[key];
    }
    // 勝負強さは第4Q以降に効く（延長戦こそ本領）
    if (skill.clutch && matchState.quarter >= 3) mult *= 1.6;
  }
  return mult;
}

// 疲労による能力低下。疲労100で6割まで落ちる。
// 終盤に足が止まる、という感覚をこの1行で作っている。
function fatigueMult(fatigue) {
  return 1 - fatigue * 0.004;
}

// コート上の集団の、その戦術における評価値。
// lineup は味方なら5人、相手なら1つ（チーム全体を1人として扱う）。
function teamRating(lineup, tactic, fatigueOf) {
  let total = 0;
  for (const [key, weight] of Object.entries(tactic.weights)) {
    let sum = 0;
    for (const unit of lineup) {
      sum += getStat(unit, key) * fatigueMult(fatigueOf(unit));
    }
    total += (sum / lineup.length) * weight;
  }
  return total;
}


// ---- 5. 試合の状態 -----------------------------------
const matchState = {
  opponent: null,
  lineup: [],      // コート上の5人（playersの要素そのもの）
  offTactic: "MOTION",
  defTactic: "MAN",
  quarter: 0,      // 終わったクォーター数
  homeScore: 0,
  awayScore: 0,
  fatigue: {},     // 試合中の疲労 { 選手名: 数値 }
  awayFatigue: 0,
  box: {},         // 個人成績 { 選手名: {pts, reb, ast, stl} }
  events: [],      // 実況ログ
  phase: "setup",  // setup → playing → done
  isFriendly: true,
};


// ---- 6. 抽選のための小道具 ---------------------------

// 重み付きの抽選。能力が高い選手ほど選ばれやすくする。
// 得点者・リバウンドを取った選手を決めるのに使う。
//
// keys は複数指定できる（平均を取る）。2Pなら「ドリブル＋シュート」など。
// 能力をそのまま重みにすると差が出なさすぎる（62対42でたった1.5倍）。
// 2.5乗して、上手い選手にはっきり寄せる（62対42が約2.9倍になる）。
function pickWeighted(units, keys) {
  const list = Array.isArray(keys) ? keys : [keys];
  const weights = units.map(u => {
    const avg = list.reduce((sum, k) => sum + getStat(u, k), 0) / list.length;
    const value = avg * fatigueMult(matchState.fatigue[u.name] ?? 0);
    // 0だと絶対に選ばれなくなるので下限を置く
    return Math.pow(Math.max(1, value), 2.5) * skillPickMult(u, list);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < units.length; i++) {
    r -= weights[i];
    if (r <= 0) return units[i];
  }
  return units[units.length - 1];
}

// 個人成績を1つ足す
function addBox(player, key, value = 1) {
  matchState.box[player.name][key] += value;
}

function addEvent(text, type = "") {
  matchState.events.push({ quarter: matchState.quarter + 1, text, type });
}


// ---- 7. 1回の攻撃 ------------------------------------
// isHome = true なら自校の攻撃。
function simulatePossession(isHome) {
  const ms = matchState;
  const opp = ms.opponent;

  const offTactic = OFF_TACTICS[isHome ? ms.offTactic : opp.off];
  const defTactic = DEF_TACTICS[isHome ? opp.def : ms.defTactic];

  const offLineup = isHome ? ms.lineup : [opp];
  const defLineup = isHome ? [opp] : ms.lineup;
  const offFatigue = isHome ? (u => ms.fatigue[u.name]) : (() => ms.awayFatigue);
  const defFatigue = isHome ? (() => ms.awayFatigue) : (u => ms.fatigue[u.name]);

  let offRating = teamRating(offLineup, offTactic, offFatigue);
  const defRating = teamRating(defLineup, defTactic, defFatigue);

  // 戦術の相性を反映する
  const offKey = isHome ? ms.offTactic : opp.off;
  const defKey = isHome ? opp.def : ms.defTactic;
  offRating += matchupValue(offKey, defKey);

  // 守備のリスク。プレスは、ミスを誘えなかった時点で相手が楽になっている。
  offRating += defTactic.allow;

  // 切り札の上乗せ。1Qしか使えないぶん、はっきり強い。
  // 攻撃の切り札なら攻撃が、守備の切り札なら相手の攻撃が沈む。
  if (isHome && offTactic.bonus) offRating += offTactic.bonus;
  if (!isHome && defTactic.bonus) offRating -= defTactic.bonus;

  // 「勝負強さ」持ちがコートにいると、第4Q以降チーム全体が上振れする
  if (isHome && ms.quarter >= 3) {
    const clutchCount = ms.lineup.filter(p => hasSkill(p, "CLUTCH")).length;
    offRating += clutchCount * 3;
  }

  const diff = offRating - defRating; // これがプラスなら攻撃側が有利

  // --- ターンオーバー判定 ---
  // プレスは奪う確率が高い。パスとIQが高ければ耐えられる。
  const toChance = Math.min(0.30, Math.max(0.03, defTactic.steal - diff * 0.003));
  if (Math.random() < toChance) {
    if (!isHome) {
      // 相手のミスを誰が奪ったか
      const stealer = pickWeighted(ms.lineup, "defense");
      addBox(stealer, "stl");
      addEvent(`${stealer.name} がスティール！`, "good");
    }
    return;
  }

  // --- シュート ---
  const isThree = Math.random() < offTactic.three;
  // 2Pは50%、3Pは35%が基準。そこから力の差で上下する。
  const baseRate = isThree ? 0.35 : 0.50;
  const rate = Math.min(0.75, Math.max(0.15, baseRate + diff * 0.004));

  if (Math.random() < rate) {
    const points = isThree ? 3 : 2;
    if (isHome) {
      ms.homeScore += points;
      // 3Pはシュート力、2Pは戦術によって「決める人」が変わる
      const scorer = pickWeighted(ms.lineup, isThree ? ["shoot", "tech"] : offTactic.scorer);
      addBox(scorer, "pts", points);
      // 6割はアシストが付く。パスの上手い選手が記録を伸ばす。
      const others = ms.lineup.filter(p => p !== scorer);
      if (others.length && Math.random() < 0.6) {
        const passer = pickWeighted(others, "pass");
        addBox(passer, "ast");
      }
      if (isThree) addEvent(`${scorer.name} の3P！`, "good");
    } else {
      ms.awayScore += points;
    }
    return;
  }

  // --- 外した。リバウンド争い ---
  // 攻撃側のリバウンド力が相対的に高いほど、拾い直せる。
  const offReb = teamRating(offLineup, { weights: { rebound: 1 } }, offFatigue);
  const defReb = teamRating(defLineup, { weights: { rebound: 1 } }, defFatigue);
  const orChance = 0.30 * (offReb / Math.max(1, defReb));

  if (Math.random() < orChance) {
    if (isHome) {
      const rebounder = pickWeighted(ms.lineup, "rebound");
      addBox(rebounder, "reb");
      addEvent(`${rebounder.name} がオフェンスリバウンド`, "");
    }
    simulatePossession(isHome); // 攻撃続行
  } else if (!isHome) {
    // 相手のミスを自校が拾った（＝ディフェンスリバウンド）
    const rebounder = pickWeighted(ms.lineup, "rebound");
    addBox(rebounder, "reb");
  }
}


// ---- 8. 1クォーター ----------------------------------

// 第5Q以降は延長戦。バスケに引き分けはない。
function isOvertime() {
  return matchState.quarter >= 4;
}

// 画面に出すクォーター名
function quarterLabel(quarter) {
  return quarter >= 4 ? `延長${quarter - 3}` : `第${quarter + 1}Q`;
}

function simulateQuarter() {
  const ms = matchState;
  const opp = ms.opponent;

  // 攻撃回数。速攻やプレスが絡むと試合が速くなる。
  let pace = 16
    + OFF_TACTICS[ms.offTactic].pace + OFF_TACTICS[opp.off].pace
    + DEF_TACTICS[ms.defTactic].pace + DEF_TACTICS[opp.def].pace;

  // 延長は5分。通常のクォーター（10分）の半分。
  if (isOvertime()) pace = Math.round(pace / 2);

  for (let i = 0; i < pace; i++) {
    simulatePossession(true);
    simulatePossession(false);
  }

  // --- 疲労の増減 ---
  // 出ている5人は消耗し、ベンチは回復する。
  // 延長は短いぶん、消耗も半分。
  const otMult = isOvertime() ? 0.5 : 1;
  const load = (OFF_TACTICS[ms.offTactic].load + DEF_TACTICS[ms.defTactic].load) / 2 * otMult;
  for (const player of players) {
    if (ms.lineup.includes(player)) {
      // 「タフガイ」は試合中の消耗が小さい
      const tough = hasSkill(player, "TOUGH") ? SKILLS.TOUGH.fatigueMult : 1;
      // 1Qあたりの消耗。4倍して1試合ぶん。
      // ここを大きくしすぎると、大会の連戦で決勝を戦えるチームがなくなる。
      const gain = 9 * load * (1.3 - player.base.stamina / 200) * tough;
      ms.fatigue[player.name] = Math.min(100, ms.fatigue[player.name] + gain);
      addBox(player, "min"); // 出場したクォーター数
    } else if (player.injuryWeeks === 0) {
      // ベンチは回復するが、休養にはならない。
      // ここを大きくすると（以前は8）、4Q座っているだけで疲労が全快し、
      // 「試合に出さない＝休ませる」になってしまう。
      // ベンチもアップして声を出している、くらいの回復に留める。
      ms.fatigue[player.name] = Math.max(0, ms.fatigue[player.name] - 4 * otMult);
    }
  }
  const awayLoad = (OFF_TACTICS[opp.off].load + DEF_TACTICS[opp.def].load) / 2 * otMult;
  ms.awayFatigue = Math.min(100, ms.awayFatigue + 9 * awayLoad * (1.3 - opp.base.stamina / 200));

  ms.quarter++;

  // 相手は次のクォーターで戦術を変えてくることがある
  if (Math.random() < 0.4) {
    const offKeys = Object.keys(OFF_TACTICS);
    opp.off = offKeys[Math.floor(Math.random() * offKeys.length)];
  }
  if (Math.random() < 0.3) {
    const defKeys = Object.keys(DEF_TACTICS);
    opp.def = defKeys[Math.floor(Math.random() * defKeys.length)];
  }
}


// ---- 8.5 試合による成長 -------------------------------
//
// 練習は「狙って伸ばす」もの。試合は「やったことが身になる」もの。
// だから伸びる場所は個人成績から決まる。
//   点を取った選手はテクニックが、リバウンドを取った選手はジャンプが伸びる。
// 出場していない選手は伸びない。ここがベンチと主力の差になる。
const EXP_RULES = [
  { key: "iq",      per: "min", rate: 0.18 }, // 出るだけで試合勘がつく
  { key: "stamina", per: "min", rate: 0.10 },
  { key: "tech",    per: "pts", rate: 0.04 },
  { key: "jump",    per: "reb", rate: 0.07 },
  { key: "power",   per: "reb", rate: 0.04 },
  { key: "speed",   per: "stl", rate: 0.15 },
  { key: "iq",      per: "ast", rate: 0.06 },
];

function applyMatchExperience() {
  const ms = matchState;

  // 相手が格上なら得るものが大きい。胸を借りる、というやつ。
  const ourLevel = ms.lineup.length
    ? ms.lineup.reduce((sum, p) => sum + calcOvr(p), 0) / ms.lineup.length
    : 50;
  const gap = (ms.opponent.level ?? 55) - ourLevel;
  const levelBonus = 1 + Math.max(0, Math.min(0.5, gap / 40));

  const scale = ms.tournament ? ms.tournament.expScale : 1.0;
  const winBonus = ms.homeScore > ms.awayScore ? 1.1 : 1.0;
  const total = levelBonus * scale * winBonus;

  const report = [];

  for (const player of players) {
    const box = ms.box[player.name];
    if (!box || box.min === 0) continue; // 出ていない選手は伸びない

    const gains = {};
    for (const rule of EXP_RULES) {
      const amount = box[rule.per] * rule.rate * player.growth[rule.key] * total;
      if (amount <= 0) continue;

      const before = player.base[rule.key];
      player.base[rule.key] = Math.min(100, before + amount);
      gains[rule.key] = (gains[rule.key] ?? 0) + amount;
    }

    // 画面に出すぶんだけ、整数に丸めてまとめる
    const shown = Object.entries(gains)
      .map(([key, v]) => ({ key, v: Math.round(v * 10) / 10 }))
      .filter(g => g.v >= 0.1);

    if (shown.length) report.push({ player, gains: shown });
  }

  return { report, levelBonus, total };
}


// ---- 9. 試合の開始と終了 ------------------------------

function openMatch() {
  matchState.phase = "setup";
  matchState.opponent = null;
  matchState.tournament = null;
  document.getElementById("match-overlay").classList.remove("hidden");
  renderMatch();
}

// 大会に挑む。練習試合と違い、勝ち進む／敗退するという流れがある。
function openTournament(tournament) {
  const ms = matchState;
  ms.tournament = tournament;
  ms.round = 0;
  ms.bracket = [];       // 各試合の結果を積んでいく
  ms.tournamentEnd = null; // "won" | "lost"
  document.getElementById("match-overlay").classList.remove("hidden");
  startMatch(tournament.rounds[0].school, tournament);
}

function closeMatch() {
  const ms = matchState;

  // 大会が終わっていたら、その週を消費して次の週へ進む
  const wasWinter = ms.tournament?.key === "winter" && ms.tournamentEnd;

  if (ms.tournament && ms.tournamentEnd) {
    state.tournaments[ms.tournament.key] = ms.tournamentEnd;
    tickBuff();
    state.week++;
    ms.tournament = null;
  } else if (!ms.tournament && ms.phase === "done") {
    // 練習試合も1週間を使う。試合をした週は練習できない。
    //
    // 以前は週を消費しなかったので、練習試合が
    // 「タダで経験値が入り、ベンチの疲労も抜ける」手段になっていた。
    // 試合を組むかどうかが選択になっていなかった。
    tickBuff();
    state.week++;
    logFriendlyWeek();
  }

  document.getElementById("match-overlay").classList.add("hidden");
  renderAll(); // 練習画面に疲労と成長を反映する
  saveGame(true);

  // ウィンターカップが終わったら、そこで1年が終わる
  if (wasWinter) openEnding();
}

function startMatch(opponent, tournament = null) {
  const ms = matchState;
  // 相手データは試合中に書き換える（戦術変更）ので、複製して元を汚さない
  ms.opponent = JSON.parse(JSON.stringify(opponent));
  ms.tournament = tournament;
  ms.quarter = 0;
  ms.homeScore = 0;
  ms.awayScore = 0;
  ms.events = [];
  // 相手校にも疲労を持たせる。0にしてしまうと、
  // 「こちらだけ週の疲れを抱えて、相手は万全」という不公平な勝負になる。
  // 向こうにも日々の練習がある、という想定。
  ms.awayFatigue = 12;
  ms.phase = "playing";
  ms.expReport = null;
  ms.skillReport = null;
  // 切り札は1試合につき、攻撃・守備それぞれ1Qだけ
  ms.trumpUsed = { off: false, def: false };

  // 通常戦術に戻す（前の試合で切り札を選んだまま持ち越さない）
  if (isTrump(OFF_TACTICS, ms.offTactic)) ms.offTactic = "MOTION";
  if (isTrump(DEF_TACTICS, ms.defTactic)) ms.defTactic = "MAN";

  // 夏に去った部員が、冬の決勝に現れることがある。
  // 選手の疲労をここで書き換えるので、下の ms.fatigue へ写す前に呼ぶ。
  ms.cheer = checkCheer();

  // 試合前の疲労をそのまま持ち込む。疲れたまま試合に入ると終盤に響く。
  ms.fatigue = {};
  ms.box = {};
  for (const player of players) {
    ms.fatigue[player.name] = player.fatigue;
    ms.box[player.name] = { pts: 0, reb: 0, ast: 0, stl: 0, min: 0 };
  }

  // 出られる選手から、総合力の高い順に5人を初期メンバーにしておく
  const available = players.filter(p => p.injuryWeeks === 0);
  ms.lineup = [...available].sort((a, b) => calcOvr(b) - calcOvr(a)).slice(0, 5);

  renderMatch();
}

// 夏に部を去った者が、ウィンターカップの決勝に応援へ来る。
// 条件は3つ全部そろったときだけ。
//   1. 実際に退部した部員がいる（＝夏に負けている）
//   2. 舞台がウィンターカップ
//   3. そこが決勝
// 夏に届かなかったチームだけが辿り着ける場面なので、
// 全国に出たルートでは絶対に起きない。
function checkCheer() {
  const ms = matchState;
  if (!state.quitter) return null;
  if (!ms.tournament || ms.tournament.key !== "winter") return null;
  if (ms.round !== ms.tournament.rounds.length - 1) return null;

  // 声援で足が動く。決勝を万全に近い状態で戦える。
  for (const player of players) {
    player.fatigue = Math.max(0, player.fatigue - 20);
  }

  const name = state.quitter.name;
  return {
    title: "あの日、部室に来なかった男",
    text: `決勝の朝。体育館の入口に、見慣れた顔が、気まずそうに立っていた。
      夏に部を去った${name}だった。私服のまま、少し痩せて、どこに手を置いていいか分からないみたいに、立ち尽くしている。
      「……見に来た。悪いかよ」
      ぶっきらぼうな言い方は、たぶん、照れ隠しだ。この子は昔から、素直じゃない。
      
      誰も、責めなかった。
      緑川が、無言のまま、タオルを1枚、ぽいと投げ渡した。「座って見てけ」の代わりだった。相変わらず、言葉が一つもない。
      ${name}はそれを受け取って、客席のいちばん前に、ちょこんと座った。
      
      8ヶ月前、8人だった。夏に、1人減った。
      今日、その1人は、客席にいる。コートには戻れない。それでも——ちゃんと、ここにいる。
      
      赤星がコートに向かって歩き出す。桃井のほうを一度だけ見て、小さく頷いた。
      その足取りは、朝、家を出たときより、少しだけ軽かった。`,
  };
}


// ---- 10. 画面 ----------------------------------------

// 相手を選ぶ画面
function renderSetup() {
  const cards = OPPONENTS.map((opp, i) => {
    const derived = calcAllDerived(opp);
    const bars = DERIVED_STATS.map(d => `
      <div class="stat">
        <span class="stat-name">${d.label}</span>
        <div class="stat-track">
          <div class="stat-fill derived" style="width:${derived[d.key]}%"></div>
        </div>
        <span class="stat-value">${derived[d.key]}</span>
      </div>`).join("");

    return `
      <div class="opp-card">
        <div class="player-head">
          ${emblem(opp.name)}
          <span class="player-name">${opp.name}</span>
          <span class="player-pos">${opp.tag}</span>
        </div>
        <div class="menu-desc">${opp.desc}</div>
        <div class="opp-tactics">
          得意な攻め: ${OFF_TACTICS[opp.off].name} ／ 守り: ${DEF_TACTICS[opp.def].name}
        </div>
        ${bars}
        <button class="next-btn small" data-opp="${i}">この相手と戦う</button>
      </div>`;
  }).join("");

  return `
    <div class="match-head">
      <h2>練習試合</h2>
      <button class="close-btn" id="match-close">✕ 閉じる</button>
    </div>
    <p class="match-note">
      <b class="warn-text">練習試合は1週間を使う。</b>
      その週は練習ができず、試合で溜まった疲労はそのまま持ち越される。
      経験を取るか、練習を取るか。
    </p>
    <div class="opp-list">${cards}</div>`;
}

// 戦術を選ぶドロップダウン。
// 使い切った切り札は、選択肢から消す。
function tacticSelect(id, tactics, current) {
  const side = id.startsWith("off") ? "off" : "def";
  const used = matchState.trumpUsed[side];

  const options = Object.entries(tactics).map(([key, t]) => {
    if (t.locked && used) return "";
    const mark = t.locked ? "★ " : "";
    const note = t.locked ? "（切り札・1Qのみ）" : "";
    return `<option value="${key}" ${key === current ? "selected" : ""}>${mark}${t.name}${note}</option>`;
  }).join("");

  return `<select id="${id}" class="assign-select">${options}</select>`;
}

// メンバー表の見出し。パラメータの列が何かを示す。
function lineupHeader() {
  return `
    <div class="lineup-row lineup-head">
      <span></span>
      <span>選手</span>
      <span class="lineup-bar-head">疲労</span>
      ${DERIVED_STATS.map(d => `<span class="num" title="${d.label}">${d.label.slice(0, 2)}</span>`).join("")}
      <span class="lineup-box">成績</span>
      <span></span>
    </div>`;
}

// メンバー1人の行（コート上／ベンチ共通）
// 交代の判断材料が要るので、総合力ではなく試合能力そのものを並べる。
// しかも疲労を反映した「今の数字」を出す。ベンチの選手のほうが
// 数字が高いなら、それが交代の理由になる。
function playerRow(player, onCourt) {
  const ms = matchState;
  const fatigue = Math.round(ms.fatigue[player.name]);
  const box = ms.box[player.name];
  const color = fatigue > 60 ? "fatigue-high" : fatigue > 30 ? "fatigue-mid" : "fatigue-low";
  const drop = Math.round((1 - fatigueMult(fatigue)) * 100);

  // 持っている特殊技能をアイコンで出す
  const skills = player.skills
    .map(k => `<span title="${SKILLS[k].name} — ${SKILLS[k].desc}">${SKILLS[k].icon}</span>`)
    .join("");

  // 試合能力を、疲労を反映した「いまの値」で出す
  const stats = DERIVED_STATS.map(d => {
    const fresh = getStat(player, d.key);
    const now = Math.round(fresh * fatigueMult(fatigue));
    // 疲労で落ちているぶんが分かるように、元の値をツールチップに入れる
    const cls = now >= 65 ? "stat-hi" : now < 45 ? "stat-lo" : "";
    return `<span class="num ${cls}" title="${d.label} ${now}（万全なら ${Math.round(fresh)}）">${now}</span>`;
  }).join("");

  return `
    <div class="lineup-row ${onCourt ? "on-court" : ""}">
      ${portrait(player, "small")}
      <span class="lineup-name">
        <span class="lineup-pos">${player.pos}</span> ${player.name} ${skills}
      </span>
      <div class="stat-track lineup-bar" title="疲労 ${fatigue}／能力が${drop}%落ちている">
        <div class="stat-fill ${color}" style="width:${fatigue}%"></div>
      </div>
      ${stats}
      <span class="lineup-box">${box.pts}点 ${box.reb}R ${box.ast}A</span>
      <button class="swap-btn" data-swap="${player.name}">
        ${onCourt ? "▼" : "▲"}
      </button>
    </div>`;
}

// 試合中の画面
function renderPlaying() {
  const ms = matchState;
  const opp = ms.opponent;
  const bench = players.filter(p => !ms.lineup.includes(p) && p.injuryWeeks === 0);
  // 同点なら4Qを終えていても「まだ終わっていない」
  const finished = ms.quarter >= 4 && ms.homeScore !== ms.awayScore;
  const tied = ms.quarter >= 4 && ms.homeScore === ms.awayScore;

  // 実況ログ（新しい順、多すぎるので直近だけ）
  const events = ms.events.slice(-40).reverse().map(e =>
    `<div class="ev ${e.type}">
      <span class="ev-q">${e.quarter > 4 ? `延${e.quarter - 4}` : `${e.quarter}Q`}</span> ${e.text}
    </div>`
  ).join("");

  // 個人成績
  const box = players
    .filter(p => ms.box[p.name].min > 0)
    .sort((a, b) => ms.box[b.name].pts - ms.box[a.name].pts)
    .map(p => {
      const b = ms.box[p.name];
      return `<tr>
        <td>${p.name}</td><td>${b.min}Q</td>
        <td class="num">${b.pts}</td><td class="num">${b.reb}</td>
        <td class="num">${b.ast}</td><td class="num">${b.stl}</td>
      </tr>`;
    }).join("");

  const canPlay = ms.lineup.length === 5;
  const t = ms.tournament;

  // 大会の勝ち上がり表。
  // 相手の試合能力まで見せる。総合力だけでは戦術が立てられない。
  // 「シュート力が高い相手にゾーンは危ない」と読めることが、
  // このゲームの戦術選択そのものだから。
  const bracket = t ? `
    <div class="bracket">
      ${t.rounds.map((r, i) => {
        const result = ms.bracket.find(b => b.round === i);
        const cls = result ? (result.win ? "won" : "lost") : (i === ms.round ? "current" : "");
        const d = calcAllDerived(r.school);
        return `
          <div class="bracket-item ${cls}">
            <div class="bracket-round">${r.label}</div>
            ${emblem(r.school.name, "small")}
            <div class="bracket-school">${r.school.name}</div>
            <div class="bracket-score">${result ? result.score : `Lv.${r.school.level}`}</div>
            <div class="bracket-stats">
              ${DERIVED_STATS.map(s => `
                <div class="bstat" title="${s.label}">
                  <span class="bstat-name">${s.label.slice(0, 2)}</span>
                  <span class="bstat-value ${d[s.key] >= 65 ? "hi" : ""}">${d[s.key]}</span>
                </div>`).join("")}
            </div>
            <div class="bracket-tactics">
              ${OFF_TACTICS[r.school.off].short} / ${DEF_TACTICS[r.school.def].short}
            </div>
          </div>`;
      }).join("")}
    </div>` : "";

  // 試合で伸びた分の報告
  const exp = ms.expReport && finished ? `
    <div class="exp-box">
      <div class="section-label">
        試合で伸びた能力
        <span class="section-note">
          ${t ? `${t.name}（経験値 ×${t.expScale}）` : "練習試合"}
          ${ms.expReport.levelBonus > 1.05
            ? `／格上補正 ×${ms.expReport.levelBonus.toFixed(2)}` : ""}
        </span>
      </div>
      ${ms.expReport.report.length ? ms.expReport.report.map(r => `
        <div class="exp-line">
          <span class="lineup-name">${r.player.name}</span>
          ${r.gains.map(g =>
            `<span class="exp-gain">${BASE_STATS.find(s => s.key === g.key).label} +${g.v}</span>`
          ).join("")}
        </div>`).join("")
        : `<div class="cond-note">出場した選手がいない</div>`}
    </div>` : "";

  // 試合の中で掴んだ技能。数字の報告より前に、大きく出す。
  const skills = ms.skillReport?.length && finished ? `
    <div class="skill-gained">
      ${ms.skillReport.map(r => `
        <div class="skill-gained-item">
          <div class="skill-gained-head">
            ${portrait(r.player, "mid")}
            <div>
              <div class="skill-gained-title">
                ${SKILLS[r.key].icon} ${r.player.name} が「${SKILLS[r.key].name}」を掴んだ！
              </div>
              <div class="skill-gained-cond">${r.label}</div>
            </div>
          </div>
          <div class="note note-skill">${r.story}</div>
        </div>`).join("")}
    </div>` : "";

  return `
    <div class="match-head">
      <h2>${t ? `${t.icon} ${t.name} ${t.rounds[ms.round].label}` : "練習試合"}
        <span class="head-sub">vs ${ms.opponent.name}</span></h2>
      <button class="close-btn" id="match-close">
        ${t && !ms.tournamentEnd ? "✕ 中断" : "✕ 閉じる"}
      </button>
    </div>
    ${bracket}
    ${ms.cheer ? `
      <div class="cheer-box">
        <div class="story-title">${ms.cheer.title}</div>
        <div class="story-cast">
          ${portraitByName(state.quitter.name, "mid", state.quitter.name)}
        </div>
        <div class="story-text">${ms.cheer.text}</div>
        <div class="cheer-effect">全員の疲労 -20</div>
      </div>` : ""}

    <div class="scoreboard">
      <div class="score-side">
        <div class="score-team">自校</div>
        <div class="score-num ${ms.homeScore > ms.awayScore ? "lead" : ""}">${ms.homeScore}</div>
      </div>
      <div class="score-mid">
        <div class="score-q ${tied ? "tied" : ""}">
          ${finished ? "試合終了" : tied ? "同点！ 延長戦へ" : quarterLabel(ms.quarter)}
        </div>
      </div>
      <div class="score-side">
        <div class="score-team">${emblem(opp.name, "tiny")} ${opp.name}</div>
        <div class="score-num ${ms.awayScore > ms.homeScore ? "lead" : ""}">${ms.awayScore}</div>
      </div>
    </div>

    ${finished ? renderResult() + skills : `
      <div class="tactic-box">
        <div class="tactic-row">
          <label>攻撃</label>${tacticSelect("off-tactic", availableTactics(OFF_TACTICS), ms.offTactic)}
          <span class="tactic-desc">${OFF_TACTICS[ms.offTactic].desc}</span>
        </div>
        <div class="tactic-row">
          <label>守備</label>${tacticSelect("def-tactic", availableTactics(DEF_TACTICS), ms.defTactic)}
          <span class="tactic-desc">${DEF_TACTICS[ms.defTactic].desc}</span>
        </div>
        <div class="scout">
          <div>相手の戦術: <b>${OFF_TACTICS[opp.off].name}</b> / <b>${DEF_TACTICS[opp.def].name}</b></div>
          <div class="scout-stats">
            ${DERIVED_STATS.map(s => {
              const value = calcDerived(opp, s);
              return `<span class="scout-stat" title="${opp.name}の${s.label}">
                ${s.label} <b class="${value >= 65 ? "hi" : ""}">${value}</b>
              </span>`;
            }).join("")}
          </div>
          ${renderTrumpStatus()}
        </div>
      </div>

      <button class="next-btn ${tied ? "cup-btn" : ""}" id="play-q" ${canPlay ? "" : "disabled"}>
        ${!canPlay ? "メンバーを5人にしてください"
          : tied ? `▶ ${quarterLabel(ms.quarter)}を戦う（5分）`
          : `▶ ${quarterLabel(ms.quarter)}を戦う`}
      </button>`}

    <div class="match-cols">
      <div class="lineup-col">
        <div class="section-label">
          コート上 <span class="section-note">${ms.lineup.length}/5 ・ 数字は疲労を反映した今の能力</span>
        </div>
        ${lineupHeader()}
        ${ms.lineup.map(p => playerRow(p, true)).join("")}
        <div class="section-label">ベンチ</div>
        ${bench.map(p => playerRow(p, false)).join("") || `<div class="cond-note">控えなし</div>`}
      </div>
      <div>
        <div class="section-label">個人成績</div>
        <table class="box-table">
          <tr><th>選手</th><th>出場</th><th>得点</th><th>R</th><th>A</th><th>S</th></tr>
          ${box || `<tr><td colspan="6" class="cond-note">まだ試合が始まっていない</td></tr>`}
        </table>
        <div class="section-label">経過</div>
        <div class="events">${events || `<div class="cond-note">—</div>`}</div>
      </div>
    </div>

    ${exp}

    ${finished ? renderDoneButton() : ""}`;
}

// 試合が終わったときの見出し。大会かどうかで意味が変わる。
function renderResult() {
  const ms = matchState;
  const win = ms.homeScore > ms.awayScore;
  const t = ms.tournament;

  if (t && ms.tournamentEnd === "won") {
    return `<div class="result champion">🏆 ${t.name} 優勝！</div>`;
  }
  if (t && ms.tournamentEnd === "lost") {
    return `<div class="result lose">
      ● ${t.rounds[ms.round].label}敗退 ${ms.homeScore} - ${ms.awayScore}
      ${t.key === "kengun" ? `<div class="result-note">全国大会への出場権は得られなかった</div>` : ""}
    </div>`;
  }
  if (t && win) {
    return `<div class="result win">
      ○ ${t.rounds[ms.round].label}突破 ${ms.homeScore} - ${ms.awayScore}
      <div class="result-note">次は ${t.rounds[ms.round + 1].school.name}</div>
    </div>`;
  }
  return `<div class="result ${win ? "win" : "lose"}">
    ${win ? "○ 勝利" : "● 敗戦"} ${ms.homeScore} - ${ms.awayScore}
  </div>`;
}

function renderDoneButton() {
  const ms = matchState;
  // 大会の途中で勝った場合だけ「次の試合へ」になる
  if (ms.tournament && !ms.tournamentEnd) {
    return `<button class="next-btn" id="next-round">▶ 次の試合へ</button>`;
  }
  return `<button class="next-btn" id="match-done">
    ${ms.tournament ? "大会を終える" : "練習に戻る"}
  </button>`;
}

// 切り札の残り。相性が有利か不利かは教えない。
// 相手の戦術は見えているので、そこから読むのは監督の仕事。
function renderTrumpStatus() {
  const ms = matchState;
  const hasOff = Object.keys(availableTactics(OFF_TACTICS)).some(k => OFF_TACTICS[k].locked);
  const hasDef = Object.keys(availableTactics(DEF_TACTICS)).some(k => DEF_TACTICS[k].locked);
  if (!hasOff && !hasDef) return "";

  const part = [];
  if (hasOff) part.push(`攻撃 ${ms.trumpUsed.off ? "使用済み" : "残り1Q"}`);
  if (hasDef) part.push(`守備 ${ms.trumpUsed.def ? "使用済み" : "残り1Q"}`);

  return `<div class="trump-status">切り札（特殊戦術）… ${part.join(" ／ ")}</div>`;
}

// その戦術が切り札（特殊戦術）かどうか
function isTrump(tactics, key) {
  return Boolean(tactics[key]?.locked);
}

function renderMatch() {
  const panel = document.getElementById("match-panel");
  panel.innerHTML = matchState.phase === "setup" ? renderSetup() : renderPlaying();

  // --- 押されたときの動きをつなぐ ---
  document.getElementById("match-close").addEventListener("click", closeMatch);

  panel.querySelectorAll("[data-opp]").forEach(btn => {
    btn.addEventListener("click", () => startMatch(OPPONENTS[Number(btn.dataset.opp)]));
  });

  const playBtn = document.getElementById("play-q");
  if (playBtn) playBtn.addEventListener("click", onPlayQuarter);

  const doneBtn = document.getElementById("match-done");
  if (doneBtn) doneBtn.addEventListener("click", closeMatch);

  const nextBtn = document.getElementById("next-round");
  if (nextBtn) nextBtn.addEventListener("click", nextRound);

  const off = document.getElementById("off-tactic");
  if (off) off.addEventListener("change", e => {
    matchState.offTactic = e.target.value;
    renderMatch();
  });

  const def = document.getElementById("def-tactic");
  if (def) def.addEventListener("change", e => {
    matchState.defTactic = e.target.value;
    renderMatch();
  });

  panel.querySelectorAll("[data-swap]").forEach(btn => {
    btn.addEventListener("click", () => onSwap(btn.dataset.swap));
  });
}


// ---- 11. 操作 ----------------------------------------

// コート⇔ベンチの入れ替え
function onSwap(name) {
  const ms = matchState;
  const player = players.find(p => p.name === name);
  const index = ms.lineup.indexOf(player);

  if (index >= 0) {
    ms.lineup.splice(index, 1);        // 下げる
  } else if (ms.lineup.length < 5) {
    ms.lineup.push(player);            // 出す
  } else {
    return; // すでに5人。誰かを下げてから
  }
  renderMatch();
}

function onPlayQuarter() {
  const ms = matchState;

  // 切り札を使ったクォーターかどうかを、走らせる前に控えておく
  const usedOff = isTrump(OFF_TACTICS, ms.offTactic);
  const usedDef = isTrump(DEF_TACTICS, ms.defTactic);

  simulateQuarter();

  // 使ったら、次のクォーターからは通常戦術に戻る。1Qだけの切り札。
  if (usedOff) {
    ms.trumpUsed.off = true;
    ms.offTactic = "MOTION";
  }
  if (usedDef) {
    ms.trumpUsed.def = true;
    ms.defTactic = "MAN";
  }

  // 同点のままでは終われない。バスケに引き分けはないので延長戦へ。
  // ここを「4Q終わったら終了」にしていたせいで、
  // 83-83 の決勝が敗戦として記録されていた。
  const decided = ms.homeScore !== ms.awayScore;
  if (ms.quarter >= 4 && decided) finishMatch();
  else renderMatch();
}


function finishMatch() {
  const ms = matchState;
  ms.phase = "done";
  const win = ms.homeScore > ms.awayScore;

  // 試合の疲労を、練習パートの疲労として引き継ぐ
  for (const player of players) {
    player.fatigue = Math.min(100, ms.fatigue[player.name]);
  }

  // 試合をした結果、選手が伸びる
  ms.expReport = applyMatchExperience();

  // その試合の中身に応じて、技能を掴むことがある
  ms.skillReport = rollMatchSkillsForAll(win);

  // --- 大会なら、勝ち進むか敗退かを決める ---
  if (ms.tournament) {
    ms.bracket.push({ round: ms.round, win, score: `${ms.homeScore}-${ms.awayScore}` });

    if (!win) {
      ms.tournamentEnd = "lost";
    } else if (ms.round >= ms.tournament.rounds.length - 1) {
      ms.tournamentEnd = "won";
      applyChampionBonus();
    }
  }

  recordHistory(win);
  logMatchResult(win);
  renderMatch();
}

// 練習試合で1週使ったことを、活動記録にも残す
function logFriendlyWeek() {
  state.log.unshift({
    week: getDateLabel(state.week - 1),
    school: "🏀 練習試合",
    lines: [{
      name: "—", menu: "", baseText: "", derivedText: "",
      event: "試合をしたため、この週の練習はなし", status: "school",
    }],
  });
}

// 戦歴に1試合を残す。通算成績もここで積む。
function recordHistory(win) {
  const ms = matchState;

  // 出場した選手の成績を通算に足す
  const box = {};
  for (const player of players) {
    const b = ms.box[player.name];
    if (!b || b.min === 0) continue;
    box[player.name] = { ...b };
    player.career.games++;
    for (const key of ["pts", "reb", "ast", "stl", "min"]) {
      player.career[key] += b[key];
    }
  }

  // その試合の最多得点者
  const top = Object.entries(box).sort((a, b) => b[1].pts - a[1].pts)[0];

  state.history.unshift({
    date: getDateLabel(state.week),
    week: state.week,
    kind: ms.tournament ? ms.tournament.key : "friendly",
    label: ms.tournament
      ? `${ms.tournament.icon} ${ms.tournament.name} ${ms.tournament.rounds[ms.round].label}`
      : "🏀 練習試合",
    opponent: ms.opponent.name,
    level: ms.opponent.level ?? null,
    home: ms.homeScore,
    away: ms.awayScore,
    win,
    top: top ? { name: top[0], pts: top[1].pts } : null,
    box,
  });
}

// 出場した全員に、技能習得の判定をかける。
// 判定の材料は「その試合で何をしたか」なので、試合が終わってから呼ぶ。
function rollMatchSkillsForAll(win) {
  const ms = matchState;
  const ctx = {
    win,
    margin: Math.abs(ms.homeScore - ms.awayScore),
    official: Boolean(ms.tournament), // 公式戦は20%、練習試合は10%
  };

  const got = [];
  for (const player of players) {
    const box = ms.box[player.name];
    if (!box || box.min === 0) continue; // 出ていない選手は掴みようがない

    const result = rollMatchSkills(player, box, {
      ...ctx,
      endFatigue: ms.fatigue[player.name],
    });
    if (result) got.push(result);
  }
  return got;
}

// 次の試合へ（大会の勝ち上がり）
function nextRound() {
  const ms = matchState;
  ms.round++;

  // 連戦なので疲労は残るが、大会には休養日がある。
  // ここが小さすぎると、決勝に着く頃には全員が限界になって勝負にならない。
  for (const player of players) {
    player.fatigue = Math.max(0, player.fatigue - 25);
  }

  startMatch(ms.tournament.rounds[ms.round].school, ms.tournament);
}

// 優勝したチームには自信がつく
function applyChampionBonus() {
  for (const player of players) {
    player.base.iq = Math.min(100, player.base.iq + 2);
  }
  setBuff(1.25, 3, `${matchState.tournament.name}優勝の勢い`);
}

function logMatchResult(win) {
  const ms = matchState;
  const label = ms.tournament
    ? `${ms.tournament.name} ${ms.tournament.rounds[ms.round].label}`
    : "練習試合";

  // 誰がどれだけ伸びたかを1行にまとめる
  const expLines = (ms.expReport?.report ?? []).map(r => ({
    name: r.player.name,
    menu: "試合経験",
    baseText: r.gains
      .map(g => `${BASE_STATS.find(s => s.key === g.key).label}+${g.v}`)
      .join(" "),
    derivedText: "",
    event: "",
    status: "trained",
  }));

  // 掴んだ技能。試合画面を閉じると消えてしまうので、記録に残す。
  const skillLines = (ms.skillReport ?? []).map(r => ({
    name: r.player.name,
    menu: "",
    baseText: "",
    derivedText: "",
    event: `★「${SKILLS[r.key].name}」を掴んだ（${r.label}）`,
    status: "returned",
  }));

  state.log.unshift({
    week: getDateLabel(state.week),
    school: `${ms.tournament ? ms.tournament.icon : "🏀"} ${label}`,
    lines: [
      {
        name: ms.opponent.name, menu: "",
        baseText: "", derivedText: "",
        event: `${win ? "○ 勝利" : "● 敗戦"} ${ms.homeScore} - ${ms.awayScore}`,
        status: win ? "returned" : "broke",
      },
      ...skillLines,
      ...expLines,
    ],
  });
}
