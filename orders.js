// ======================================================
// 練習指示メニュー
//
// スマホで部員カードを1枚ずつスクロールしながらメニューを選ぶのは、
// 8人ぶんとなると現実的でない。指示を出すことだけに絞った画面を用意する。
//
// 出すのは3つだけ。
//   名前 / 練習内容の選択 / 評価値
// 数字のバーは出さない。ここは「誰に何をやらせるか」を決める場所であって、
// 能力を吟味する場所ではない。吟味したいときは手帳を開けばいい。
// ======================================================

// 一覧に出す評価。ポジションによって見たい能力が違う。
// PGにリバウンドの評価を出しても判断材料にならない。
const ORDER_STATS = {
  PG: ["pass", "drive", "shoot"],
  SG: ["shoot", "drive", "defense"],
  SF: ["shoot", "defense", "rebound"],
  PF: ["rebound", "defense", "shoot"],
  C:  ["rebound", "defense", "shoot"],
};

function renderOrders() {
  const panel = document.getElementById("orders-panel");
  const finished = state.week >= TOTAL_WEEKS;
  const tournament = getTournament(state.week);
  const event = getSchoolEvent(state.week);
  const forced = event?.forced;

  const rows = players.map(player => {
    const derived = calcAllDerived(player);
    const condition = getCondition(player);
    const injured = player.injuryWeeks > 0;
    const fatigue = Math.round(player.fatigue);

    // その選手のポジションで意味のある3つだけ
    const keys = ORDER_STATS[player.pos] ?? ["shoot", "defense", "rebound"];
    const ranks = keys.map(key => {
      const stat = DERIVED_STATS.find(d => d.key === key);
      return `
        <div class="order-rank">
          <span class="order-rank-name">${stat.label.replace("力", "")}</span>
          ${rankBadge(derived[key], `${stat.label} ${derived[key]}`)}
        </div>`;
    }).join("");

    const options = MENUS.map((m, i) => {
      if (!isMenuAvailable(m)) return "";
      const selected = state.assign[player.name] === i ? "selected" : "";
      return `<option value="${i}" ${selected}>${m.locked ? "▲ " : ""}${m.name}</option>`;
    }).join("");

    return `
      <div class="order-row ${injured ? "injured" : ""}">
        <button class="order-face" data-profile="${player.name}" title="手帳を開く">
          ${portrait(player)}
        </button>

        <div class="order-main">
          <div class="order-head">
            <span class="order-name">${player.name}</span>
            <span class="player-pos">${player.pos}</span>
            <span class="cond-badge ${condition.cls}">${condition.label}</span>
            <span class="order-ovr">${rankBadge(calcOvr(player), `総合力 ${calcOvr(player)}`)}</span>
          </div>

          <div class="order-ranks">${ranks}</div>

          <div class="order-fatigue" title="疲労 ${fatigue}">
            <div class="stat-track">
              <div class="stat-fill ${fatigue > 60 ? "fatigue-high" : fatigue > 30 ? "fatigue-mid" : "fatigue-low"}"
                   style="width:${fatigue}%"></div>
            </div>
          </div>
        </div>

        <select class="order-select assign-select" data-player="${player.name}" ${injured ? "disabled" : ""}>
          ${injured ? `<option>離脱中（残り${player.injuryWeeks}週）</option>` : options}
        </select>
      </div>`;
  }).join("");

  // 今週そもそも練習できるのか、先に伝える
  const notice = finished ? `<div class="notice notice-bad"><b>シーズン終了</b></div>`
    : tournament ? `<div class="notice notice-cup"><b>${tournament.icon} 今週は${tournament.name}</b>
        <div>練習の指示は反映されない</div></div>`
    : forced ? `<div class="notice notice-${event.type}"><b>${event.icon} 今週は${event.name}</b>
        <div>部活動がないため、指示は反映されない</div></div>`
    : "";

  panel.innerHTML = `
    <div class="match-head">
      <h2>今週の練習指示</h2>
      <button class="close-btn" id="orders-close">✕ 閉じる</button>
    </div>

    ${notice}

    <div class="order-bulk">
      <label for="orders-bulk">全員に同じメニュー</label>
      <select id="orders-bulk" class="assign-select"></select>
    </div>

    <div class="order-list">${rows}</div>

    <div class="order-legend">
      評価は S・A・B・C・D・E・F の7段階。ポジションごとに大事な3つだけを出しています。
      細かい数字は名前を押すと手帳で見られます。
    </div>

    <button class="next-btn" id="orders-run" ${finished ? "disabled" : ""}>
      ${finished ? "シーズン終了"
        : tournament ? `${tournament.icon} ${tournament.name}へ`
        : "▶ この指示で1週間進める"}
    </button>`;

  // 一括設定
  const bulk = document.getElementById("orders-bulk");
  bulk.innerHTML = `<option value="">— 選ぶ —</option>` +
    MENUS.map((m, i) => isMenuAvailable(m)
      ? `<option value="${i}">${m.locked ? "▲ " : ""}${m.name}</option>` : "").join("");
  bulk.addEventListener("change", e => {
    if (e.target.value === "") return;
    const index = Number(e.target.value);
    for (const player of players) state.assign[player.name] = index;
    renderOrders();
    renderAll(); // 部員カード側の表示も合わせる
  });

  // 個別の指示
  panel.querySelectorAll(".order-select").forEach(select => {
    select.addEventListener("change", e => {
      state.assign[e.target.dataset.player] = Number(e.target.value);
      renderAll();
    });
  });

  // 顔を押したら手帳へ
  panel.querySelectorAll("[data-profile]").forEach(btn => {
    btn.addEventListener("click", () => {
      closeOrders();
      openProfile(btn.dataset.profile);
    });
  });

  document.getElementById("orders-close").addEventListener("click", closeOrders);
  document.getElementById("orders-run").addEventListener("click", () => {
    closeOrders();
    onNextWeek();
  });
}

function openOrders() {
  document.getElementById("orders-overlay").classList.remove("hidden");
  renderOrders();
}

function closeOrders() {
  document.getElementById("orders-overlay").classList.add("hidden");
}
