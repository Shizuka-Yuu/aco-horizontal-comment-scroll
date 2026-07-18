const defaults = {
  duration: 7000,
  fontSize: 24,
  laneCount: 12,
  opacity: 1.0,
  systemColor: "#ffff00",
  ngWords: [],
  ngRegex: [],
  ngMinLength: 0,
  ngMaxLength: 0,
};

function loadOptions() {
  chrome.storage.local.get(defaults, (items) => {
    document.getElementById("duration").value = items.duration;
    document.getElementById("fontSize").value = items.fontSize;
    document.getElementById("laneCount").value = items.laneCount;
    document.getElementById("opacity").value = items.opacity;
    document.getElementById("systemColor").value = items.systemColor;

    document.getElementById("durationVal").textContent = items.duration + "ms";
    document.getElementById("fontSizeVal").textContent = items.fontSize + "px";
    document.getElementById("opacityVal").textContent = items.opacity;
    document.getElementById("systemColorVal").textContent =
      items.systemColor.toUpperCase();

    document.getElementById("ngWords").value = (items.ngWords || []).join("\n");
    document.getElementById("ngRegex").value = (items.ngRegex || []).join("\n");
    document.getElementById("ngMinLength").value = items.ngMinLength || 0;
    document.getElementById("ngMaxLength").value = items.ngMaxLength || 0;
  });
}

function saveOptions() {
  const duration = parseInt(document.getElementById("duration").value, 10);
  const fontSize = parseInt(document.getElementById("fontSize").value, 10);
  const laneCount = parseInt(document.getElementById("laneCount").value, 10);
  const opacity = parseFloat(document.getElementById("opacity").value);
  const systemColor = document.getElementById("systemColor").value;

  const ngWords = document
    .getElementById("ngWords")
    .value.split("\n")
    .map((word) => word.trim())
    .filter((word) => word.length > 0);

  const ngRegex = document
    .getElementById("ngRegex")
    .value.split("\n")
    .map((regex) => regex.trim())
    .filter((regex) => regex.length > 0);

  const ngMinLength =
    parseInt(document.getElementById("ngMinLength").value, 10) || 0;
  const ngMaxLength =
    parseInt(document.getElementById("ngMaxLength").value, 10) || 0;

  chrome.storage.local.set(
    {
      duration,
      fontSize,
      laneCount,
      opacity,
      systemColor,
      ngWords,
      ngRegex,
      ngMinLength,
      ngMaxLength,
    },
    () => {
      document.getElementById("durationVal").textContent = duration + "ms";
      document.getElementById("fontSizeVal").textContent = fontSize + "px";
      document.getElementById("opacityVal").textContent = opacity;
      document.getElementById("systemColorVal").textContent =
        systemColor.toUpperCase();

      const status = document.getElementById("status");
      status.textContent = "設定を保存しました";
      setTimeout(() => {
        status.textContent = "";
      }, 1000);
    },
  );
}

document.addEventListener("DOMContentLoaded", loadOptions);

document.querySelectorAll("input, textarea").forEach((input) => {
  input.addEventListener("input", saveOptions);
});
