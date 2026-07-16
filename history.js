// ======================================================
// 戦歴
//
// state.history に積まれた試合の記録と、
// player.career に積まれた通算成績を見せるだけのファイル。
// 計算はしない。記録は match.js の recordHistory が作っている。
// ======================================================


// ---- 1. 集計 -----------------------------------------

// 通算の勝敗。kind で絞り込める（"friendly" や大会のkey）。
function countRecord(kind) {
  const list = kind ? state.history.filter(h => h.kind === kind) : state.history;
  return {
    games: list.length,
    wins: list.filter(h => h.win).length,
    loses: list.filter(h => !h.win).length,
  };
}

// 1試合あたりの平均に直す
function perGame(value, games) {
  return games > 0 ? (value / games).toFixed(1) : "—";
}

// 合計と平均を1つのマスに重ねて出す。
// 「通算200点」と「1試合20点」は別の話なので、どちらも要る。
// 列を倍に増やすと表が読めなくなるため、上下に重ねる。
function statCell(value, games) {
  return `
    <td class="num stat-cell">
      <span class="stat-total">${value}</span>
      <span class="stat-avg">${perGame(value, games)}</span>
    </td>`;
}


// ---- 2. 画面 -----------------------------------------

function renderHistory() {
  const panel = document.getElementById("history-panel");
  const all = countRecord();

  // 大会ごとの成績
  const cupRows = TOURNAMENTS.map(t => {
    const result = state.tournaments[t.key];
    const record = countRecord(t.key);
    const label =
      result === "won" ? `<span class="cup-won">優勝</span>`
      : result === "lost" ? `<span class="cup-lost">敗退</span>`
      : result === "skipped" ? `<span class="cup-skip">不出場</span>`
      : `<span class="cup-yet">未開催</span>`;

    return `
      <tr>
        <td>${t.icon} ${t.name}</td>
        <td>${label}</td>
        <td class="num">${record.games ? `${record.wins}勝${record.loses}敗` : "—"}</td>
      </tr>`;
  }).join("");

  // 個人の通算成績。出場していない選手も含めて全員出す。
  const careerRows = players
    .slice()
    .sort((a, b) => b.career.pts - a.career.pts)
    .map(p => {
      const c = p.career;
      const skills = p.skills.map(k => SKILLS[k].icon).join("");
      return `
        <tr class="${c.games === 0 ? "no-games" : ""}">
          <td class="name-cell">${portrait(p, "small")} ${p.name} ${skills}</td>
          <td class="num">${c.games}</td>
          <td class="num">${c.min}</td>
          ${statCell(c.pts, c.games)}
          ${statCell(c.reb, c.games)}
          ${statCell(c.ast, c.games)}
          ${statCell(c.stl, c.games)}
        </tr>`;
    }).join("");

  // 試合の一覧（新しい順）
  const matchRows = state.history.map(h => `
    <tr class="${h.win ? "win-row" : "lose-row"}">
      <td class="date">${h.date}</td>
      <td>${h.label}</td>
      <td>${h.opponent}${h.level ? `<span class="lv">Lv.${h.level}</span>` : ""}</td>
      <td class="num result-cell">${h.win ? "○" : "●"} ${h.home} - ${h.away}</td>
      <td class="top-scorer">${h.top ? `${h.top.name} ${h.top.pts}点` : "—"}</td>
    </tr>`).join("");

  panel.innerHTML = `
    <div class="match-head">
      <h2>📋 戦歴</h2>
      <button class="close-btn" id="history-close">✕ 閉じる</button>
    </div>

    <div class="record-summary">
      <div class="record-big">
        <span class="record-w">${all.wins}</span>勝
        <span class="record-l">${all.loses}</span>敗
      </div>
      <div class="record-note">通算 ${all.games}試合</div>
    </div>

    <div class="section-label">大会の結果</div>
    <table class="box-table">
      <tr><th>大会</th><th>結果</th><th class="num">戦績</th></tr>
      ${cupRows}
    </table>

    <div class="section-label">
      個人通算成績
      <span class="section-note">上段が合計、下段が1試合あたりの平均</span>
    </div>
    <table class="box-table stat-table">
      <tr>
        <th>選手</th><th class="num">試合</th><th class="num">出場Q</th>
        <th class="num">得点</th><th class="num">リバウンド</th>
        <th class="num">アシスト</th><th class="num">スティール</th>
      </tr>
      ${careerRows}
    </table>

    <div class="section-label">試合の記録</div>
    ${state.history.length ? `
      <table class="box-table history-table">
        <tr><th>日付</th><th>大会</th><th>相手</th><th class="num">結果</th><th>最多得点</th></tr>
        ${matchRows}
      </table>`
      : `<div class="cond-note">まだ1試合も戦っていない</div>`}
  `;

  document.getElementById("history-close").addEventListener("click", closeHistory);
}

function openHistory() {
  document.getElementById("history-overlay").classList.remove("hidden");
  renderHistory();
}

function closeHistory() {
  document.getElementById("history-overlay").classList.add("hidden");
}
