(function () {
  const ns = (window.__AbemaComment__ = window.__AbemaComment__ || {});

  const seenNodes = new WeakSet();
  let lastMode = null;

  ns.isCommentAreaActive = function () {
    const commentBlock = document.querySelector(".com-tv-CommentBlock");
    const feedPanel = document.querySelector('[class*="com-tv-FeedSidePanel"]');

    let isBlockVisible = false;
    let blockRect = null;
    if (commentBlock) {
      blockRect = commentBlock.getBoundingClientRect();
      const inViewport =
        blockRect.left < window.innerWidth &&
        blockRect.right > 0 &&
        blockRect.top < window.innerHeight &&
        blockRect.bottom > 0;

      isBlockVisible =
        commentBlock.offsetParent !== null &&
        blockRect.width > 0 &&
        blockRect.height > 0 &&
        inViewport;
    }

    let isPanelVisible = false;
    let panelRect = null;
    if (feedPanel) {
      panelRect = feedPanel.getBoundingClientRect();
      const inViewport =
        panelRect.left < window.innerWidth &&
        panelRect.right > 0 &&
        panelRect.top < window.innerHeight &&
        panelRect.bottom > 0;

      isPanelVisible =
        feedPanel.offsetParent !== null &&
        panelRect.width > 0 &&
        panelRect.height > 0 &&
        inViewport;
    }

    const isActive = !!(isBlockVisible || isPanelVisible);

    const currentMode = isActive
      ? "DOM (Low-latency)"
      : "API (Background-fetch)";
    if (lastMode !== currentMode) {
      const isInitial = lastMode === null;
      console.log(
        `[DOM Observer] 🔄 Comment Stream Mode Switched: ${lastMode || "Initial"} -> ${currentMode}`,
      );

      lastMode = currentMode;

      const isNews = /\/now-on-air\/(abema-)?news/.test(window.location.href);
      if (!isInitial && ns.config.showComment && !isNews) {
        const displayModeName = isActive ? "DOM" : "API";
        ns.pushToQueue({
          text: `【システム】コメント取得先を「${displayModeName}」に切り替えました。`,
          isSystem: true,
        });
      }
    }

    return isActive;
  };

  ns.startCommentObserver = function () {
    const target = document.body;
    if (!target) {
      setTimeout(ns.startCommentObserver, 500);
      return;
    }

    const domObserver = new MutationObserver((mutations) => {
      ns.initOverlay();

      if (ns.checkAndTriggerNewsGuidance) {
        ns.checkAndTriggerNewsGuidance();
      }

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const isAreaActive = ns.isCommentAreaActive();

            const blocks = node.matches(".com-tv-CommentBlock")
              ? [node]
              : Array.from(node.querySelectorAll(".com-tv-CommentBlock"));

            blocks.forEach((block) => {
              if (seenNodes.has(block)) return;
              seenNodes.add(block);

              if (!ns.config.showComment) return;
              if (!isAreaActive) return;

              const pElement = block.querySelector("p");
              if (pElement) {
                const commentText = pElement.textContent.trim();

                if (!commentText || ns.shouldFilterText(commentText)) {
                  return;
                }

                const timeElement = block.querySelector(
                  ".com-tv-CommentBlock__time",
                );
                const datetimeAttr = timeElement
                  ? timeElement.getAttribute("datetime")
                  : null;

                if (datetimeAttr) {
                  const commentTimeSec = Math.floor(
                    parseInt(datetimeAttr, 10) / 1000,
                  );
                  const nowSec = Math.floor(Date.now() / 1000);
                  const diffSec = nowSec - commentTimeSec;

                  if (diffSec > 30 || diffSec < -30) {
                    return;
                  }
                }

                console.log(
                  "[DOM Observer] 💬 DOM Comment Detected (Passed Filter):",
                  commentText,
                );
                ns.pushToQueue({ text: commentText, isSystem: false });
              }
            });
          }
        }
      }
    });

    domObserver.observe(target, { childList: true, subtree: true });
    console.log(
      "[DOM Observer] 👁️ Comment DOM Observer & Water-Edge Verification is active.",
    );
  };
})();
