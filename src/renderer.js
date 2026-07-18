(function () {
  const ns = (window.__AbemaComment__ = window.__AbemaComment__ || {});

  let overlay = null;
  let laneLastComments = [];

  ns.getOverlay = function () {
    return overlay;
  };

  ns.initOverlay = function () {
    const container = document.querySelector(
      ".com-tv-TVScreen__player__screen",
    );
    if (!container) return;

    const existingOverlay = document.getElementById("abema-comment-overlay");

    if (existingOverlay && container.contains(existingOverlay)) {
      overlay = existingOverlay;

      if (ns.injectToggleButton) {
        ns.injectToggleButton();
      }
      return;
    }

    const savedSystemComments = [];
    if (existingOverlay) {
      Array.from(existingOverlay.children).forEach((child) => {
        if (child.dataset.isSystem === "true") {
          savedSystemComments.push({
            text: child.textContent,
            isSystem: true,
          });
        }
      });
      existingOverlay.remove();
    }

    const computedStyle = window.getComputedStyle(container);
    if (computedStyle.position === "static") {
      container.style.position = "relative";
    }

    overlay = document.createElement("div");
    overlay.id = "abema-comment-overlay";
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 9999; overflow: hidden;
    `;

    if (!ns.config.showComment) {
      overlay.style.display = "none";
    } else {
      overlay.style.display = "block";
    }

    container.appendChild(overlay);

    if (laneLastComments.length !== ns.config.laneCount) {
      laneLastComments = new Array(ns.config.laneCount).fill(null);
    } else {
      laneLastComments.fill(null);
    }

    console.log("[Renderer] 🖥️ Overlay mounted/remounted!");

    if (ns.injectToggleButton) {
      ns.injectToggleButton();
    }

    if (savedSystemComments.length > 0) {
      savedSystemComments.reverse().forEach((comment) => {
        ns.pushToQueue(comment);
      });
    }
  };

  ns.clearOverlay = function () {
    if (overlay) overlay.innerHTML = "";
    laneLastComments.fill(null);
  };

  ns.clearNormalComments = function () {
    if (overlay) {
      const children = Array.from(overlay.children);
      children.forEach((child) => {
        if (child.dataset.isSystem !== "true") {
          child.remove();
        }
      });
    }
  };

  ns.measureCommentWidth = function (text) {
    if (!overlay) return 0;

    const div = document.createElement("div");
    div.textContent = text;
    div.style.cssText = `
      position: absolute; white-space: nowrap; font-size: ${ns.config.fontSize}px;
      font-weight: bold; left: -9999px; top: -9999px; visibility: hidden;
    `;
    overlay.appendChild(div);
    const width = div.offsetWidth;
    div.remove();

    return width;
  };

  ns.getSafeLane = function (commentWidth, duration) {
    const now = Date.now();
    if (!overlay) return null;

    const screenWidth = overlay.offsetWidth || window.innerWidth;
    const speed = (screenWidth + commentWidth) / duration;
    const laneCount = ns.config.laneCount;

    if (laneLastComments.length !== laneCount) {
      laneLastComments = new Array(laneCount).fill(null);
    }

    const lanesToCheck = Array.from({ length: laneCount }, (_, i) => i);
    for (let i = lanesToCheck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanesToCheck[i], lanesToCheck[j]] = [lanesToCheck[j], lanesToCheck[i]];
    }

    for (const i of lanesToCheck) {
      const last = laneLastComments[i];
      if (!last) {
        laneLastComments[i] = {
          width: commentWidth,
          duration,
          speed,
          time: now,
        };
        return i;
      }
      const tL = last.time,
        WL = last.width,
        vL = last.speed,
        tC = now,
        vC = speed;
      const t_enter = tL + WL / vL;
      if (tC < t_enter) continue;
      if (vC > vL) {
        const t_coll = (vC * tC - vL * tL - WL) / (vC - vL);
        const x_coll = screenWidth - vC * (t_coll - tC);
        if (x_coll > 0) continue;
      }
      laneLastComments[i] = { width: commentWidth, duration, speed, time: now };
      return i;
    }

    return null;
  };

  ns.renderComment = function (commentObj) {
    if (document.hidden || !overlay) return false;

    const { text, isSystem } = commentObj;

    if (!ns.config.showComment && !isSystem) {
      return true;
    }

    const commentWidth = ns.measureCommentWidth(text);
    const duration = ns.config.duration;
    const laneIndex = ns.getSafeLane(commentWidth, duration);

    if (laneIndex === null) return false;

    const textColor = isSystem ? ns.config.systemColor : "white";

    const div = document.createElement("div");
    div.textContent = text;

    if (isSystem) {
      div.dataset.isSystem = "true";
    }

    div.style.cssText = `
      position: absolute; white-space: nowrap; color: ${textColor};
      text-shadow: 2px 2px 2px black; font-size: ${ns.config.fontSize}px; font-weight: bold;
      opacity: ${ns.config.opacity};
      left: 0; top: -9999px; pointer-events: none; visibility: hidden;
      will-change: transform;
    `;
    overlay.appendChild(div);

    const screenWidth = overlay.offsetWidth || window.innerWidth;
    div.style.visibility = "visible";
    const step = 85 / ns.config.laneCount;
    div.style.top = `${5 + laneIndex * step}%`;

    const animation = div.animate(
      [
        { transform: `translateX(${screenWidth}px)` },
        { transform: `translateX(${-commentWidth}px)` },
      ],
      { duration: duration, easing: "linear" },
    );

    animation.onfinish = () => {
      div.remove();
      if (!ns.config.showComment && isSystem) {
        overlay.style.display = "none";
        console.log(
          "[Renderer] 💤 System message finished. Overlay is now completely hidden (display: none).",
        );
      }
    };

    return true;
  };
})();
