// like-button.js
const API_URL = "https://like-api.shizuka-yuu-0309.workers.dev/";

/**
 * いいねボタンを初期化する関数
 * @param {string} buttonSelector - ボタン要素のCSSセレクタ
 * @param {string} countSelector - カウント表示要素のCSSセレクタ
 */
export function initLikeButton(buttonSelector, countSelector) {
  const btn = document.querySelector(buttonSelector);
  const countEl = document.querySelector(countSelector);

  if (!btn || !countEl) return;

  // 1. 初期カウントの取得
  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      if (data.count !== undefined) {
        countEl.textContent = data.count;
      }
    })
    .catch((err) => console.error("Failed to fetch like count:", err));

  // 2. クリックイベントの設定
  btn.addEventListener("click", async () => {
    if (btn.disabled) return;

    // クールダウン制御（フロント連投防止）
    btn.disabled = true;

    // 楽観的UI更新（レスポンス爆速化のため、結果を待たずに+1）
    const currentCount = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = currentCount + 1;

    try {
      const res = await fetch(API_URL, { method: "POST" });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      // サーバーの正確なカウントで同期
      if (data.count !== undefined) {
        countEl.textContent = data.count;
      }
    } catch (err) {
      console.warn("Like request failed, rolling back:", err);
      // エラー時は元のカウントに戻す
      countEl.textContent = currentCount;
    } finally {
      // 2秒後にボタンを再度有効化
      setTimeout(() => {
        btn.disabled = false;
      }, 2000);
    }
  });
}
