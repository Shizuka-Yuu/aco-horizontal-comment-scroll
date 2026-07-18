let activeSlotId = null;

console.log("[Background] Service Worker / Event Page started.");

try {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const url = details.url;
      const match = url.match(/\/(?:mp4|mp4live)\/([a-zA-Z0-9]+)\//);

      if (match && match[1]) {
        const newSlotId = match[1];

        if (activeSlotId !== newSlotId) {
          console.log(
            `[Background] 🟢 New slotId detected from network: ${newSlotId}`,
          );

          const oldSlotId = activeSlotId;
          activeSlotId = newSlotId;

          if (details.tabId && details.tabId !== -1) {
            chrome.tabs.sendMessage(
              details.tabId,
              {
                action: "slotIdChanged",
                slotId: newSlotId,
                oldSlotId: oldSlotId,
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.log(
                    "[Background] Active tab not ready to receive message yet.",
                  );
                }
              },
            );
          }
        }
      }
    },
    { urls: ["https://*.akamaized.net/*.m4s*"] },
  );
  console.log("[Background] webRequest listener registered successfully.");
} catch (e) {
  console.error("[Background] Failed to register webRequest listener:", e);
}

const api = typeof browser !== "undefined" ? browser : chrome;

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getActiveSlotId") {
    sendResponse({ slotId: activeSlotId });
    return false;
  }

  if (request.action === "fetchComments") {
    console.log(`[Background] Fetching comments for URL: ${request.url}`);

    const headers = {};
    if (request.token) {
      headers["Authorization"] = request.token;
    }

    fetch(request.url, { headers })
      .then((res) => res.json())
      .then((data) => {
        console.log(
          `[Background] Fetch success. Comments retrieved: ${data?.comments?.length || 0}`,
        );
        sendResponse({ data });
      })
      .catch((err) => {
        console.error("[Background] Fetch error:", err);
        sendResponse({ error: err.message });
      });

    return true;
  }
});
