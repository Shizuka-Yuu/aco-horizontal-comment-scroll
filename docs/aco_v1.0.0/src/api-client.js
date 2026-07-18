(function () {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const ns = (window.__AbemaComment__ = window.__AbemaComment__ || {});

  const seenComments = new Set();

  const getAuthToken = () => {
    const token = localStorage.getItem("abm_token");
    return token ? `Bearer ${token}` : "";
  };

  ns.clearApiCache = function () {
    seenComments.clear();
  };

  ns.fetchComments = function (currentSlotId) {
    if (!ns.getOverlay()) return;

    if (!ns.config.showComment) {
      return;
    }

    if (ns.isCommentAreaActive()) {
      return;
    }

    if (!currentSlotId) {
      console.warn("[API Client] 🛑 Active slotId is null. Skipping fetch.");
      return;
    }

    const since = Date.now() - 5000;
    const url = `https://api.p-c3-e.abema-tv.com/v1/slots/${currentSlotId}/comments?since=${since}&limit=100`;

    console.log(
      `[API Client] 🛰️ [API Mode] Sending fetch request to Background proxy (SlotId: ${currentSlotId})`,
    );

    const targetSlotId = currentSlotId;

    api.runtime.sendMessage(
      {
        action: "fetchComments",
        url: url,
        token: getAuthToken(),
      },
      (res) => {
        if (currentSlotId !== targetSlotId) {
          console.log(
            `[API Client] 💨 Discarding fetch results from outdated slotId: ${targetSlotId}`,
          );
          return;
        }

        if (res && res.error) {
          console.error(
            "[API Client] ❌ Error fetching comments via Background proxy:",
            res.error,
          );
          return;
        }

        if (res && res.data && res.data.comments) {
          const comments = res.data.comments;
          console.log(
            `[API Client] 💬 Successfully received ${comments.length} comments from Background.`,
          );

          comments.forEach((c) => {
            if (!seenComments.has(c.id)) {
              if (!c.message || ns.shouldFilterText(c.message)) {
                return;
              }
              ns.pushToQueue({ text: c.message, isSystem: false });
              seenComments.add(c.id);
            }
          });
          if (seenComments.size > 1000) seenComments.clear();
        }
      },
    );
  };
})();
