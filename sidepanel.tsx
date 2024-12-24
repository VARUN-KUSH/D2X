import { CaptureAPI } from "capture-api"
import React, { useEffect, useState } from "react"
import {
  addTimestampToScreenshots,
  addToZip,
  capturereportablessandchangetoURLs,
  getFilename
} from "utility"

import { profileScrape } from "./contents/profile-scrapper.js"

import "./popup.css"

//need to handle bug when user clicks multiple times the start analysis button
//edge cases
//disabling buttons when we start the automatic or manuala report creation until the process is complete
//showing a nice message to user when they did not added any api key before
//showing message of each detailed step that is going on during the process
//api change to chat completions from assistant api
//side panel and also should be open when we click the icon similar to popup
//fixed sidepanel errors
//perplexity response consistecny
//hover effects
// click effects
//save and delete locally to all input fields
//ui with effects
//optimisation and making the process faster
//darkmode (toggle to enable dark mode and light mode)
//hide the profile image while taking ss
//making sure profile ss should be taken when profile image is loaded completely
//post ss should be when post is completely loaded
//automatic report -->> automatic report download
//manual download -->> enabling button once step is completed
//manual analysis and report creation
//should be running in almost everyone browser
//improvement in UI
//user feedback for user functioanlity satisfation and rating
//user price paying
//stop button to stop the report creation
//improving the scrapper so it should be scrolling to bottom and extracting all tweets
//imrove consistency from openai
//attaching the creating report tool into an extension itself
//report iframes improvement
//testing in multiple user systems
//status logg
//16-11-2024

function SidePanel() {
  const [inputValues, setInputValues] = useState({
    profileUrl: "",
    knownProfileInfo: ""
  })

  const [inputValuesPost, setInputValuesPost] = useState({
    postUrl: "",
    knownPostInfo: ""
  })

  const [AnalysisData, setAnalysisData] = useState({
    visiblescreenshot: null,
    fullscreenshot: null,
    posts: null,
    analysisID: null,
    postsUrl: null,
    profilesdata: null,
    screenName: null
  })

  const [base64data, setBase64Data] = useState(null)
  const [formData, setFormData] = useState({
    senderAddress: "",
    recipientAddress: "",
    senderContactdetails: "",
    city: "",
    fullName: ""
  })
  const [openSection, setOpenSection] = useState<string | null>(
    "evaluateSection"
  )
  //state save locally
  const [isaddress, setisAddress] = useState(false)
  const [backgroundInfopresent, setbackgroundInfopresent] = useState(false)
  const [backgroundInfo, setbackgroundInfo] = useState("")
  const [analysisId, setAnalysisId] = useState("")
  const [showHelpSection, setShowHelpSection] = useState(false)
  const [showSettingsSection, setShowSettingsSection] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [results, setResults] = useState("")
  const [openSubSections, setOpenSubSections] = useState({
    apiKeysSection: false,
    addressSection: false,
    backgroundInfoSection: false
  })
  const [apiKeys, setApiKeys] = useState({
    openaiApiKey: "",
    perplexityApiKey: ""
  })
  const [showMessage, setShowMessage] = useState("")
  const [projectStatus, setprojectStatus] = useState("")
  const [isAnimating, setisAnimating] = useState(true)
  const [animatedStatus, setAnimatedStatus] = useState("")
  const [dotCount, setDotCount] = useState(0)
  // Track saved status for each API key and also save it locally
  const [savedKeys, setSavedKeys] = useState({
    openaiApiKey: false,
    perplexityApiKey: false
  })
  const [isTwitterHeaderDisabled, setIsTwitterHeaderDisabled] = useState(true) // Default is on (header visible)
  const [isPerplexityDisabled, setIsPerplexityDisabled] = useState(true)

  // const [darkMode, setDarkMode] = useState(false); // Track dark mode state
  // useEffect(() => {
  //     setupMessageListener();
  //     // Ensure "Seite Auswerten" is open by default
  //     document.getElementById("evaluateSection").open = true;
  // }, []);

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleInputChanges = (e) => {
    const { name, value } = e.target
    setInputValues((prevValues) => ({
      ...prevValues,
      [name]: value
    }))
  }

  const handleInputPostChanges = (e) => {
    const { name, value } = e.target
    setInputValuesPost((prevValues) => ({
      ...prevValues,
      [name]: value
    }))
  }

  const handleProfileSearch = async () => {
    // Store new screenshot in state
    setprojectStatus("processing the profile info")
    setAnalysisData((prevState) => ({
      ...prevState,
      profilesdata: null
    }))
    const response: any = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "SEARCH_PROFILE",
          data: inputValues
        },
        function (response) {
          if (response && response.analysisId) {
            resolve(response)
            setShowProgressBar(false)
          } else {
            console.error("Failed to start analysis", response)
            alert("Failed to start analysis")
            setShowProgressBar(false)
            reject()
            return
          }
        }
      )
    })

    const { analysisId, userprofiledata } = response
    console.log("userprofiledata>>>>>>>", userprofiledata)
    setAnalysisData((prevState) => ({
      ...prevState,
      profilesdata: userprofiledata,
      screenName: userprofiledata.screenName || "",
      analysisID: prevState.analysisID || analysisId // Keep existing analysisID if it exists, otherwise use new one
    }))

    //   // Update analysisId state using the same logic
    //   setAnalysisId(AnalysisData.analysisID || analysisId)
    // })

    // const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    // const scrapedData = await new Promise((resolve, reject) => {
    //   chrome.scripting.executeScript(
    //     {
    //       target: { tabId: tab.id },
    //       world: "MAIN", // Access the window object directly
    //       func: profileScrape
    //     },
    //     (results) => {
    //       if (chrome.runtime.lastError) {
    //         console.error("Script injection failed:", chrome.runtime.lastError)
    //         reject(chrome.runtime.lastError)
    //       } else if (results && results[0]?.result !== undefined) {
    //         console.log("Background script got callback after injection")
    //         resolve(results[0].result) // Access the returned data here
    //       } else {
    //         console.error("No data returned from content script.")
    //         resolve(null)
    //       }
    //     }
    //   )
    // })

    // console.log("scrapedprofileData", scrapedData)
    // setAnalysisData((prevState) => ({
    //   ...prevState,
    //   profilescrape: scrapedData
    // }))

    // Update analysisId state using the same logic
    setAnalysisId(AnalysisData.analysisID || analysisId)
  }

  const handlePostSearch = async () => {
    // Send data to background script
    //first check the open api is added and enabled

    const { openaiApiKey } = apiKeys
    if (!openaiApiKey) {
      setShowMessage("Please add OpenAI API key to start the analysis.")
      setTimeout(() => setShowMessage(""), 1000)
      return
    }

    setShowProgressBar(true)
    setProgress(10)
    setprojectStatus("post is analysed by openai")
    setAnalysisData((prevState) => ({
      ...prevState,
      post: null
    }))

    const response: any = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "SEARCH_POST",
          data: inputValuesPost
        },
        function (response) {
          if (response && response.analysisId) {
            resolve(response)
            // setShowProgressBar(false)
          } else {
            console.error("Failed to start analysis", response)
            alert("Failed to start analysis")
            setShowProgressBar(false)
            reject()
            return
          }
        }
      )
    })
    setProgress(50)
    const { analysisId, openairesponse } = response

    console.log("openairesponse>>>>>>", openairesponse)

    // Combine both state updates into a single conditional update
    setAnalysisData((prevState) => ({
      ...prevState,
      posts: openairesponse,
      analysisID: prevState.analysisID || analysisId, // Keep existing analysisID if it exists, otherwise use new one
      postsUrl: openairesponse[0].Post_URL
    }))
    setProgress(100)
    // Update analysisId state using the same logic
    setAnalysisId(AnalysisData.analysisID || analysisId)
    setTimeout(() => {
      setShowProgressBar(false)
    }, 1000)
  }

  const handleBackgroundInfo = (e) => {
    setbackgroundInfo(e.target.value)
  }

  const saveformdata = () => {
    // e.preventDefault()
    // Save the formData locally using chrome.storage.local
    chrome.storage.local.set({ formData }, () => {
      console.log("Data saved locally", formData)
      setisAddress(true)
    })
  }

  useEffect(() => {
    chrome.storage.local.get(["formData"], function (result) {
      const formData = result.formData || {};
      const {
        senderAddress = "",
        recipientAddress = "",
        senderContactdetails = "",
        city = "", 
        fullName = ""
      } = formData;
      
      setFormData(() => ({
  
        senderAddress,
        recipientAddress,
        senderContactdetails,
        city,
        fullName
      }));

      setisAddress(!!formData)
    });
  }, []);
  
  
  function updateProgressBar(progress) {
    setProgress(progress)
  }
  const toggleHelpSection = () => {
    // setShowSettingsSection(false)
    // setShowHelpSection(!showHelpSection)
    const url =
      "chrome-extension://hnaaheihinnakbnfianoeifkiledcegi/tabs/Uber_D2X.html"
    window.open(url, "_blank")
  }

  const toggledownloadSection = async () => {
    console.log("in toggle")
    console.log("AnalysisData>>>>>>>", AnalysisData)

    if (
      AnalysisData.fullscreenshot &&
      AnalysisData.posts &&
      AnalysisData.visiblescreenshot &&
      AnalysisData.profilesdata
    ) {
      console.log("running the toggle download section")
      //handle the profile scraping
      const results = {
        ...AnalysisData.posts[0],
        Screenname: AnalysisData.screenName,
        postScreenshot: AnalysisData.fullscreenshot,
        profileScreenshot: AnalysisData.visiblescreenshot,
        scrapedData: AnalysisData.profilesdata
      }
      console.log("results>>>>>>.", results)
      const finalreport = {
        originalUrl: AnalysisData.postsUrl,
        reportablePostsArray: [results]
      }

      // Send message to background.js
      try {
        const response = await chrome.runtime.sendMessage({
          action: "SAVE_REPORT",
          payload: finalreport
        })
        console.log("Response from background:", response)
      } catch (error) {
        console.error("Error sending message:", error)
      }
      return
    }
  }

  const toggleSettingsSection = () => {
    setShowHelpSection(false)
    setOpenSection(null)
    setShowSettingsSection(!showSettingsSection)
  }

  const toggleSection = (sectionId: string, event: React.MouseEvent) => {
    event.preventDefault()
    setShowHelpSection(false)
    setShowSettingsSection(false)
    if (openSection === sectionId) {
      setOpenSection(null)
    } else {
      // Otherwise, open the clicked section and close the previous one
      setOpenSection(sectionId)
    }
  }

  const handleTwitterHeaderToggle = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = e.target.checked
    setIsTwitterHeaderDisabled(isChecked)

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: isChecked ? "disableTwitterHeader" : "enableTwitterHeader"
        })
      }
    })
  }

  const handlePerplexityToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked
    setIsPerplexityDisabled(isChecked)

    // Send message to background script
    // Store usePerplexity value locally in chrome storage
    chrome.storage.local.set({ usePerplexity: isChecked }, () => {
      console.log("Saved usePerplexity:", isChecked)
    })
  }

  useEffect(() => {
    // By default, send message to show the Twitter header
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: isTwitterHeaderDisabled
            ? "disableTwitterHeader"
            : "enableTwitterHeader"
        })
      }
    })
  }, [])

  // Load the saved state when the component mounts
  useEffect(() => {
    // Get the stored value from chrome.storage.local
    chrome.storage.local.get(["usePerplexity"], (result) => {
      // If we have a stored value, use it to update our state
      if (result.usePerplexity !== undefined) {
        setIsPerplexityDisabled(result.usePerplexity)
      }
      // If no stored value exists, the state will remain at its default value (true)
    })
  }, []) // Empty dependency array means this runs once when component mounts

  const toggleSubSection = (sectionId: any) => {
    setOpenSubSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Handle input change
  const handleInputChange = (event) => {
    const { name, value } = event.target
    setApiKeys({
      ...apiKeys,
      [name]: value
    })
  }

  useEffect(() => {
    let interval

    if (isAnimating) {
      // Animate the ellipsis dynamically
      interval = setInterval(() => {
        setDotCount((prevCount) => (prevCount + 1) % 4) // Cycle through 0, 1, 2, 3
      }, 500) // Adjust the interval for animation speed
    }

    return () => clearInterval(interval) // Cleanup the interval on unmount or stop
  }, [isAnimating])

  useEffect(() => {
    const dots = isAnimating ? ".".repeat(dotCount) : "" // Generate the ellipsis dynamically
    setAnimatedStatus(`${projectStatus}${dots}`)
  }, [dotCount, projectStatus, isAnimating])

  const saveAPIKey = (keyType) => {
    const keyName = keyType === "openai" ? "openaiApiKey" : "perplexityApiKey"
    const apiKey = apiKeys[keyName]

    const trimmedapiKey = apiKey.trim()

    // Check if the trimmed backgroundInfo is empty
    if (trimmedapiKey === "") {
      console.log("Empty input detected. Skipping save.")
      return
    }

    chrome.storage.local.set({ [keyName]: apiKey }, () => {
      if (chrome.runtime.lastError) {
        alert(
          `Fehler beim Speichern des ${keyType} API-Schlüssels: ${chrome.runtime.lastError.message}`
        )
      } else {
        alert(
          `${keyType.charAt(0).toUpperCase() + keyType.slice(1)} API-Schlüssel erfolgreich gespeichert!`
        )

        // Mark the key as saved
        setSavedKeys((prev) => ({ ...prev, [keyName]: true }))
      }
    })
  }

  const saveBackgroundInfo = () => {
    // Trim and validate the backgroundInfo string
    // const trimmedBackgroundInfo = backgroundInfo.trim()

    // // Check if the trimmed backgroundInfo is empty
    // if (trimmedBackgroundInfo === "") {
    //   console.log("Empty input detected. Skipping save.")
    //   return
    // }
  
    
    chrome.storage.local.set({ backgroundInfo: backgroundInfo }, function () {
      alert("Hintergrundinformationen erfolgreich gespeichert!")
      setbackgroundInfopresent(true)
    })
  }

  useEffect(() => {
    chrome.storage.local.get(
      ["backgroundInfo", "openaiApiKey", "perplexityApiKey"],
      function (result) {
        const backgroundinfo = result.backgroundInfo || ""
        setbackgroundInfo(backgroundinfo)
        // Set backgroundInfopresent to true if backgroundInfo is found
        setbackgroundInfopresent(!!backgroundinfo)
        const openaiKey = result.openaiApiKey || ""
        const perplexityKey = result.perplexityApiKey || ""

        setApiKeys({
          openaiApiKey: openaiKey,
          perplexityApiKey: perplexityKey
        })

        // Update savedKeys based on whether the API keys exist
        setSavedKeys({
          openaiApiKey: !!openaiKey, // Set to true if openaiApiKey exists
          perplexityApiKey: !!perplexityKey // Set to true if perplexityApiKey exists
        })
      }
    )
  }, [])

  const editBackgroundInfo = () => {
    // Remove the assistant ID from chrome.storage.local
    // chrome.storage.local.remove("Assistantid", function () {
    //   console.log("Assistant ID removed from local storage.")
    // })

    // chrome.storage.local.remove("backgroundInfo", () => {
    //   console.log("Background info removed.")
    //   setbackgroundInfo("")
      setbackgroundInfopresent(false)
    // })
  }

  const editaddress = () => {
    setisAddress(false)
  }

  const deleteAPIKey = (keyType) => {
    const keyName = keyType === "openai" ? "openaiApiKey" : "perplexityApiKey"

    // Remove the key from chrome.storage.local
    chrome.storage.local.remove(keyName, () => {
      if (chrome.runtime.lastError) {
        alert(
          `Error deleting ${keyType.charAt(0).toUpperCase() + keyType.slice(1)} API key: ${chrome.runtime.lastError.message}`
        )
      } else {
        alert(
          `${keyType.charAt(0).toUpperCase() + keyType.slice(1)} API key deleted successfully!`
        )

        // Clear the key from state
        setApiKeys((prevKeys) => ({
          ...prevKeys,
          [keyName]: ""
        }))
        setSavedKeys((prev) => ({ ...prev, [keyName]: false }))
      }
    })
  }

  const triggerFullAnalysis = () => {
    const { openaiApiKey, perplexityApiKey } = apiKeys

    // Check API key conditions
    if (!openaiApiKey) {
      setShowMessage("Please add OpenAI API key to start the analysis.")
      setTimeout(() => setShowMessage(""), 1000)
      return
    }

    // If Perplexity key is missing, show a message but still proceed
    // if (!perplexityApiKey) {
    //   setShowMessage("Perplexity key is not added.")
    //   setTimeout(() => setShowMessage(""), 1000)
    // }

    setShowProgressBar(true)
    chrome.runtime.sendMessage(
      { action: "startAnalysis" },
      function (response) {
        if (response && response.analysisId) {
          setAnalysisId(response.analysisId)
          console.log("Analysis initiated with ID:", response.analysisId)
        } else {
          console.error("Failed to start analysis", response)
          alert("Failed to start analysis")
          setShowProgressBar(false)
        }
      }
    )

    setupMessageListener()
  }

  const takefullpagess = async () => {
    try {
      setShowProgressBar(true)
      //loader should load

      // required things > fullpagess > ss + date + url + analysisId
      //get analysisId, time from background
      //
      setprojectStatus("taking the full screenshots of this page")
      // First clear the existing screenshot
      setAnalysisData((prevState) => ({
        ...prevState,
        fullscreenshot: null
      }))

      const response: any = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          // if analysis id there send it
          { action: "fullpagelengthss" },
          function (response) {
            if (response && response.analysisId) {
              resolve(response)
            } else {
              console.error("Failed to start analysis", response)
              alert("Failed to start analysis")
              setShowProgressBar(false)
              reject()
              return
            }
          }
        )
      })

      const { analysisId, url, filename, directory } = response
      setAnalysisId(AnalysisData.analysisID || analysisId)
      console.log("filename>>>>>>>", filename)
      console.log("Analysis initiated with ID:", analysisId)
      // Add condition to check which analysisId to use
      const screenshotAnalysisId = AnalysisData.analysisID
        ? AnalysisData.analysisID
        : analysisId

      const modifiednewscreenshots: any =
        await screenshot.captureAndStoreScreenshot(
          screenshotAnalysisId, // Use the determined analysisId
          url,
          filename,
          directory
        )
      console.log("modifiedscreenshots", modifiednewscreenshots)

      // Store new screenshot in state
      setAnalysisData((prevState) => ({
        ...prevState,
        fullscreenshot: modifiednewscreenshots
      }))

      console.log("New screenshot captured:", modifiednewscreenshots)
    } catch (error) {
      console.error("Error taking screenshot:", error)
      alert("Failed to capture screenshot")
    } finally {
      setShowProgressBar(false)
    }
  }

  const visiblepagess = async () => {
    setShowProgressBar(true)
    updateProgressBar(10)
    setprojectStatus("screenshoting the user profile")
    setAnalysisData((prevState) => ({
      ...prevState,
      visiblescreenshot: null
    }))

    const response: any = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "visiblelengthss" },
        function (response) {
          if (response && response.analysisId) {
            resolve(response)
          } else {
            console.error("Failed to start analysis", response)
            alert("Failed to start analysis")
            setShowProgressBar(false)
            reject()
            return
          }
        }
      )
    })

    const { analysisId, url, filename, directory } = response
    let portname = "reportablescreenshotPort"
    updateProgressBar(50)
    const screenshotAnalysisId = AnalysisData.analysisID
      ? AnalysisData.analysisID
      : analysisId

    const modifiednewscreenshots: any =
      await screenshot.captureAndStoreScreenshot(
        screenshotAnalysisId,
        url,
        filename,
        directory,
        portname
      )
    console.log("modifiedscreenshots", modifiednewscreenshots)
    updateProgressBar(100)

    setAnalysisData((prevState) => ({
      ...prevState,
      visiblescreenshot: modifiednewscreenshots
    }))
    setAnalysisId(AnalysisData.analysisID || analysisId)
    setTimeout(() => {
      setShowProgressBar(false)
    }, 1000)
  }

  const screenshot = {
    captureAndStoreScreenshot: function (
      analysisId,
      url,
      filename,
      directory,
      portname = null
    ) {
      console.log(
        "analysisID>>>>",
        analysisId,
        "url>>>>>>",
        url,
        "filename>>",
        filename,
        "directory>>>",
        directory
      )
      return new Promise<void>((resolve, reject) => {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          async function (tabs) {
            const currentTab = tabs[0]

            if (!currentTab) {
              reject(new Error("No active tab found"))
              return
            }

            // Ensure we're on the correct page
            if (currentTab.url !== url) {
              reject(new Error("Current tab URL does not match target URL."))
              return
            }
            console.log(
              "currentTab>>>>>>>>>>",
              currentTab,
              "filename>>>>>",
              filename
            )
            let blobURLs
            try {
              // Capture screenshot of the current page
              //condition to check ss for reportable posts or for initial posts
              if (portname == "reportablescreenshotPort") {
                const timeResponse = await chrome.runtime.sendMessage({
                  action: "getCurrentTime"
                })

                blobURLs = await new Promise((resolve, reject) => {
                  capturereportablessandchangetoURLs(
                    currentTab,
                    filename || getFilename(url, analysisId),
                    resolve,
                    reject,
                    (progress) => updateProgressBar(progress * 100),
                    directory,
                    analysisId,
                    timeResponse.time
                  )
                })

                resolve(blobURLs)
                return
              } else {
                await new Promise((resolve) => {
                  CaptureAPI.forceCleanup()
                  setTimeout(resolve, 300) // Give cleanup time to complete
                })

                const blobURL = await new Promise((resolve, reject) => {
                  CaptureAPI.captureToFiles(
                    currentTab,
                    filename || getFilename(url, analysisId),
                    resolve,
                    reject,
                    (progress) => updateProgressBar(progress * 100)
                  )
                })

                console.log("Blobsul>>>>>>>>>>>>>>", blobURL)
                const timeResponse = await chrome.runtime.sendMessage({
                  action: "getCurrentTime"
                })
                blobURLs = await addTimestampToScreenshots(
                  blobURL,
                  timeResponse.time,
                  url,
                  analysisId,
                  filename
                )

                console.log("processedScreenshots>>>>>>>>>>>>>>>>>", blobURLs)
                // Add processed screenshots to ZIP

                for (let i = 0; i < blobURLs.length; i++) {
                  const response = await fetch(blobURLs[i])
                  const blob = await response.blob()
                  const fileName = filename || `screenshot_${i + 1}.png`
                  addToZip(blob, fileName, directory)
                }

                resolve(blobURLs)
                return
              }
            } catch (error) {
              console.error("Error capturing and storing screenshot:", error)
              reject(error)
            }
          }
        )
      })
    }
  }

  const handleLinkClick = () => {
    const url =
      "chrome-extension://hnaaheihinnakbnfianoeifkiledcegi/tabs/Anzeigen_neu_generieren.html"
    window.open(url, "_blank")
  }

  const setupMessageListener = () => {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === "reportablescreenshotPort") {
        console.log("Connection established in content script:", port)
        port.onMessage.addListener(async (request) => {
          if (request.action === "capturereportabletweetsScreenshot") {
            try {
              const modifiedscreenshots =
                await screenshot.captureAndStoreScreenshot(
                  request.analysisId,
                  request.url,
                  request.filename,
                  request.directory,
                  port.name
                )
              port.postMessage({
                success: true,
                modifiedscreenshots: modifiedscreenshots
              })
            } catch (error) {
              port.postMessage({ error: error.message })
            } finally {
              // Disconnect the port after sending the response
              port.disconnect()
            }
          }
        })
      } else if (port.name == "fullpagescreenshot") {
        port.onMessage.addListener(async (request) => {
          console.log("Connection established in content script:", port)
          if (request.action === "fulltweetsScreenshot") {
            try {
              const modifiednewscreenshots =
                await screenshot.captureAndStoreScreenshot(
                  request.analysisId,
                  request.url,
                  request.filename,
                  request.directory
                )
              port.postMessage({
                success: true,
                modifiedscreenshots: modifiednewscreenshots
              })
            } catch (error) {
              port.postMessage({ error: error.message })
            } finally {
              // Disconnect the port after sending the response
              port.disconnect()
            }
          }
        })
      }
    })

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      ;(async () => {
        try {
          switch (request.action) {
            case "progressUpdate":
              console.log("progressupdateinpopup")
              setShowProgressBar(true)
              setProgress(request.progress)
              break

            // case "captureScreenshot":
            //   console.log("start taking full screenshot in sidepanel")
            //   const modifiednewscreenshots =
            //     await screenshot.captureAndStoreScreenshot(
            //       request.analysisId,
            //       request.url,
            //       request.filename,
            //       request.directory
            //     )
            //   sendResponse({
            //     success: true,
            //     modifiedscreenshots: modifiednewscreenshots
            //   })
            //   return true

            case "analysisComplete":
              // Handle ZIP file generation and download
              break
            case "batchComplete":
              console.log(
                `Batch ${request.currentBatch} of ${request.totalBatches} completed`
              )
              setProgress((request.currentBatch / request.totalBatches) * 100)
              break
            case "analysisError":
              setResults("Fehler: " + request.error)
              setShowProgressBar(false)
              break
            case "requestAPIKey":
              alert(
                "Bitte setzen Sie Ihren API-Schlüssel unter Einstellungen > API Keys."
              )
              setShowProgressBar(false)
              break
            case "processingUpdate":
              setResults("Verarbeitung: " + request.message)
              break

            case "downloadZip":
              const base64 = request.base64data
              console.log("base64data>>>>>>>>>>>", base64data)

              const byteCharacters = atob(base64)
              const byteNumbers = new Array(byteCharacters.length)
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
              }
              const byteArray = new Uint8Array(byteNumbers)
              const zipBlob = new Blob([byteArray], { type: "application/zip" })

              // Create a URL for the Blob and download it
              const url = URL.createObjectURL(zipBlob)
              const downloadName = "D2X_Report.zip"

              const a = document.createElement("a")
              a.href = url
              a.download = downloadName
              a.click()

              // Clean up the URL after download
              URL.revokeObjectURL(url)
              break

            case "processUpdate":
              setprojectStatus(request.data)
              if (
                request.data === "Dokumente erfolgreich heruntergeladen." ||
                request.data ===
                  "Entschuldigung, ich habe keine anzeigbaren Tweets gefunden."
              ) {
                setisAnimating(false) // Stop animation
                setTimeout(() => {
                  setShowProgressBar(false)
                  setAnimatedStatus("")
                  setprojectStatus("") // Clear the status after a delay
                }, 3000) // Adjust the delay as needed
              } else {
                setisAnimating(true) // Start animation for other statuses
              }
              break
            default:
              console.log("Unhandled message action:", request.action)
              break
          }
        } catch (error) {
          console.error("Error in message handler:", error)
          sendResponse({ error: error.message })
        }
      })()
      return true
    })
  }

  return (
    <div>
      <header>
        <h1>D2X</h1>
        {/* Display the message if it exists */}

        <div className="header-icons">
          {(AnalysisData.visiblescreenshot ||
            AnalysisData.posts ||
            AnalysisData.fullscreenshot ||
            AnalysisData.profilesdata) && (
            <span
              className="main-icon"
              onClick={toggledownloadSection}
              style={{
                cursor: "pointer",
                transition: "transform 0.1s ease-in-out"
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.9)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}>
              ⬇️
            </span>
          )}

          <span
            id="mainLinkIcon"
            role="img"
            aria-label="link"
            onClick={handleLinkClick}
            style={{
              cursor: "pointer",
              transition: "transform 0.1s ease-in-out"
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.9)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            🔗
          </span>
          <span
            id="mainHelpIcon"
            className="main-icon"
            title="Über D2X"
            onClick={toggleHelpSection}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.9)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            ⓘ
          </span>
          <span
            id="settingsToggle"
            className="main-icon"
            title="Einstellungen"
            onClick={toggleSettingsSection}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.9)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            ⚙️
          </span>
        </div>
      </header>

      <div id="analysisIdSection">
        Analysis ID: <span id="analysisId">{analysisId}</span>
      </div>

      <main>
        {showHelpSection && (
          <section id="mainHelpSection">
            <h2>Über D2X</h2>
            <p>
              D2X ist eine Erweiterung zur automatischen Auswertung von
              Social-Media-Beiträgen und zur Erstellung von Berichten über
              potenziell illegale Inhalte zur Einreichung bei Behörden.
            </p>
            <p>Die Erweiterung führt folgende Schritte aus:</p>
            <ol>
              <li>Erfassung von Screenshots der aktuellen Seite</li>
              <li>Extraktion relevanter Inhalte</li>
              <li>KI-gestützte Analyse der Inhalte</li>
              <li>Erstellung eines Berichts mit Empfehlungen</li>
              <li>Zusammenstellung aller Beweise in einer ZIP-Datei</li>
            </ol>
            <p>
              Alle sensitiven Daten werden lokal in Ihrem Browser verarbeitet
              und nur die für die Analyse notwendigen Informationen an die
              KI-Dienste übermittelt.
            </p>
          </section>
        )}

        {showSettingsSection && (
          <>
            <div id="twitterheaderdisablesection">
              <input
                type="checkbox"
                id="twitterHeaderToggle"
                name="twitterHeaderToggle"
                checked={isTwitterHeaderDisabled}
                onChange={handleTwitterHeaderToggle}
              />
              <label
                htmlFor="twitterHeaderToggle"
                id="twitterheaderdisablelabel">
                Menu auf x.com ausblenden
              </label>
            </div>
            <div
              //remove instyle and add in popup css
              style={{
                display: "flex",
                alignItems: "center", // camelCase for "align-items"
                justifyItems: "center", // camelCase for "justify-items"
                fontSize: "14px", // camelCase for "font-size"
                fontWeight: "normal", // camelCase for "font-weight"
                color: "#555555",
                borderBottom: "1px solid #e6e6e6" // camelCase for "border-bottom"
              }}>
              <input
                type="checkbox"
                id="perplexityuse"
                name="PerplexityToggle"
                checked={isPerplexityDisabled}
                onChange={handlePerplexityToggle}
              />
              <label htmlFor="perplexityuse" id="perplexitylabel">
                Profilsuche mit Perplexity
              </label>
            </div>
            <section id="settingsSection">
              <h2>Einstellungen</h2>
              <details
                id="apiKeysSection"
                open={openSubSections.apiKeysSection}>
                <summary
                  onClick={() => {
                    event.preventDefault() // Prevent default toggle behavior
                    toggleSubSection("apiKeysSection")
                  }}>
                  API Keys
                </summary>
                {openSubSections.apiKeysSection && (
                  <div>
                    <label htmlFor="openaiApiKey">
                      OpenAI API-Schlüssel:
                      <span
                        className="help-icon"
                        title="Der API-Key wird benötigt, um die KI-Services von OpenAI zu nutzen. Er wird lokal im Browser gespeichert und bei Anfragen an OpenAI gesendet.">
                        ⓘ
                      </span>
                    </label>
                    <input
                      type="password"
                      id="openaiApiKey"
                      name="openaiApiKey"
                      value={apiKeys.openaiApiKey}
                      onChange={handleInputChange}
                      disabled={savedKeys.openaiApiKey} // Disable input if key is saved
                    />
                    {savedKeys.openaiApiKey ? (
                      <button
                        id="deletebutton"
                        onClick={() => deleteAPIKey("openai")}
                        style={{ backgroundColor: "red", color: "white" }}
                        onMouseDown={(e) =>
                          (e.currentTarget.style.transform = "scale(0.9)")
                        }
                        onMouseUp={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }>
                        OpenAI-Schlüssel löschen
                      </button>
                    ) : (
                      <button
                        onClick={() => saveAPIKey("openai")}
                        onMouseDown={(e) =>
                          (e.currentTarget.style.transform = "scale(0.9)")
                        }
                        onMouseUp={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }>
                        API-Schlüssel speichern
                      </button>
                    )}

                    <label htmlFor="perplexityApiKey">
                      Perplexity API-Schlüssel:
                      <span
                        className="help-icon"
                        title="Der API-Key wird benötigt, um die KI-Services von Perplexity.ai zu nutzen. Er wird lokal im Browser gespeichert und bei Anfragen an Perplexity.ai gesendet.">
                        ⓘ
                      </span>
                    </label>
                    <input
                      type="password"
                      id="perplexityApiKey"
                      name="perplexityApiKey"
                      value={apiKeys.perplexityApiKey}
                      onChange={handleInputChange}
                      disabled={savedKeys.perplexityApiKey}
                    />
                    {savedKeys.perplexityApiKey ? (
                      <button
                        id="deletebutton"
                        onClick={() => deleteAPIKey("perplexity")}
                        onMouseDown={(e) =>
                          (e.currentTarget.style.transform = "scale(0.9)")
                        }
                        onMouseUp={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }>
                        Perplexity-Schlüssel löschen
                      </button>
                    ) : (
                      <button
                        onClick={() => saveAPIKey("perplexity")}
                        onMouseDown={(e) =>
                          (e.currentTarget.style.transform = "scale(0.9)")
                        }
                        onMouseUp={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }>
                        API-Schlüssel speichern
                      </button>
                    )}
                  </div>
                )}
              </details>

              <details id="addressSection">
                <summary onClick={() => toggleSubSection("addressSection")}>
                  Adressdaten
                </summary>
                <div>
                  <div>
                    <label htmlFor="senderAddress">
                      Absender:
                      <span
                        className="help-icon"
                        title="Geben Sie hier die Adresse des Absenders ein. Diese Daten werden nur lokal in Ihrem Browser gespeichert und ausschließlich lokal verarbeitet.">
                        ⓘ
                      </span>
                    </label>
                    <textarea
                      id="senderAddress"
                      name="senderAddress"
                      value={formData.senderAddress}
                      onChange={handleChange}
                      disabled={isaddress}
                    />

                    <label htmlFor="recipientAddress">
                      Empfänger:
                      <span
                        className="help-icon"
                        title="Geben Sie hier die Adresse des Empfängers ein. Diese Daten werden nur lokal in Ihrem Browser gespeichert und ausschließlich lokal verarbeitet.">
                        ⓘ
                      </span>
                    </label>
                    <textarea
                      id="recipientAddress"
                      name="recipientAddress"
                      value={formData.recipientAddress}
                      placeholder="John Smith, MyStreet 123, 12345 Berlin"
                      onChange={handleChange}
                      disabled={isaddress}
                    />

                    <label htmlFor="senderContact">
                      Meine Kontakdaten:
                      <span
                        className="help-icon"
                        title="Geben Sie hier die Adresse des Empfängers ein. Diese Daten werden nur lokal in Ihrem Browser gespeichert und ausschließlich lokal verarbeitet.">
                        ⓘ
                      </span>
                    </label>
                    <textarea
                      id="senderContact"
                      name="senderContactdetails"
                      value={formData.senderContactdetails}
                      placeholder="+49 123 45678, Me@example.com"
                      onChange={handleChange}
                      disabled={isaddress}
                    />

                    <label htmlFor="city">
                      Stadt für Datumszeile im Brief:
                      <span
                        className="help-icon"
                        title="Geben Sie hier die Adresse des Absenders ein. Diese Daten werden nur lokal in Ihrem Browser gespeichert und ausschließlich lokal verarbeitet.">
                        ⓘ
                      </span>
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      placeholder="Berlin"
                      onChange={handleChange}
                      disabled={isaddress}
                    />

                    <label htmlFor="fullName">
                      Name der unterzeichnenden Person:
                      <span
                        className="help-icon"
                        title="Geben Sie hier die Adresse des Empfängers ein. Diese Daten werden nur lokal in Ihrem Browser gespeichert und ausschließlich lokal verarbeitet.">
                        ⓘ
                      </span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      placeholder="John Smith"
                      onChange={handleChange}
                      disabled={isaddress}
                    />

                    {isaddress ? (
                      <button
                        id="deletebutton"
                        type="button"
                        onClick={editaddress}
                        style={{
                          backgroundColor: "red",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          cursor: "pointer"
                        }}
                        onMouseDown={(e) =>
                          (e.currentTarget.style.transform = "scale(0.9)")
                        }
                        onMouseUp={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }>
                        edit
                      </button>
                    ) : (
                      <button
                        type="submit"
                        onClick={saveformdata}
                        onMouseDown={(e) =>
                          (e.currentTarget.style.transform = "scale(0.9)")
                        }
                        onMouseUp={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                        style={{
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          cursor: "pointer"
                        }}>
                        Speichern
                      </button>
                    )}
                  </div>
                </div>
              </details>

              <details id="backgroundInfoSection">
                <summary
                  onClick={() => toggleSubSection("backgroundInfoSection")}>
                  Hintergrundinformationen
                </summary>
                <div>
                  <label htmlFor="backgroundInfo">
                    Hintergrundinformationen:
                    <span
                      className="help-icon"
                      title="Geben Sie hier zusätzliche Hintergrundinformationen ein. Diese Informationen werden an OpenAI gesendet, um bei der Bewertung der Nachrichten berücksichtigt zu werden.">
                      ⓘ
                    </span>
                  </label>
                  <textarea
                    id="backgroundInfo"
                    name="backgroundInfo"
                    value={backgroundInfo}
                    placeholder=""
                    onChange={handleBackgroundInfo}
                    disabled={backgroundInfopresent}></textarea>
                  {backgroundInfopresent ? (
                    <button
                      id="deletebutton"
                      onClick={editBackgroundInfo}
                      style={{
                        backgroundColor: "red",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        cursor: "pointer"
                      }}
                      onMouseDown={(e) =>
                        (e.currentTarget.style.transform = "scale(0.9)")
                      }
                      onMouseUp={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }>
                      edit
                    </button>
                  ) : (
                    <button
                      onClick={saveBackgroundInfo}
                      style={{
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        cursor: "pointer"
                      }}
                      onMouseDown={(e) =>
                        (e.currentTarget.style.transform = "scale(0.9)")
                      }
                      onMouseUp={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }>
                      Speichern
                    </button>
                  )}
                </div>
              </details>
            </section>
          </>
        )}

        <section id="mainActions">
          <details
            id="evaluateSection"
            open={openSection === "evaluateSection"}>
            <summary onClick={(e) => toggleSection("evaluateSection", e)}>
              Seite Auswerten
            </summary>
            <div>
              {/* disabling button until the process is complete */}

              <button
                onClick={triggerFullAnalysis}
                title="Führt eine automatische Auswertung der Seite aus, inklusive Screenshots, Profilsuchen und Beweissicherungen, und stellt die Ergebnisse zum Download bereit.">
                Seite auswerten
              </button>
            </div>
          </details>

          <details
            id="screenshotSection"
            open={openSection === "screenshotSection"}>
            <summary onClick={(e) => toggleSection("screenshotSection", e)}>
              Screenshots erstellen
            </summary>
            <div>
              {/* disable button until process is going */}
              <button
                id="fullPageScreenshot"
                title="Erstellt einen Screenshot der gesamten Webseite, einschließlich der Bereiche, die aktuell nicht sichtbar sind."
                onClick={takefullpagess}>
                Ganze Seite
              </button>
              <button
                id="visibleAreaScreenshot"
                title="Erstellt einen Screenshot des aktuell sichtbaren Bereichs der Webseite."
                onClick={visiblepagess}>
                Angezeigter Bereich
              </button>
            </div>
          </details>

          <details id="profileSection" open={openSection === "profileSection"}>
            <summary onClick={(e) => toggleSection("profileSection", e)}>
              Profilrecherche
            </summary>
            <div>
              <label htmlFor="profileUrl">
                Profil-URL:{" "}
                <span
                  className="help-icon"
                  title="Geben Sie hier die URL des Benutzerprofils ein, das untersucht werden soll.">
                  ⓘ
                </span>
              </label>
              <input
                type="text"
                id="profileUrl"
                name="profileUrl"
                value={inputValues.profileUrl}
                onChange={handleInputChanges}
              />
              <label htmlFor="knownProfileInfo">
                Bekannte Profilinformationen:{" "}
                <span
                  className="help-icon"
                  title="Geben Sie hier zusätzliche Informationen ein, die als Ergänzung für die Recherche an Perplexity.ai gesendet werden.">
                  ⓘ
                </span>
              </label>
              <textarea
                id="knownProfileInfo"
                name="knownProfileInfo"
                value={inputValues.knownProfileInfo}
                onChange={handleInputChanges}></textarea>
              <button
                id="searchProfile"
                title="Startet eine Recherche des angegebenen Profils mithilfe von Perplexity.ai."
                onClick={handleProfileSearch}>
                Profil recherchieren
              </button>
            </div>
          </details>

          <details id="profileSection" open={openSection === "postSection"}>
            <summary onClick={(e) => toggleSection("postSection", e)}>
              Kommentaranalyse
            </summary>
            <div>
              <label htmlFor="profileUrl">
                ULR des Kommentars:{" "}
                <span
                  className="help-icon"
                  title="Geben Sie hier die URL des Benutzerprofils ein, das untersucht werden soll.">
                  ⓘ
                </span>
              </label>
              <input
                type="text"
                id="profileUrl"
                name="postUrl"
                value={inputValuesPost.postUrl}
                onChange={handleInputPostChanges}
              />
              <label htmlFor="knownProfileInfo">
                Bekannte Postinformationen:{" "}
                <span
                  className="help-icon"
                  title="Geben Sie hier zusätzliche Informationen ein, die als Ergänzung für die Recherche an Perplexity.ai gesendet werden.">
                  ⓘ
                </span>
              </label>
              <textarea
                id="knownProfileInfo"
                name="knownPostInfo"
                value={inputValuesPost.knownPostInfo}
                onChange={handleInputPostChanges}></textarea>
              <button
                id="searchProfile"
                title="Startet eine Recherche des angegebenen Profils mithilfe von Perplexity.ai."
                onClick={handlePostSearch}>
                Profil recherchieren
              </button>
            </div>
          </details>
        </section>

        {showMessage && <div className="message">{showMessage}</div>}

        {showProgressBar && (
          <section id="progressSection">
            <div id="progressBar">
              <div id="progressBarFill" style={{ width: `${progress}%` }}></div>
            </div>
            <div id="progressText">
              Wird bearbeitet... {Math.round(progress)}%
            </div>
            {/* check if there is something in progress state then show the animated status */}
            <div id="progressText" style={{ color: "green" }}>
              {animatedStatus}
            </div>
          </section>
        )}

        {/* // removing this section  */}
        {results && (
          <section id="resultsSection">
            <button
              id="downloadResults"
              title="Speichert die bisher erstellten Ergebnisse in einem ZIP-Ordner, der im Download-Ordner abgelegt wird.">
              Ergebnisse herunterladen
            </button>
            <div id="results">{results}</div>
          </section>
        )}
      </main>
    </div>
  )
}

export default SidePanel
