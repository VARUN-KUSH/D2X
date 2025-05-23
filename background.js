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
  fetchEvaluation,
  isPerplexityEnabled
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

function getUsername(profileUrl) {
  const profileUrlPattern = /^https:\/\/x\.com\/([^/]+)$/

  let username = null
  if (profileUrlPattern.test(profileUrl)) {
    username = profileUrl.match(profileUrlPattern)[1]
    console.log("Extracted Username:", username)
  } else {
    console.log("Profile URL does not match the expected format.")
  }
  return username
}

function generateScreenshotFilename(analysisId, index, total) {
  return `screenshot_${analysisId}_${index + 1}_of_${total}.png`
}

/**
 * Filters the scraped tweets for the victim’s posts and concatenates their data.
 * @param {string} victimUsername - The victim's username (extracted from the profile URL).
 * @param {Array} scrapedContent - The array of scraped tweet objects.
 * @returns {string} A concatenated string of all matching tweet details.
 */
function filterVictimPosts(victimUsername, scrapedContent) {
  if (!victimUsername || !Array.isArray(scrapedContent)) return ""

  // Ensure victimUsername has an "@" prefix.
  if (victimUsername.charAt(0) !== "@") {
    victimUsername = "@" + victimUsername
  }

  // Filter tweets where the Username matches exactly.
  const victimTweets = scrapedContent.filter(
    (tweet) => tweet.Username === victimUsername
  )

  // Return a concatenated string with each tweet's details.
  return victimTweets
    .map((tweet) => {
      return `Screenname: ${tweet.Screenname}\nUsername: ${tweet.Username}\nTime: ${tweet.time}\nText: ${tweet.text}\n`
    })
    .join("\n\n")
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

async function handleAsyncScrape(request, sendResponse) {
  try {
    const analysisId = getActiveAnalysisId()
    const scrapedPost = await handlePostURLScrape(
      analysisId,
      request.url,
      request.isSecondaryParse
    )
    console.log("scrapedPost>>>>>>>", scrapedPost)
    sendResponse(scrapedPost)
  } catch (error) {
    console.error("Error in handleAsyncScrape:", error)
    sendResponse(null)
  }
}

async function handlePostURLScrape(analysisId, url, isSecondaryParse) {
  console.log(`Handling post URL scrape for: ${url}`)
  console.log("isSecondaryParse>>>>", isSecondaryParse)
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
        analysisId: analysisId,
        isSecondaryParse: isSecondaryParse
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
    reader.onloadend = async () => {
      const base64data = reader.result.split(",")[1] // Extract base64 part
      console.log("base64data>>>>>>>>", base64data)
      await saveData(base64data)
    }
    reader.readAsDataURL(zipBlob)
  } catch (error) {
    console.error("Error during download:", error)
  }
}

const saveData = async (base64data) => {
  await chrome.storage.local.set({ downloadData: base64data })
  chrome.runtime.sendMessage({ action: "downloadZip" })
}

// Function to send messages to the popup
export function sendMessageToPopup(message, progress = null) {
  chrome.runtime.sendMessage({
    action: "processUpdate",
    data: message,
    currentloaderprogress: progress
  })
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

    // Proceed with scraping and processing
    updateAnalysisStatus(uid, "scraping")
    console.log("Scraping content for URL:", url)
    sendMessageToPopup("Ich lese die Posts....", 10)
    const scrapedContent = await scrapeContent(uid, tabId)
    console.log("Scraped content:", scrapedContent)

    updateAnalysisStatus(uid, "processing")
    //change the lang to german
    sendMessageToPopup("Ich beginne mit der Verarbeitung der Posts...", 20)
    const results = await processContent(scrapedContent, uid)
    console.log("Processed results:", results)
    console.log("finalreport>>>>>>", results.Report)
    if (!results.Report) {
      sendMessageToPopup("Ich habe keine anzeigbaren Posts gefunden.", 100)
      return
    }
    // After processing, add analysis results to the ZIP Folder
    sendMessageToPopup("Ich erstelle die Strafanzeigen und Dokumente...", 80)
    await createFinalReport(results.Report.reportablePostsArray)

    sendMessageToPopup("Dokumente werden heruntergeladen...", 95)
    await initiateDownload()
    sendMessageToPopup("Dokumente erfolgreich heruntergeladen.", 100)
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

const replaceTextBlocks = (systemPrompt, contextBlock, victimPost) => {
  try {
    // First replace the context_block
    let updatedPrompt = systemPrompt.replace(
      /\{\{context_block\}\}\n*/g,
      contextBlock || ""
    )

    // Then replace the victim_post_block
    updatedPrompt = updatedPrompt.replace(
      /\{\{victim_post_block\}\}\n*/g,
      victimPost || ""
    )

    return updatedPrompt
  } catch (error) {
    console.error("Error replacing text blocks:", error)
    return systemPrompt // Return original if something goes wrong
  }
}

const getvictimname = (profileUrl) => {
  try {
    // Check if the URL is valid
    if (!profileUrl || typeof profileUrl !== "string") {
      return null
    }

    // Create URL object to validate URL format
    const url = new URL(profileUrl)

    // Check if it's an X/Twitter domain
    if (!["x.com", "twitter.com"].includes(url.hostname)) {
      return null
    }

    // Split path and remove empty strings
    const pathParts = url.pathname.split("/").filter(Boolean)

    // If no path parts or first part is not a username
    if (!pathParts.length) {
      return null
    }

    // Get the username (first part of path)
    const username = pathParts[0]

    // Check for reserved paths and username length
    const reservedPaths = ["home", "explore", "notifications", "status"]
    if (
      reservedPaths.includes(username.toLowerCase()) ||
      username.length > 15
    ) {
      return null
    }

    return username
  } catch (error) {
    return null
  }
}

// Function to process content with batching and error handling
async function processContent(messages, uid) {
  try {
   
    console.log(`Processing content for analysis ID: ${uid}`)
    updateAnalysisStatus(uid, "processing")
    const API_KEY = await getAPIKey()
    if (!API_KEY) {
      throw new Error(
        "API Key not set. Please set your API key in the extension options."
      )
    }

    sendMessageToPopup("Ich bewerte die Posts mit Hilfe von OpenAI...", 40)

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
    if (backgroundInfo.profileUrl || backgroundInfo.Info) {
      const contextBlock = `
      ${backgroundInfo.Info}
      `

      // First extract the victim’s username...
      const victimUsername = getvictimname(backgroundInfo.profileUrl)
      // ... then filter the scraped content (which is passed as 'messages') for the victim's posts.
      const victimPost = filterVictimPosts(victimUsername, messages)

      systemPromptWithContext = replaceTextBlocks(
        evaluatorSystemPrompt,
        contextBlock,
        victimPost
      )
    }

    console.log("systemprompts", systemPromptWithContext)
    const results = []
    console.log("messages>>>>>>>", messages)

    // Map to store original user information
    const userInfoMap = new Map()
    let userCounter = 1

    function generateUniqueKey() {
      return `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    function generatePaddedCounter(counter) {
      // using antic as padding should help LLMs to better handle the different names since the individual words created in reducing antic will likely map into different tokens.
      const num = parseInt(counter)
      if (num < 10) return `antic${num}` // antic1-antic9
      if (num < 100) return `anti${num}` // anti10-anti99
      if (num < 1000) return `ant${num}` // ant100-ant999
      if (num < 10000) return `an${num}` // an1000-an9999
      return `a${num}` // a10000+
    }

    function anonymizeMessages(messages) {
      const anonymizedMessages = messages.map((message) => {
        const uniqueKey = generateUniqueKey()
        const paddedCounter = generatePaddedCounter(userCounter)

        userInfoMap.set(uniqueKey, {
          originalScreenname: message.screenname || message.Screenname,
          originalUsername: message.handle || message.Username,
          originalpostUrl: message.postUrl,
          originalProfileUrl: message.userProfileUrl
        })

        userCounter++

        return {
          ...message,
          Screenname: `SCREEN_${paddedCounter}_NAME`, // e.g. SCREEN_antic1_NAME
          Username: `USER_${paddedCounter}_HANDLE`, // e.g. USER_antic1_HANDLE
          postUrl: `https://anonymous.post/POST_${paddedCounter}_URL`,
          userProfileUrl: `https://anonymous.profileurl/PROFILE_${paddedCounter}_URL`,
          _messageKey: uniqueKey
        }
      })

      return anonymizedMessages
    }

    function restoreOriginalInfo(reportablePosts) {
      // 1) First do the global string replacement for any mentions in text fields
      let bigJsonString = JSON.stringify(reportablePosts)

      // 2) For each post, do global replacements
      for (const post of reportablePosts) {
        const originalInfo = userInfoMap.get(post._messageKey)
        if (!originalInfo) {
          console.log("No original info found for post - debug info:", {
            messageKey: post._messageKey,
            postContent: post,
            availableKeys: Array.from(userInfoMap.keys()),
            userInfoMapContent: Array.from(userInfoMap.entries())
          })
          continue
        }

        // Global replacements to catch any mentions in text fields
        const replacements = [
          {
            searchValue: post.Screenname,
            replaceValue: originalInfo.originalScreenname
          },
          {
            searchValue: post.Username,
            replaceValue: originalInfo.originalUsername
          },
          {
            searchValue: post.postUrl,
            replaceValue: originalInfo.originalpostUrl
          },
          {
            searchValue: post.userProfileUrl,
            replaceValue: originalInfo.originalProfileUrl
          }
        ]

        // Go through each replacement
        for (const { searchValue, replaceValue } of replacements) {
          if (searchValue && replaceValue) {
            const escapedSearch = searchValue.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )
            bigJsonString = bigJsonString.replace(
              new RegExp(escapedSearch, "g"),
              replaceValue
            )
          }
        }
      }

      // 3) Parse back into objects
      const updatedPosts = JSON.parse(bigJsonString)

      // 4) Now explicitly set the critical fields using original values and filter out posts without matches
      const validPosts = updatedPosts.filter((post) => {
        const originalInfo = userInfoMap.get(post._messageKey)
        if (!originalInfo) {
          console.log("Dropping post due to missing original info:", {
            post: post,
            messageKey: post._messageKey,
            availableMapContent: Array.from(userInfoMap.entries())
          })
          return false
        }

        // Directly set URLs and names to ensure they're correct
        post.postUrl = originalInfo.originalpostUrl
        post.userProfileUrl = originalInfo.originalProfileUrl
        post.Username = originalInfo.originalUsername
        post.Screenname = originalInfo.originalScreenname
        return true
      })

      // 5) Remove the _messageKey
      validPosts.forEach((p) => {
        delete p._messageKey
      })

      // Log summary of dropped posts if any were dropped
      if (validPosts.length < updatedPosts.length) {
        console.log(
          `Dropped ${updatedPosts.length - validPosts.length} posts due to missing original info. ${validPosts.length} valid posts remaining.`
        )
      }

      return validPosts
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
        `Ich habe ${reportablePostsWithOriginalInfo.length} anzeigbare Posts identifiziert.`,
        60
      )
      await calculate_estimated_time_in_reportDownloading(reportablePostsWithOriginalInfo.length)
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

async function calculate_estimated_time_in_reportDownloading(reportablePostslength) {
  // Berechnung der benötigten Zeit pro Post (0.5 min oder 1 min)
  let timeForOnePost = 0.7; 
  const usePerplexity = await isPerplexityEnabled();
  if (usePerplexity) {
    timeForOnePost = 1;
  }
  
  // Gesamtdauer in Minuten (kann Bruchteile enthalten)
  const totalTime = reportablePostslength * timeForOnePost;
  // Aufrunden auf volle Minuten
  const roundedMinutes = Math.ceil(totalTime);
  
  // Aktuelle Zeit holen
  const now = new Date();
  // Endzeitpunkt berechnen: aktuelle Zeit + roundedMinutes
  const expectedTime = new Date(now.getTime() + roundedMinutes * 60000);
  
  // Formatierung in HH:MM (24-Stunden-Format)
  const hours = expectedTime.getHours().toString().padStart(2, '0');
  const minutes = expectedTime.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;
  
  // Sende den erwarteten Endzeitpunkt an die Side Panel
  chrome.runtime.sendMessage({ action: "updateTime", time: timeString });
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
          await chrome.tabs.update(originalTab.id, { url: post.postUrl })
          await waitForTabToLoad(originalTab.id)


        // Capture post screenshot
        //should be taken once the dom and assets fully loaded

        await new Promise((resolve) => setTimeout(resolve, 10000))
        console.log("going to take screenshort of fullpage")
        sendMessageToPopup("Ich mache Screenshots der anzeigbaren Posts..", 65)
        const reportablepostscreenshots = await requestinitialScreenshotCapture(
          post.postUrl,
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
        let scrapedProfileData = null
        let scrapedData = null
        // Capture user profile screenshot if not already done
        if (!capturedProfiles.has(post.userProfileUrl)) {
          if (originalTab.url !== post.userProfileUrl) {
            await chrome.tabs.update(originalTab.id, {
              url: post.userProfileUrl
            })
            await waitForTabToLoad(originalTab.id)
          }
          sendMessageToPopup("Ich lese die Benutzerprofilinformationen..")
          await delay(3000)
          scrapedProfileData = await new Promise((resolve, reject) => {
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

          console.log("scrapedprofileData", scrapedProfileData)
          scrapedData = {...scrapedProfileData, "User-Name": post.Screenname}
          await new Promise((resolve) => setTimeout(resolve, 3000))
          sendMessageToPopup(
            "Ich mache Screenshots der Profile zur Beweissicherung..."
          )
          profileScreenshot = await requestScreenshotCapture(
            post.userProfileUrl,
            `profile_${post.Username}.png`,
            `${post.Username}`
          )

          console.log("profilescreenshot>>>>>>>>>>>", profileScreenshot)

          //scrape the profile of each user

          // Store the profile screenshot in the map for reuse
          capturedProfiles.set(post.userProfileUrl, profileScreenshot)
          capturedProfilesdata.set(post.userProfileUrl, scrapedData)
        } else {
          // Reuse the existing profile screenshot if already captured
          profileScreenshot = capturedProfiles.get(post.userProfileUrl)
          scrapedData = capturedProfilesdata.get(post.userProfileUrl)
        }

        // let postReport = null
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

        let postReport = null
        let response = null
        let known_info = null
        let online_praesenz = null
        let weitere_informationen_zur_person = null

        if (perplexityresponse) {
          try {
            // First try the clean JSON way
            const jsonStart = perplexityresponse.indexOf("{")
            const jsonEnd = perplexityresponse.lastIndexOf("}") + 1

            if (jsonStart !== -1 && jsonEnd !== -1) {
              const jsonStr = perplexityresponse.substring(jsonStart, jsonEnd)
              try {
                response = JSON.parse(jsonStr)
                if (response.known_info) {
                  known_info = response.known_info
                  online_praesenz = response.online_praesenz
                  weitere_informationen_zur_person =
                    response.weitere_informationen_zur_person
                }
              } catch (jsonError) {
                console.log("JSON parsing failed, trying fallback method")
              }
            }

            // Fallback: String-based extraction if JSON parsing fails
            if (!known_info) {
              const knownInfoMarker = '"known_info": "'
              const onlinePraesenzMarker = '"online_praesenz"'

              let startIndex = perplexityresponse.indexOf(knownInfoMarker)
              let endIndex = perplexityresponse.indexOf(onlinePraesenzMarker)

              if (startIndex !== -1 && endIndex !== -1) {
                known_info = perplexityresponse
                  .substring(startIndex + knownInfoMarker.length, endIndex)
                  .replace(/\\n/g, "\n")
                  .replace(/",\s*$/, "")
                  .trim()
              }

              // Extract online_praesenz
              const weitereInfoMarker = '"weitere_informationen_zur_person"'
              startIndex = perplexityresponse.indexOf('"online_praesenz": "')
              endIndex = perplexityresponse.indexOf(weitereInfoMarker)

              if (startIndex !== -1 && endIndex !== -1) {
                online_praesenz = perplexityresponse
                  .substring(
                    startIndex + '"online_praesenz": "'.length,
                    endIndex
                  )
                  .replace(/\\n/g, "\n")
                  .replace(/",\s*$/, "")
                  .trim()
              }

              // Extract weitere_informationen_zur_person
              const allgemeineAnmerkungenMarker = '"allgemeine_anmerkungen"'
              startIndex = perplexityresponse.indexOf(
                '"weitere_informationen_zur_person": "'
              )
              endIndex = perplexityresponse.indexOf(allgemeineAnmerkungenMarker)

              if (startIndex !== -1 && endIndex !== -1) {
                weitere_informationen_zur_person = perplexityresponse
                  .substring(
                    startIndex + '"weitere_informationen_zur_person": "'.length,
                    endIndex
                  )
                  .replace(/\\n/g, "\n")
                  .replace(/",\s*$/, "")
                  .trim()
              }
            }

            postReport = {
              ...post,
              scrapedData, // Original scraped data remains unchanged
              perplexityresponse: {
                known_info,
                online_praesenz,
                weitere_informationen_zur_person
              },
              postScreenshot: reportablepostscreenshots,
              profileScreenshot: profileScreenshot
            }
          } catch (error) {
            console.error("Error processing perplexity response:", error)
            postReport = {
              ...post,
              scrapedData,
              perplexityresponse: null,
              postScreenshot: reportablepostscreenshots,
              profileScreenshot: profileScreenshot
            }
          }
        } else {
          sendMessageToPopup(
            "Perplexity Toggle ist ausgeschaltet, daher wird nicht nach der Online-Präsenz des Benutzers gesucht.."
          )
          postReport = {
            ...post,
            scrapedData,
            perplexityresponse: null,
            postScreenshot: reportablepostscreenshots,
            profileScreenshot: profileScreenshot
          }
        }

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

      directory = `@${twitterUserHandle}/${tweetURLNumber}`
      filename = `screenshot_@${twitterUserHandle}_${tweetURLNumber}_${date}.png`
    }

    // Case 2: Profile URL format https://x.com/[TwitterUserHandle]
    if (pathSegments.length === 1) {
      const twitterUserHandle = pathSegments[0]
      // Create directory structure: username/profile
      directory = `@${twitterUserHandle}`
      filename = `screenshot_profile_@${twitterUserHandle}_${date}.png`
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

        case "GET_PROFILE_INFO":
          try {
            const { profileUrl, knownProfileInfo } = request.data
            console.log("Starting SEARCH_PROFILE with:", {
              profileUrl,
              knownProfileInfo
            })

            const username = getUsername(profileUrl)
            let profileinfo = {
              screenname: null,
              username: username,
              profilebiodata: null,
              userlocation: null,
              userJoindate: null,
              followingCount: null,
              followersCount: null,
              userBirthdate: null,
              userUrl: null
            }
            sendResponse({
              analysisId: getActiveAnalysisId(),
              perplexityresponse: null,
              userprofileinfo: profileinfo
            })
          } catch (error) {}
        case "SEARCH_PROFILE":
          try {
            const { profileUrl, knownProfileInfo } = request.data
            console.log("Starting SEARCH_PROFILE with:", {
              profileUrl,
              knownProfileInfo
            })

            const username = getUsername(profileUrl)

            const perplexityQuery = generatePerplexityPrompt(
              username,
              knownProfileInfo
            )

            const perplexityresponse = await callPerplexity(perplexityQuery)
            let response = null
            let known_info = null
            let online_praesenz = null
            let weitere_informationen_zur_person = null

            if (perplexityresponse) {
              // Erst versuchen wir den JSON-Weg
              const jsonStart = perplexityresponse.indexOf("{")
              const jsonEnd = perplexityresponse.lastIndexOf("}") + 1

              if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = perplexityresponse.substring(jsonStart, jsonEnd)
                try {
                  response = JSON.parse(jsonStr)
                  if (response.known_info) {
                    known_info = response.known_info
                    online_praesenz = response.online_praesenz
                    weitere_informationen_zur_person =
                      response.weitere_informationen_zur_person
                  }
                } catch (jsonError) {
                  console.log("JSON parsing failed, trying fallback method")
                }
              }

              // Fallback: String-basierte Extraktion wenn JSON-Parsing fehlschlägt
              if (!known_info) {
                const knownInfoMarker = '"known_info": "'
                const onlinePraesenzMarker = '"online_praesenz"'

                let startIndex = perplexityresponse.indexOf(knownInfoMarker)
                let endIndex = perplexityresponse.indexOf(onlinePraesenzMarker)

                if (startIndex !== -1 && endIndex !== -1) {
                  known_info = perplexityresponse
                    .substring(startIndex + knownInfoMarker.length, endIndex)
                    .replace(/\\n/g, "\n")
                    .replace(/",\s*$/, "")
                    .trim()
                }

                // Extraktion für online_praesenz
                const weitereInfoMarker = '"weitere_informationen_zur_person"'
                startIndex = perplexityresponse.indexOf('"online_praesenz": "')
                endIndex = perplexityresponse.indexOf(weitereInfoMarker)

                if (startIndex !== -1 && endIndex !== -1) {
                  online_praesenz = perplexityresponse
                    .substring(
                      startIndex + '"online_praesenz": "'.length,
                      endIndex
                    )
                    .replace(/\\n/g, "\n")
                    .replace(/",\s*$/, "")
                    .trim()
                }

                // Extraktion für weitere_informationen_zur_person
                const allgemeineAnmerkungenMarker = '"allgemeine_anmerkungen"'
                startIndex = perplexityresponse.indexOf(
                  '"weitere_informationen_zur_person": "'
                )
                endIndex = perplexityresponse.indexOf(
                  allgemeineAnmerkungenMarker
                )

                if (startIndex !== -1 && endIndex !== -1) {
                  weitere_informationen_zur_person = perplexityresponse
                    .substring(
                      startIndex +
                        '"weitere_informationen_zur_person": "'.length,
                      endIndex
                    )
                    .replace(/\\n/g, "\n")
                    .replace(/",\s*$/, "")
                    .trim()
                }
              }

              // Initialisiere profileinfo mit dem Username aus der URL
              let profileinfo = {
                username: username
              }

              if (known_info) {
                profileinfo.known_info = known_info

                // Parse einzelne Felder für Abwärtskompatibilität
                const knownInfoLines = known_info.split("\n")
                const knowninfo = {}

                knownInfoLines.forEach((line) => {
                  if (line.includes(": ")) {
                    const [key, value] = line.replace("- ", "").split(": ")
                    knowninfo[key] = value
                  }
                })

                // Extrahiere numerische Werte mit Fallbacks
                const followingCount =
                  parseInt(
                    knowninfo["Anzahl Konten denen dieser User folgt"]
                  ) || 0
                const followerCount =
                  parseInt(knowninfo["Anzahl Konten die diesem User folgen"]) ||
                  0
                const birthdate = parseInt(knowninfo["Geburtsdatum"]) || ""

                // Aktualisiere profileinfo
                profileinfo = {
                  ...profileinfo,
                  screenname: knowninfo["User-Name"] || knowninfo["Name"], // Fallback auf "Name"
                  username: knowninfo["User-Handle"] || username,
                  profilebiodata: knowninfo["Beschreibung"],
                  userlocation: knowninfo["Ort"],
                  userJoindate: knowninfo["Konto erstellt"],
                  followingCount: followingCount,
                  followersCount: followerCount,
                  userBirthdate: birthdate || knowninfo["Geburtsdatum"], // Fallback auf "Geburtsdatum"
                  userUrl: knowninfo["URL"]
                }
              }

              sendResponse({
                analysisId: getActiveAnalysisId(),
                perplexityresponse: response || {
                  known_info,
                  online_praesenz,
                  weitere_informationen_zur_person
                },
                userprofileinfo: profileinfo
              })
            } else {
              sendResponse({
                analysisId: getActiveAnalysisId(),
                perplexityresponse: null,
                userprofileinfo: { username }
              })
            }
          } catch (error) {
            console.error("Error in SEARCH_PROFILE:", error)
            sendResponse({
              analysisId: getActiveAnalysisId(),
              perplexityresponse: null,
              userprofileinfo: { username: null }
            })
          }
          break

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
          if (backgroundInfo.profileUrl || backgroundInfo.Info) {
            const contextBlock = `
            ${backgroundInfo.Info}
            `
            // First extract the victim’s username...
            const victimUsername = getvictimname(backgroundInfo.profileUrl)
            // ... then filter the scraped content (which is passed as 'messages') for the victim's posts.
            const victimPost = filterVictimPosts(victimUsername, messages)

            systemPromptWithContext = replaceTextBlocks(
              evaluatorSystemPrompt,
              contextBlock,
              victimPost
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
           
            postresults.map((post) => {
              const posts = JSON.parse(post.choices[0].message?.content)
              results.push(...(posts?.Posts || []))
            })

            console.log("results>>>>>>>>>>>>>>", results)

            const reportablePosts = results.filter(
              (post) => post.Post_selbst_ist_anzeigbar_flag === true
            )

            console.log("Reportable posts:", reportablePosts)
            if (reportablePosts.length > 0) {
              sendMessageToPopup(
                `"Der Kommentar ist vermutlich strafbar."`,
                100
              )
            }
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

        case "scrapeContent":
          const content = await scrapeContent(
            request.analysisId,
            request.screenshotData
          )
          sendResponse({ status: "Content scraped", content: content })
          break

        case "scrapePostURL":
          handleAsyncScrape(request, sendResponse)
          return true // This is crucial - tells Chrome to keep the message channel open
      
        case "SAVE_REPORT":
          // Handle the finalreport data
          const reports = request.payload

          const reportablePostsArray = reports.reportablePostsArray
          await createFinalReport(reportablePostsArray)
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

          const reportablePosts = postreport.reportablePostsArray
          await downloadpostreport(reportablePosts)
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
