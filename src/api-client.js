(function () {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const ns = (window.__AbemaComment__ = window.__AbemaComment__ || {});

  const seenComments = new Set();
  let lastCreatedAtMs = 0;
  let isInitialFetch = true; // 初回/切り替え時フラグ

  const getAuthToken = () => {
    const token = localStorage.getItem("abm_token");
    return token ? `Bearer ${token}` : "";
  };

  ns.clearApiCache = function () {
    seenComments.clear();
    lastCreatedAtMs = 0;
    isInitialFetch = true; // スロット切り替え時にフラグをリセット
  };

  ns.fetchComments = function (currentSlotId) {
    if (
      !ns.getOverlay() ||
      !ns.config.showComment ||
      ns.isCommentAreaActive()
    ) {
      return;
    }

    if (!currentSlotId) {
      console.warn("[API Client] 🛑 Active slotId is null. Skipping fetch.");
      return;
    }

    // 初回は10分前から取得、2回目以降は前回取得した最新時刻+1ms
    const since =
      lastCreatedAtMs > 0 ? lastCreatedAtMs + 1 : Date.now() - 600000;
    const url = `https://api.p-c3-e.abema-tv.com/v1/slots/${currentSlotId}/comments?since=${since}&limit=100`;

    const targetSlotId = currentSlotId;

    api.runtime.sendMessage(
      {
        action: "fetchComments",
        url: url,
        token: getAuthToken(),
      },
      (res) => {
        if (currentSlotId !== targetSlotId) return;

        if (res && res.error) {
          console.error("[API Client] ❌ Error fetching comments:", res.error);
          return;
        }

        if (res && Array.isArray(res.comments) && res.comments.length > 0) {
          // 古い順（昇順）にソート
          const sortedComments = [...res.comments].sort(
            (a, b) => a.createdAtMs - b.createdAtMs,
          );

          // カーソルを今回の最新コメント時刻へ更新
          const latestComment = sortedComments[sortedComments.length - 1];
          if (latestComment.createdAtMs > lastCreatedAtMs) {
            lastCreatedAtMs = latestComment.createdAtMs;
          }

          // 処理対象コメントの切り出し
          let targetsToPush = sortedComments;

          if (isInitialFetch) {
            // 初回/切り替え時：直近の最新3件だけに絞って流す（洪水防止）
            targetsToPush = sortedComments.slice(-3);
            isInitialFetch = false;
            console.log(
              `[API Client] ⚡ Initial fetch fast-forwarded. Kept recent ${targetsToPush.length} comments.`,
            );
          }

          // キューへ流し込み
          targetsToPush.forEach((c) => {
            if (!seenComments.has(c.id)) {
              if (!c.message || ns.shouldFilterText(c.message)) return;

              ns.pushToQueue({
                id: c.id,
                text: c.message,
                message: c.message,
                createdAtMs: c.createdAtMs,
                userId: c.userId,
                isSystem: false,
              });

              seenComments.add(c.id);
            }
          });

          if (seenComments.size > 1000) seenComments.clear();
        }
      },
    );
  };
})();
