// Screenshot functionality based on Peter Coles - http://mrcoles.com/ - from https://github.com/chemtrails/FullCap
// This constant should be a var if we want to inject the script twice on the same page
export const config = {
  matches: ["<all_urls>"]
}

var CAPTURE_DELAY = 700;

// function onMessage(data, sender, callback) {
//   if (data.msg === "scrollPage") {
//     getPositions(callback);
//     return true;
//   } else if (data.msg === "logMessage") {
//     console.log("[POPUP LOG]", data.data);
//     callback(); // Always send a response
//   } else {
//     console.log("Ignoring unknown message in capture-page.js:", data);
//     callback(); // Send a response to avoid message channel errors
//   }
// }

// if (!window.hasScreenCapturePage) {
//   window.hasScreenCapturePage = true;
//   chrome.runtime.onMessage.addListener(onMessage);
// }

function onPortMessage(port) {
  port.onMessage.addListener((data) => {
    if (data.msg === "scrollPage") {
      getPositions(() => {
        port.postMessage({ msg: "scrollComplete" });
      });
    } else if (data.msg === "logMessage") {
      console.log("[POPUP LOG]", data.data);
      port.postMessage({ msg: "logComplete" }); // Send acknowledgment
    } else {
      console.log("Ignoring unknown message in capture-page.js:", data);
      port.postMessage({ msg: "unknownMessageHandled" }); // Send acknowledgment
    }
  });
}

if (!window.hasScreenCapturePage) {
  window.hasScreenCapturePage = true;
  chrome.runtime.onConnect.addListener(onPortMessage);
}

function max(nums) {
  return Math.max(...nums.filter(Boolean));
}

function getPositions(callback) {
  const body = document.body,
    originalBodyOverflowYStyle = body ? body.style.overflowY : "",
    originalX = window.scrollX,
    originalY = window.scrollY,
    originalOverflowStyle = document.documentElement.style.overflow;

  if (body) body.style.overflowY = "visible";

  let widths = [
      document.documentElement.clientWidth,
      body ? body.scrollWidth : 0,
      document.documentElement.scrollWidth,
      body ? body.offsetWidth : 0,
      document.documentElement.offsetWidth,
    ],
    heights = [
      document.documentElement.clientHeight,
      body ? body.scrollHeight : 0,
      document.documentElement.scrollHeight,
      body ? body.offsetHeight : 0,
      document.documentElement.offsetHeight,
    ],
    fullWidth = max(widths),
    fullHeight = max(heights),
    windowWidth = window.innerWidth,
    windowHeight = window.innerHeight,
    arrangements = [],
    scrollPad = 200,
    yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
    xDelta = windowWidth,
    yPos = fullHeight - windowHeight,
    xPos,
    numArrangements;

  if (fullWidth <= xDelta + 1) fullWidth = xDelta;

  document.documentElement.style.overflow = "hidden";

  while (yPos > -yDelta) {
    xPos = 0;
    while (xPos < fullWidth) {
      arrangements.push([xPos, yPos]);
      xPos += xDelta;
    }
    yPos -= yDelta;
  }

  console.log("fullHeight:", fullHeight, "fullWidth:", fullWidth);
  console.log("windowWidth:", windowWidth, "windowHeight:", windowHeight);

  numArrangements = arrangements.length;

  function cleanUp() {
    document.documentElement.style.overflow = originalOverflowStyle;
    if (body) body.style.overflowY = originalBodyOverflowYStyle;
    window.scrollTo(originalX, originalY);
  }

  (function processArrangements() {
    if (!arrangements.length) {
      cleanUp();
      if (callback) callback();
      return;
    }

    const [x, y] = arrangements.shift();
    window.scrollTo(x, y);

    const data = {
      msg: "capture",
      x: window.scrollX,
      y: window.scrollY,
      complete: (numArrangements - arrangements.length) / numArrangements,
      windowWidth,
      totalWidth: fullWidth,
      totalHeight: fullHeight,
      devicePixelRatio: window.devicePixelRatio,
    };

    setTimeout(() => {
      const cleanUpTimeout = setTimeout(cleanUp, 1250);

      chrome.runtime.sendMessage(data, (captured) => {
        clearTimeout(cleanUpTimeout);
        if (captured) processArrangements();
        else cleanUp();
      });
    }, CAPTURE_DELAY);
  })();
}
