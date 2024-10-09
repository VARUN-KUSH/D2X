export{}

console.log("D2X content script loaded", new Date().toISOString());

let twitterScraper = null;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 5;

function initializeTwitterScraper() {
  console.log("Attempting to initialize TwitterScraper");
  if (typeof TwitterScraper !== "undefined") {
    twitterScraper = new TwitterScraper();
    console.log("TwitterScraper initialized successfully");
  } else {
    console.log("TwitterScraper not available, waiting for it to be ready");
    window.addEventListener(
      "TwitterScraperReady",
      () => {
        twitterScraper = new TwitterScraper();
        console.log("TwitterScraper initialized after waiting for ready event");
      },
      { once: true }
    );
  }
}

function ensureTwitterScraperInitialized() {
  return new Promise((resolve, reject) => {
    if (twitterScraper) {
      resolve(twitterScraper);
    } else {
      const checkInterval = setInterval(() => {
        if (twitterScraper) {
          clearInterval(checkInterval);
          resolve(twitterScraper);
        } else if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
          clearInterval(checkInterval);
          reject(
            new Error(
              "Failed to initialize TwitterScraper after multiple attempts"
            )
          );
        } else {
          console.log("Attempting to initialize TwitterScraper");
          initializeTwitterScraper();
          initializationAttempts++;
        }
      }, 1000);
    }
  });
}

function isTwitterOrX() {
  return (
    window.location.hostname.includes("twitter.com") ||
    window.location.hostname.includes("x.com")
  );
}

async function scrapeContent(analysisId, screenshotData, targetUrl = null) {
  console.log(
    `Scraping content for analysisId: ${analysisId}, targetUrl: ${targetUrl}`
  );
  if (isTwitterOrX()) {
    console.log("Twitter/X page detected");
    try {
      const scraper = await ensureTwitterScraperInitialized();
      console.log("TwitterScraper initialized, getting tweets");

      let tweets;
      if (targetUrl) {
        // If targetUrl is provided, we're scraping a single tweet
        console.log(`Scraping single tweet: ${targetUrl}`);
        tweets = scraper.parseTweets(analysisId, targetUrl);
      } else {
        // Otherwise, scrape all tweets on the page
        tweets = await scraper.getTweets(analysisId);
      }

      if (!tweets || tweets.length === 0) {
        console.warn(
          `No tweets scraped. analysisId: ${analysisId}, targetUrl: ${targetUrl}`
        );
        console.log("Current page content:", document.body.innerHTML);
      } else {
        console.log(`Scraped ${tweets.length} tweets`);
      }

      return tweets;
    } catch (error) {
      console.error("Error in TwitterScraper:", error);
      throw error;
    }
  } else {
    console.log("Non-Twitter page detected");
    // Fallback to universal scraping method
    return await universalScrape(screenshotData, analysisId);
  }
}

// Placeholder for universal scrape function
async function universalScrape(screenshotData, analysisId) {
  console.log("Universal scrape not implemented yet");
  return [];
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Message received in content script:", request);
  // Handle the disableTwitterHeader and enableTwitterHeader actions
  const headerElement = document.querySelector('header[role="banner"]');
  
  if (request.action === "disableTwitterHeader") {
    if (headerElement) {
      headerElement.style.display = "none"; // Hide the header
      console.log("Twitter header disabled");
    }
    sendResponse({ status: "Twitter header disabled" });
  } else if (request.action === "enableTwitterHeader") {
    if (headerElement) {
      headerElement.style.display = ""; // Show the header
      console.log("Twitter header enabled");
    }
    sendResponse({ status: "Twitter header enabled" });
  }
});

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === "scrapingChannel") {
    console.log("Connection established in content script:", port);

    port.onMessage.addListener(function (request) {
      console.log("Message received in content script:", request);

      if (request.action === "scrapeContent") {
        console.log(
          `Scraping content with analysisId: ${request.analysisId}, targetUrl: ${request.tabUrl}`
        );

        scrapeContent(request.analysisId, request.screenshotData, request.tabUrl)
          .then((content) => {
            console.log(`Content extracted: ${JSON.stringify(content)}`);
            
            // Send the response back to the background script
            port.postMessage({ status: "Content extracted", content: content });
          })
          .catch((error) => {
            console.error(`Error scraping content: ${error.message}`);
            port.postMessage({ status: "Error", message: error.message });
          });
      }
    });

    // Clean up the connection if needed
    port.onDisconnect.addListener(() => {
      console.log("Port disconnected in content script");
    });
  }
});


// Initialize TwitterScraper when the content script loads
initializeTwitterScraper();
