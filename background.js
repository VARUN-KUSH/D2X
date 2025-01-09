// Function to handle the full analysis workflow
// TODO implement Workflow
//  - Start analysis with user button click
//  - Generate a UID
//  - trigger screenshot of the social media page with timestamps and url added
//  - trigger scraping
//  - Use LLM / Assitent API
//    - if required (i.e. if scraping gives unstructured ORC result from universal scraper(i.e. a scraper flag = universalScraper)) structure the scrape into a format of messages and replies
//    - evaluate if post can be reported to authorities
//  - create report / download report (folder with screenshot, and report and possibly csv with analysis results so the user can change the suggestions and then automate reporting to the authorieties with a different program)
// handle when no reportable posts

import { profileScrape } from "./contents/profile-scrapper.js"
import jsonSchema from "./response.schema.json"
import {
  addToZip,
  callPerplexity,
  createFinalReport,
  downloadpostreport,
  downloadprofilereport,
  downloadZip,
  fetchEvaluation
} from "./utility.js"
import { evaluatorSystemPrompt, generatePerplexityPrompt } from "./utils.js"

// ## Global variables
let currentAnalysisId = null
let activeAnalyses = new Map()

// ## UID generation and management

function generateUniqueId() {
  // The IDs follow the UUID (Universally Unique Identifier) version 4 format
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function startNewAnalysis() {
  const newUID = generateUniqueId()
  currentAnalysisId = newUID
  activeAnalyses.set(newUID, { status: "started", timestamp: Date.now() })
  return newUID
}

function getActiveAnalysisId() {
  if (!currentAnalysisId) {
    return startNewAnalysis()
  }
  return currentAnalysisId
}

function updateAnalysisStatus(uid, status) {
  if (activeAnalyses.has(uid)) {
    console.log(`Updating analysis ${uid} to status: ${status}`)
    activeAnalyses.get(uid).status = status
  } else {
    console.warn(`Attempted to update status for unknown analysis ID: ${uid}`)
  }
}

async function getCurrentTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0]?.id
}

async function getCurrentTabUrl() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0]?.url
}

// ## Utility functions
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// may be are using the listeneer inside function
function waitForTabToLoad(tabId) {
  return new Promise((resolve) => {
    function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }
    chrome.tabs.onUpdated.addListener(listener)
  })
}

async function getCurrentTime() {
  const url =
    "https://www.timeapi.io/api/time/current/zone?timezone=Europe/Berlin"
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.dateTime
  } catch (error) {
    console.error("Error fetching time:", error)
    return new Date().toISOString() // Fallback to local system time
  }
}

function generateScreenshotFilename(analysisId, index, total) {
  return `screenshot_${analysisId}_${index + 1}_of_${total}.png`
}

async function scrapeContent(analysisId, tabId) {
  return new Promise((resolve, reject) => {
    const port = chrome.tabs.connect(tabId, { name: "scrapingChannel" })

    // Send the scrape request via the persistent connection
    port.postMessage({
      action: "scrapeContent",
      analysisId: analysisId
    })

    // Listen for messages from the content script
    port.onMessage.addListener((response) => {
      if (response.status === "Content extracted") {
        console.log(
          "Content extracted successfully in background:",
          response.content
        )
        resolve(response.content)
        port.disconnect() // Close the port after receiving the response
      } else if (response.status === "Error") {
        console.error("Error in content script:", response.message)
        reject(new Error(response.message))
        port.disconnect() // Close the port on error
      }
    })

    // Handle errors if the connection fails
    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      }
    })
  })
}

async function handlePostURLScrape(analysisId, url) {
  console.log(`Handling post URL scrape for: ${url}`)
  let tab
  try {
    tab = await chrome.tabs.create({ url: url, active: false })
    console.log(
      `Created new tab with ID: ${tab.id} and analysisId: ${analysisId}`
    )

    // Wait for the page to load
    await new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener)
          console.log(`Tab ${tabId} finished loading`)
          resolve()
        }
      })
    })

    // First attempt
    console.log("Waiting for 5 seconds to ensure content is fully loaded...")
    await delay(5000)

    console.log(`Sending scrapeContent message to tab ${tab.id}`)

    const result = await new Promise((resolve, reject) => {
      const port = chrome.tabs.connect(tab.id, {
        name: "scrapeContent"
      })

      // Send the scrape request via the persistent connection
      port.postMessage({
        action: "scrapeContent",
        targetUrl: url,
        analysisId: analysisId
      })

      // Listen for messages from the content script
      port.onMessage.addListener((response) => {
        if (response.status === "Content extracted") {
          console.log(
            "Content extracted successfully in background:",
            response.content
          )
          resolve(response.content)
          port.disconnect() // Close the port after receiving the response
        } else if (response.status === "Error") {
          console.error("Error in content script:", response.message)
          reject(new Error(response.message))
          port.disconnect() // Close the port on error
        }
      })

      // Handle errors if the connection fails
      port.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        }
      })
    })
    console.log(`Received scrape result: ${JSON.stringify(result)}`)

    // Check if result is empty and retry if necessary
    if (!result) {
      console.log(
        "First scrape attempt returned empty result. Waiting additional 3 seconds and retrying..."
      )
      //try again to sendmessage to scrape full post
    }

    if (result && Array.isArray(result)) {
      return result
    } else {
      console.error(
        "Invalid scrape result format or scraping failed after retry"
      )
      return null
    }
  } catch (error) {
    console.error(`Error in handlePostURLScrape: ${error.message}`)
    return null
  } finally {
    if (tab) {
      try {
        await chrome.tabs.remove(tab.id)
        console.log(`Removed tab ${tab.id}`)
      } catch (error) {
        console.error(`Error removing tab ${tab.id}: ${error.message}`)
      }
    }
  }
}

async function initiateDownload() {
  try {
    const zipBlob = await downloadZip()

    // Convert the Blob to a base64 string to send to the content script or popup
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64data = reader.result.split(",")[1] // Extract base64 part
      console.log("base64data>>>>>>>>", base64data)
      chrome.runtime.sendMessage({
        action: "downloadZip",
        base64data: base64data
      })
    }
    reader.readAsDataURL(zipBlob)
  } catch (error) {
    console.error("Error during download:", error)
  }
}

// Function to send messages to the popup
export function sendMessageToPopup(message) {
  chrome.runtime.sendMessage({ action: "processUpdate", data: message })
}

// ## Main analysis functions
async function startFullAnalysis() {
  try {
    const uid = getActiveAnalysisId()
    console.log("uid>>>>>>>>>>>>>>>>>>>>>", uid)
    console.log(`Starting full analysis with ID: ${uid}`)

    const tabId = await getCurrentTabId()
    const url = await getCurrentTabUrl()
    console.log("tabid>>>>>>>>>>>>>", tabId)
    console.log("url>>>>>>>>>>>>>>", url)

    // Capture initial screenshot without navigation
    //send status of project to popup
    //chnage this to german language
    sendMessageToPopup("Ich erstelle einen Screenshot der ganzen Seite...")
    const screenshot = await requestinitialScreenshotCapture(
      url,
      "initial_page.png",
      ""
    )
    console.log("initialscreenshot>>>>>>>>>", screenshot)

    // Proceed with scraping and processing
    updateAnalysisStatus(uid, "scraping")
    console.log("Scraping content for URL:", url)
    sendMessageToPopup("Ich lese die Tweets....")
    const scrapedContent = await scrapeContent(uid, tabId)
    console.log("Scraped content:", scrapedContent)

    updateAnalysisStatus(uid, "processing")
    //change the lang to german
    sendMessageToPopup("Ich beginne mit der Verarbeitung der Tweets...")
    const results = await processContent(scrapedContent)
    console.log("Processed results:", results)
    console.log("finalreport>>>>>>", results.Report)
    if (!results.Report) {
      sendMessageToPopup("Ich habe keine anzeigbaren Tweets gefunden.")
      return
    }
    // After processing, add analysis results to the ZIP Folder
    sendMessageToPopup("Ich erstelle die Strafanzeigen und Dokumente...")
    await createFinalReport(
      results.Report.reportablePostsArray,
      results.Report.originalUrl
    )
    sendMessageToPopup("Dokumente werden heruntergeladen...")
    await initiateDownload()
    sendMessageToPopup("Dokumente erfolgreich heruntergeladen.")
    // Signal completion to trigger ZIP download
    // chrome.runtime.sendMessage({ action: "analysisComplete", analysisId: uid })

    // updateAnalysisStatus(uid, "completed")
  } catch (error) {
    console.error("Error during full analysis:", error)
    chrome.runtime.sendMessage({
      action: "analysisError",
      error: error.message,
      analysisId: getActiveAnalysisId()
    })
    updateAnalysisStatus(getActiveAnalysisId(), "error")
  }
}

// async function addAnalysisResultsToZip(results) {
//   return new Promise((resolve, reject) => {
//     chrome.runtime.sendMessage(
//       {
//         action: "addToZip",
//         fileData: JSON.stringify(results, null, 2),
//         filename: "analysis_results.json",
//         directory: ""
//       },
//       (response) => {
//         if (chrome.runtime.lastError || (response && response.error)) {
//           reject(chrome.runtime.lastError || response.error)
//         } else {
//           resolve()
//         }
//       }
//     )
//   })
// }

// # Assistent functionality
// Function to load API key storage
async function getAPIKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["openaiApiKey"], function (result) {
      if (result.openaiApiKey) {
        console.log("API key found in storage")
        resolve(result.openaiApiKey)
      } else {
        console.log("API key not found in storage or config")
        chrome.runtime.sendMessage({ action: "requestAPIKey" })
        resolve(null)
      }
    })
  })
}

// Function to process content with batching and error handling
async function processContent(messages) {
  try {
    const uid = getActiveAnalysisId()
    console.log(`Processing content for analysis ID: ${uid}`)
    updateAnalysisStatus(uid, "processing")
    const API_KEY = await getAPIKey()
    if (!API_KEY) {
      throw new Error(
        "API Key not set. Please set your API key in the extension options."
      )
    }

    sendMessageToPopup("Ich bewerte die Tweets mit Hilfe von OpenAI...")

    let backgroundInfo = ""
    try {
      const result = await chrome.storage.local.get(["backgroundInfo"])
      backgroundInfo = result.backgroundInfo || ""
      console.log(
        "resultInbackgroundinfo>>>>>>>>>>",
        result,
        "backgroundInfo>>>>>>>>",
        backgroundInfo
      )
    } catch (error) {
      console.error("Error retrieving background info:", error)
    }

    let systemPromptWithContext = evaluatorSystemPrompt
    if (backgroundInfo.trim() !== "") {
      const contextBlock = `
    # Context by the user
    Additional context provided by the user to be considered during analysis:
    ${backgroundInfo}
    # End of user context
    `
      // Use a regular expression to safely replace the placeholder
      systemPromptWithContext = evaluatorSystemPrompt.replace(
        /\{\{context_block\}\}\n*/g,
        contextBlock
      )
    } else {
      // If no context, just remove the placeholder
      systemPromptWithContext = evaluatorSystemPrompt.replace(
        /\{\{context_block\}\}\n*/g,
        ""
      )
    }

    console.log("systemprompts", systemPromptWithContext)
    const results = []
    console.log("messages>>>>>>>", messages)

    // Map to store original user information
    const userInfoMap = new Map()
    let userCounter = 1

    function anonymizeMessages(messages) {
      const anonymizedMessages = messages.map((message) => {
        // Use Post_URL as a unique identifier
        const postUrl = message.postUrl || message.Post_URL

        // Store original information with Post_URL as key
        userInfoMap.set(postUrl, {
          originalScreenname: message.screenname || message.Screenname,
          originalUsername: message.handle || message.Username,
          anonymousScreenname: `Username${userCounter}`,
          anonymousUsername: `user${userCounter}123`,
          postUrl: postUrl
        })

        userCounter++
        // Return anonymized message
        return {
          ...message,
          screenname: `Username${userCounter}`,
          handle: `user${userCounter}123`,
          Screenname: `Username${userCounter}`,
          Username: `user${userCounter}123`
        }
      })

      return anonymizedMessages
    }

    function restoreOriginalInfo(reportablePosts) {
      return reportablePosts.map((post) => {
        // Get original info using Post_URL
        const originalInfo = userInfoMap.get(post.Post_URL)

        if (originalInfo) {
          return {
            ...post,
            Screenname: originalInfo.originalScreenname,
            Username: originalInfo.originalUsername
          }
        }

        return post
      })
    }

    try {
      const anonymizedMessages = anonymizeMessages(messages)
      console.log("anonymizedMessages>>>", anonymizedMessages)
      const postresults = await fetchEvaluation(
        API_KEY,
        systemPromptWithContext,
        jsonSchema,
        anonymizedMessages
      )

      // Parse and use the structured output as needed
      console.log("Structured Response:", postresults)
      postresults.map((post) => {
        const posts = JSON.parse(post.choices[0].message?.content)
        results.push(...(posts?.Posts || []))
      })

      console.log("results>>>>>>>>>>>>>>", results)
    } catch (error) {
      console.error("Error fetching evaluation:", error)
    }

    const reportablePosts = results.filter(
      (post) => post.Post_selbst_ist_anzeigbar_flag === true
    )

    console.log("Reportable posts:", reportablePosts)

    // Restore original information only for reportable posts
    const reportablePostsWithOriginalInfo = restoreOriginalInfo(reportablePosts)

    console.log(
      "Reportable posts with original info:",
      reportablePostsWithOriginalInfo
    )

    let finalreports
    // Capture screenshots for reportable posts and user profiles
    if (reportablePostsWithOriginalInfo.length > 0) {
      sendMessageToPopup(
        `Ich habe ${reportablePostsWithOriginalInfo.length} anzeigbare Posts identifiziert.`
      )
      finalreports = await captureReportablePostScreenshots(
        reportablePostsWithOriginalInfo
      )
    }

    updateAnalysisStatus(uid, "completed")
    return { Posts: results, analysisId: uid, Report: finalreports }
  } catch (error) {
    console.error("Error in content analysis:", error)
    chrome.runtime.sendMessage({
      action: "analysisError",
      error: error.message,
      analysisId: getActiveAnalysisId()
    })
    updateAnalysisStatus(getActiveAnalysisId(), "error")
    throw error
  }
}

// Neue Funktion zur Verarbeitung erfasster Screenshots
async function captureReportablePostScreenshots(reportablePosts) {
  // const capturedProfiles = new Set()
  let originalTab
  let originalUrl

  try {
    // Get the current active tab and its URL
    let attempts = 0
    const maxRetries = 5
    const delaytime = 1000 // 1 second

    let tabs
    while (attempts < maxRetries) {
      tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tabs && tabs.length > 0) {
        console.log("tabs>>>>>>>>>>>>>>", tabs)
        originalTab = tabs[0]
        console.log("originalTab>>>>", originalTab)
        // Continue with further code here, such as accessing `originalTab.url`
        break
      }

      attempts++
      console.warn(`Attempt ${attempts} failed. Retrying in ${delaytime}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delaytime))
    }

    if (!tabs || tabs.length === 0) {
      console.error("No active tab found after multiple retries.")
      throw new Error("No active tab found")
    }

    console.log("tabs>>>>>>>>>>>>>>", tabs)
    originalTab = tabs[0]
    console.log("originalTab>>>>", originalTab)
    originalUrl = originalTab.url
    let reportablePostsArray = [] // Array to store all posts with screenshots
    let capturedProfiles = new Map() // Map to store profile screenshots for each user by their profile URL
    let capturedProfilesdata = new Map()
    for (const post of reportablePosts) {
      //screenshoting the all reportable posts
      //ss of the tweets + ss of their profile (exception:- if same people having multiple tweets only one )
      // scraping the profile info section
      console.log("eachreportablepost>>>>>>>>>>", post)
      try {
        // Navigate to post URL if necessary
        if (originalTab.url !== post.Post_URL) {
          console.log("post url and originaltab are not equal")
          await chrome.tabs.update(originalTab.id, { url: post.Post_URL })
          await waitForTabToLoad(originalTab.id)
        }

        // Capture post screenshot
        //should be taken once the dom and assets fully loaded

        await new Promise((resolve) => setTimeout(resolve, 10000))
        console.log("going to take screenshort of fullpage")
        sendMessageToPopup("Ich mache Screenshots der anzeigbaren Posts..")
        const reportablepostscreenshots = await requestinitialScreenshotCapture(
          post.Post_URL,
          `post_${post.ID}.png`,
          `${post.Username}/Post_${post.ID}`
        )

        console.log(
          "reportablescreenshots>>>>>>>>>>>",
          reportablepostscreenshots
        )

        // Optional delay

        // Initialize profileScreenshot as null for each post
        let profileScreenshot = null
        let scrapedData = null
        // Capture user profile screenshot if not already done
        if (!capturedProfiles.has(post.User_Profil_URL)) {
          if (originalTab.url !== post.User_Profil_URL) {
            await chrome.tabs.update(originalTab.id, {
              url: post.User_Profil_URL
            })
            await waitForTabToLoad(originalTab.id)
          }
          sendMessageToPopup("Extrahieren von Benutzerprofilinformationen..")
          await delay(3000)
          scrapedData = await new Promise((resolve, reject) => {
            chrome.scripting.executeScript(
              {
                target: { tabId: originalTab.id },
                world: "MAIN", // Access the window object directly
                func: profileScrape
              },
              (results) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Script injection failed:",
                    chrome.runtime.lastError
                  )
                  reject(chrome.runtime.lastError)
                } else if (results && results[0]?.result !== undefined) {
                  console.log("Background script got callback after injection")
                  resolve(results[0].result) // Access the returned data here
                } else {
                  console.error("No data returned from content script.")
                  resolve(null)
                }
              }
            )
          })

          console.log("scrapedprofileData", scrapedData)

          await new Promise((resolve) => setTimeout(resolve, 3000))
          sendMessageToPopup(
            "Ich mache Screenshots der Profile zur Beweissicherung..."
          )
          profileScreenshot = await requestScreenshotCapture(
            post.User_Profil_URL,
            `profile_${post.Username}.png`,
            `${post.Username}`
          )

          console.log("profilescreenshot>>>>>>>>>>>", profileScreenshot)

          //scrape the profile of each user

          // Store the profile screenshot in the map for reuse
          capturedProfiles.set(post.User_Profil_URL, profileScreenshot)
          capturedProfilesdata.set(post.User_Profil_URL, scrapedData)
        } else {
          // Reuse the existing profile screenshot if already captured
          profileScreenshot = capturedProfiles.get(post.User_Profil_URL)
          scrapedData = capturedProfilesdata.get(post.User_Profil_URL)
        }

        let postReport = null
        sendMessageToPopup(
          "Suche Informationen zum User mit Hilfe von Perplexity..."
        )
        const perplexityQuery = generatePerplexityPrompt(
          post.Username,
          scrapedData
        )

        // console.log("perplexityQuery>>>>>>>>>", perplexityQuery)
        const perplexityresponse = await callPerplexity(perplexityQuery)
        console.log("perplexityresponse", perplexityresponse)

        if (perplexityresponse) {
          try {
            // Find the JSON part of the response
            const jsonStart = perplexityresponse.indexOf("{")
            const jsonEnd = perplexityresponse.lastIndexOf("}") + 1

            if (jsonStart !== -1 && jsonEnd !== -1) {
              // Extract only the JSON part
              const jsonStr = perplexityresponse.substring(jsonStart, jsonEnd)
              const response = JSON.parse(jsonStr)

              postReport = {
                ...post,
                scrapedData: scrapedData,
                perplexityresponse: response,
                postScreenshot: reportablepostscreenshots,
                profileScreenshot: profileScreenshot
              }
            }
            // else {
            //   // If no JSON found, store the raw response
            //   postReport = {
            //     ...post,
            //     scrapedData: scrapedData,
            //     perplexityresponse: { raw: perplexityresponse },
            //     postScreenshot: reportablepostscreenshots,
            //     profileScreenshot: profileScreenshot
            //   };
            // }
          } catch (error) {
            console.error("Error parsing perplexity response:", error)
          }
        } else {
          sendMessageToPopup(
            "Perplexity Toggle ist ausgeschaltet, daher wird nicht nach der Online-Präsenz des Benutzers gesucht.."
          )
          postReport = {
            ...post,
            scrapedData: scrapedData,
            postScreenshot: reportablepostscreenshots, // Unique post screenshot for each post
            profileScreenshot: profileScreenshot // Shared profile screenshot for each post by the same user
          }
        }
        // Create a structured object for each post

        //calling perplexity logic
        // Add the structured post report to the array
        reportablePostsArray.push(postReport)
      } catch (error) {
        console.error(`Error capturing screenshots for post ${post.ID}:`, error)
      }
    }

    // Navigate back to the original URL
    // if (originalTab.url !== originalUrl) {
    await chrome.tabs.update(originalTab.id, { url: originalUrl })
    // }
    console.log("reportablePostsArray>>>>>>>>>>", reportablePostsArray)
    return { reportablePostsArray, originalUrl }
  } catch (error) {
    console.error(`Error in captureReportablePostScreenshots:`, error)
  }
}

async function requestinitialScreenshotCapture(url, filename, directory) {
  // return await new Promise((resolve, reject) => {
  //   chrome.runtime.sendMessage(
  //     {
  //       action: "captureScreenshot",
  //       analysisId: getActiveAnalysisId(),
  //       url: url,
  //       filename: filename,
  //       directory: directory,
  //     },
  //     (response) => {
  //       if (chrome.runtime.lastError || (response && response.error)) {
  //         reject(chrome.runtime.lastError || response.error);
  //       } else {
  //         if (response.success && response.modifiedscreenshots) {
  //           resolve(response.modifiedscreenshots)
  //           return
  //         }
  //       }
  //     }
  //   );
  // });

  return await new Promise((resolve, reject) => {
    const port = chrome.runtime.connect({ name: "fullpagescreenshot" })

    // Send the message through the port
    port.postMessage({
      action: "fulltweetsScreenshot",
      analysisId: getActiveAnalysisId(),
      url: url,
      filename: filename,
      directory: directory
    })

    port.onMessage.addListener((response) => {
      if (response.success && response.modifiedscreenshots) {
        resolve(response.modifiedscreenshots)
      } else if (response.error) {
        reject(response.error)
      }

      port.disconnect()
    })

    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError) // Handle runtime errors
      } else {
        console.log("Port disconnected in background.")
      }
    })
  })
}

async function requestScreenshotCapture(url, filename, directory) {
  return await new Promise((resolve, reject) => {
    const port = chrome.runtime.connect({ name: "reportablescreenshotPort" })

    // Send the message through the port
    port.postMessage({
      action: "capturereportabletweetsScreenshot",
      analysisId: getActiveAnalysisId(),
      url: url,
      filename: filename,
      directory: directory
    })

    port.onMessage.addListener((response) => {
      if (response.success && response.modifiedscreenshots) {
        resolve(response.modifiedscreenshots)
      } else if (response.error) {
        reject(response.error)
      }

      port.disconnect()
    })

    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError) // Handle runtime errors
      } else {
        console.log("Port disconnected in background.")
      }
    })
  })
}

// Utility function to get the current date in DD.MM.YYYY format
function getCurrentDate() {
  const now = new Date()
  return `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`
}

// Function to generate the appropriate filename based on the URL format
function generateFilename(url) {
  const date = getCurrentDate()
  const urlObj = new URL(url)
  let directory = ""
  let filename = ""

  // Check if it's a Twitter profile or tweet URL on x.com
  if (urlObj.hostname === "x.com") {
    const pathSegments = urlObj.pathname.split("/").filter(Boolean) // Split and remove empty segments

    // Case 1: Tweet URL format https://x.com/[TwitterUserHandle]/status/[TweetURLNumber]
    if (pathSegments.length === 3 && pathSegments[1] === "status") {
      const twitterUserHandle = pathSegments[0]
      const tweetURLNumber = pathSegments[2]

      directory = `${twitterUserHandle}/tweets/${tweetURLNumber}`
      filename = `screenshot_${twitterUserHandle}_${tweetURLNumber}_${date}.png`
    }

    // Case 2: Profile URL format https://x.com/[TwitterUserHandle]
    if (pathSegments.length === 1) {
      const twitterUserHandle = pathSegments[0]
      // Create directory structure: username/profile
      directory = `${twitterUserHandle}`
      filename = `screenshot_userInfo_${twitterUserHandle}_${date}.png`
    }
  }

  // Default case: For other URLs, organize by domain
  else {
    const pageURL = urlObj.hostname
    // Remove common TLDs and create clean directory name

    ;(directory = ""), (filename = `screenshot_${pageURL}_${date}.png`)
  }
  // Default case: For other URLs, create a general filename

  return {
    directory,
    filename
  }
}

// # Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message in background:", request)

  if (!request.action) {
    console.log("Message without action, ignoring:", request)
    return
  }

  ;(async () => {
    try {
      switch (request.action) {
        case "startAnalysis":
          await startFullAnalysis()
          sendResponse({ analysisId: getActiveAnalysisId() })
          break

        case "fullpagelengthss":
          console.log("here in fullpage")
          const url = await getCurrentTabUrl()
          // Generate the filename based on the URL
          const { directory, filename } = generateFilename(url)
          console.log("filename>>>>>", filename)
          sendResponse({
            analysisId: getActiveAnalysisId(),
            url: url,
            filename: filename,
            directory: directory
          })
          break

        case "visiblelengthss":
          console.log("here in visibletabpage")
          const urlofpost = await getCurrentTabUrl()
          const res = generateFilename(urlofpost)
          sendResponse({
            analysisId: getActiveAnalysisId(),
            url: urlofpost,
            filename: res.filename,
            directory: res.directory
          })
          break

        case "SEARCH_PROFILE":
          function extractTwitterProfileData(profileText) {
            // Initialize the result object
            const profileData = {
              screenname: "",
              username: "",
              profilebiodata: "",
              userlocation: "",
              userJoindate: "",
              followingCount: 0,
              followersCount: 0,
              additionalInfo: []
            }

            // Split the text into lines for easier processing
            const lines = profileText
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line)

            // Extract screen name (first line) and username (second line)
            profileData.screenName = lines[0]
            profileData.username = lines[1].startsWith("@") ? lines[1] : ""

            // Extract bio (typically the next few lines until location/join date)
            let bioLines = []
            let currentIndex = 2

            while (
              currentIndex < lines.length &&
              !lines[currentIndex].includes("Joined") &&
              !lines[currentIndex].includes("Following") &&
              !lines[currentIndex].includes("Followers")
            ) {
              bioLines.push(lines[currentIndex])
              currentIndex++
            }
            profileData.bio = bioLines.join("\n")

            // Extract location and join date
            const locationJoinLine = lines.find((line) =>
              line.includes("Joined")
            )
            if (locationJoinLine) {
              const [location, joinInfo] = locationJoinLine.split("Joined")
              profileData.location = location.trim()
              profileData.joinDate = joinInfo.trim()
            }

            // Extract following and followers counts
            for (const line of lines) {
              if (line.includes("Following")) {
                profileData.followingCount = parseInt(line.match(/\d+/)[0])
              }
              if (line.includes("Followers")) {
                profileData.followersCount = parseInt(line.match(/\d+/)[0])
              }
            }

            // Add any additional information
            const additionalInfoLine = lines.find((line) =>
              line.includes("Not followed")
            )
            if (additionalInfoLine) {
              profileData.additionalInfo.push(additionalInfoLine)
            }

            return profileData
          }

          //call perplexity and the create a folder which contains the report
          const { profileUrl, knownProfileInfo } = request.data
          const profileUrlPattern = /^https:\/\/x\.com\/([^/]+)$/

          let username = null
          if (profileUrlPattern.test(profileUrl)) {
            // Extract the username from the profile URL
            username = profileUrl.match(profileUrlPattern)[1]
            console.log("Extracted Username:", username)
          } else {
            console.log("Profile URL does not match the expected format.")
          }

          const perplexityQuery = generatePerplexityPrompt(
            username,
            knownProfileInfo
          )

          const perplexityresponse = await callPerplexity(perplexityQuery)
          let response
          if (perplexityresponse) {
            try {
              // Find the JSON part of the response
              const jsonStart = perplexityresponse.indexOf("{")
              const jsonEnd = perplexityresponse.lastIndexOf("}") + 1

              if (jsonStart !== -1 && jsonEnd !== -1) {
                // Extract only the JSON part
                const jsonStr = perplexityresponse.substring(jsonStart, jsonEnd)
                response = JSON.parse(jsonStr)
                // Parse the known_info string into an object
                const knownInfoLines = response.known_info.split("\n")
                const knowninfo = {}

                knownInfoLines.forEach((line) => {
                  if (line.includes(": ")) {
                    const [key, value] = line.replace("- ", "").split(": ")
                    knowninfo[key] = value
                  }
                })

                // Extract follower and following counts and convert to numbers
                const followingCount =
                  parseInt(
                    knowninfo["Anzahl Konten denen dieser User folgt"]
                  ) || 0
                const followerCount =
                  parseInt(knowninfo["Anzahl Konten die diesem User folgen"]) ||
                  0

                const profileinfo = {
                  screenname: knowninfo["User-Name"],
                  username: knowninfo["User-Handle"],
                  profilebiodata: knowninfo["Beschreibung"],
                  userlocation: knowninfo["Ort"],
                  userJoindate: knowninfo["Konto erstellt"],
                  followingCount: followingCount,
                  followersCount: followerCount
                }

                sendResponse({
                  analysisId: getActiveAnalysisId(),
                  perplexityresponse: response,
                  userprofileinfo: profileinfo
                })
                break
              } else {
                console.log(
                  "response found from perplexity is not in correct format"
                )
              }
            } catch (error) {
              console.error("Error parsing perplexity response:", error)
            }
          } else {
            console.log("no response found from perplexity")
          }

        case "SEARCH_POST":
          const results = []
          async function parseTwitterUrl(url) {
            try {
              const urlObj = new URL(url)

              if (
                !urlObj.hostname.includes("x.com") &&
                !urlObj.hostname.includes("twitter.com")
              ) {
                throw new Error("Invalid Twitter/X URL")
              }

              const pathParts = urlObj.pathname.split("/").filter(Boolean)
              if (pathParts.length < 1) {
                throw new Error("No username found in URL")
              }

              const userName = pathParts[0]
              const profileURl = `https://x.com/${userName}`

              return {
                userName,
                profileURl
              }
            } catch (error) {
              throw new Error(`Failed to parse URL: ${error.message}`)
            }
          }

          const { postUrl, knownPostInfo } = request.data
          console.log("posturl>>>>", postUrl, "post>>>>", knownPostInfo)
          const resp = await parseTwitterUrl(postUrl)
          const { userName, profileURl } = resp
          //send both values to open ai
          const message = {
            postUrl: postUrl,
            handle: userName,
            isTruncated: false,
            postId: getActiveAnalysisId(),
            postUrl: postUrl,
            screenname: "",
            text: knownPostInfo,
            time: getCurrentTime(),
            userProfileUrl: profileURl
          }

          let messages = []
          messages.push(message)
          console.log("messages>>>>>>.", messages)
          let backgroundInfo = ""
          try {
            const result = await chrome.storage.local.get(["backgroundInfo"])
            backgroundInfo = result.backgroundInfo || ""
            console.log(
              "resultInbackgroundinfo>>>>>>>>>>",
              result,
              "backgroundInfo>>>>>>>>",
              backgroundInfo
            )
          } catch (error) {
            console.error("Error retrieving background info:", error)
          }

          const API_KEY = await getAPIKey()

          let systemPromptWithContext = evaluatorSystemPrompt
          if (backgroundInfo.trim() !== "") {
            const contextBlock = `
          # Context by the user
          Additional context provided by the user to be considered during analysis:
          ${backgroundInfo}
          # End of user context
          `
            // Use a regular expression to safely replace the placeholder
            systemPromptWithContext = evaluatorSystemPrompt.replace(
              /\{\{context_block\}\}\n*/g,
              contextBlock
            )
          } else {
            // If no context, just remove the placeholder
            systemPromptWithContext = evaluatorSystemPrompt.replace(
              /\{\{context_block\}\}\n*/g,
              ""
            )
          }

          try {
            const postresults = await fetchEvaluation(
              API_KEY,
              systemPromptWithContext,
              jsonSchema,
              messages
            )

            console.log("Structured Response:", postresults)
            // const posts = JSON.parse(postresults.choices[0].message?.content)
            // console.log("posts>>>>>>", posts)
            postresults.map((post) => {
              const posts = JSON.parse(post.choices[0].message?.content)
              results.push(...(posts?.Posts || []))
            })

            console.log("results>>>>>>>>>>>>>>", results)

            const reportablePosts = results.filter(
              (post) => post.Post_selbst_ist_anzeigbar_flag === true
            )

            console.log("Reportable posts:", reportablePosts)
            sendResponse({
              analysisId: getActiveAnalysisId(),
              openairesponse: reportablePosts
            })
          } catch (error) {
            console.error("Error fetching evaluation:", error)
          }

          break
        case "getCurrentTime":
          const time = await getCurrentTime()
          sendResponse({ time: time })
          break
        case "getActiveAnalysisId":
          sendResponse({ analysisId: getActiveAnalysisId() })
          break

        //case "storeScreenshot":
        //await storeScreenshot(request.analysisId, request.screenshot);
        //sendResponse({ status: "Screenshot stored successfully" });
        //break;

        case "scrapeContent":
          const content = await scrapeContent(
            request.analysisId,
            request.screenshotData
          )
          sendResponse({ status: "Content scraped", content: content })
          break

        case "scrapePostURL":
          analysisId = getActiveAnalysisId()
          const scrapedPost = await handlePostURLScrape(analysisId, request.url)
          console.log("scrapedPost>>>>>>>", scrapedPost)
          sendResponse(scrapedPost)
          break

        case "SAVE_REPORT":
          // Handle the finalreport data
          const reports = request.payload
          const originalUrl = reports.originalUrl
          const reportablePostsArray = reports.reportablePostsArray
          await createFinalReport(reportablePostsArray, originalUrl)
          await initiateDownload()
          sendResponse({ status: "Download section toggled" })
          break

        case "SaveProfileReport":
          const report = request.payload
          const reportableProfilePosts = report.reportablePostsArray
          await downloadprofilereport(reportableProfilePosts)
          await initiateDownload()
          sendResponse({ status: "Download section toggled" })
          break

        case "SavepostReport":
          const postreport = request.payload
          const PostoriginalUrl = postreport.originalUrl
          const reportablePosts = postreport.reportablePostsArray
          await downloadpostreport(reportablePosts, PostoriginalUrl)
          await initiateDownload()
          sendResponse({ status: "Download section toggled" })
          break

        case "screenshotError":
          console.error("Fehler bei der Screenshot-Erfassung:", request.error)
          break

        default:
          console.warn("Unhandled message action:", request.action)
          sendResponse({
            status: "Error",
            message: "Unhandled message action"
          })
          break
      }
    } catch (error) {
      console.error("Error in message handler:", error)
      sendResponse({ status: "Error", message: error.message })
    }
  })()

  return true // Indicates that the response is sent asynchronously
})

// background.js

chrome.action.onClicked.addListener((tab) => {
  // Programmatically open the side panel with your HTML content
  console.log("icon got clicked")
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error))
})

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "sidePanel") {
    console.log(port.sender)
    port.onDisconnect.addListener(() => {
      console.log("disconnected")
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "enableTwitterHeader"
          })
        }
      })
    })
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openNewTab") {
    console.log("opening new tab")
    chrome.tabs.create({
      url: chrome.runtime.getURL(message.url)
    })
  }
})

console.log("Background script loaded")
