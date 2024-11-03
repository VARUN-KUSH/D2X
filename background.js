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

import {profileScrape} from "./contents/profile-scrapper.js"
import { callPerplexity, createFinalReport, downloadZip } from "./utility.js"
import { evaluatorSystemPrompt } from "./utils.js"

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

function setAPIKey(apiKey) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ apiKey: apiKey }, function () {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve()
      }
    })
  })
}

async function getCurrentTime() {
  const url = "http://worldtimeapi.org/api/ip"
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.datetime
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
    const zipBlob = await downloadZip();

    // Convert the Blob to a base64 string to send to the content script or popup
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1]; // Extract base64 part
      chrome.runtime.sendMessage({ action: "downloadZip", base64data });
    };
    reader.readAsDataURL(zipBlob);

  } catch (error) {
    console.error("Error during download:", error);
  }
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
    await requestinitialScreenshotCapture(url, "initial_page.png", "")

    // Proceed with scraping and processing
    updateAnalysisStatus(uid, "scraping")
    console.log("Scraping content for URL:", url)
    const scrapedContent = await scrapeContent(uid, tabId)
    console.log("Scraped content:", scrapedContent)

    updateAnalysisStatus(uid, "processing")
    const results = await processContent(scrapedContent)
    console.log("Processed results:", results)
    console.log("finalreport>>>>>>", results.Report)
    // After processing, add analysis results to the ZIP Folder
    await createFinalReport(results.Report.reportablePostsArray, results.Report.originalUrl)
    await initiateDownload();

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

async function addAnalysisResultsToZip(results) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "addToZip",
        fileData: JSON.stringify(results, null, 2),
        filename: "analysis_results.json",
        directory: ""
      },
      (response) => {
        if (chrome.runtime.lastError || (response && response.error)) {
          reject(chrome.runtime.lastError || response.error)
        } else {
          resolve()
        }
      }
    )
  })
}

// # Assistent functionality
// Function to load API key storage
async function getAPIKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiKey"], function (result) {
      if (result.apiKey) {
        console.log("API key found in storage")
        resolve(result.apiKey)
      } else {
        console.log("API key not found in storage or config")
        chrome.runtime.sendMessage({ action: "requestAPIKey" })
        resolve(null)
      }
    })
  })
}

// Function to create an OpenAI Assistant
async function createAssistant(apiKey) {
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

  console.log("apikeys", apiKey)
  const response = await fetch("https://api.openai.com/v1/assistants", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({
      name: "D2X Evaluation Assistant",
      instructions: systemPromptWithContext,
      model: "gpt-4o", // TODO replace with "gpt-4o-mini" when openai api is back
      tools: [{ type: "code_interpreter" }]
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to create assistant: ${response.statusText}`)
  }

  return await response.json()
}

// Function to create a Thread
async function createThread(apiKey) {
  const response = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({})
  })

  if (!response.ok) {
    throw new Error(`Failed to create thread: ${response.statusText}`)
  }

  return await response.json()
}

// Function to add a message to a Thread
async function addMessage(apiKey, threadId, content) {
  const response = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        role: "user",
        content: typeof content === "string" ? content : JSON.stringify(content)
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to add message: ${response.statusText}`)
  }

  return await response.json()
}

// Function to run the Assistant on a Thread
async function runAssistant(apiKey, threadId, assistantId) {
  const response = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/runs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to run assistant: ${response.statusText}`)
  }

  return await response.json()
}

// Function to check the status of a Run
async function checkRunStatus(apiKey, threadId, runId) {
  try {
    const response = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Run status check failed:", errorData)
      throw new Error(
        `Failed to check run status: ${response.status} ${response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    console.error("Error in checkRunStatus:", error)
    throw error
  }
}

// Function to get messages from a Thread
async function getMessages(apiKey, threadId) {
  const response = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2"
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get messages: ${response.statusText}`)
  }

  return await response.json()
}

function parseAssistantResponse(response) {
  console.log("Parsing assistant response:", response)
  let content = response.text.value

  // Remove JSON code block markers if present
  if (content.startsWith("```json")) {
    content = content.replace(/^```json\n/, "").replace(/\n```$/, "")
    console.log("Removed JSON code block markers. Content:", content)
  }

  try {
    const parsedContent = JSON.parse(content)
    console.log("Successfully parsed content:", parsedContent)
    return parsedContent
  } catch (error) {
    console.error("Error parsing JSON:", error)
    console.log("Raw content that failed to parse:", content)
    return { Posts: [{ rawContent: content }] }
  }
}

async function getAssistant(assistantId, apiKey) {
  const url = `https://api.openai.com/v1/assistants/${assistantId}`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v1"
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("getassistantdata>>>>>>>>>>>>>>", data)
    return data
  } catch (error) {
    console.error("Fetch request failed:", error)
    //create assistant in case previous assistant dont exist
  }
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

    let assistant
    try {
      // Check if assistant ID is already saved in chrome.storage.local
      await new Promise((resolve, reject) => {
        chrome.storage.local.get("Assistantid", async (result) => {
          assistant = result

          if (assistant.id) {
            console.log(`Assistant already exists with ID: ${assistant.id}`)
            //add logic for checking get assistant and also to get all the list assistants
            await getAssistant(assistant.id, API_KEY)
            resolve()
            return // If assistantId exists, don't create a new one
          }

          // If assistantId doesn't exist, create a new assistant
          assistant = await createAssistant(API_KEY)

          console.log(
            `Created new assistant with ID: ${assistant.id}`,
            "assistant>>>>>>>>",
            assistant
          )

          // Save the assistant ID in chrome.storage.local
          chrome.storage.local.set({ Assistantid: assistant.id }, () => {
            console.log(`Assistant ID saved: ${assistant.id}`)
            resolve()
          })
        })
      })
    } catch (error) {
      console.error("Error creating assistant:", error)
      throw error
    }

    const batchSize = 2
    const results = []
    const totalBatches = Math.ceil(messages.length / batchSize)

    for (let i = 0; i < messages.length; i += batchSize) {
      const currentBatch = Math.floor(i / batchSize) + 1
      const progress = (currentBatch / totalBatches) * 100

      chrome.runtime.sendMessage({
        action: "progressUpdate",
        progress: progress,
        currentBatch: currentBatch,
        totalBatches: totalBatches,
        analysisId: uid
      })

      const batch = messages.slice(i, i + batchSize)
      console.log(
        `Processing batch ${currentBatch} of ${totalBatches}. Progress: ${progress}%`
      )
      console.log(`Batch ${currentBatch} content: ${JSON.stringify(batch)}`)

      let retries = 3
      while (retries > 0) {
        try {
          const thread = await createThread(API_KEY)
          console.log(
            `Created thread with ID: ${thread.id} for batch ${currentBatch}`
          )

          for (const message of batch) {
            await addMessage(API_KEY, thread.id, message)
            console.log(`Added message to thread ${thread.id}`)
          }

          console.log(`Starting run for thread ${thread.id}`)
          const run = await runAssistant(API_KEY, thread.id, assistant.id)
          console.log(
            `Finished run for thread ${thread.id} with run ID: ${run.id}`
          )

          let runStatus
          let retryCount = 0
          do {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            try {
              runStatus = await checkRunStatus(API_KEY, thread.id, run.id)
              console.log(
                `Run status for run ID ${run.id}: ${runStatus.status}`
              )
            } catch (error) {
              console.error(
                `Error checking run status (attempt ${retryCount + 1}):`,
                error
              )
              if (++retryCount > 3) throw error
            }
          } while (runStatus.status !== "completed")

          const threadMessages = await getMessages(API_KEY, thread.id)
          const assistantResponses = threadMessages.data.filter(
            (msg) => msg.role === "assistant"
          )

          console.log(
            `Raw assistant responses for thread ${thread.id}:`,
            JSON.stringify(assistantResponses, null, 2)
          )

          assistantResponses.forEach((msg, index) => {
            console.log(`Processing response ${index + 1}:`, msg.content[0])
            const parsedContent = parseAssistantResponse(msg.content[0])
            if (parsedContent.Posts) {
              results.push(...parsedContent.Posts)
            } else {
              console.warn(
                "Parsed content does not contain Posts array:",
                parsedContent
              )
            }
          })

          chrome.runtime.sendMessage({
            action: "batchComplete",
            currentBatch: currentBatch,
            totalBatches: totalBatches,
            analysisId: uid
          })

          break
        } catch (error) {
          console.error(
            `Error processing batch (attempt ${4 - retries}):`,
            error
          )
          if (--retries === 0) {
            throw error
          }
          // await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      }
    }

    console.log("Final processed results:", JSON.stringify(results, null, 2))

    // Identify reportable posts
    // todo: improve the loggic to identify
    const reportablePosts = results.filter(
      (post) => post.Anzeige_Entwurf && post.Anzeige_Entwurf.trim() !== ""
    )

    console.log("Reportable posts:", reportablePosts)
    let finalreports
    // Capture screenshots for reportable posts and user profiles
    if (reportablePosts.length > 0) {
      finalreports = await captureReportablePostScreenshots(reportablePosts)
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
        const reportablepostscreenshots = await requestScreenshotCapture(
          post.Post_URL,
          `post_${post.ID}.png`,
          `${post.Username}/Post_${post.ID}`
        )

        console.log(
          "reportablescreenshots>>>>>>>>>>>",
          reportablepostscreenshots
        )

        // Optional delay
        await delay(2000)

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
          await delay(2000)
        } else {
          // Reuse the existing profile screenshot if already captured
          profileScreenshot = capturedProfiles.get(post.User_Profil_URL)
          scrapedData = capturedProfilesdata.get(post.User_Profil_URL)
        }

        let postReport = null
        // const perplexityresponse = await callPerplexity()
        // if (perplexityresponse) {
        //   postReport = {
        //     ...post,
        //     scrapedData: scrapedData,
        //     perplexityresponse: perplexityresponse,
        //     postScreenshot: postScreenshot, // Unique post screenshot for each post
        //     profileScreenshot: profileScreenshot // Shared profile screenshot for each post by the same user
        //   }
        // } else {
        postReport = {
          ...post,
          scrapedData: scrapedData,
          postScreenshot: reportablepostscreenshots, // Unique post screenshot for each post
          profileScreenshot: profileScreenshot // Shared profile screenshot for each post by the same user
        }
        // }
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
    return {reportablePostsArray, originalUrl}
  } catch (error) {
    console.error(`Error in captureReportablePostScreenshots:`, error)
  }
}

//  TODO - delete if no longer needed
// Neue Funktion zur Verarbeitung erfasster Screenshots

// async function captureScreenshot(url, filename) {
//   console.log(`Attempting to capture screenshot for URL: ${url}`)

//   try {
//     const [tab] = await chrome.tabs.query({
//       active: true,
//       currentWindow: true
//     })
//     if (!tab) {
//       throw new Error("No active tab found")
//     }

//     // Navigate to the new URL
//     await chrome.tabs.update(tab.id, { url: url })

//     // Wait for the page to load
//     await new Promise((resolve) => {
//       function listener(tabId, info) {
//         if (tabId === tab.id && info.status === "complete") {
//           chrome.tabs.onUpdated.removeListener(listener)
//           resolve()
//         }
//       }
//       chrome.tabs.onUpdated.addListener(listener)
//     })

//     // Add a delay to ensure the page is fully rendered
//     await new Promise((resolve) => setTimeout(resolve, 5000))

//     // Request screenshot capture from popup
//     const response = await new Promise((resolve, reject) => {
//       chrome.runtime.sendMessage(
//         {
//           action: "captureScreenshot",
//           analysisId: getActiveAnalysisId(),
//           tabId: tab.id,
//           url: url,
//           filename: filename
//         },
//         (response) => {
//           if (chrome.runtime.lastError) {
//             reject(new Error(chrome.runtime.lastError.message))
//           } else {
//             resolve(response)
//           }
//         }
//       )
//     })

//     if (!response || !response.success) {
//       throw new Error(
//         response ? response.error : "Failed to capture screenshot"
//       )
//     }

//     return response.screenshotUrls
//   } catch (error) {
//     console.error(`Error capturing screenshot for ${url}:`, error)
//     throw error
//   }
// }

function requestinitialScreenshotCapture(url, filename, directory) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "captureScreenshot",
        analysisId: getActiveAnalysisId(),
        url: url,
        filename: filename,
        directory: directory
      },

      (response) => {
        if (chrome.runtime.lastError || (response && response.error)) {
          reject(chrome.runtime.lastError || response.error)
        } else {
          resolve()
        }
      }
    )
  })
}

async function requestScreenshotCapture(url, filename, directory) {
  return new Promise((resolve, reject) => {
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

  // chrome.tabs.query(
  //   { active: true, currentWindow: true },
  //   async function (tabs) {
  //     const currentTab = tabs[0]

  //     if (!currentTab) {
  //       reject(new Error("No active tab found"))
  //       return
  //     }

  //     // Ensure we're on the correct page
  //     if (currentTab.url !== url) {
  //       reject(new Error("Current tab URL does not match target URL."))
  //       return
  //     }
  //     console.log("currentTab>>>>>>>>>>", currentTab, "filename>>>>>", filename)

  //     try {
  //       let blobURLs = await new Promise((resolve, reject) => {
  //         capturereportablessandchangetoURLs(
  //           currentTab,
  //           filename || getFilename(url, analysisId),
  //           resolve,
  //           reject,
  //           (progress) => updateProgressBar(progress * 100) // Update the progress bar
  //         )
  //       })
  //       console.log("blobreportable>>>>>>>>>>>>>", blob)
  //       const time = await getCurrentTime()
  //       const analysisId = getActiveAnalysisId()
  //       const processedScreenshots = await addTimestampToScreenshots(
  //         blobURLs,
  //         time,
  //         url,
  //         analysisId
  //       )
  //     } catch(error) {
  //       console.error("Error capturing and storing screenshot:", error)
  //       reject(error)
  //     }
  //   }
  // )
}

// // Neue Funktion zum Hinzufügen von Zeitstempeln zu Screenshots
// async function addTimestampToScreenshots(
//   screenshotFiles,
//   time,
//   url,
//   analysisId
// ) {
//   return Promise.all(
//     screenshotFiles.map((file, index) => {
//       return new Promise((resolve, reject) => {
//         const newUrl = modifyUrl(url)
//         const img = new Image()
//         img.onload = function () {
//           const canvas = document.createElement("canvas")
//           const ctx = canvas.getContext("2d")

//           const bannerHeight = 80
//           canvas.width = img.width
//           canvas.height = img.height + bannerHeight

//           ctx.drawImage(img, 0, bannerHeight, img.width, img.height)

//           ctx.fillStyle = "#f0f0f0"
//           ctx.fillRect(0, 0, canvas.width, bannerHeight)
//           ctx.fillStyle = "#000000"
//           ctx.font = "14px Arial"
//           ctx.textAlign = "left"
//           ctx.textBaseline = "middle"

//           const timestamp = `Captured on: ${new Date(time).toUTCString()}`
//           const urlText = `URL: ${newUrl}`
//           const idText = `Analysis ID: ${analysisId}`
//           const partText = `Part ${index + 1} of ${screenshotFiles.length}`

//           ctx.fillText(timestamp, 10, bannerHeight / 5)
//           ctx.fillText(urlText, 10, (bannerHeight / 5) * 2)
//           ctx.fillText(idText, 10, (bannerHeight / 5) * 3)
//           ctx.fillText(partText, 10, (bannerHeight / 5) * 4)

//           canvas.toBlob(function (blob) {
//             const url = URL.createObjectURL(blob)
//             resolve(url)
//           }, "image/png")
//         }

//         img.onerror = function (error) {
//           reject(new Error(`Failed to load the screenshot image ${index + 1}`))
//         }

//         img.src = file
//       })
//     })
//   )
// }

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

        case "setAPIKey":
          await setAPIKey(request.apiKey)
          sendResponse({ status: "API Key set successfully" })
          break

        //        case "screenshotCaptured":
        //          await handleCapturedScreenshot(request);
        //          break;

        // case "toggleDownloadSection":
        //   const zipBlob = await downloadZip()
        //   // Create a URL for the Blob and download it
        //   const url = URL.createObjectURL(zipBlob)
        //   const downloadName = "D2X_Report.zip"

        //   chrome.downloads.download({
        //     url: url,
        //     filename: downloadName,
        //     saveAs: true
        //   })

        //   // Clean up the URL object after download
        //   URL.revokeObjectURL(url)

        //   sendResponse({ status: "Download section toggled" })
        //   break

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

console.log("Background script loaded")
