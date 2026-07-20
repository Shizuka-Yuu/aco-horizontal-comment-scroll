const API_URL = "https://like-api.shizuka-yuu-0309.workers.dev/";
const STORAGE_KEY = "aco_has_liked";

export function initLikeButton(buttonSelector, countSelector) {
  const btn = document.querySelector(buttonSelector);
  const countEl = document.querySelector(countSelector);

  if (!btn || !countEl) return;

  // すでにブラウザにいいね記録があればボタンを押せない状態にする
  if (localStorage.getItem(STORAGE_KEY) === "true") {
    setLikedState(btn);
  }

  // 1. 初期カウントおよびサーバー側のIP判定を取得
  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      if (data.count !== undefined) countEl.textContent = data.count;
      if (data.userLiked) {
        localStorage.setItem(STORAGE_KEY, "true");
        setLikedState(btn);
      }
    })
    .catch((err) => console.error("Failed to fetch like status:", err));

  // 2. クリックイベント
  btn.addEventListener("click", async () => {
    if (btn.disabled || localStorage.getItem(STORAGE_KEY) === "true") return;

    // 即座にボタンを無効化（連打防止）
    setLikedState(btn);

    // 楽観的UI更新
    const currentCount = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = currentCount + 1;

    try {
      const res = await fetch(API_URL, { method: "POST" });
      if (!res.ok) throw new Error(`Status: ${res.status}`);

      const data = await res.json();
      if (data.count !== undefined) countEl.textContent = data.count;

      // ローカルストレージに保存
      localStorage.setItem(STORAGE_KEY, "true");
    } catch (err) {
      console.warn("Like failed:", err);
      // エラー時はロールバックしてボタンを元に戻す
      countEl.textContent = currentCount;
      resetButtonState(btn);
    }
  });
}

// いいね済み状態の見た目にする共通処理
function setLikedState(btn) {
  btn.disabled = true;
  btn.classList.remove("btn-outline-danger");
  btn.classList.add("btn-danger"); // 見た目を「塗りつぶし」に変更
}

function resetButtonState(btn) {
  btn.disabled = false;
  btn.classList.remove("btn-danger");
  btn.classList.add("btn-outline-danger");
}
