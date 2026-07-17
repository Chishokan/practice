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
//
// 4月の時点では、全員が「まだ何者でもない」ようにしてある。
// 初期の平均OVRは45.8。県大会1回戦の城東（Lv38）に、ようやく勝てるくらい。
//
// 以前は平均49.6で、開幕から県大会の全チームより上だった。
// それだと「1年かけて強くなる」話にならない。
//
// 下げ幅は実測で決めた。4月の平均を変えて1シーズンずつ回した結果:
//   41.8 → 12月57.8 / 県13% / 冬 3%   ← 下げすぎ。1年育てても届かない
//   45.8 → 12月61.6 / 県47% / 冬17%   ← ここ。県は五分、冬は難しいが届く
//   47.8 → 12月63.9 / 県63% / 冬47%   ← 以前の値。楽すぎる
//
// 下げ方は一律ではない。その選手の武器は残し、弱点をより深くしてある。
//   緑川のパワー74はそのまま／スピードは26→22（もう歩いている）
//   白石のジャンプ74はそのまま／IQは22→18（何も分かっていない）
// 平坦に引くと全員が同じ顔になり、誰を伸ばすかの判断が消える。
//
// base    : 基礎パラメータの現在値（0〜100）
// growth  : 固有の成長率。1.0が普通、1.4なら4割増しで伸びる。
//           「同じ練習でも伸び方が違う」の正体。
// durable : 頑丈さ。1.0が普通。数字が小さいほど故障しやすい。
const players = [
  {
    // 走れて視野が広いが線が細い。パス型PG。体は強くない。
    name: "赤星 蓮", pos: "PG", year: 1,
    base:   { power: 30, speed: 59, stamina: 52, jump: 42, tech: 54, iq: 61 },
    growth: { power: 0.7, speed: 1.3, stamina: 1.1, jump: 0.9, tech: 1.2, iq: 1.4 },
    durable: 0.8,
  },
  {
    // 手先が器用なシューター。守備は課題。
    name: "青木 樹", pos: "SG", year: 2,
    base:   { power: 36, speed: 44, stamina: 40, jump: 47, tech: 66, iq: 42 },
    growth: { power: 0.9, speed: 0.9, stamina: 0.8, jump: 1.0, tech: 1.4, iq: 1.0 },
    durable: 1.0,
  },
  {
    // 全部そこそこ。伸びしろも平均的な万能型。頑丈さが取り柄。
    name: "黒田 迅", pos: "SF", year: 2,
    base:   { power: 48, speed: 50, stamina: 54, jump: 48, tech: 46, iq: 48 },
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
    base:   { power: 54, speed: 42, stamina: 44, jump: 74, tech: 20, iq: 18 },
    growth: { power: 1.4, speed: 1.0, stamina: 1.2, jump: 1.5, tech: 0.9, iq: 0.7 },
    durable: 0.6,
  },
  {
    // 動かない壁。跳ばない。走れない。それでも誰も通れない。
    // パワー76と読み（IQ54）で守るタイプで、白石とは正反対。
    // スピード26は部内最低だが、頑丈さ1.3は部内最高。ケガをしない。
    // 伸びるのはIQ（1.3）。年を追うごとに「読む」センターになる。
    name: "緑川 壮真", pos: "C", year: 2,
    base:   { power: 74, speed: 22, stamina: 54, jump: 48, tech: 28, iq: 50 },
    growth: { power: 1.2, speed: 0.5, stamina: 1.1, jump: 0.8, tech: 0.7, iq: 1.3 },
    durable: 1.3,
  },
  {
    // 頭は良いが身体能力が足りない。控えPG。線が細い。
    name: "紫藤 圭", pos: "PG", year: 1,
    base:   { power: 26, speed: 42, stamina: 41, jump: 34, tech: 44, iq: 55 },
    growth: { power: 0.8, speed: 1.0, stamina: 1.0, jump: 0.8, tech: 1.1, iq: 1.2 },
    durable: 0.9,
  },
  {
    // 無尽蔵のスタミナ。走り勝つタイプ。いくら走らせても平気。
    name: "桃井 隼", pos: "SG", year: 1,
    base:   { power: 38, speed: 55, stamina: 68, jump: 44, tech: 35, iq: 33 },
    growth: { power: 1.0, speed: 1.2, stamina: 1.4, jump: 1.0, tech: 0.9, iq: 0.9 },
    durable: 1.4,
  },
  {
    // 目立たないが穴がない。守備要員。
    name: "灰谷 悠", pos: "SF", year: 2,
    base:   { power: 44, speed: 46, stamina: 44, jump: 42, tech: 40, iq: 46 },
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
  sortRoster();
  return player;
}

// 部員を1人減らす（退部）
function removePlayer(player) {
  const index = players.indexOf(player);
  if (index >= 0) players.splice(index, 1);
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
//
// 練習は5種類＋休憩。全員が同じ練習をする。
//
// 毎週、それぞれの練習に選手の名前が並ぶ。誰がどこに出るかは抽選で、
// 選手ごとに出やすい練習が違う（affinity）。
// プレイヤーがやるのは「今週どれを選ぶか」だけ。
//
// 面白さの中心は、練習の中身ではなく「並びを見て選ぶ」ことにある。
//   ・伸ばしたい練習に人が集まっている週は当たり
//   ・欲しい練習に誰もいない週はハズレ
//   ・人数が多いほど全員がよく伸びる（gatherBonus）
// だから毎週の顔ぶれが判断材料になり、指示を8人ぶん出す必要がなくなる。
//
// effects は「基礎パラメータ」を対象にする。試合能力は直接は狙えない。
// load は疲労の溜まりやすさ。毎週6は自然に回復する。
// 数字が旧仕様より大きいのは、伸びる人数が減ったから。
// 旧仕様は8人全員が毎週フルで練習していた。今は名前が出た平均2.4人だけ。
// 同じ数字のままだと1年でOVR 58までしか行かず、12月に帝王と戦えない。
//
// 対象は最大3つまで。そして5つの練習が別々のものになるようにしてある。
//   主に伸ばすもの（その練習の存在理由）
//     フィジカル → パワー・ジャンプ
//     ランニング → スタミナ
//     アジリティ → スピード
//     シュート   → テクニック
//     戦術       → バスケIQ  ← ここでしか伸びない
//   バスケIQを戦術だけにしているのは、5つに役割を配りきるため。
//   シュートと戦術が両方「テクニック＋IQ」だった時期があり、
//   それだと2つが同じ練習になってしまい、選ぶ意味が消えていた。
const MENUS = [
  {
    key: "physical", name: "フィジカル", icon: "🏋",
    desc: "当たり負けしない体と、跳ぶ力を作る。",
    effects: { power: 2.9, jump: 2.0, stamina: 0.7 },
    load: 16,
  },
  {
    key: "running", name: "ランニング", icon: "🏃",
    desc: "走り込み。地味だが、40分走り切る体になる。",
    effects: { stamina: 3.2, speed: 1.4 },
    load: 18,
  },
  {
    key: "agility", name: "アジリティ", icon: "⚡",
    desc: "初速と切り返し。抜く力と、追う力。",
    effects: { speed: 3.2, jump: 1.0, tech: 0.5 },
    load: 15,
  },
  {
    key: "shooting", name: "シュート", icon: "🎯",
    desc: "ひたすら打ち込む。手首と、跳ぶ高さ。",
    effects: { tech: 3.2, jump: 0.7, power: 0.4 },
    load: 11,
  },
  {
    // load 9 は「疲労が+3ずつ溜まる」ということ。
    // 4にしていたときは自然回復(6)を下回り、疲労が減りながら伸びた。
    // IQは全部の試合能力に効くので、それを無限に回せると
    // 「戦術だけ選び続ける」が最適解になり、他の4つが死ぬ。
    key: "tactics", name: "戦術", icon: "🧠",
    desc: "映像と読み合わせ。ここでしかIQは伸びない。",
    effects: { iq: 2.6, tech: 0.6 },
    load: 9,
  },
  {
    key: "rest", name: "休憩", icon: "😴",
    desc: "休ませる。伸びないが、疲労が大きく抜ける。",
    effects: {},
    load: 0,
    rest: 30,
    always: true, // 休憩には誰の名前も出ない。いつでも選べる。
  },
];

function getMenu(key) {
  return MENUS.find(m => m.key === key);
}

// 練習として選べるもの（休憩を除く5つ）
function trainingMenus() {
  return MENUS.filter(m => !m.always);
}


// ---- 5.1 練習レベル ----------------------------------
//
// 同じ練習を5回選ぶとレベルが上がる。最大3。
// 「あれこれ手を出すより、1つを続けたほうが伸びる」を作るための仕組み。
// ただしレベルを上げるには5週かかるので、36週で全部を3にはできない。
const LEVEL_UP_EVERY = 5;
const MAX_LEVEL = 3;

// レベルごとの伸びの倍率
const LEVEL_MULT = { 1: 1.0, 2: 1.25, 3: 1.5 };

function menuLevel(key) {
  const count = state.menuCount[key] ?? 0;
  return Math.min(MAX_LEVEL, 1 + Math.floor(count / LEVEL_UP_EVERY));
}

// 次のレベルまであと何回か（最大なら null）
function toNextLevel(key) {
  const level = menuLevel(key);
  if (level >= MAX_LEVEL) return null;
  const count = state.menuCount[key] ?? 0;
  return LEVEL_UP_EVERY - (count % LEVEL_UP_EVERY);
}


// ---- 5.2 誰がどの練習に出るか -------------------------
//
// affinity は「その練習に名前が出やすいか」。1.0が普通。
// 選手の性格と噛み合わせてある。
//   緑川は走らない（ランニング0.3）。白石は跳ぶ（フィジカル1.8）。
//   紫藤は戦術に必ず顔を出すが、フィジカルにはまず出ない。
// これがあるから「今週フィジカルに白石と緑川が並んだ」に意味が出る。
const AFFINITY = {
  "赤星 蓮":   { physical: 0.6, running: 1.1, agility: 1.5, shooting: 1.4, tactics: 1.6 },
  "紫藤 圭":   { physical: 0.4, running: 0.9, agility: 1.0, shooting: 1.3, tactics: 1.9 },
  "青木 樹":   { physical: 0.7, running: 0.7, agility: 1.0, shooting: 2.0, tactics: 1.0 },
  "桃井 隼":   { physical: 0.9, running: 2.0, agility: 1.5, shooting: 0.8, tactics: 0.5 },
  "黒田 迅":   { physical: 1.3, running: 1.2, agility: 1.2, shooting: 1.1, tactics: 1.2 },
  "灰谷 悠":   { physical: 1.0, running: 1.0, agility: 1.0, shooting: 1.0, tactics: 1.1 },
  "鷲尾 陣":   { physical: 1.6, running: 1.1, agility: 1.4, shooting: 0.9, tactics: 0.7 },
  "白石 大河": { physical: 1.8, running: 1.0, agility: 0.9, shooting: 0.6, tactics: 0.3 },
  "緑川 壮真": { physical: 1.7, running: 0.3, agility: 0.4, shooting: 0.8, tactics: 1.5 },
};

// 1つの練習に名前が出る基本確率。
// 5つの練習それぞれで抽選するので、1人あたり平均 5 × 0.26 ≈ 1.3ヶ所に出る。
const APPEAR_BASE = 0.26;

// 主人公の名前
const HERO_NAME = "赤星 蓮";

function appearChance(player, menuKey) {
  const affinity = AFFINITY[player.name]?.[menuKey] ?? 1.0;
  return Math.max(0.04, Math.min(0.62, APPEAR_BASE * affinity));
}

// 今週の顔ぶれを抽選する。{ 練習key: [選手名] }
//
// 週を進めるたびに引き直す。前の週の並びが残っていると、
// 「今週は誰が出ているか」を見る意味がなくなる。
function rollRoster() {
  const roster = {};
  for (const menu of trainingMenus()) roster[menu.key] = [];

  const available = players.filter(p => p.injuryWeeks === 0);

  for (const player of available) {
    for (const menu of trainingMenus()) {
      if (Math.random() < appearChance(player, menu.key)) {
        roster[menu.key].push(player.name);
      }
    }
  }

  // 赤星は主人公なので、必ず2ヶ所以上に出る。
  // 出ない週があると「今週は赤星が育てられない」で話が止まってしまう。
  const hero = players.find(p => p.name === HERO_NAME && p.injuryWeeks === 0);
  if (hero) {
    const where = () => trainingMenus().filter(m => roster[m.key].includes(hero.name));
    // 出やすい練習から順に足していく
    const order = trainingMenus()
      .slice()
      .sort((a, b) => appearChance(hero, b.key) - appearChance(hero, a.key));

    for (const menu of order) {
      if (where().length >= 2) break;
      if (!roster[menu.key].includes(hero.name)) roster[menu.key].push(hero.name);
    }
  }

  return roster;
}

// 人数が多いほど、その練習に出ている全員がよく伸びる。
// 1人でやるより、5人で競り合ったほうが練習になる、という話。
function gatherBonus(count) {
  if (count <= 0) return 1;
  return 1 + (count - 1) * 0.10; // 5人なら1.4倍
}


// ---- 6. ゲームの状態 ---------------------------------
// 4月1週目から12月4週目まで。9ヶ月 × 4週 = 36週。
// カレンダーの表示（9ヶ月ぶん）とこの数字は必ず一致させること。
const TOTAL_WEEKS = 36;

const state = {
  week: 0,   // 経過週数（0 = 4月1週目）
  log: [],
  // 今週、どの練習に誰の名前が出ているか { 練習key: [選手名] }
  // 週を進めるたびに引き直す。
  roster: {},
  // その練習を何回選んだか { 練習key: 回数 }。5回ごとにレベルが上がる。
  menuCount: {},
  buff: null,      // 練習効率のバフ { mult, weeks, text }。なければ null
  unlocked: [],    // イベントで習得した特殊戦術のキー
  tournaments: {}, // 大会の結果 { kengun: "won" | "lost" | "skipped" }
  history: [],     // 戦歴（試合の記録）
  storySeen: [],   // 既に流したメインストーリーの週
  choicesMade: {}, // 選択式イベントで選んだもの { key: 選んだ選択肢のkey }
  subs: {},        // サブイベントの進行 { key: 進んだ段数 }
  subLast: {},     // 各サブイベントが最後に進んだ週 { key: 週 }
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

// ---- 6.5 評価（F〜S）---------------------------------
//
// 数字を全部読むのは疲れる。特にスマホでは、バーを見比べる余裕がない。
// 「85」より「A」のほうが、一瞬で強い弱いが分かる。
// 数字は詳細ページに残してあるので、こちらは「およその状況」を掴むためのもの。
// 刻みは、このゲームで実際に出る幅（およそ30〜85）に合わせてある。
// 均等に10ずつ切ると、4月がD・12月がBで、1年育てても2段階しか動かない。
// それでは成長が見えない。
//   4月の部員   … F〜C（まだ何者でもない）
//   12月の主力  … B〜S（1年でここまで来た）
const RANKS = [
  { min: 80, label: "S", cls: "rank-s" },
  { min: 70, label: "A", cls: "rank-a" },
  { min: 62, label: "B", cls: "rank-b" },
  { min: 54, label: "C", cls: "rank-c" },
  { min: 46, label: "D", cls: "rank-d" },
  { min: 38, label: "E", cls: "rank-e" },
  { min: 0,  label: "F", cls: "rank-f" },
];

function rankOf(value) {
  return RANKS.find(r => value >= r.min);
}

// 「B」のような字を出す
function rankBadge(value, title = "") {
  const rank = rankOf(value);
  return `<span class="rank ${rank.cls}" ${title ? `title="${title}"` : ""}>${rank.label}</span>`;
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
function calcFatigueGain(player, load) {
  const staminaMult = 1.3 - player.base.stamina / 200;
  return load * staminaMult;
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
  // mods.load があればそちらを使う（脇で自主練している選手のため）
  const load = mods.load ?? menu.load;
  const fatigueGain = calcFatigueGain(player, load) * fatigueMult + (mods.extraFatigue ?? 0);
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
    // sideline = 名前が出ていなくて、脇で軽く動いていただけ
    status: menu.rest ? "rest" : mods.attending === false ? "sideline" : "trained",
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

// 名前が出ていない選手が、その週にやること。
// 完全に何もしないわけではない。脇で自主練はしている。
//
// 伸びは3分の1ほど。ここを0にすると、名前が出ない選手が
// 1年間まったく育たず、控えとの差が開きすぎる。
const SIDELINE_MULT = 0.35;

// 自主練の負荷。選んだ練習が何であっても、脇の選手はこれだけ疲れる。
//
// 以前はここも「選んだ練習の負荷 × 0.35」にしていた。
// すると自然回復(6)を下回り、脇にいるだけで疲労が抜けていった。
// 「名前が出なければ休養」になってしまい、疲労管理が死んでいた。
// 練習には出ているのだから、軽くても疲れる。
const SIDELINE_LOAD = 10;

// 選んだ練習を、部全体で1週間おこなう。
//
// 名前が出ている選手 … その練習を本気でやる（人数ボーナス＋レベル倍率つき）
// 出ていない選手     … 脇で軽く動くだけ（微増）
function doWeek(menuKey) {
  const mods = getWeekMods();
  const menu = getMenu(menuKey);
  const attending = state.roster[menuKey] ?? [];

  // 人数ボーナスとレベル倍率。参加者全員に等しくかかる。
  const bonus = menu.always ? 1 : gatherBonus(attending.length);
  const level = menu.always ? 1 : LEVEL_MULT[menuLevel(menuKey)];

  const results = players.map(player => {
    // 休憩は全員が対象。それ以外は名前が出ている選手だけ。
    const joined = menu.always || attending.includes(player.name);

    if (joined) {
      return trainPlayer(player, menu, {
        ...mods,
        growth: mods.growth * bonus * level,
        attending: true,
      });
    }

    return trainPlayer(player, menu, {
      ...mods,
      growth: mods.growth * SIDELINE_MULT,
      load: SIDELINE_LOAD, // 選んだ練習の負荷ではなく、自主練ぶんだけ
      attending: false,
    });
  });

  // 選んだ回数を数える。5回でレベルが上がる。
  // 行事で流れた週と休憩は数えない。
  if (!mods.forced && !menu.always) {
    state.menuCount[menuKey] = (state.menuCount[menuKey] ?? 0) + 1;
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

// その選手が今週どの練習に名前を出しているか。
// 部員カードからも見えたほうが、練習盤と行き来せずに済む。
function appearsIn(player) {
  if (player.injuryWeeks > 0) {
    return `<div class="appears out">故障のため離脱中</div>`;
  }
  const where = trainingMenus().filter(m => (state.roster[m.key] ?? []).includes(player.name));
  if (!where.length) {
    return `<div class="appears none">今週はどこにも出ていない</div>`;
  }
  return `
    <div class="appears">
      <span class="appears-label">今週</span>
      ${where.map(m => `<span class="appears-tag" title="${m.name}">${m.icon} ${m.name}</span>`).join("")}
    </div>`;
}

// 直前の練習で上がった項目を覚えておき、緑色で表示するために使う
let lastGained = {};
// 直前に起きた特殊イベント（画面上部に大きく出す）
let lastEvent = null;
// 直前に進んだメインストーリー
let lastStory = null;
// 直前に進んだサブイベント
let lastSub = null;
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
      return `
        <div class="stat" title="成長率 ${rate.toFixed(1)} — ${s.desc}">
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
        ${rankBadge(calcOvr(player), `${player.pos}としての総合力 ${calcOvr(player)}`)}
        <span class="player-ovr" title="${player.pos}としての総合力">${calcOvr(player)}</span>
      </div>
      ${skills ? `<div class="skills">${skills}</div>` : ""}
      <div class="section-label">コンディション<span class="section-note">頑丈さ ${player.durable.toFixed(1)}</span></div>
      ${conditionBox}
      <div class="section-label">基礎パラメータ</div>
      ${baseRows}
      <div class="section-label">試合能力<span class="section-note">基礎から自動計算</span></div>
      ${derivedRows}
      ${appearsIn(player)}`;

    box.appendChild(card);
  }

  // 名前を押したら、マネージャーの手帳を開く
  box.querySelectorAll("[data-profile]").forEach(btn => {
    btn.addEventListener("click", () => openProfile(btn.dataset.profile));
  });
}

// メニュー表。押すものではなく、何が伸びるかを確認するための一覧。
// 上位練習は、解禁前も「あと何回で解禁か」を見せる。目標になるので。
// 練習盤。このゲームでいちばん見る場所。
//
// 5つの練習に、今週の顔ぶれが並ぶ。押せばその練習で1週が進む。
// 8人ぶんの指示を出す代わりに、ここでの1タップだけで週が終わる。
function renderMenus() {
  const box = document.getElementById("menu-list");

  const finished = state.week >= TOTAL_WEEKS;
  const tournament = getTournament(state.week);
  const event = getSchoolEvent(state.week);
  const blocked = finished || tournament || event?.forced;

  box.innerHTML = MENUS.map(menu => {
    const attending = menu.always
      ? players.filter(p => p.injuryWeeks === 0).map(p => p.name)
      : (state.roster[menu.key] ?? []);

    const level = menu.always ? 1 : menuLevel(menu.key);
    const next = menu.always ? null : toNextLevel(menu.key);

    // 誰が出ているか。ここを見て選ぶので、顔と名前を両方出す。
    const faces = attending.map(name => {
      const player = getPlayer(name);
      if (!player) return "";
      return `
        <span class="face" title="${name}">
          ${portraitByName(name, "small", name)}
          <span class="face-name">${name.split(" ")[0]}</span>
        </span>`;
    }).join("");

    const bonus = menu.always ? 1 : gatherBonus(attending.length);
    const mult = menu.always ? 1 : LEVEL_MULT[level] * bonus;

    return `
      <button class="train-card ${menu.key === "rest" ? "rest" : ""}
                     ${attending.length === 0 && !menu.always ? "empty" : ""}"
              data-train="${menu.key}" ${blocked ? "disabled" : ""}>
        <div class="train-head">
          <span class="train-icon">${menu.icon}</span>
          <span class="train-name">${menu.name}</span>
          ${menu.always ? "" : `<span class="train-lv lv${level}">Lv${level}</span>`}
        </div>

        <div class="train-tags">${menuTags(menu)}</div>

        <div class="train-faces">
          ${faces || (menu.always
            ? ""
            : `<span class="train-none">誰も来ていない</span>`)}
        </div>

        <div class="train-foot">
          ${menu.always
            ? `<span class="train-effect">全員が休む</span>`
            : `<span class="train-count ${attending.length >= 3 ? "many" : ""}">${attending.length}人</span>
               <span class="train-effect">${attending.length ? `×${mult.toFixed(2)}` : "—"}</span>`}
          <span class="menu-load ${netLoad(menu) > 0 ? "" : "recover"}">${loadText(menu)}</span>
        </div>

        ${next ? `<div class="train-next">あと${next}回でLv${level + 1}</div>` : ""}
      </button>`;
  }).join("");

  box.querySelectorAll("[data-train]").forEach(btn => {
    btn.addEventListener("click", () => onNextWeek(btn.dataset.train));
  });
}

// メニュー表示のための小道具
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

// 練習盤の見出しと、練習できない週の案内。
//
// 「今週は何ができるのか」を、練習盤を見た瞬間に分かるようにする。
// 以前はメニューを開かないと進行方法が分からず、行事の週に手が止まっていた。
function renderNextButton() {
  const hint = document.getElementById("train-hint");
  const board = document.getElementById("menu-list");

  const finished = state.week >= TOTAL_WEEKS;
  const tournament = getTournament(state.week);
  const event = getSchoolEvent(state.week);
  const forced = event?.forced;

  // 練習できない週は、練習盤そのものを「進む」ボタンに差し替える。
  // 押せないカードを並べても、何をすればいいのか分からない。
  if (finished || tournament || forced) {
    hint.textContent = "";
    board.className = "train-blocked";
    board.innerHTML = finished
      ? `<div class="blocked-note">シーズン終了。おつかれさまでした。</div>`
      : `<div class="blocked-note">
           ${tournament ? `${tournament.icon} 今週は${tournament.name}です。`
             : `${event.icon} 今週は${event.name}。部活動はありません。`}
         </div>
         <button class="next-btn ${tournament && canEnter(tournament) ? "cup-btn" : ""}" id="blocked-go">
           ${tournament && canEnter(tournament) ? `${tournament.icon} ${tournament.name}に挑む`
             : tournament ? `▶ ${tournament.name}を見送って次の週へ`
             : `▶ ${event.name}の1週間を過ごす`}
         </button>`;

    const go = document.getElementById("blocked-go");
    if (go) go.addEventListener("click", () => onNextWeek());
    return;
  }

  hint.textContent = "1つ選ぶと1週間進みます";
  board.className = "train-board";
}


// 月頭のストーリーと、選択の結果。
//
// 画面に流し込むと縦に長くなりすぎて、下の部員一覧が押し出されてしまう。
// どちらも「その週に一度だけ読ませたいもの」なので、前面に出して、
// 読み終わったら閉じてもらう形にする。
function showStoryModal() {
  // メインが無ければ、サブだけを出す
  if (!lastStory && !lastChoice) {
    showSubModal();
    return;
  }

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
    // 同じ週にサブイベントも起きていたら、メインを読み終えてから出す
    showSubModal();
  });
}

// サブイベント。メインストーリーと同じ週に起きたら、メインの後に出す。
function showSubModal() {
  if (!lastSub) return;

  const panel = document.getElementById("story-panel");
  const sub = lastSub;

  // 三宅が関わる話では、彼女の顔も並べる
  const faces = [
    ...sub.cast.map(name => portraitByName(name, "mid", name)),
    sub.withManager
      ? `<div class="portrait mid" title="${MANAGER.name}">
           <span class="portrait-initial">三</span>
           <img src="${MANAGER.img}" alt="" onerror="this.style.display='none'">
         </div>`
      : "",
  ].join("");

  panel.innerHTML = `
    <div class="story-modal-head">
      <div class="sub-label">
        <span class="sub-tag">部員の話</span>
        ${sub.title}
        <span class="sub-step">${sub.step} / ${sub.total}</span>
      </div>
      <div class="story-title">${sub.stepTitle}</div>
    </div>

    <div class="story-cast">${faces}</div>
    <div class="story-text">${sub.text}</div>

    ${sub.gained ? `<div class="sub-gained">${sub.gained}</div>` : ""}
    ${sub.finished ? `<div class="sub-finished">この話は、ここで終わり</div>` : ""}

    <button class="next-btn" id="story-close">続ける</button>`;

  const overlay = document.getElementById("story-overlay");
  overlay.classList.remove("hidden");

  document.getElementById("story-close").addEventListener("click", () => {
    overlay.classList.add("hidden");
    lastSub = null;
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
        ${entry.sub ? `
          <div class="log-sub">
            ${entry.sub.title} ${entry.sub.step}/${entry.sub.total} —「${entry.sub.stepTitle}」
          </div>` : ""}
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
  renderNextButton(); // 練習できない週は、上で描いた練習盤を差し替える
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
// 練習を1つ選んで、1週間を進める。
// menuKey を省いたとき（大会週・行事週など）は練習なしで週だけ進む。
function onNextWeek(menuKey) {
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
    state.roster = rollRoster();
    renderAll();
    return;
  }

  // ストーリーは月頭に、練習より先に進む。
  // 「悔しさで練習効率が上がる」といった効果を、その週の練習に乗せたいため。
  lastStory = runStory();

  const mods = getWeekMods();
  // 行事で部活が止まる週は、何を選んでいても練習にならない。
  // その場合は休憩扱いにして、trainPlayer 側の forced 処理に任せる。
  const chosen = mods.forced ? "rest" : (menuKey ?? "rest");
  const results = doWeek(chosen);

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

  // サブイベントも別枠。上の抽選に混ぜると、他の出来事に押し出されて
  // 一生出てこない（特殊戦術の習得で一度やった失敗）。
  lastSub = rollSubEvent();
  if (lastSub) state.log[0].sub = lastSub;

  tickBuff(); // バフの残り週数を減らす
  state.week++;

  // 次の週の顔ぶれを引く。
  // ここで引かないと、先週と同じ並びのまま次の週が始まってしまう。
  state.roster = rollRoster();

  renderAll();
  saveGame(true); // 週が変わるたびに自動セーブ

  // 話があれば、最後に前面へ出す
  showStoryModal();
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
  // 古い仕様のセーブには顔ぶれが入っていない。その場で引き直す。
  if (!state.roster || !Object.keys(state.roster).length) state.roster = rollRoster();
  if (!state.menuCount) state.menuCount = {};
  if (!state.subs) state.subs = {};
  if (!state.subLast) state.subLast = {};
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
  const loadBtn = document.getElementById("menu-load");
  if (loadBtn) loadBtn.disabled = !data;
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


// ---- 11.8 バーガーメニュー ----------------------------
//
// スマホでは右のパネルが画面の下のほうまで流れてしまい、
// 「1週間進める」を押すのにスクロールが要る。
// 主要な入口を1箇所にまとめて、いつでも指の届く場所に置く。

function openDrawer() {
  document.getElementById("drawer-date").textContent = getDateLabel(state.week);

  // 今週できないことは、メニューでも押せなくしておく
  const tournament = getTournament(state.week);
  const event = getSchoolEvent(state.week);
  const finished = state.week >= TOTAL_WEEKS;

  const matchBtn = document.getElementById("menu-match");
  matchBtn.disabled = Boolean(finished || tournament || event?.forced);

  document.getElementById("menu-drawer").classList.remove("hidden");
}

function closeDrawer() {
  document.getElementById("menu-drawer").classList.add("hidden");
}

// メニューから何かを選んだら、まず閉じてから実行する
function fromDrawer(fn) {
  return () => {
    closeDrawer();
    fn();
  };
}


// ---- 12. ゲーム開始 ----------------------------------
// events.js や match.js の関数を使うので、
// 全部のファイルが読み込まれてから動かす必要がある。
// DOMContentLoaded は、末尾に並べた script が全部終わってから発火する。
document.addEventListener("DOMContentLoaded", () => {
  // 入口はメニューに1本化した
  document.getElementById("burger").addEventListener("click", openDrawer);
  document.getElementById("drawer-close").addEventListener("click", closeDrawer);
  // 外側（暗い部分）を押しても閉じる
  document.getElementById("menu-drawer").addEventListener("click", e => {
    if (e.target.id === "menu-drawer") closeDrawer();
  });

  document.getElementById("menu-match").addEventListener("click", fromDrawer(openMatch));
  document.getElementById("menu-notebook").addEventListener("click", fromDrawer(openNotebook));
  document.getElementById("menu-history").addEventListener("click", fromDrawer(openHistory));
  document.getElementById("menu-save").addEventListener("click", fromDrawer(() => saveGame()));
  document.getElementById("menu-load").addEventListener("click", fromDrawer(() => loadGame()));
  document.getElementById("menu-reset").addEventListener("click", fromDrawer(resetGame));

  // 続きがあればそこから、なければ4月1週目の話から始める
  if (readSave()) {
    loadGame();
  } else {
    state.roster = rollRoster(); // 初週の顔ぶれ
    lastStory = runStory();
    renderAll();
    renderSaveInfo();
    showStoryModal(); // 第1話を読ませてから始める
  }

  previewEnding(); // ?ending=champion のときだけ動く（確認用）

  // 画面を回したり幅を変えたら、カレンダーの表示範囲を決め直す。
  // 縦横で見せられる月数が変わるため。
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderCalendar(), 150);
  });
});
