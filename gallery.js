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

    return `
      <div class="gal-sub ${started ? "" : "unknown"}">
        <div class="gal-sub-head">
          <span class="gal-stars rarity${sub.rarity ?? 1}">${stars}</span>
          <span class="gal-title">${started ? sub.title : "??? "}</span>
          <span class="gal-prog ${done === sub.steps.length ? "done" : ""}">
            ${done} / ${sub.steps.length}
          </span>
        </div>
        ${started ? `<div class="gal-cast">${who.join(" × ")}</div>` : ""}
        <div class="gal-steps">${steps}</div>
      </div>`;
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
      部員の話 ${seenSub} / ${totalSub}
    </div>

    <div class="section-label">メインストーリー<span class="section-note">毎月1週目</span></div>
    <div class="gal-list">${mainRows}</div>

    <div class="section-label">
      部員の話<span class="section-note">★が多いほど起きにくい</span>
    </div>
    ${subRows}

    <div id="gallery-read" class="gal-read hidden"></div>`;

  document.getElementById("gallery-close").addEventListener("click", closeGallery);

  panel.querySelectorAll("[data-story]").forEach(btn => {
    btn.addEventListener("click", () => showRead(Number(btn.dataset.story)));
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
  box.innerHTML = `
    <div class="story-title">${saved.title}</div>
    ${saved.cast?.length ? `
      <div class="story-cast">
        ${saved.cast.map(n => portraitByName(n, "mid", n)).join("")}
      </div>` : ""}
    <div class="story-text">${saved.text}</div>`;
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
