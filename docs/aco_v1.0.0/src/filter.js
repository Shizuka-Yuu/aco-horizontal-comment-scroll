(function () {
  const ns = (window.__AbemaComment__ = window.__AbemaComment__ || {});

  ns.shouldFilterText = function (commentInput) {
    const text =
      typeof commentInput === "object" && commentInput !== null
        ? commentInput.text
        : commentInput;

    if (!text) return true;

    const config = ns.config;
    const trimmedText = text.trim();

    if (config.ngMaxLength > 0 && trimmedText.length > config.ngMaxLength)
      return true;
    if (config.ngMinLength > 0 && trimmedText.length < config.ngMinLength)
      return true;

    if (
      config.ngWords &&
      config.ngWords.some((word) => trimmedText.includes(word))
    ) {
      return true;
    }

    if (ns.compiledNgRegex.some((rx) => rx.test(trimmedText))) {
      return true;
    }

    return false;
  };
})();
