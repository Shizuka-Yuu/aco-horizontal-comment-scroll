const API_URL = "https://like-api.shizuka-db.workers.dev/";
const STORAGE_KEY = "aco_has_liked";

export function initLikeButton(buttonSelector, countSelector) {
  const btn = document.querySelector(buttonSelector);
  const countEl = document.querySelector(countSelector);

  if (!btn || !countEl) return;

  // 初期状態：リクエスト中は連打防止のため一旦無効化（またはそのまま）
  btn.disabled = true;

  // 1. 初期カウントおよびサーバー側のIP判定を取得
  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      if (data.count !== undefined) countEl.textContent = data.count;

      // サーバー側の判定（24時間経過しているかどうか）に従う
      if (data.userLiked) {
        localStorage.setItem(STORAGE_KEY, "true");
        setLikedState(btn);
      } else {
        // 24時間経って解除された場合、ストレージも削除してボタンを再有効化
        localStorage.removeItem(STORAGE_KEY);
        resetButtonState(btn);
      }
    })
    .catch((err) => {
      console.error("Failed to fetch like status:", err);
      // エラー時はフォールバックとしてボタンを有効化（または好みの状態へ）
      resetButtonState(btn);
    });

  // 2. クリックイベント
  btn.addEventListener("click", async () => {
    if (btn.disabled) return;

    // 即座にボタンを無効化（連打防止）
    setLikedState(btn);

    // 楽観的UI更新
    const currentCount = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = currentCount + 1;

    try {
      const res = await fetch(API_URL, { method: "POST" });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Status: ${res.status}`);
      }

      const data = await res.json();
      if (data.count !== undefined) countEl.textContent = data.count;

      // 成功したらローカルストレージにも記録
      localStorage.setItem(STORAGE_KEY, "true");
    } catch (err) {
      console.warn("Like failed:", err);
      // エラー時はロールバックしてボタンを元に戻す＆ストレージ削除
      countEl.textContent = currentCount;
      localStorage.removeItem(STORAGE_KEY);
      resetButtonState(btn);
    }
  });
}

// いいね済み状態の見た目にする共通処理
function setLikedState(btn) {
  btn.disabled = true;
  btn.classList.remove("btn-outline-danger");
  btn.classList.add("btn-danger");
}

// ボタンを再度押せる状態に戻す共通処理
function resetButtonState(btn) {
  btn.disabled = false;
  btn.classList.remove("btn-danger");
  btn.classList.add("btn-outline-danger");
}
