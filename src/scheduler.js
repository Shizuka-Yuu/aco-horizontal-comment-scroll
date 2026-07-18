(function () {
  const ns = (window.__AbemaComment__ = window.__AbemaComment__ || {});

  const commentQueue = [];
  let isProcessingQueue = false;
  let lastRenderTime = 0;

  ns.clearQueue = function () {
    commentQueue.length = 0;
    isProcessingQueue = false;
  };

  ns.pushToQueue = function (messageOrObj) {
    const commentObj =
      typeof messageOrObj === "string"
        ? { text: messageOrObj, isSystem: false }
        : messageOrObj;

    if (!commentObj.timestamp) {
      commentObj.timestamp = Date.now();
    }

    if (commentObj.isSystem) {
      commentQueue.unshift(commentObj);
    } else {
      commentQueue.push(commentObj);
    }

    if (!isProcessingQueue) {
      isProcessingQueue = true;
      processCommentQueue();
    }
  };

  function getCurrentInterval() {
    if (commentQueue.length === 0) return 0;

    if (commentQueue[0].isSystem) {
      return 0;
    }

    const idealInterval = 3000 / commentQueue.length;
    return Math.max(40, Math.min(idealInterval, 300));
  }

  function processCommentQueue() {
    const now = Date.now();

    while (commentQueue.length > 0) {
      const first = commentQueue[0];
      if (!first.isSystem && first.timestamp && (now - first.timestamp) > 30000) {
        commentQueue.shift();
      } else {
        break;
      }
    }

    if (commentQueue.length === 0) {
      isProcessingQueue = false;
      return;
    }

    const nextComment = commentQueue[0];

    const currentInterval = getCurrentInterval();
    const timePassed = now - lastRenderTime;

    if (timePassed >= currentInterval) {
      const success = ns.renderComment(nextComment);

      if (success) {
        commentQueue.shift();
        lastRenderTime = Date.now();
        requestAnimationFrame(processCommentQueue);
      } else {
        setTimeout(processCommentQueue, 100);
      }
    } else {
      const nextDelay = currentInterval - timePassed;
      setTimeout(processCommentQueue, nextDelay);
    }
  }
})();
