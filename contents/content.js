export const config = {
  matches: ["https://x.com/*"],
  all_frames: true
}

console.log("D2X content script loaded", new Date().toISOString())

let twitterScraper = null
let initializationAttempts = 0
const MAX_INITIALIZATION_ATTEMPTS = 5

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function initializeTwitterScraper() {
  console.log("Attempting to initialize TwitterScraper")
  if (typeof window.TwitterScraper !== "undefined") {
    twitterScraper = new window.TwitterScraper()
    console.log("TwitterScraper initialized successfully")
  } else {
    console.log("TwitterScraper not available, waiting for it to be ready")
    window.addEventListener(
      "TwitterScraperReady",
      () => {
        twitterScraper = new window.TwitterScraper()
        console.log("TwitterScraper initialized after waiting for ready event")
      },
      { once: true }
    )
  }
}

async function ensureTwitterScraperInitialized() {
  return await new Promise((resolve, reject) => {
    if (twitterScraper) {
      resolve(twitterScraper)
    } else {
      const checkInterval = setInterval(() => {
        if (twitterScraper) {
          clearInterval(checkInterval)
          resolve(twitterScraper)
        } else if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
          clearInterval(checkInterval)
          reject(
            new Error(
              "Failed to initialize TwitterScraper after multiple attempts"
            )
          )
        } else {
          console.log("Attempting to initialize TwitterScraper")
          initializeTwitterScraper()
          initializationAttempts++
        }
      }, 1000)
    }
  })
}

function isTwitterOrX() {
  return (
    window.location.hostname.includes("twitter.com") ||
    window.location.hostname.includes("x.com")
  )
}

// async function scrapeContent(
//   analysisId = null,
//   targetUrl = null,
//   isSecondaryParse = false
// ) {
//   console.log(
//     `Scraping content for analysisId: ${analysisId}, targetUrl: ${targetUrl}`
//   )
//   console.log("isSecondaryParse>>>>", isSecondaryParse)
//   if (isTwitterOrX()) {
//     console.log("Twitter/X page detected")
//     try {
//       const scraper = await ensureTwitterScraperInitialized()
//       console.log("TwitterScraper initialized, getting tweets")

//       let tweets
//       if (targetUrl) {
//         async function executeScraping() {
//           setTimeout(async () => {
//             console.log("Page fully loaded or already loaded")

//             // Logic when DOM is loaded, then run it
//             console.log(`Scraping single tweet: ${targetUrl}`)

//             tweets = await scraper.parseTweets(analysisId, targetUrl, isSecondaryParse)
//             console.log("fullPostTweet>>>>>>>>>", tweets)
//           }, 2000)
//         }

//         // Check if the document is already fully loaded
//         return await new Promise(async(resolve, reject) => {
//           if (document.readyState === "complete") {
//             await delay(2000)
//             // Page is already loaded, so run the scraping logic immediately
//             await executeScraping()
//             resolve(tweets)
//           } else {
//             // Page is not fully loaded yet, wait for it to load
            
//             window.addEventListener("load", async() => {await executeScraping()
//               resolve(tweets)
//             })
//           }
//         })
        
//         // await delay(3000);
//         //logic when dom is loaded then run it
//         // If targetUrl is provided, we're scraping a single tweet
//         // console.log(`Scraping single tweet: ${targetUrl}`)
//         // tweets = scraper.parseTweets(analysisId, targetUrl)
//         // console.log("fullPostTweet>>>>>>>>>", tweets)
//       } else {
//         // Otherwise, scrape all tweets on the page
//         tweets = await scraper.getTweets(analysisId)
//         return tweets
//       }

      
//     } catch (error) {
//       console.error("Error in TwitterScraper:", error)
//       throw error
//     }
//   } else {
//     console.log("Non-Twitter page detected")
//     // Fallback to universal scraping method
//     return await universalScrape(screenshotData, analysisId)
//   }
// }

async function scrapeContent(
  analysisId = null,
  targetUrl = null,
  isSecondaryParse = false
) {
  console.log(
    `Scraping content for analysisId: ${analysisId}, targetUrl: ${targetUrl}`
  )
  console.log("isSecondaryParse>>>>", isSecondaryParse)

  if (!isTwitterOrX()) {
    console.log("Non-Twitter page detected")
    return await universalScrape(screenshotData, analysisId)
  }

  console.log("Twitter/X page detected")
  try {
    const scraper = await ensureTwitterScraperInitialized()
    console.log("TwitterScraper initialized, getting tweets")

    // Function to wait for page load
    const waitForPageLoad = () => {
      return new Promise((resolve) => {
        if (document.readyState === "complete") {
          resolve()
        } else {
          window.addEventListener("load", () => resolve(), { once: true })
        }
      })
    }

    // Function to perform the actual scraping
    const performScraping = async () => {
      if (targetUrl) {
        // If targetUrl is provided, we're scraping a single tweet
        console.log(`Scraping single tweet: ${targetUrl}`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for dynamic content
        const tweets = await scraper.parseTweets(analysisId, targetUrl, isSecondaryParse)
        console.log("fullPostTweet>>>>>>>>>", tweets)
        return tweets
      } else {
        // Otherwise, scrape all tweets on the page
        const tweets = await scraper.getTweets(analysisId)
        return tweets
      }
    }

    // Main execution flow
    await waitForPageLoad()
    const result = await performScraping()
    return result

  } catch (error) {
    console.error("Error in TwitterScraper:", error)
    throw error
  }
}

// Placeholder for universal scrape function
async function universalScrape(screenshotData, analysisId) {
  console.log("Universal scrape not implemented yet")
  return []
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Message received in content script:", request);
  
  // Handle the disableTwitterHeader and enableTwitterHeader actions
  const headerElement = document.querySelector('header[role="banner"]');
  if (!headerElement) {
    console.log("Header element not found");
    sendResponse({ status: "Header element not found" });
    return;
  }

  // Safely get the profile element and its child element
  let element = null;
  try {
    const profileelem = document.querySelector('div[data-testid="inline_reply_offscreen"]');
    console.log("profilelem>>>>>>>", profileelem);
    
    // Only try to query the child element if profileelem exists
    if (profileelem) {
      element = profileelem.querySelector('div[data-testid^="UserAvatar-Container-"]');
      console.log("elem>>>>>>>", element);
    } else {
      console.log("Profile element not found in DOM");
    }
  } catch (error) {
    console.log("Error while finding elements:", error);
  }

  if (request.action === "disableTwitterHeader") {
    // Always handle the header element
    headerElement.style.display = "none";
    console.log("Twitter header disabled");
    chrome.storage.local.set({ disableTwitterHeader: true });

    // Only handle the profile element if it exists
    if (element) {
      element.style.display = "none";
      console.log("Profile element disabled");
    }

    sendResponse({ 
      status: "Twitter header disabled",
      profileElementFound: !!element
    });

  } else if (request.action === "enableTwitterHeader") {
    // Always handle the header element
    headerElement.style.display = "";
    console.log("Twitter header enabled");
    chrome.storage.local.set({ disableTwitterHeader: false });

    // Only handle the profile element if it exists
    if (element) {
      element.style.display = "";
      console.log("Profile element enabled");
    }

    sendResponse({ 
      status: "Twitter header enabled",
      profileElementFound: !!element
    });
  }
});

function checkTwitterHeaderVisibility() {
  // Function to find profile element with retries
  async function findProfileElement(maxAttempts = 5, intervalMs = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const profileelem = document.querySelector('div[data-testid="inline_reply_offscreen"]');
      if (profileelem) {
        console.log(`Profile element found on attempt ${attempt}`);
        return profileelem;
      }
      console.log(`Profile element not found, attempt ${attempt}/${maxAttempts}`);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    return null;
  }

  // Function to handle header visibility
  function updateHeaderVisibility(headerElement, disableTwitterHeader) {
    if (disableTwitterHeader) {
      headerElement.style.display = "none";
      console.log("Twitter header is hidden (based on chrome.storage)");
    } else {
      headerElement.style.display = "";
      console.log("Twitter header is visible (based on chrome.storage)");
    }
  }

  // Function to recursively wait for the header element to load
  async function waitForHeader() {
    const headerElement = document.querySelector('header[role="banner"]');
   
    if (headerElement) {
      chrome.storage.local.get("disableTwitterHeader", async (result) => {
        console.log("Inside the header visibility function");
        const disableTwitterHeader = result.disableTwitterHeader || false;
        
        // Try to find the profile element with retries
        const profileelem = await findProfileElement();
        
        // Handle the case where only header exists (no profile element)
        if (!profileelem) {
          console.log("Profile element not found - page only contains header");
          updateHeaderVisibility(headerElement, disableTwitterHeader);
          return;
        }

        // If profile element exists, try to find the avatar container
        const element = profileelem.querySelector(
          'div[data-testid^="UserAvatar-Container-"]'
        );
        
        if (!element) {
          console.log("UserAvatar container not found - updating header only");
          // updateHeaderVisibility(headerElement, disableTwitterHeader);
          // return;
        }
             
        console.log("disableTwitterHeader:", disableTwitterHeader);
        console.log("headerElement and profile element found:", headerElement);
        
        // Update both header and profile element visibility
        if (disableTwitterHeader) {
          headerElement.style.display = "none";
          element.style.display = "none";
          console.log("Twitter header and profile element are hidden");
        } else {
          headerElement.style.display = "";
          element.style.display = "";
          console.log("Twitter header and profile element are visible");
        }
      });
    } else {
      // If headerElement is not found, wait a little and try again
      console.log("Waiting for headerElement to be available...");
      setTimeout(waitForHeader, 100); // Check every 100 milliseconds
    }
  }

  // Run the wait function on page load or reload
  waitForHeader();
}

// Use addEventListener instead of direct assignment for better practice
window.addEventListener('load', () => checkTwitterHeaderVisibility());

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === "scrapingChannel") {
    console.log("Connection established in content script:", port)

    port.onMessage.addListener(function (request) {
      console.log("Message received in content script:", request)

      if (request.action === "scrapeContent") {
        console.log(
          `Scraping content with analysisId: ${request.analysisId}, targetUrl: ${request.tabUrl}`
        )

        scrapeContent(request.analysisId)
          .then((content) => {
            console.log(`Content extracted: ${content}`)

            // Send the response back to the background script
            port.postMessage({ status: "Content extracted", content: content })
          })
          .catch((error) => {
            console.error(`Error scraping content: ${error.message}`)
            port.postMessage({ status: "Error", message: error.message })
          })
      }
    })

    // Clean up the connection if needed
    port.onDisconnect.addListener(() => {
      console.log("Port disconnected in content script")
    })
  } else if (port.name === "scrapeContent") {
    console.log("Connection established in content script:", port)

    port.onMessage.addListener(function (request) {
      console.log("Message received in content script:", request)

      if (request.action === "scrapeContent") {
        console.log(
          `Scraping content with analysisId: ${request.analysisId}, targetUrl: ${request.tabUrl}`
        )
        console.log("isSecondaryParse>>>>", request.isSecondaryParse)
        scrapeContent(request.analysisId, request.targetUrl, request.isSecondaryParse)
          .then((content) => {
            console.log(`Content extracted of truncated tweets: ${content}`)

            // Send the response back to the background script
            port.postMessage({ status: "Content extracted", content: content })
          })
          .catch((error) => {
            console.error(`Error scraping content: ${error.message}`)
            port.postMessage({ status: "Error", message: error.message })
          })
      }
    })

    // Clean up the connection if needed
    port.onDisconnect.addListener(() => {
      console.log("Port disconnected in content script")
    })
  }
})

// Initialize TwitterScraper when the content script loads
initializeTwitterScraper()
