(function () {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const ns = (window.__AbemaComment__ = window.__AbemaComment__ || {});
  const toggleButtonId = "abema-comment-toggle-btn";

  const SVG_ON = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
  `;

  const SVG_OFF = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
    <path d="M18.83 13.17A2 2 0 0 0 19 12.5V5a2 2 0 0 0-2-2H5.5a2 2 0 0 0-.67.12"></path>
    <path d="M3 3l18 18"></path>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" opacity="0.3"></path>
    <path d="M2.1 5.1A2 2 0 0 0 2 5.5V21l4-4h8.5a2 2 0 0 0 .4-.04"></path>
  </svg>
  `;

  ns.injectToggleButton = function () {
    const fullscreenContainer = document.querySelector(
      '[class*="com-tv-TVController__fullscreen"]',
    );
    if (!fullscreenContainer) return;

    const controlGroup = fullscreenContainer.parentElement;
    if (!controlGroup) return;

    // 🎯 対策1: 現在アクティブなコントロールグループ内「だけ」を探索
    const existingBtn = controlGroup.querySelector("#" + toggleButtonId);
    if (existingBtn) {
      return; // 既に正常な位置に存在する場合は何もしない
    }

    // 🎯 保険: ドキュメント上の他の場所（古いDOMツリーの残骸など）にボタンが残っている場合はクリーンアップ
    const orphanedBtn = document.getElementById(toggleButtonId);
    if (orphanedBtn) {
      const oldWrapper = orphanedBtn.closest(
        ".com-tv-TVController__fullscreen",
      );
      if (oldWrapper) {
        oldWrapper.remove();
      } else {
        orphanedBtn.remove();
      }
      console.log("[UI] 🧹 Cleaned up orphaned toggle button.");
    }

    const wrapper = document.createElement("div");
    wrapper.className =
      "com-tv-TVController__fullscreen com-tv-TVController__tooltip-wrapper";
    wrapper.style.marginRight = "8px";
    const tooltip = document.createElement("div");
    tooltip.className = "com-tv-TVController__tooltip";
    const tooltipSpan = document.createElement("span");
    tooltipSpan.className =
      "com-a-Tooltip com-a-Tooltip--arrow-position-center";
    tooltipSpan.id = "abema-comment-toggle-tooltip";
    tooltip.appendChild(tooltipSpan);

    const btn = document.createElement("button");
    btn.id = toggleButtonId;
    btn.type = "button";
    btn.className = "com-tv-TVController__fullscreen-button";
    btn.style.cssText = `
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; background: none; border: none; outline: none; padding: 0;
      transition: transform 0.1s ease; color: rgba(255, 255, 255, 0.85);
    `;

    const iconSpan = document.createElement("span");
    iconSpan.id = "abema-comment-toggle-icon";
    iconSpan.style.cssText = `
      display: inline-flex; align-items: center; justify-content: center;
    `;
    btn.appendChild(iconSpan);

    wrapper.appendChild(tooltip);
    wrapper.appendChild(btn);

    ns.updateButtonVisual(btn, tooltipSpan);

    btn.addEventListener("mouseenter", () => {
      btn.style.color = "#ffffff";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.color = "rgba(255, 255, 255, 0.85)";
    });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      // 🎯 対策2: 安全ガード（configが未ロードの場合は処理を中断してエラーを防止）
      if (!ns.config) {
        console.warn("[UI] ⚠️ Configuration is not loaded yet.");
        return;
      }

      btn.style.transform = "scale(0.85)";
      setTimeout(() => (btn.style.transform = "scale(1)"), 100);

      const nextState = !ns.config.showComment;

      ns.config.showComment = nextState;
      api.storage.local.set({ showComment: nextState }, () => {
        console.log(`[UI] 🔄 Comment display state set to: ${nextState}`);
      });

      ns.updateButtonVisual(btn, tooltipSpan);

      if (ns.handleVisibilityChange) {
        ns.handleVisibilityChange(nextState);
      }
    });

    controlGroup.insertBefore(wrapper, fullscreenContainer);
    console.log(
      "[UI] 🔘 Custom bar button successfully injected (Restored position).",
    );
  };

  ns.updateButtonVisual = function (btnEl = null, tooltipEl = null) {
    const btn = btnEl || document.getElementById(toggleButtonId);
    if (!btn) return;

    const iconSpan =
      btn.querySelector("#abema-comment-toggle-icon") || btn.firstChild;
    const tooltipSpan =
      tooltipEl || document.getElementById("abema-comment-toggle-tooltip");

    // 🎯 対策2と同様に config の存在を確認
    if (!ns.config) return;

    if (ns.config.showComment) {
      if (iconSpan) {
        iconSpan.innerHTML = SVG_ON;
        iconSpan.style.filter =
          "drop-shadow(0px 0px 3px rgba(0, 230, 118, 0.4))";
      }
      if (tooltipSpan) {
        tooltipSpan.textContent = "コメント表示: ON";
      }
      btn.setAttribute("aria-label", "コメント表示: ON");
    } else {
      if (iconSpan) {
        iconSpan.innerHTML = SVG_OFF;
        iconSpan.style.filter = "none";
      }
      if (tooltipSpan) {
        tooltipSpan.textContent = "コメント表示: OFF";
      }
      btn.setAttribute("aria-label", "コメント表示: OFF");
    }
  };
})();
