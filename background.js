let activeSlotId = null;
let authToken = null;

console.log("[Background] Service Worker / Event Page started.");

// Abema本体の通信から有効な Authorization ヘッダーを自動キャプチャ
try {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      if (details.requestHeaders) {
        const authHeader = details.requestHeaders.find(
          (h) => h.name.toLowerCase() === "authorization",
        );
        if (authHeader && authHeader.value) {
          authToken = authHeader.value;
          console.log(
            "[Background] 🔑 Captured live Authorization token from network.",
          );
        }
      }
    },
    { urls: ["https://api.p-c3-e.abema-tv.com/*"] },
    ["requestHeaders"],
  );
  console.log(
    "[Background] webRequest (onBeforeSendHeaders) listener registered.",
  );
} catch (e) {
  console.error(
    "[Background] Failed to register onBeforeSendHeaders listener:",
    e,
  );
}

// 動画ストリームからの slotId 検知
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

    const executeFetch = async (token) => {
      const headers = {};
      if (token) headers["Authorization"] = token;

      const res = await fetch(request.url, { headers });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          status: res.status,
          error: `HTTP ${res.status}`,
          details: errData,
        };
      }
      const data = await res.json();
      return { data };
    };

    (async () => {
      // キャプチャ済みのトークン、または request 経由のトークンを使用
      const tokenToUse = authToken || request.token;

      if (!tokenToUse) {
        console.warn("[Background] ⚠️ No auth token available yet.");
      }

      // background.js 内の fetchComments メッセージハンドラー部分
      const result = await executeFetch(tokenToUse);

      if (result.error) {
        sendResponse({
          error: result.error,
          status: result.status,
          details: result.details,
        });
      } else {
        // 生データから必要な4プロパティのみを抽出して一次成型
        const rawComments = Array.isArray(result.data?.comments)
          ? result.data.comments
          : [];

        const formattedComments = rawComments.map((c) => ({
          id: c.id || "",
          message: c.message || "",
          createdAtMs: c.createdAtMs || 0,
          userId: c.userId || "",
        }));

        console.log(
          `[Background] Fetch success. Formatted comments count: ${formattedComments.length}`,
        );

        // フロントには成型済み配列のみを返却
        sendResponse({ comments: formattedComments });
      }
    })();

    return true; // 非同期応答のため true
  }
});
