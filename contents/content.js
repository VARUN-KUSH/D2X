export const config = {
  matches: ["https://x.com/*"],
  all_frames: true
}

console.log("D2X content script loaded", new Date().toISOString())

let twitterScraper = null
let initializationAttempts = 0
const MAX_INITIALIZATION_ATTEMPTS = 5

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
        twitterScraper = new TwitterScraper()
        console.log("TwitterScraper initialized after waiting for ready event")
      },
      { once: true }
    )
  }
}

function ensureTwitterScraperInitialized() {
  return new Promise((resolve, reject) => {
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

async function scrapeContent(
  analysisId = null,
  screenshotData = null,
  targetUrl = null
) {
  console.log(
    `Scraping content for analysisId: ${analysisId}, targetUrl: ${targetUrl}`
  )
  if (isTwitterOrX()) {
    console.log("Twitter/X page detected")
    try {
      const scraper = await ensureTwitterScraperInitialized()
      console.log("TwitterScraper initialized, getting tweets")

      let tweets
      if (targetUrl) {
        function executeScraping() {
          setTimeout(() => {
            console.log("Page fully loaded or already loaded")

            // Logic when DOM is loaded, then run it
            console.log(`Scraping single tweet: ${targetUrl}`)

            tweets = scraper.parseTweets(analysisId, targetUrl)
            console.log("fullPostTweet>>>>>>>>>", tweets)
          }, 2000)
        }

        // Check if the document is already fully loaded
        if (document.readyState === "complete") {
          await delay(2000)
          // Page is already loaded, so run the scraping logic immediately
          executeScraping()
        } else {
          // Page is not fully loaded yet, wait for it to load
          window.addEventListener("load", executeScraping)
        }
        // await delay(3000);
        //logic when dom is loaded then run it
        // If targetUrl is provided, we're scraping a single tweet
        // console.log(`Scraping single tweet: ${targetUrl}`)
        // tweets = scraper.parseTweets(analysisId, targetUrl)
        // console.log("fullPostTweet>>>>>>>>>", tweets)
      } else {
        // Otherwise, scrape all tweets on the page
        tweets = await scraper.getTweets(analysisId)
      }

      if (!tweets || tweets.length === 0) {
        console.warn(
          `No tweets scraped. analysisId: ${analysisId}, targetUrl: ${targetUrl}`
        )
        console.log("Current page content:", document.body.innerHTML)
      } else {
        console.log(`Scraped ${tweets.length} tweets`)
      }

      return tweets
    } catch (error) {
      console.error("Error in TwitterScraper:", error)
      throw error
    }
  } else {
    console.log("Non-Twitter page detected")
    // Fallback to universal scraping method
    return await universalScrape(screenshotData, analysisId)
  }
}

// Placeholder for universal scrape function
async function universalScrape(screenshotData, analysisId) {
  console.log("Universal scrape not implemented yet")
  return []
}

// XPath selector for the target element
const targetXPath = '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div/div/section/div/div/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div/div[1]/div/div[2]/div/div[2]/div/a/div[4]/div';

// Function to find element by XPath
function getElementByXPath(xpath) {
    return document.evaluate(
        xpath, 
        document, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
    ).singleNodeValue;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Message received in content script:", request)
  // Handle the disableTwitterHeader and enableTwitterHeader actions
  const headerElement = document.querySelector('header[role="banner"]')
  //localStorage event save and action based on event

  const element = getElementByXPath(targetXPath);
  console.log("profilelem>>>>>>>", element)

  if (request.action === "disableTwitterHeader") {
    if (headerElement) {
      headerElement.style.display = "none" // Hide the header
      console.log("Twitter header disabled")
      chrome.storage.local.set({ disableTwitterHeader: true }) // Save setting to chrome.storage
    }
    if (element) {
      // Disable the element
      element.style.pointerEvents = 'none';
  }
    sendResponse({ status: "Twitter header disabled" })
  } else if (request.action === "enableTwitterHeader") {
    if (headerElement) {
      headerElement.style.display = "" // Show the header
      console.log("Twitter header enabled")
      chrome.storage.local.set({ disableTwitterHeader: false })
    }
    sendResponse({ status: "Twitter header enabled" })
  }
})
// to disable twitter header every time tab updates
function checkTwitterHeaderVisibility() {
  // Function to recursively wait for the header element to load
  function waitForHeader() {
    const headerElement = document.querySelector('header[role="banner"]')
    if (headerElement) {
      chrome.storage.local.get("disableTwitterHeader", (result) => {
        console.log("Inside the header visibility function")
        const disableTwitterHeader = result.disableTwitterHeader || false
         // Find the profile link element - using the specific selectors from your example
        const element = getElementByXPath(targetXPath);
        console.log("profilelem>>>>>>>", element)
        console.log("disableTwitterHeader:", disableTwitterHeader)
        console.log("headerElement found:", headerElement)
        if (disableTwitterHeader) {
          headerElement.style.display = "none" // Hide the header
          console.log("Twitter header is hidden (based on chrome.storage)")
          if (element) {
            // Disable the element
            element.style.pointerEvents = 'none';
        }

        } else {
          headerElement.style.display = "" // Show the header
          console.log("Twitter header is visible (based on chrome.storage)")
          profileLink.style.display = "";
          console.log("Profile link is visible");
        }
      })
    } else {
      // If headerElement is not found, wait a little and try again
      console.log("Waiting for headerElement to be available...")
      setTimeout(waitForHeader, 100) // Check every 100 milliseconds
    }
  }

  // Run the wait function on page load or reload
  waitForHeader()
}

checkTwitterHeaderVisibility()

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
            console.log(`Content extracted: ${JSON.stringify(content)}`)

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

        scrapeContent(request.analysisId, request.targetUrl)
          .then((content) => {
            console.log(`Content extracted: ${JSON.stringify(content)}`)

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
