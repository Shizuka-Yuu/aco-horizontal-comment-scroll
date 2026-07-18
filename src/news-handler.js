(function () {
  const ns = (window.__AbemaComment__ = window.__AbemaComment__ || {});

  let lastCommentAreaActive = null;
  let hasPendingNewsEntryGuidance = false;

  ns.isNewsChannel = function () {
    return /\/now-on-air\/(abema-)?news/.test(window.location.href);
  };
  ns.setPendingNewsEntryGuidance = function (value) {
    hasPendingNewsEntryGuidance = value;
  };

  ns.resetNewsState = function () {
    lastCommentAreaActive = null;
    hasPendingNewsEntryGuidance = false;
  };

  ns.checkAndTriggerNewsGuidance  = function () {
    if (!ns.isNewsChannel()) return;

    if (ns.currentSlotId !== null) {
      console.log(
        "[News Handler] 📰 News channel active. Purging slotId & caches.",
      );
      ns.currentSlotId = null;
      ns.clearApiCache();
      ns.clearQueue();
      ns.clearOverlay();
    }

    const overlay = ns.getOverlay();
    if (!overlay || !document.getElementById("abema-comment-overlay")) {
      return;
    }

    if (!ns.config.showComment) return;

    const active = ns.isCommentAreaActive();

    if (hasPendingNewsEntryGuidance) {
      if (!active) {
        ns.pushToQueue({
          text: "【システム】【ニュースチャンネル】コメントを流すには、右のコメント欄を開いてください",
          isSystem: true,
        });
        console.log("[News Handler] 📢 News entry guidance dispatched.");
      }

      hasPendingNewsEntryGuidance = false;
      lastCommentAreaActive = active;
      return;
    }

    if (lastCommentAreaActive !== null && lastCommentAreaActive !== active) {
      if (!active) {
        ns.pushToQueue({
          text: "【システム】【ニュースチャンネル】コメントを流すには、右のコメント欄を開いてください",
          isSystem: true,
        });
        console.log(
          "[News Handler] 📢 News guidance state-transition message dispatched.",
        );
      }

      lastCommentAreaActive = active;
    }
  };
})();
