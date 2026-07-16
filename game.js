// ======================================================
// ウィンターカップへの道 — ステップ1.5
//
// パラメータは2層構造になっている。
//   基礎パラメータ … 練習で直接伸びる。選手の「素材」。
//   試合能力       … 基礎から計算される。直接は伸ばせない。
//                    試合の勝敗はこちらを使う。
// ======================================================


// ---- 1. 基礎パラメータ（練習で伸ばせるのはここだけ）----
const BASE_STATS = [
  { key: "power",   label: "パワー",     desc: "筋力・体幹。当たり負けしない強さ" },
  { key: "speed",   label: "スピード",   desc: "走力・敏捷性。抜く力と追う力" },
  { key: "stamina", label: "スタミナ",   desc: "持久力。試合終盤まで動けるか" },
  { key: "jump",    label: "ジャンプ",   desc: "跳躍力。リバウンドとブロック" },
  { key: "tech",    label: "テクニック", desc: "技術・器用さ。手足の精度" },
  { key: "iq",      label: "バスケIQ",   desc: "判断力・視野・読み" },
];


// ---- 2. 試合能力とその計算式 --------------------------
// weights の合計は必ず 1.0 にする。そうすれば計算結果も 0〜100 に収まる。
// この表を書き換えるだけでゲームバランスが変わる、いちばん大事な場所。
const DERIVED_STATS = [
  {
    key: "shoot", label: "シュート力",
    weights: { tech: 0.50, iq: 0.25, power: 0.15, jump: 0.10 },
  },
  {
    key: "drive", label: "ドリブル力",
    weights: { tech: 0.45, speed: 0.30, power: 0.15, iq: 0.10 },
  },
  {
    key: "pass", label: "パス力",
    weights: { iq: 0.50, tech: 0.35, power: 0.10, speed: 0.05 },
  },
  {
    key: "defense", label: "ディフェンス力",
    weights: { speed: 0.30, stamina: 0.25, power: 0.25, iq: 0.20 },
  },
  {
    key: "rebound", label: "リバウンド力",
    weights: { jump: 0.40, power: 0.35, iq: 0.15, speed: 0.10 },
  },
];


// ---- 3. ポジションごとの重要度 ------------------------
// 同じ能力でも、ポジションによって価値が違う。
// センターのパス力より、ポイントガードのパス力のほうが重い。
// 総合力(OVR)はこの重みで計算する。
const POSITION_WEIGHTS = {
  PG: { pass: 0.30, drive: 0.30, shoot: 0.20, defense: 0.15, rebound: 0.05 },
  SG: { shoot: 0.35, drive: 0.25, defense: 0.20, pass: 0.10, rebound: 0.10 },
  SF: { shoot: 0.25, defense: 0.25, drive: 0.20, rebound: 0.20, pass: 0.10 },
  PF: { rebound: 0.30, defense: 0.30, shoot: 0.20, drive: 0.10, pass: 0.10 },
  C:  { rebound: 0.35, defense: 0.35, shoot: 0.15, pass: 0.10, drive: 0.05 },
};


// ---- 4. 部員データ -----------------------------------
// base    : 基礎パラメータの現在値（0〜100）
// growth  : 固有の成長率。1.0が普通、1.4なら4割増しで伸びる。
//           「同じ練習でも伸び方が違う」の正体。
// durable : 頑丈さ。1.0が普通。数字が小さいほど故障しやすい。
const players = [
  {
    // 走れて視野が広いが線が細い。パス型PG。体は強くない。
    name: "赤星 蓮", pos: "PG", year: 1,
    base:   { power: 32, speed: 62, stamina: 55, jump: 45, tech: 58, iq: 64 },
    growth: { power: 0.7, speed: 1.3, stamina: 1.1, jump: 0.9, tech: 1.2, iq: 1.4 },
    durable: 0.8,
  },
  {
    // 手先が器用なシューター。守備は課題。
    name: "青木 樹", pos: "SG", year: 2,
    base:   { power: 40, speed: 48, stamina: 44, jump: 50, tech: 68, iq: 46 },
    growth: { power: 0.9, speed: 0.9, stamina: 0.8, jump: 1.0, tech: 1.4, iq: 1.0 },
    durable: 1.0,
  },
  {
    // 全部そこそこ。伸びしろも平均的な万能型。頑丈さが取り柄。
    name: "黒田 迅", pos: "SF", year: 2,
    base:   { power: 52, speed: 54, stamina: 58, jump: 52, tech: 50, iq: 52 },
    growth: { power: 1.1, speed: 1.0, stamina: 1.2, jump: 1.0, tech: 1.0, iq: 1.1 },
    durable: 1.3,
  },
  {
    // 跳ぶ怪物。身体能力だけで、それ以外は何も無い。
    // ジャンプ76は部内最高、バスケIQ22は部内最低。
    // 伸びしろは全員の中で最大（ジャンプ成長率1.5）だが、
    // 頑丈さ0.6で、追い込むと真っ先にケガをする。
    // 緑川とは「跳ぶ／跳ばない」で正反対に作ってある。
    name: "白石 大河", pos: "PF", year: 1,
    base:   { power: 58, speed: 46, stamina: 48, jump: 76, tech: 24, iq: 22 },
    growth: { power: 1.4, speed: 1.0, stamina: 1.2, jump: 1.5, tech: 0.9, iq: 0.7 },
    durable: 0.6,
  },
  {
    // 動かない壁。跳ばない。走れない。それでも誰も通れない。
    // パワー76と読み（IQ54）で守るタイプで、白石とは正反対。
    // スピード26は部内最低だが、頑丈さ1.3は部内最高。ケガをしない。
    // 伸びるのはIQ（1.3）。年を追うごとに「読む」センターになる。
    name: "緑川 壮真", pos: "C", year: 2,
    base:   { power: 76, speed: 26, stamina: 58, jump: 52, tech: 32, iq: 54 },
    growth: { power: 1.2, speed: 0.5, stamina: 1.1, jump: 0.8, tech: 0.7, iq: 1.3 },
    durable: 1.3,
  },
  {
    // 頭は良いが身体能力が足りない。控えPG。線が細い。
    name: "紫藤 圭", pos: "PG", year: 1,
    base:   { power: 30, speed: 46, stamina: 45, jump: 38, tech: 48, iq: 58 },
    growth: { power: 0.8, speed: 1.0, stamina: 1.0, jump: 0.8, tech: 1.1, iq: 1.2 },
    durable: 0.9,
  },
  {
    // 無尽蔵のスタミナ。走り勝つタイプ。いくら走らせても平気。
    name: "桃井 隼", pos: "SG", year: 1,
    base:   { power: 42, speed: 58, stamina: 70, jump: 48, tech: 40, iq: 38 },
    growth: { power: 1.0, speed: 1.2, stamina: 1.4, jump: 1.0, tech: 0.9, iq: 0.9 },
    durable: 1.4,
  },
  {
    // 目立たないが穴がない。守備要員。
    name: "灰谷 悠", pos: "SF", year: 2,
    base:   { power: 48, speed: 50, stamina: 48, jump: 46, tech: 44, iq: 50 },
    growth: { power: 1.0, speed: 0.9, stamina: 0.9, jump: 0.9, tech: 1.0, iq: 1.1 },
    durable: 1.0,
  },
];

// 全員に、試合と週の進行で使う状態を持たせる。
// データ本体には書かず、ここでまとめて足すことで、上の表を読みやすく保つ。
function initPlayer(player) {
  player.fatigue = 10;    // 疲労（0〜100）
  player.injuryWeeks = 0; // 故障で離脱する残り週数
  player.skills = [];     // 習得した特殊技能（events.js の SKILLS のキー）
  // 通算成績。試合を重ねるほど積み上がる。
  player.career = { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, min: 0 };
  player.injuryCount = 0; // 故障した回数。マネージャーの手帳が拾う。
  return player;
}

players.forEach(initPlayer);


// ---- 4.5 部員の並び順 ---------------------------------
// ポジション順（PG→SG→SF→PF→C）に並べる。
// バスケの名簿はこの順で見るものなので、能力順や入部順よりずっと読みやすい。
const POS_ORDER = ["PG", "SG", "SF", "PF", "C"];

function sortRoster() {
  players.sort((a, b) => {
    const diff = POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos);
    if (diff !== 0) return diff;
    return b.year - a.year; // 同じポジションなら上級生が先
  });
}

sortRoster();

// 部員を1人加える（転校生）
function addPlayer(data) {
  const player = initPlayer({ ...data });
  players.push(player);
  state.assign[player.name] = DEFAULT_MENU;
  sortRoster();
  return player;
}

// 部員を1人減らす（退部）
function removePlayer(player) {
  const index = players.indexOf(player);
  if (index >= 0) players.splice(index, 1);
  delete state.assign[player.name];
  // 試合画面が抱えている参照も切っておく
  if (matchState.lineup) {
    matchState.lineup = matchState.lineup.filter(p => p !== player);
  }
}

// 名前で部員を探す（ストーリーが特定の選手を指すため）
function getPlayer(name) {
  return players.find(p => p.name === name);
}


// ---- 5. 練習メニュー ---------------------------------
// effects は「基礎パラメータ」を対象にする。試合能力は直接は狙えない。
//   シュート力を上げたければ、テクニックとIQを伸ばすしかない。
// load は疲労の溜まりやすさ。
//   毎週6は自然に回復するので、load 6未満のメニューは疲労が抜けていく。
//
// 設計の原則: 「伸び」と「負荷」は必ず釣り合わせる。
//   よく伸びるのに疲れないメニューがあると、それを選び続けるだけになり、
//   疲労管理という仕組みそのものが死ぬ。
//   例外は戦術ミーティングだけ。伸びが小さい代わりに、休みながら進める。
//
// 対象パラメータも重ねない。1メニュー = 1つの主目的。
//   技術練習とミーティングが両方テクニックとIQを伸ばしていたのでは、
//   どちらを選ぶかが「疲れない方」の一択になってしまう。
const MENUS = [
  {
    name: "ウェイトトレーニング", key: "weight",
    desc: "パワー中心。当たり負けしない体を作る。",
    effects: { power: 2.2, stamina: 0.4 },
    load: 16,
  },
  {
    name: "アジリティ", key: "agility",
    desc: "スピード中心。切り返しと初速。",
    effects: { speed: 2.2, stamina: 0.5 },
    load: 14,
  },
  {
    name: "走り込み", key: "run",
    desc: "地味だが効く。スタミナ全振り。",
    effects: { stamina: 2.5, speed: 0.4 },
    load: 18,
  },
  {
    name: "ジャンプ強化", key: "jump",
    desc: "跳躍力。リバウンド争いの土台。膝に来る。",
    effects: { jump: 2.2, power: 0.6 },
    load: 15,
  },
  {
    name: "技術練習", key: "tech",
    desc: "ハンドリングとシューティング。反復あるのみ。",
    effects: { tech: 2.2 },
    load: 12,
  },
  {
    name: "戦術ミーティング", key: "meeting",
    desc: "座学。伸びは小さいが、休みながら賢くなれる。",
    effects: { iq: 1.4 },
    load: 2,
  },
  {
    name: "実戦形式", key: "scrimmage",
    desc: "紅白戦。全部が少しずつ伸びるが、いちばん疲れる。",
    effects: { power: 0.4, speed: 0.6, stamina: 0.7, jump: 0.4, tech: 0.8, iq: 0.9 },
    load: 20,
  },
  {
    name: "休養", key: "rest",
    desc: "休ませる。伸びないが、疲労が大きく抜ける。",
    effects: {},
    load: 0,
    rest: 30, // 追加で回復する量
  },

  // --- ここから下は上位練習 ---
  // 同じ練習を積み重ねると解禁される。
  //
  // 注意して読むべき点: 上位練習は「疲労あたりの伸び」ではむしろ基本練習に劣る。
  //   ウェイト   伸び2.6 / 疲労10 = 0.26
  //   加重ウェイト 伸び3.9 / 疲労18 = 0.22
  // それでも価値があるのは、シーズンが36週しかないからだ。
  // 疲労は休めば戻るが、週は戻らない。「1週あたりの伸び」を買うために、
  // 効率の悪さを承知で踏み込む——それが上位練習。
  // だから「解禁したから全部これにする」は成立しない。ケガ人が出る。
  {
    name: "加重ウェイト", key: "weight2", upgradeOf: "weight", locked: true,
    desc: "限界まで挙げる。パワーの伸びが跳ね上がる。",
    effects: { power: 3.4, stamina: 0.5 },
    load: 24,
  },
  {
    name: "SAQトレーニング", key: "agility2", upgradeOf: "agility", locked: true,
    desc: "加速・減速・方向転換を分解して鍛える。",
    effects: { speed: 3.4, stamina: 0.6 },
    load: 21,
  },
  {
    name: "インターバル走", key: "run2", upgradeOf: "run", locked: true,
    desc: "全力と小休止の繰り返し。心臓が悲鳴を上げる。",
    effects: { stamina: 3.6, speed: 0.8 },
    load: 26,
  },
  {
    name: "プライオメトリクス", key: "jump2", upgradeOf: "jump", locked: true,
    desc: "爆発的な跳躍。効果は絶大、膝への負担も絶大。",
    effects: { jump: 3.4, power: 0.8 },
    load: 23,
  },
  {
    name: "個別技術指導", key: "tech2", upgradeOf: "tech", locked: true,
    desc: "一人ひとりの癖を矯正する。地味だが確実。",
    effects: { tech: 3.4 },
    load: 18,
  },
  {
    name: "映像分析", key: "meeting2", upgradeOf: "meeting", locked: true,
    desc: "相手と自分を映像で解剖する。休みながら伸びる、唯一の上位練習。",
    effects: { iq: 2.4 },
    load: 4,
  },
  {
    name: "紅白戦（強度高）", key: "scrimmage2", upgradeOf: "scrimmage", locked: true,
    desc: "本番同様の強度。全部が伸びるが、ケガと隣り合わせ。",
    effects: { power: 0.6, speed: 0.9, stamina: 1.0, jump: 0.6, tech: 1.2, iq: 1.3 },
    load: 28,
  },
];

// 上位練習が解禁されるのに必要な熟練度。
// 全員で1週やると +1.0 なので、6 は「全員で6週ぶん」。
//
// 10にしていたときは、3種類に絞っても1つしか解禁できなかった。
// 36週のうち、大会で3週・行事で4週が消え、疲労を抜くための休養も要る。
// 実際に練習できるのは20週ほどしかない。10は机上の数字だった。
// 6なら、2種類で2つ、3種類で3つ。散らせば0のまま。
const MASTERY_NEEDED = 6;

// メニューを key から引く
function getMenu(key) {
  return MENUS.find(m => m.key === key);
}

// その練習が今使えるか
function isMenuAvailable(menu) {
  if (!menu.locked) return true;
  return (state.mastery[menu.upgradeOf] ?? 0) >= MASTERY_NEEDED;
}

// 上位練習が存在するメニューについて、その上位版を返す
function getUpgrade(menu) {
  return MENUS.find(m => m.upgradeOf === menu.key);
}


// ---- 6. ゲームの状態 ---------------------------------
// 4月1週目から12月4週目まで。9ヶ月 × 4週 = 36週。
// カレンダーの表示（9ヶ月ぶん）とこの数字は必ず一致させること。
const TOTAL_WEEKS = 36;

const DEFAULT_MENU = MENUS.findIndex(m => m.key === "scrimmage");

const state = {
  week: 0,   // 経過週数（0 = 4月1週目）
  log: [],
  // 誰にどのメニューをやらせるか。{ 選手名: MENUSの番号 }
  // 最初は全員「実戦形式」にしておく。
  assign: Object.fromEntries(players.map(p => [p.name, DEFAULT_MENU])),
  buff: null,      // 練習効率のバフ { mult, weeks, text }。なければ null
  unlocked: [],    // イベントで習得した特殊戦術のキー
  tournaments: {}, // 大会の結果 { kengun: "won" | "lost" | "skipped" }
  // 練習の熟練度 { メニューkey: 積み重ね }。
  // 全員で1週やると +1.0。半分の人数なら +0.5。
  // MASTERY_NEEDED に達すると上位練習が解禁される。
  mastery: {},
  history: [],     // 戦歴（試合の記録）
  storySeen: [],   // 既に流したメインストーリーの週
  choicesMade: {}, // 選択式イベントで選んだもの { key: 選んだ選択肢のkey }
  quitter: null,   // 退部した部員（冬に効いてくる）
};


// ---- 7. 計算まわり -----------------------------------

// 週から「◯月◯週目」を作る。4月始まりなので3を足してから12で割る。
function getDateLabel(week) {
  const month = ((3 + Math.floor(week / 4)) % 12) + 1;
  const weekOfMonth = (week % 4) + 1;
  return `${month}月 ${weekOfMonth}週目`;
}

// 基礎パラメータから試合能力を1つ計算する。
// 重み付き平均なので、weightsの合計が1.0なら結果も0〜100に収まる。
function calcDerived(player, derived) {
  let total = 0;
  for (const [baseKey, weight] of Object.entries(derived.weights)) {
    total += player.base[baseKey] * weight;
  }
  return Math.round(total);
}

// 選手の試合能力5つをまとめて計算する。
function calcAllDerived(player) {
  const result = {};
  for (const d of DERIVED_STATS) {
    result[d.key] = calcDerived(player, d);
  }
  return result;
}

// 総合力(OVR)。試合能力をポジションの重要度で重み付けした平均。
function calcOvr(player) {
  const derived = calcAllDerived(player);
  const weights = POSITION_WEIGHTS[player.pos];
  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += derived[key] * weight;
  }
  return Math.round(total);
}


// ---- 7.5 疲労のルール --------------------------------
// 疲労まわりの数字はこの4つの関数に閉じ込めてある。
// バランス調整したくなったら、ここだけ触ればいい。

const NATURAL_RECOVERY = 6; // 何もしなくても毎週これだけ回復する

// 疲労が成長効率にどう響くか。30までは無傷、そこから落ちていく。
function calcEfficiency(fatigue) {
  if (fatigue <= 30) return 1.0;
  return Math.max(0.4, 1.0 - (fatigue - 30) * 0.008); // 疲労100で40%まで落ちる
}

// 今週たまる疲労。スタミナが高いほど溜まりにくい。
// スタミナ30なら1.15倍、スタミナ90なら0.85倍。
function calcFatigueGain(player, menu) {
  const staminaMult = 1.3 - player.base.stamina / 200;
  return menu.load * staminaMult;
}

// 故障する確率。疲労60から危険域に入る。頑丈さで割り引く。
function calcInjuryRisk(player) {
  if (player.fatigue <= 60) return 0;
  return ((player.fatigue - 60) * 0.005) / player.durable;
}

// 疲労から状態名を決める。画面に出すのは数字よりこちらが分かりやすい。
function getCondition(player) {
  if (player.injuryWeeks > 0) return { label: "故障中", cls: "cond-injury" };
  const f = player.fatigue;
  if (f <= 25) return { label: "好調", cls: "cond-good" };
  if (f <= 55) return { label: "普通", cls: "cond-normal" };
  if (f <= 75) return { label: "疲労", cls: "cond-tired" };
  return { label: "限界", cls: "cond-limit" };
}

// 計算式を人が読める文字列にする（画面のツールチップ用）。
function describeFormula(derived) {
  return Object.entries(derived.weights)
    .sort((a, b) => b[1] - a[1]) // 影響の大きい順に並べる
    .map(([key, w]) => {
      const label = BASE_STATS.find(s => s.key === key).label;
      return `${label} ${Math.round(w * 100)}%`;
    })
    .join(" + ");
}


// ---- 8. 練習を1週分おこなう --------------------------

// 選手1人の1週間。練習して、疲れて、ときどきケガをする。
//
// mods は、その週にかかっている外的な条件をまとめたもの。
//   合宿なら growth 1.7 / fatigue 1.8、テスト週なら forced（練習なし）。
// 学校行事もバフも、ぜんぶこの1つの引数に集約して渡す。
// そうすれば trainPlayer 自身は「誰のせいで倍率が変わったか」を知らずに済む。
function trainPlayer(player, menu, mods = {}) {
  const growthMult = mods.growth ?? 1;
  const fatigueMult = mods.fatigue ?? 1;

  // --- 故障中は練習させられない。休んで治すだけ ---
  if (player.injuryWeeks > 0) {
    player.injuryWeeks--;
    player.fatigue = Math.max(0, player.fatigue - 20);
    return {
      player, menu,
      status: player.injuryWeeks > 0 ? "injured" : "returned",
      gains: {}, derivedGains: {},
    };
  }

  // --- 学校行事などで、そもそも練習がない週 ---
  if (mods.forced) {
    player.fatigue = Math.max(0, player.fatigue - NATURAL_RECOVERY - (mods.recover ?? 0));
    return { player, menu, status: "school", gains: {}, derivedGains: {} };
  }

  // --- 練習する ---
  const efficiency = calcEfficiency(player.fatigue); // 疲れていると伸びない
  const gains = {};
  const derivedBefore = calcAllDerived(player); // 差分を出すため控えておく

  for (const [key, base] of Object.entries(menu.effects)) {
    // 上昇量 = 基礎値 × 成長率 × ゆらぎ(0.7〜1.3) × 疲労効率 × その週の倍率
    const random = 0.7 + Math.random() * 0.6;
    let gain = base * player.growth[key] * random * efficiency * growthMult;

    // 高い能力ほど伸びにくい。全員が100に張り付くのを防ぐ。
    if (player.base[key] > 80) gain *= 0.4;
    else if (player.base[key] > 65) gain *= 0.7;

    const before = player.base[key];
    player.base[key] = Math.min(100, before + gain);

    // 表示用に「整数で何ポイント上がったか」を記録
    const shown = Math.floor(player.base[key]) - Math.floor(before);
    if (shown > 0) gains[key] = shown;
  }

  // 基礎が上がった結果、試合能力がいくつ上がったかを計算
  const derivedAfter = calcAllDerived(player);
  const derivedGains = {};
  for (const d of DERIVED_STATS) {
    const diff = derivedAfter[d.key] - derivedBefore[d.key];
    if (diff > 0) derivedGains[d.key] = diff;
  }

  // --- 故障判定 ---
  // 「疲れた体で練習に入った」からケガをする。だから疲労を更新する前に判定する。
  // 順番を逆にすると、休養させた週に故障するような妙なことが起きる。
  const risk = calcInjuryRisk(player);
  const broke = Math.random() < risk;

  // --- 疲労の増減 ---
  const fatigueGain = calcFatigueGain(player, menu) * fatigueMult + (mods.extraFatigue ?? 0);
  const recovery = NATURAL_RECOVERY + (menu.rest || 0) + (mods.recover ?? 0);
  player.fatigue = Math.max(0, Math.min(100, player.fatigue + fatigueGain - recovery));

  if (broke) {
    player.injuryWeeks = 1 + Math.floor(Math.random() * 3); // 1〜3週の離脱
    player.fatigue = Math.max(0, player.fatigue - 10);
    player.injuryCount++;
    return { player, menu, status: "broke", gains, derivedGains };
  }

  return {
    player, menu,
    status: menu.rest ? "rest" : "trained",
    efficiency,
    gains, derivedGains,
  };
}

// その週にかかっている条件を1つにまとめる。
// 学校行事とバフは別々の仕組みだが、選手から見れば「今週の条件」でしかない。
function getWeekMods() {
  const event = getSchoolEvent(state.week);
  const buffMult = state.buff ? state.buff.mult : 1;

  return {
    growth: (event?.growth ?? 1) * buffMult, // 合宿とバフは掛け算で重なる
    fatigue: event?.fatigue ?? 1,
    recover: event?.recover ?? 0,
    extraFatigue: event?.extraFatigue ?? 0,
    forced: event?.forced ?? false,
    event,
  };
}

// 全員が「それぞれに指示されたメニュー」を1週間おこなう。
function doWeek() {
  const mods = getWeekMods();
  const results = players.map(player => {
    const menu = MENUS[state.assign[player.name]];
    return trainPlayer(player, menu, mods);
  });

  // 練習の熟練度を積む。行事で練習が流れた週は積まない。
  if (!mods.forced) {
    for (const result of results) {
      if (result.status !== "trained") continue; // 休養・故障中は熟練にならない
      const key = result.menu.key;
      state.mastery[key] = (state.mastery[key] ?? 0) + 1 / players.length;
    }
  }

  return results;
}


// ---- 9. ログに1週分を追加 -----------------------------
function addLog(results, schoolEvent) {
  const lines = results.map(r => {
    const baseText = Object.entries(r.gains)
      .map(([key, v]) => `${BASE_STATS.find(s => s.key === key).label}+${v}`)
      .join(" ");

    const derivedText = Object.entries(r.derivedGains)
      .map(([key, v]) => `${DERIVED_STATS.find(s => s.key === key).label}+${v}`)
      .join(" ");

    // 状態によって、メニュー名の代わりに出来事を書く
    let event = "";
    if (r.status === "broke") event = `⚠ 故障！ ${r.player.injuryWeeks}週の離脱`;
    else if (r.status === "injured") event = `離脱中（残り${r.player.injuryWeeks}週）`;
    else if (r.status === "returned") event = "✓ 練習に復帰";
    else if (r.status === "school") event = "学校行事のため練習なし";
    // 疲れて効率が落ちているときは警告を出す
    else if (r.efficiency < 0.75) event = `疲労で効率${Math.round(r.efficiency * 100)}%`;

    return {
      name: r.player.name,
      menu: r.status === "trained" || r.status === "rest" ? r.menu.name : "—",
      baseText, derivedText, event,
      status: r.status,
    };
  });

  state.log.unshift({
    week: getDateLabel(state.week),
    school: schoolEvent ? `${schoolEvent.icon} ${schoolEvent.name}` : "",
    lines,
  });
}


// ---- 10. 画面の描画 ----------------------------------

// 直前の練習で上がった項目を覚えておき、緑色で表示するために使う
let lastGained = {};
// 直前に起きた特殊イベント（画面上部に大きく出す）
let lastEvent = null;
// 直前に進んだメインストーリー
let lastStory = null;
// 直前に選んだ選択肢の結果。
// pendingChoice は「選んだ直後の1回だけ表示する」ための受け渡し用。
// answerChoice が onNextWeek を呼ぶので、onNextWeek の頭で単純に
// lastChoice を消すと、選んだ結果がその場で消えてしまう。
let lastChoice = null;
let pendingChoice = null;

function renderRoster() {
  const box = document.getElementById("roster");
  box.innerHTML = "";

  for (const player of players) {
    const derived = calcAllDerived(player);
    // いま指示しているメニューが、どの基礎パラメータを狙っているか
    const assignedMenu = MENUS[state.assign[player.name]];
    const condition = getCondition(player);
    const injured = player.injuryWeeks > 0;

    const card = document.createElement("div");
    card.className = `player ${injured ? "injured" : ""}`;

    // 基礎パラメータ（練習で伸ばせる）
    const baseRows = BASE_STATS.map(s => {
      const value = Math.floor(player.base[s.key]);
      const gained = lastGained[player.name]?.gains?.[s.key];
      const rate = player.growth[s.key];
      // 成長率が高い項目に印をつける。育成方針を決める手がかりになる。
      const mark = rate >= 1.3 ? "◎" : rate >= 1.1 ? "○" : rate <= 0.8 ? "▲" : "";
      // 今週の練習で伸びる項目に印をつける（選ぶ前に効果が分かるように）
      const targeted = assignedMenu.effects[s.key] ? "targeted" : "";
      return `
        <div class="stat ${targeted}" title="成長率 ${rate.toFixed(1)} — ${s.desc}">
          <span class="stat-name">${s.label}<span class="growth-mark">${mark}</span></span>
          <div class="stat-track">
            <div class="stat-fill" style="width:${value}%"></div>
          </div>
          <span class="stat-value ${gained ? "gained" : ""}">${value}</span>
        </div>`;
    }).join("");

    // 試合能力（基礎から計算される）
    const derivedRows = DERIVED_STATS.map(d => {
      const value = derived[d.key];
      const gained = lastGained[player.name]?.derivedGains?.[d.key];
      return `
        <div class="stat" title="${d.label} = ${describeFormula(d)}">
          <span class="stat-name">${d.label}</span>
          <div class="stat-track">
            <div class="stat-fill derived" style="width:${value}%"></div>
          </div>
          <span class="stat-value ${gained ? "gained" : ""}">${value}</span>
        </div>`;
    }).join("");

    // この選手の練習メニューを選ぶドロップダウン。
    // まだ解禁していない上位練習は出さない。
    const options = MENUS.map((m, i) => {
      if (!isMenuAvailable(m)) return "";
      const selected = state.assign[player.name] === i ? "selected" : "";
      return `<option value="${i}" ${selected}>${m.locked ? "▲ " : ""}${m.name}</option>`;
    }).join("");

    // コンディション欄。疲労バーと、今週の見込みを出す。
    const fatigue = Math.round(player.fatigue);
    const efficiency = Math.round(calcEfficiency(player.fatigue) * 100);
    const risk = Math.round(calcInjuryRisk(player) * 100);
    // 疲労バーの色。30(効率が落ち始める)と60(故障の危険域)が境目。
    const fatigueColor =
      fatigue > 60 ? "fatigue-high" : fatigue > 30 ? "fatigue-mid" : "fatigue-low";

    const conditionBox = injured
      ? `<div class="cond-note injury-note">
           全治まで あと${player.injuryWeeks}週。練習はできない。
         </div>`
      : `<div class="stat" title="疲労が30を超えると成長効率が落ち、60を超えると故障の危険が出る">
           <span class="stat-name">疲労</span>
           <div class="stat-track">
             <div class="stat-fill ${fatigueColor}" style="width:${fatigue}%"></div>
           </div>
           <span class="stat-value">${fatigue}</span>
         </div>
         <div class="cond-note">
           成長効率 <b class="${efficiency < 75 ? "warn" : ""}">${efficiency}%</b>
           ${risk > 0 ? `／ 故障率 <b class="warn">${risk}%</b>` : ""}
         </div>`;

    // 習得した特殊技能
    const skills = player.skills.map(key => {
      const skill = SKILLS[key];
      return `<span class="skill-chip" title="${skill.desc}">${skill.icon} ${skill.name}</span>`;
    }).join("");

    card.innerHTML = `
      <div class="player-head">
        ${portrait(player)}
        <button class="player-name link" data-profile="${player.name}"
                title="クリックでマネージャーの手帳を見る">${player.name}</button>
        <span class="player-pos">${player.pos}</span>
        <span class="player-year">${player.year}年</span>
        <span class="cond-badge ${condition.cls}">${condition.label}</span>
        <span class="player-ovr" title="${player.pos}としての総合力">${calcOvr(player)}</span>
      </div>
      ${skills ? `<div class="skills">${skills}</div>` : ""}
      <div class="section-label">コンディション<span class="section-note">頑丈さ ${player.durable.toFixed(1)}</span></div>
      ${conditionBox}
      <div class="section-label">基礎パラメータ</div>
      ${baseRows}
      <div class="section-label">試合能力<span class="section-note">基礎から自動計算</span></div>
      ${derivedRows}
      <div class="assign">
        <span class="assign-label">今週</span>
        <select class="assign-select" data-player="${player.name}" ${injured ? "disabled" : ""}>
          ${injured ? `<option>故障のため離脱中</option>` : options}
        </select>
      </div>`;

    box.appendChild(card);
  }

  // ドロップダウンが変更されたら、指示を覚えておく
  box.querySelectorAll(".assign-select").forEach(select => {
    select.addEventListener("change", e => {
      state.assign[e.target.dataset.player] = Number(e.target.value);
      renderRoster(); // 効果プレビューを更新するために描き直す
    });
  });

  // 名前を押したら、マネージャーの手帳を開く
  box.querySelectorAll("[data-profile]").forEach(btn => {
    btn.addEventListener("click", () => openProfile(btn.dataset.profile));
  });
}

// メニュー表。押すものではなく、何が伸びるかを確認するための一覧。
// 上位練習は、解禁前も「あと何回で解禁か」を見せる。目標になるので。
function renderMenus() {
  const box = document.getElementById("menu-list");

  // 基本の練習だけを並べ、その下に上位版をぶら下げる
  const baseMenus = MENUS.filter(m => !m.locked);

  box.innerHTML = baseMenus.map(menu => {
    const upgrade = getUpgrade(menu);
    const mastery = state.mastery[menu.key] ?? 0;
    const unlocked = upgrade && isMenuAvailable(upgrade);

    // 上位練習の枠。解禁済みなら中身を、まだなら熟練度のバーを出す。
    const upgradeBox = !upgrade ? "" : unlocked
      ? `<div class="upgrade unlocked">
           <div class="menu-title">
             ▲ ${upgrade.name}
             ${menuCount(upgrade) > 0 ? `<span class="menu-count">${menuCount(upgrade)}人</span>` : ""}
             <span class="menu-load ${netLoad(upgrade) > 0 ? "" : "recover"}">${loadText(upgrade)}</span>
           </div>
           <div class="menu-desc">${upgrade.desc}</div>
         </div>`
      : `<div class="upgrade">
           <div class="upgrade-head">
             🔒 ${upgrade.name}
             <span class="upgrade-need">熟練度 ${mastery.toFixed(1)} / ${MASTERY_NEEDED}</span>
           </div>
           <div class="stat-track">
             <div class="stat-fill" style="width:${Math.min(100, mastery / MASTERY_NEEDED * 100)}%"></div>
           </div>
         </div>`;

    return `
      <div class="menu-item ${menuCount(menu) > 0 ? "active" : ""}">
        <div class="menu-title">
          ${menu.name}
          ${menuCount(menu) > 0 ? `<span class="menu-count">${menuCount(menu)}人</span>` : ""}
          <span class="menu-load ${netLoad(menu) > 0 ? "" : "recover"}"
                title="1週あたりの疲労の増減。スタミナが高い選手ほど実際は軽くなる。">${loadText(menu)}</span>
        </div>
        <div class="menu-desc">${menu.desc}</div>
        <div class="tags">${menuTags(menu)}</div>
        ${upgradeBox}
      </div>`;
  }).join("");
}

// メニュー表示のための小道具
function menuCount(menu) {
  return players.filter(p =>
    p.injuryWeeks === 0 && MENUS[state.assign[p.name]] === menu).length;
}

function netLoad(menu) {
  return menu.load - NATURAL_RECOVERY - (menu.rest || 0);
}

function loadText(menu) {
  const net = netLoad(menu);
  return net > 0 ? `疲労 +${net}` : `疲労 ${net}`;
}

function menuTags(menu) {
  return Object.entries(menu.effects)
    .sort((a, b) => b[1] - a[1])
    .map(([key, v]) => {
      const label = BASE_STATS.find(s => s.key === key).label;
      return `<span class="tag ${v >= 1.5 ? "tag-main" : ""}">${label}</span>`;
    })
    .join("");
}

// 「全員に同じメニュー」のドロップダウン
function renderBulk() {
  const select = document.getElementById("bulk-select");
  select.innerHTML =
    `<option value="">— 選ぶ —</option>` +
    MENUS.map((m, i) => isMenuAvailable(m)
      ? `<option value="${i}">${m.locked ? "▲ " : ""}${m.name}</option>` : "").join("");
}

function renderNextButton() {
  const btn = document.getElementById("next-week");
  const finished = state.week >= TOTAL_WEEKS;
  const event = getSchoolEvent(state.week);
  const tournament = getTournament(state.week);
  btn.disabled = finished;

  // 大会の週は、練習ではなく大会に挑むボタンになる
  btn.className = tournament && canEnter(tournament) ? "next-btn cup-btn" : "next-btn";
  btn.textContent = finished ? "シーズン終了"
    : tournament && canEnter(tournament) ? `${tournament.icon} ${tournament.name}に挑む`
    : tournament ? `▶ ${tournament.name}を見送る`
    : event?.forced ? `▶ ${event.name}の1週間`
    : event ? `▶ ${event.name}で1週間`
    : "▶ 1週間 練習する";

  // 練習試合も1週間を使うようになったので、
  // 大会の週や部活動停止の週には組めない。
  const matchBtn = document.getElementById("open-match");
  const busy = finished || tournament || event?.forced;
  matchBtn.disabled = Boolean(busy);
  matchBtn.textContent = finished ? "シーズン終了"
    : tournament ? `${tournament.name}の週`
    : event?.forced ? `${event.name}の週`
    : "🏀 練習試合を組む（1週）";
}

// 月頭のストーリーと、選択の結果。
//
// 画面に流し込むと縦に長くなりすぎて、下の部員一覧が押し出されてしまう。
// どちらも「その週に一度だけ読ませたいもの」なので、前面に出して、
// 読み終わったら閉じてもらう形にする。
function showStoryModal() {
  if (!lastStory && !lastChoice) return;

  const panel = document.getElementById("story-panel");

  panel.innerHTML = `
    ${lastChoice ? `
      <div class="choice-result">
        <div class="choice-head">
          <span class="choice-tag">選択</span>
          <h2>${lastChoice.title}</h2>
          <span class="chose">${lastChoice.label}</span>
        </div>
        <div class="story-text">${lastChoice.text}</div>
      </div>` : ""}

    ${lastStory ? `
      <div class="story-modal-head">
        <div class="story-title">${lastStory.title}</div>
      </div>
      ${lastStory.cast?.length ? `
        <div class="story-cast">
          ${lastStory.cast.map(name => portraitByName(name, "mid", name)).join("")}
        </div>` : ""}
      <div class="story-text">${lastStory.text}</div>` : ""}

    <button class="next-btn" id="story-close">続ける</button>`;

  const overlay = document.getElementById("story-overlay");
  overlay.classList.remove("hidden");

  document.getElementById("story-close").addEventListener("click", () => {
    overlay.classList.add("hidden");
    // 一度読んだら消す。週を進めるたびに再表示されては困る。
    lastStory = null;
    lastChoice = null;
  });
}

// 直前のイベントを画面上部に大きく出す。ログの中に埋もれさせない。
function renderEventBanner() {
  const box = document.getElementById("event-banner");
  if (!lastEvent) {
    box.innerHTML = "";
    box.classList.add("hidden");
    return;
  }
  // 誰の話かを分かるようにする（1人／数名／部全体）
  const scopeLabel =
    lastEvent.scope === "few" ? "数名" :
    lastEvent.scope === "team" ? "部全体" : "個人";

  box.classList.remove("hidden");
  box.className = `event-banner ${lastEvent.good ? "good" : "bad"}`;
  box.innerHTML = `
    <div class="event-head">
      <span class="event-tag">${scopeLabel}</span>
      ${lastEvent.text}
    </div>
    ${lastEvent.story ? `<div class="event-story">${lastEvent.story}</div>` : ""}`;
}

function renderLog() {
  const box = document.getElementById("log");
  box.innerHTML = state.log.map(entry => `
    <div class="log-entry">
      <div class="log-week">
        ${entry.week}
        ${entry.school ? `<span class="log-school">${entry.school}</span>` : ""}
      </div>
      <div class="log-body">
        ${entry.story ? `
          <div class="log-story">📖 ${entry.story.title}</div>` : ""}
        ${entry.event ? `
          <div class="log-special ${entry.event.good ? "good" : "bad"}">${entry.event.text}</div>` : ""}
        <div class="log-lines">
          ${entry.lines.map(l => `
            <div class="log-line ${l.status}">
              <span class="log-name">${l.name}</span>
              <span class="log-menu">${l.menu}</span>
              <span class="log-base">${l.baseText}</span>
              ${l.derivedText ? `<span class="log-derived">→ ${l.derivedText}</span>` : ""}
              ${l.event ? `<span class="log-event">${l.event}</span>` : ""}
            </div>`).join("")}
        </div>
      </div>
    </div>`).join("");
}

function renderHeader() {
  document.getElementById("date-label").textContent = getDateLabel(state.week);
  const left = TOTAL_WEEKS - state.week;
  document.getElementById("weeks-left").textContent =
    left > 0 ? `ウィンターカップまで あと${left}週` : "ウィンターカップ当日";
}

function renderAll() {
  renderHeader();
  renderCalendar();    // events.js
  renderUpcoming();    // events.js
  renderTactics();     // events.js
  renderEventBanner();
  renderRoster();
  renderMenus();
  renderBulk();  // 上位練習が解禁されたら選べるようにする
  renderNextButton();
  renderLog();
  renderManagerComment(); // profile.js
  renderSaveInfo();
}


// ---- 11. 操作されたときの処理 -------------------------

// ---- 11.2 選択式イベント ------------------------------

// 選択肢を出す。選ぶまで週は進まない。
function openChoice(choice) {
  const panel = document.getElementById("choice-panel");

  panel.innerHTML = `
    <div class="choice-head">
      <span class="choice-tag">選択</span>
      <h2>${choice.title}</h2>
    </div>
    <div class="story-text choice-text">${choice.text}</div>
    <div class="choice-options">
      ${choice.options.map((o, i) => `
        <button class="choice-btn" data-option="${i}">
          <div class="choice-label">${o.label}</div>
          <div class="choice-desc">${o.desc}</div>
        </button>`).join("")}
    </div>`;

  panel.querySelectorAll("[data-option]").forEach(btn => {
    btn.addEventListener("click", () => {
      answerChoice(choice, choice.options[Number(btn.dataset.option)]);
    });
  });

  document.getElementById("choice-overlay").classList.remove("hidden");
}

// 選んだあと。効果をかけて、そのまま週を進める。
function answerChoice(choice, option) {
  state.choicesMade[choice.key] = option.key;
  const resultText = option.effect();

  // 選んだ結果を、この直後の1週だけ画面に出す
  pendingChoice = { title: choice.title, label: option.label, text: resultText };

  document.getElementById("choice-overlay").classList.add("hidden");

  // 選択は記録済みなので、今度は素通りして週が進む
  onNextWeek();
}


// 「1週間 練習する」を押したとき。この関数が1週間の流れそのもの。
function onNextWeek() {
  if (state.week >= TOTAL_WEEKS) return;

  // 選ぶべきことがあるなら、先に選んでもらう。
  // ここで一度抜けて、選択後に answerChoice がもう一度この関数を呼ぶ。
  const choice = getChoice(state.week);
  if (choice) {
    openChoice(choice);
    return;
  }

  // 選んだ結果は、選んだ直後の1週だけ出す
  lastChoice = pendingChoice;
  pendingChoice = null;

  // 大会の週は、練習ではなく大会になる。
  // 週を進めるのは大会が終わってから（closeMatch の中）。
  const tournament = getTournament(state.week);
  if (tournament) {
    if (canEnter(tournament)) {
      openTournament(tournament);
      return;
    }
    // 出場権がない大会は見送る。その週は何もできない。
    state.tournaments[tournament.key] = "skipped";
    state.log.unshift({
      week: getDateLabel(state.week),
      school: `${tournament.icon} ${tournament.name}`,
      lines: [{
        name: "—", menu: "", baseText: "", derivedText: "",
        event: "出場権がなく、テレビで見ていた", status: "school",
      }],
    });
    lastEvent = null;
    tickBuff();
    state.week++;
    renderAll();
    return;
  }

  // ストーリーは月頭に、練習より先に進む。
  // 「悔しさで練習効率が上がる」といった効果を、その週の練習に乗せたいため。
  lastStory = runStory();

  const mods = getWeekMods();
  const results = doWeek();

  // 「今回どこが上がったか」を選手名ごとにまとめて覚えておく（緑表示用）
  lastGained = {};
  for (const r of results) {
    lastGained[r.player.name] = { gains: r.gains, derivedGains: r.derivedGains };
  }

  addLog(results, mods.event);
  if (lastStory) state.log[0].story = lastStory;

  // 練習が終わってから特殊イベントを引く。
  // 先に引くと、能力が上がった直後にその週の練習が走ることになり、
  // 「コツを掴んだ週にもう伸びている」という妙な結果になる。
  //
  // 特殊戦術の習得は抽選と別枠。表示している習得率どおりに毎週判定する。
  const event = checkTacticUnlock() ?? rollRandomEvent();
  if (event) {
    state.log[0].event = event;
    lastEvent = event;
  } else {
    lastEvent = null;
  }

  tickBuff(); // バフの残り週数を減らす
  state.week++;
  renderAll();
  saveGame(true); // 週が変わるたびに自動セーブ

  // 話があれば、最後に前面へ出す
  showStoryModal();
}

// 「全員に同じメニュー」が選ばれたとき
function onBulkChange(e) {
  if (e.target.value === "") return;
  const index = Number(e.target.value);
  for (const player of players) {
    state.assign[player.name] = index;
  }
  e.target.value = ""; // 選びっぱなしにせず戻す
  renderAll();
}


// ---- 11.5 セーブとロード ------------------------------
//
// ブラウザの localStorage に、まるごと JSON で置くだけ。
// 保存するのは「選手の配列」と「state」の2つ。
//   ゲームの状態がこの2つに集まるように作ってきたので、
//   セーブは後付けでもこれだけで済んでいる。
//
// 試合の途中（matchState）は保存しない。週の切れ目でだけ保存する。
// 試合を中断して再開できるようにすると、話が一気に面倒になるため。
const SAVE_KEY = "basketball-club-save-v1";

function saveGame(silent = false) {
  const data = {
    version: 1,
    savedAt: new Date().toLocaleString("ja-JP"),
    week: state.week,
    state,
    players,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    if (!silent) flashSaveNote("セーブしました");
    renderSaveInfo();
    return true;
  } catch (e) {
    flashSaveNote("セーブできませんでした");
    return false;
  }
}

function readSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null; // 壊れたセーブは無いものとして扱う
  }
}

function loadGame() {
  const data = readSave();
  if (!data) return false;

  // players も state も const なので、中身を入れ替える。
  // 配列やオブジェクトごと差し替えると、他のファイルが持っている
  // 参照が古いままになってしまう。
  players.length = 0;
  players.push(...data.players);

  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, data.state);

  sortRoster();
  matchState.lineup = [];   // 古い選手への参照を捨てる
  matchState.tournament = null;
  lastEvent = null;
  lastStory = null;

  renderAll();
  flashSaveNote("ロードしました");
  return true;
}

function resetGame() {
  if (!confirm("最初からやり直します。今のセーブは消えます。よろしいですか？")) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

// セーブの状況を画面に出す
function renderSaveInfo() {
  const box = document.getElementById("save-info");
  const data = readSave();
  box.textContent = data ? `最終セーブ: ${getDateLabel(data.week)}` : "セーブなし";
  document.getElementById("load-btn").disabled = !data;
}

// 「セーブしました」を一瞬だけ出す
function flashSaveNote(text) {
  const box = document.getElementById("save-info");
  box.textContent = text;
  box.classList.add("flash");
  setTimeout(() => {
    box.classList.remove("flash");
    renderSaveInfo();
  }, 1200);
}


// ---- 12. ゲーム開始 ----------------------------------
// events.js や match.js の関数を使うので、
// 全部のファイルが読み込まれてから動かす必要がある。
// DOMContentLoaded は、末尾に並べた script が全部終わってから発火する。
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("next-week").addEventListener("click", onNextWeek);
  document.getElementById("bulk-select").addEventListener("change", onBulkChange);
  document.getElementById("open-match").addEventListener("click", () => openMatch());
  document.getElementById("open-history").addEventListener("click", () => openHistory());
  document.getElementById("open-notebook").addEventListener("click", () => openNotebook());
  document.getElementById("save-btn").addEventListener("click", () => saveGame());
  document.getElementById("load-btn").addEventListener("click", () => loadGame());
  document.getElementById("reset-btn").addEventListener("click", () => resetGame());

  // 続きがあればそこから、なければ4月1週目の話から始める
  if (readSave()) {
    loadGame();
  } else {
    lastStory = runStory();
    renderBulk();
    renderAll();
    renderSaveInfo();
    showStoryModal(); // 第1話を読ませてから始める
  }

  previewEnding(); // ?ending=champion のときだけ動く（確認用）
});
