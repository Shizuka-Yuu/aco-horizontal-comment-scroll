(function () {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const ns = (window.__AbemaComment__ = window.__AbemaComment__ || {});

  // デフォルト設定
  ns.config = {
    laneCount: 12,
    duration: 8000,
    fontSize: 26,
    opacity: 0.9,
    ngWords: [],
    ngRegex: [],
    ngMaxLength: 0,
    ngMinLength: 0,
    systemColor: "#ffff00",
    showComment: true,
  };

  ns.compiledNgRegex = [];

  ns.loadConfig = function (callback) {
    api.storage.local.get(ns.config, (items) => {
      Object.assign(ns.config, items);

      ns.compiledNgRegex = [];
      ns.config.ngRegex.forEach((pattern) => {
        try {
          if (pattern.trim() !== "") {
            ns.compiledNgRegex.push(new RegExp(pattern));
          }
        } catch (e) {
          console.error("[Config] Invalid RegExp pattern:", pattern, e);
        }
      });

      console.log("[Config] Loaded Configuration:", ns.config);
      if (callback) callback();
    });
  };
})();
