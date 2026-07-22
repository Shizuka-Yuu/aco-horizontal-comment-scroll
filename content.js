(function () {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const ns = window.__AbemaComment__;

  if (!ns) {
    console.error("[Content] ❌ Global namespace __AbemaComment__ not found!");
    return;
  }

  ns.currentSlotId = null;

  let newsGuidanceTimeoutId = null;
  ns.triggerNewsGuidanceWithDelay = function () {
    if (newsGuidanceTimeoutId) {
      clearTimeout(newsGuidanceTimeoutId);
    }

    console.log(
      "[Content] ⏰ News channel transition detected. Scheduling guidance in 3 seconds...",
    );
    newsGuidanceTimeoutId = setTimeout(() => {
      if (ns.isNewsChannel()) {
        ns.resetNewsState();
        ns.setPendingNewsEntryGuidance(true);
        ns.checkAndTriggerNewsGuidance();
        console.log("[Content] ⏰ Scheduled news guidance triggered.");
      }
      newsGuidanceTimeoutId = null;
    }, 3000);
  };

  ns.cancelNewsGuidanceDelay = function () {
    if (newsGuidanceTimeoutId) {
      clearTimeout(newsGuidanceTimeoutId);
      newsGuidanceTimeoutId = null;
      console.log(
        "[Content] ⏰ Scheduled news guidance cancelled (left news channel).",
      );
    }
  };

  ns.handleVisibilityChange = function (show) {
    const overlay = ns.getOverlay();
    if (!overlay) return;

    if (show) {
      overlay.style.display = "block";

      ns.pushToQueue({
        text: "【システム】コメントのオーバーレイ表示を「ON」にしました。",
        isSystem: true,
      });

      ns.resetNewsState();
      ns.setPendingNewsEntryGuidance(true);

      if (ns.isNewsChannel()) {
        ns.checkAndTriggerNewsGuidance();
        return;
      }

      if (!ns.isCommentAreaActive() && ns.currentSlotId) {
        ns.fetchComments(ns.currentSlotId);
      }
    } else {
      ns.clearQueue();
      ns.clearNormalComments();

      ns.resetNewsState();

      ns.pushToQueue({
        text: "【システム】コメントのオーバーレイ表示を「OFF」にしました。",
        isSystem: true,
      });
    }
  };

  api.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "slotIdChanged") {
      const { slotId, oldSlotId } = request;
      console.log(
        `[Content] 🔀 slotIdChanged received: ${oldSlotId} -> ${slotId}`,
      );

      if (ns.isNewsChannel()) {
        ns.triggerNewsGuidanceWithDelay();
        return;
      }

      ns.cancelNewsGuidanceDelay();
      ns.resetNewsState();

      if (ns.currentSlotId === slotId) return;

      ns.currentSlotId = slotId;
      ns.clearApiCache();
      ns.clearQueue();
      ns.clearOverlay();

      if (ns.config.showComment) {
        ns.pushToQueue({
          text: `【システム】番組IDを更新しました（ID: ${slotId}）`,
          isSystem: true,
        });
      }
      ns.fetchComments(ns.currentSlotId);
    }
  });

  ns.loadConfig(() => {
    ns.startCommentObserver();

    api.runtime.sendMessage({ action: "getActiveSlotId" }, (response) => {
      if (ns.isNewsChannel()) {
        ns.triggerNewsGuidanceWithDelay();
        return;
      }

      ns.resetNewsState();

      if (response?.slotId) {
        ns.currentSlotId = response.slotId;
        console.log(
          `[Content] 🚀 Bootstrapped with initial slotId: ${ns.currentSlotId}`,
        );

        if (ns.config.showComment) {
          ns.pushToQueue({
            text: `【システム】番組IDを検出しました（ID: ${ns.currentSlotId}）`,
            isSystem: true,
          });
        }
        ns.fetchComments(ns.currentSlotId);
      }
    });

    setInterval(() => {
      if (ns.isNewsChannel()) {
        ns.checkAndTriggerNewsGuidance();
        return;
      }
      ns.fetchComments(ns.currentSlotId);
    }, 3000);

    let lastUrl = window.location.href;
    setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        console.log(`[Content] 🌐 URL Changed: ${lastUrl} -> ${currentUrl}`);
        lastUrl = currentUrl;

        if (ns.isNewsChannel()) {
          ns.triggerNewsGuidanceWithDelay();
        } else {
          ns.cancelNewsGuidanceDelay();
          ns.resetNewsState();
        }
      }
    }, 1000);

    console.log("[Content] 🚀 Abema Comment Hybrid Streamer is loaded.");
  });
})();
