// Screenshot functionality based on Peter Coles - http://mrcoles.com/ - from https://github.com/chemtrails/FullCap
function logFileOperation(operation, path) {
  console.log(`File Operation: ${operation}, Path: ${path}`);
}
export const CaptureAPI = (function () {
  const MAX_PRIMARY_DIMENSION = 15000 * 2,
    MAX_SECONDARY_DIMENSION = 4000 * 2,
    MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;
  const injectedTabs = new Map(); // o1-preview suggestion
  const captureLocks = new Map(); // o1-preview suggestion

  //
  // URL Matching test - to verify we can talk to this URL
  //

  const matches = ["http://*/*", "https://*/*", "ftp://*/*", "file://*/*"],
    noMatches = [/^https?:\/\/chrome.google.com\/.*$/];

  function isValidUrl(url) {
    // couldn't find a better way to tell if executeScript
    // wouldn't work -- so just testing against known urls
    // for now...

    console.log(`Validating URL: ${url}`);

    if (!url || typeof url !== "string") {
      console.error(`Invalid URL type or empty: ${typeof url}`);
      return false;
    }

    for (let i = noMatches.length - 1; i >= 0; i--) {
      if (noMatches[i].test(url)) {
        console.log(`URL ${url} matched noMatches pattern: ${noMatches[i]}`);
        return false;
      }
    }
    for (let i = matches.length - 1; i >= 0; i--) {
      const r = new RegExp("^" + matches[i].replace(/\*/g, ".*") + "$");
      if (r.test(url)) {
        console.log(`URL ${url} matched valid pattern: ${matches[i]}`);
        return true;
      }
    }

    console.log(`URL ${url} did not match any valid patterns`);
    return false;
  }

  function initiateCapture(tab, callback) {
    chrome.tabs.sendMessage(tab.id, { msg: "scrollPage" }, function () {
      // We're done taking snapshots of all parts of the window. Display
      // the resulting full screenshot images in a new browser tab.
      callback();
    });
  }

  function capture(data, screenshots, sendResponse, splitnotifier) {
    // Log the timestamp before the captureVisibleTab call
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Calling chrome.tabs.captureVisibleTab`);

    chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataURI) {
      if (!dataURI) return;
      const image = new Image();

      image.onload = function () {
        data.image = { width: image.width, height: image.height };

        // given device mode emulation or zooming, we may end up with
        // a different sized image than expected, so let's adjust to
        // match it!
        if (data.windowWidth !== image.width) {
          var scale = image.width / data.windowWidth;
          data.x *= scale;
          data.y *= scale;
          data.totalWidth *= scale;
          data.totalHeight *= scale;
        }

        // lazy initialization of screenshot canvases (since we need to wait
        // for actual image size)
        if (!screenshots.length) {
          Array.prototype.push.apply(
            screenshots,
            _initScreenshots(data.totalWidth, data.totalHeight)
          );
          if (screenshots.length > 1) {
            if (splitnotifier) {
              splitnotifier();
            }
            $("screenshot-count").innerText = screenshots.length;
          }
        }

        // draw it on matching screenshot canvases
        _filterScreenshots(
          data.x,
          data.y,
          image.width,
          image.height,
          screenshots
        ).forEach(function (screenshot) {
          screenshot.ctx.drawImage(
            image,
            data.x - screenshot.left,
            data.y - screenshot.top
          );
        });

        // send back log data for debugging (but keep it truthy to
        // indicate success)
        sendResponse(JSON.stringify(data, null, 4) || true);
      };

      image.src = dataURI;
    });
  }

  function _initScreenshots(totalWidth, totalHeight) {
    // Create and return an array of screenshot objects based
    // on the `totalWidth` and `totalHeight` of the final image.
    // We have to account for multiple canvases if too large,
    // because Chrome won't generate an image otherwise.
    //
    const badSize =
      totalHeight > MAX_PRIMARY_DIMENSION ||
      totalWidth > MAX_PRIMARY_DIMENSION ||
      totalHeight * totalWidth > MAX_AREA;

    const biggerWidth = totalWidth > totalHeight;

    const maxWidth = !badSize
      ? totalWidth
      : biggerWidth
      ? MAX_PRIMARY_DIMENSION
      : MAX_SECONDARY_DIMENSION;

    const maxHeight = !badSize
      ? totalHeight
      : biggerWidth
      ? MAX_SECONDARY_DIMENSION
      : MAX_PRIMARY_DIMENSION;

    const numCols = Math.ceil(totalWidth / maxWidth);
    const numRows = Math.ceil(totalHeight / maxHeight);
    let canvas, left, top;
    let canvasIndex = 0;
    const result = [];

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        canvas = document.createElement("canvas");
        canvas.width =
          col == numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth;
        canvas.height =
          row == numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight;
        left = col * maxWidth;
        top = row * maxHeight;

        result.push({
          canvas: canvas,
          ctx: canvas.getContext("2d"),
          index: canvasIndex,
          left: left,
          right: left + canvas.width,
          top: top,
          bottom: top + canvas.height,
        });

        canvasIndex++;
      }
    }

    return result;
  }

  function _filterScreenshots(
    imgLeft,
    imgTop,
    imgWidth,
    imgHeight,
    screenshots
  ) {
    // Filter down the screenshots to ones that match the location
    // of the given image.
    //
    const imgRight = imgLeft + imgWidth;
    const imgBottom = imgTop + imgHeight;

    return screenshots.filter(function (screenshot) {
      return (
        imgLeft < screenshot.right &&
        imgRight > screenshot.left &&
        imgTop < screenshot.bottom &&
        imgBottom > screenshot.top
      );
    });
  }

  function getBlobs(screenshots) {
    return screenshots.map(function (screenshot) {
      const dataURI = screenshot.canvas.toDataURL();

      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs
      const byteString = atob(dataURI.split(",")[1]);

      // separate out the mime component
      const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

      // write the bytes of the string to an ArrayBuffer
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      // create a blob for writing to a file
      return new Blob([ab], { type: mimeString });
    });
  }

  function saveBlob(blob, filename, index, callback, errback) {
    if (!blob) {
      const errorMsg = `Blob is undefined for filename ${filename} at index ${index}`;
      console.error(errorMsg);
      errback(new Error(errorMsg));
      return;
    }
    console.log(
      `Saving blob: filename=${filename}, index=${index}, size=${blob.size}`
    );
    filename = _addFilenameSuffix(filename, index);

    function onwriteend() {
      console.log(`File write completed: ${filename}`);
      callback(
        "filesystem:chrome-extension://" +
          chrome.i18n.getMessage("@@extension_id") +
          "/temporary/" +
          filename
      );
    }

    const size = blob.size + 1024 / 2;
    console.log(`Requesting file system with size: ${size}`);

    const reqFileSystem =
      window.requestFileSystem || window.webkitRequestFileSystem;

    reqFileSystem(
      window.TEMPORARY,
      size,
      function (fs) {
        console.log("File system acquired");
        fs.root.getFile(
          filename,
          { create: true },
          function (fileEntry) {
            console.log(`File entry created: ${filename}`);
            fileEntry.createWriter(
              function (fileWriter) {
                fileWriter.onwriteend = onwriteend;
                console.log(`Writing blob to file: ${filename}`);
                fileWriter.write(blob);
              },
              function (error) {
                console.error(`Error creating writer for ${filename}:`, error);
                errback(error);
              }
            );
          },
          function (error) {
            console.error(`Error getting file ${filename}:`, error);
            errback(error);
          }
        );
      },
      function (error) {
        console.error("Error requesting file system:", error);
        errback(error);
      }
    );
  }

  function _addFilenameSuffix(filename, index) {
    if (!index) return filename;
    const sp = filename.split(".");
    const ext = sp.pop();
    return sp.join(".") + "-" + (index + 1) + "." + ext;
  }

  function captureToBlobs(tab, callback, errback, progress, splitnotifier) {
    let loaded = false;
    let screenshots = [];
    let timedOut = false;
    const timeout = 3000;
    const noop = function () {};

    callback = callback || noop;
    errback = errback || noop;
    progress = progress || noop;

    if (!isValidUrl(tab.url)) {
      errback(`invalid url ${tab.url}`); // TODO errors
    }

    // TODO will this stack up if run multiple times? (I think it will get cleared?)
    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      if (request.msg === "capture") {
        progress(request.complete);
        capture(request, screenshots, sendResponse, splitnotifier);

        // https://developer.chrome.com/extensions/messaging#simple
        //
        // If you want to asynchronously use sendResponse, add return true;
        // to the onMessage event handler.
        //
        return true;
      } else {
        console.log("Ignoring unknown message in capture-api.js:", request);
        return false;
      }
    });

    console.log("Tab object before executeScript: ", tab);

    if (!injectedTabs.has(tab.id)) {
      injectedTabs.set(tab.id, true);

      if (chrome.scripting) {
        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, files: ["capture-page.js"] },
          function () {
            if (timedOut) {
              console.error(
                "Timed out too early while waiting for " +
                  "chrome.tabs.executeScript. Try increasing the timeout."
              );
            } else {
              loaded = true;
              progress(0);
              console.log("capture-page.js was injected and executed: ");
              initiateCapture(tab, function () {
                callback(getBlobs(screenshots));
              });
            }
          }
        );
      } else {
        console.error("Scripting API is unavailable in this context.");
      }
    } else {
      // `capture-page.js` already injected, proceed directly
      console.log("`capture-page.js` already injected, proceed directly ");
      initiateCapture(tab, function () {
        callback(getBlobs(screenshots));
      });
    }

    window.setTimeout(function () {
      if (!loaded) {
        timedOut = true;
        errback("execute timeout");
      }
    }, timeout);
  }

  function captureToFiles(
    tab,
    filename,
    callback,
    errback,
    progress,
    splitnotifier
  ) {
    console.log(
      `Starting captureToFiles: tabId=${tab.id}, filename=${filename}`
    );

    if (captureLocks.get(tab.id)) {
      errback(new Error("Capture already in progress for this tab."));
      return;
    }
    captureLocks.set(tab.id, true);

    if (typeof filename !== "string") {
      console.error("Invalid filename:", filename);
      errback(new Error("Invalid filename provided"));
      return;
    }
    captureToBlobs(
      tab,
      function (blobs) {
        console.log(`Captured ${blobs.length} blobs`);
        let i = 0;
        let filenames = [];

        (function doNext() {
          console.log(`Processing blob ${i + 1} of ${blobs.length}`);
          saveBlob(
            blobs[i],
            filename,
            i,
            function (savedFilename) {
              console.log(`Blob ${i + 1} saved as ${savedFilename}`);
              filenames.push(savedFilename);
              i++;
              if (i >= blobs.length) {
                console.log(
                  `All blobs processed. Total files: ${filenames.length}`
                );
                callback(filenames);
              } else {
                doNext();
              }
            },
            function (error) {
              console.error(`Error saving blob ${i + 1}:`, error);
              errback(error);
            }
          );
        })();
        captureLocks.delete(tab.id);
        callback(filenames);
      },
      function (error) {
        captureLocks.delete(tab.id);
        console.error("Error in captureToBlobs:", error);
        errback(error);
      },
      progress,
      splitnotifier
    );
  }

  return {
    captureToBlobs: captureToBlobs,
    captureToFiles: captureToFiles,
  };
})();