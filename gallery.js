// ======================================================
// イベント履歴
//
// 一度読んだ話を、あとから読み返すための場所。
// モーダルは一度閉じると二度と読めないので、ここに残す。
//
// 見ていない話は、タイトルだけ出して中身は ??? にする。
//   ・全部隠すと「まだ何かある」ことに気づけない
//   ・全部見せると、見つける楽しみが消える
// タイトルとレア度だけ見せて、中身は自分で引いてもらう。
// ======================================================

// 読んだ話の記録は state.seenStory / state.subs が持っている。
// メインは「その週の話を読んだか」、サブは「何段目まで進んだか」。

function renderGallery() {
  const panel = document.getElementById("gallery-panel");

  // ---- メインストーリー ----
  const mainRows = STORY.map(story => {
    const month = ((3 + Math.floor(story.week / 4)) % 12) + 1;
    const seen = state.storySeen.includes(story.week);
    // 読んだ話は、そのとき出た分岐だけを見せる。
    // 全分岐を見せると「他の道もあった」が丸見えになり、次の周回が死ぬ。
    const shown = seen ? state.storyRead?.[story.week] : null;

    return `
      <button class="gal-row ${seen ? "" : "locked"}"
              ${seen && shown ? `data-story="${story.week}"` : "disabled"}>
        <span class="gal-when">${month}月</span>
        <span class="gal-title">
          ${seen && shown ? shown.title : `第${STORY.indexOf(story) + 1}話 ???`}
        </span>
        <span class="gal-mark">${seen ? "読了" : "未読"}</span>
      </button>`;
  }).join("");

  // ---- サブイベント ----
  const subRows = SUB_EVENTS.map(sub => {
    const done = subProgress(sub.key);
    const stars = RARITY[sub.rarity ?? 1].stars;
    const who = [...sub.cast, sub.withManager ? "三宅 詩織" : ""].filter(Boolean);

    // 1段も見ていない話は、タイトルすら伏せる。
    // 「誰と誰の話か」まで見えていると、狙い撃ちできてしまう。
    const started = done > 0;

    const steps = sub.steps.map((step, i) => {
      const read = i < done;
      return `
        <button class="gal-step ${read ? "" : "locked"}"
                ${read ? `data-sub="${sub.key}" data-step="${i}"` : "disabled"}>
          ${read ? step.title : `${i + 1}話 ???`}
        </button>`;
    }).join("");

    // ヒントは、まだ終わっていない話にだけ出す。
    // 「起こしたい」と思わせるのが目的なので、終わった話には要らない。
    //
    // タイトルは伏せたままヒントだけ見せる。
    // 何の話かは分からないが、何をすれば動くかは分かる、という状態にする。
    const done_all = done >= sub.steps.length;
    const hintText = done_all ? null : (started ? sub.hintAfter : sub.hint);

    return `
      <div class="gal-sub ${started ? "" : "unknown"}">
        <div class="gal-sub-head">
          <span class="gal-stars rarity${sub.rarity ?? 1}">${stars}</span>
          <span class="gal-title">${started ? sub.title : "??? "}</span>
          <span class="gal-prog ${done_all ? "done" : ""}">
            ${done} / ${sub.steps.length}
          </span>
        </div>
        ${started ? `<div class="gal-cast">${who.join(" × ")}</div>` : ""}
        <div class="gal-steps">${steps}</div>
        ${hintText ? `
          <div class="gal-hint">
            <div class="portrait small" title="${MANAGER.name}">
              <span class="portrait-initial">三</span>
              <img src="${MANAGER.img}" alt="" onerror="this.style.display='none'">
            </div>
            <div class="gal-hint-text">${hintText}</div>
          </div>` : ""}
      </div>`;
  }).join("");

  // ---- 大会の話（1回戦前・決勝前・決勝後）----
  // 大会の節目に出る短い話。到達していない大会のぶんは伏せておく。
  const CUP_ORDER = [
    { key: "kengun", name: "県大会", icon: "🥈" },
    { key: "national", name: "インターハイ（全国）", icon: "🔴" },
    { key: "winter", name: "ウィンターカップ", icon: "🏆" },
  ];

  let seenCup = 0, totalCup = 0;
  const cupRows = CUP_ORDER.map(cup => {
    const def = CUP_STORY[cup.key];
    if (!def) return "";

    const slots = [];
    Object.keys(def.before ?? {})
      .sort((a, b) => Number(a) - Number(b))
      .forEach(r => {
        const label = Number(r) === 0 ? "1回戦前" : "決勝前";
        slots.push({ k: cupStoryKey(cup.key, "before", r), label });
      });
    if (def.after) slots.push({ k: cupStoryKey(cup.key, "after"), label: "決勝後" });

    const rows = slots.map(s => {
      const saved = state.cupRead?.[s.k];
      totalCup++;
      if (saved) seenCup++;
      return `
        <button class="gal-row ${saved ? "" : "locked"}"
                ${saved ? `data-cup="${s.k}"` : "disabled"}>
          <span class="gal-when">${s.label}</span>
          <span class="gal-title">${saved ? saved.title : "???"}</span>
          <span class="gal-mark">${saved ? "読了" : "未読"}</span>
        </button>`;
    }).join("");

    return `
      <div class="section-label">${cup.icon} ${cup.name}</div>
      <div class="gal-list">${rows}</div>`;
  }).join("");

  const seenMain = state.storySeen.length;
  const seenSub = SUB_EVENTS.reduce((n, s) => n + subProgress(s.key), 0);
  const totalSub = SUB_EVENTS.reduce((n, s) => n + s.steps.length, 0);

  panel.innerHTML = `
    <div class="match-head">
      <h2>📖 イベント履歴</h2>
      <button class="close-btn" id="gallery-close">✕ 閉じる</button>
    </div>

    <div class="gal-summary">
      メインストーリー ${seenMain} / ${STORY.length}
      大会の話 ${seenCup} / ${totalCup}
      部員の話 ${seenSub} / ${totalSub}
    </div>

    <div class="section-label">メインストーリー<span class="section-note">毎月1週目</span></div>
    <div class="gal-list">${mainRows}</div>

    <div class="section-label">
      大会の話<span class="section-note">1回戦前・決勝前・決勝後／決勝に届いた年だけ読める話もある</span>
    </div>
    ${cupRows}

    <div class="section-label">
      部員の話<span class="section-note">★が多いほど起きにくい／三宅の書き込みは当てにならないこともある</span>
    </div>
    ${subRows}

    <div id="gallery-read" class="gal-read hidden"></div>`;

  document.getElementById("gallery-close").addEventListener("click", closeGallery);

  panel.querySelectorAll("[data-story]").forEach(btn => {
    btn.addEventListener("click", () => showRead(Number(btn.dataset.story)));
  });
  panel.querySelectorAll("[data-cup]").forEach(btn => {
    btn.addEventListener("click", () => showCupRead(btn.dataset.cup));
  });
  panel.querySelectorAll("[data-sub]").forEach(btn => {
    btn.addEventListener("click", () =>
      showSubRead(btn.dataset.sub, Number(btn.dataset.step)));
  });
}

// 読み返し（メイン）
function showRead(week) {
  const saved = state.storyRead?.[week];
  if (!saved) return;

  const box = document.getElementById("gallery-read");
  box.classList.remove("hidden");

  // 読み返しも、ライブと同じページ送りノベルで見せる。
  // 古いセーブには pages が無いので、その場合は text を1ページとして扱う。
  const data = {
    title: saved.title,
    cast: saved.cast,
    image: saved.image,
    pages: saved.pages ?? (saved.text ? [saved.text] : []),
  };
  renderStoryPages(box, data, {}); // onFinal 無し＝前へ／次へだけ
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// 読み返し（大会の話）。メインと同じページ送りで見せる。
function showCupRead(key) {
  const saved = state.cupRead?.[key];
  if (!saved) return;

  const box = document.getElementById("gallery-read");
  box.classList.remove("hidden");
  renderStoryPages(box, {
    title: saved.title,
    cast: saved.cast,
    image: saved.image,
    pages: saved.pages ?? (saved.text ? [saved.text] : []),
  }, {});
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// 読み返し（サブ）
function showSubRead(key, index) {
  const sub = SUB_EVENTS.find(s => s.key === key);
  if (!sub) return;
  const step = sub.steps[index];

  const box = document.getElementById("gallery-read");
  box.classList.remove("hidden");

  const faces = [
    ...sub.cast.map(n => portraitByName(n, "mid", n)),
    sub.withManager
      ? `<div class="portrait mid" title="${MANAGER.name}">
           <span class="portrait-initial">三</span>
           <img src="${MANAGER.img}" alt="" onerror="this.style.display='none'">
         </div>`
      : "",
  ].join("");

  box.innerHTML = `
    <div class="sub-label">
      <span class="sub-tag">部員の話</span>${sub.title}
      <span class="sub-step">${index + 1} / ${sub.steps.length}</span>
    </div>
    <div class="story-title">${step.title}</div>
    <div class="story-cast">${faces}</div>
    <div class="story-text">${step.text()}</div>`;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function openGallery() {
  document.getElementById("gallery-overlay").classList.remove("hidden");
  renderGallery();
}

function closeGallery() {
  document.getElementById("gallery-overlay").classList.add("hidden");
}
