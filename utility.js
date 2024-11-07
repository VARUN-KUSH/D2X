import JSZip from "jszip.min.js"

let zip = new JSZip()

function modifyUrl(url) {
  // Find the base URL by splitting at the first "/status/" or anything after "https://x.com/"
  const baseUrl = url.split("x.com/")[0] + "x.com/"

  // Append "username" to the base URL
  const modifiedUrl = baseUrl + "username"

  return modifiedUrl
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

export async function capturereportablessandchangetoURLs(
  currentTab,
  filename,
  resolve,
  reject,
  progressCallback,
  directory,
  analysisId
) {
  try {
    // Step 1: Capture the screenshot of the current tab and convert it into a Promise
    const dataUrl = await new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(
        null,
        { format: "png" },
        function (dataUrl) {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError) // Reject if there's an error
          }
          resolve(dataUrl) // Resolve with the captured screenshot's data URL
        }
      )
    })

    // Step 2: Convert the captured screenshot to Blob format
    const blob = await (await fetch(dataUrl)).blob()

    // Step 3: Create a Blob URL for the captured screenshot
    const screenshotBlobUrl = URL.createObjectURL(blob)

    // Step 4: Get the current time from the background script
    const timeResponse = getCurrentTime()

    // Step 5: Process the screenshot and add timestamps using addTimestampToScreenshots
    const processedScreenshot = await addTimestampToScreenshots(
      [screenshotBlobUrl], // Screenshot file array (only 1 in this case)
      timeResponse, // Timestamp
      currentTab.url, // Tab URL
      analysisId // Filename or analysisId
    )

    console.log("processedss>>>>>>>>>", processedScreenshot)

    // Step 6: Resolve with the processed Blob URL
    resolve(processedScreenshot)
    // Optionally clean up the original blob URL to avoid memory leaks
    URL.revokeObjectURL(screenshotBlobUrl)
  } catch (error) {
    reject(error) // Catch any errors and reject the promise
  }
}

export async function addTimestampToScreenshots(
  screenshotFiles,
  time,
  url,
  analysisId
) {
  return Promise.all(
    screenshotFiles.map((file, index) => {
      return new Promise((resolve, reject) => {
        // const newUrl = modifyUrl(url)
        const newUrl = url
        const img = new Image()
        img.onload = function () {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          const bannerHeight = 80
          canvas.width = img.width
          canvas.height = img.height + bannerHeight

          ctx.drawImage(img, 0, bannerHeight, img.width, img.height)

          ctx.fillStyle = "#f0f0f0"
          ctx.fillRect(0, 0, canvas.width, bannerHeight)
          ctx.fillStyle = "#000000"
          ctx.font = "14px Arial"
          ctx.textAlign = "left"
          ctx.textBaseline = "middle"

          const timestamp = `Captured on: ${new Date(time).toUTCString()}`
          const urlText = `URL: ${newUrl}`
          const idText = `Analysis ID: ${analysisId}`
          const partText = `Part ${index + 1} of ${screenshotFiles.length}`

          ctx.fillText(timestamp, 10, bannerHeight / 5)
          ctx.fillText(urlText, 10, (bannerHeight / 5) * 2)
          ctx.fillText(idText, 10, (bannerHeight / 5) * 3)
          ctx.fillText(partText, 10, (bannerHeight / 5) * 4)

          canvas.toBlob(function (blob) {
            const url = URL.createObjectURL(blob)
            resolve(url)
          }, "image/png")
        }

        img.onerror = function (error) {
          reject(new Error(`Failed to load the screenshot image ${index + 1}`))
        }

        img.src = file
      })
    })
  )
}

export async function addToZip(fileData, filename, directory) {
  console.log(
    "filename>>>>>>",
    filename,
    "fileData>>>>>>>>>>>",
    fileData,
    "directory::::::::",
    directory
  )

  // Fetch the Blob data from the Blob URL
  const response = await fetch(fileData)
  const blobData = await response.blob()

  if (directory) {
    zip.folder(directory).file(filename, blobData, { binary: true })
  } else {
    zip.file(filename, blobData, { binary: true })
  }

  downloadZip()
}

// function _initScreenshots(totalWidth, totalHeight) {
//   // Create and return an array of screenshot objects based
//   // on the `totalWidth` and `totalHeight` of the final image.
//   // We have to account for multiple canvases if too large,
//   // because Chrome won't generate an image otherwise.
//   //
//   const badSize =
//     totalHeight > MAX_PRIMARY_DIMENSION ||
//     totalWidth > MAX_PRIMARY_DIMENSION ||
//     totalHeight * totalWidth > MAX_AREA;

//   const biggerWidth = totalWidth > totalHeight;

//   const maxWidth = !badSize
//     ? totalWidth
//     : biggerWidth
//     ? MAX_PRIMARY_DIMENSION
//     : MAX_SECONDARY_DIMENSION;

//   const maxHeight = !badSize
//     ? totalHeight
//     : biggerWidth
//     ? MAX_SECONDARY_DIMENSION
//     : MAX_PRIMARY_DIMENSION;

//   const numCols = Math.ceil(totalWidth / maxWidth);
//   const numRows = Math.ceil(totalHeight / maxHeight);
//   let canvas, left, top;
//   let canvasIndex = 0;
//   const result = [];

//   for (let row = 0; row < numRows; row++) {
//     for (let col = 0; col < numCols; col++) {
//       canvas = document.createElement("canvas");
//       canvas.width =
//         col == numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth;
//       canvas.height =
//         row == numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight;
//       left = col * maxWidth;
//       top = row * maxHeight;

//       result.push({
//         canvas: canvas,
//         ctx: canvas.getContext("2d"),
//         index: canvasIndex,
//         left: left,
//         right: left + canvas.width,
//         top: top,
//         bottom: top + canvas.height,
//       });

//       canvasIndex++;
//     }
//   }

//   return result;
// }

async function getFormData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("formData", (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve(result.formData)
      }
    })
  })
}

export async function createFinalReport(results, originalUrl) {
  // First subfolder: "Anschreiben_Basis_Daten"
  let now = new Date()
  let year = now.getFullYear()
  let month = String(now.getMonth() + 1).padStart(2, "0") // Months are 0-indexed, so we add 1
  let date = String(now.getDate()).padStart(2, "0")
  let hours = String(now.getHours()).padStart(2, "0")
  let minutes = String(now.getMinutes()).padStart(2, "0")
  let seconds = String(now.getSeconds()).padStart(2, "0")

  // Create folder name in format D2X_Report_year.month.date.time
  let folderName = `D2X_Report_${year}.${month}.${date}.${hours}.${minutes}.${seconds}`
  let mainFolder = zip.folder(folderName) // Main folder
  mainFolder.file("AnalyseZeitpunkt.txt")
  const formData = await getFormData()
  console.log("Retrieved formData:", formData)
  const {
    senderAddress = "",
    recipientAddress = "",
    senderContactdetails = "",
    city = "",
    fullName = ""
  } = formData

  // Helper function to format data with new lines
  function formatText(text) {
    return text
      .split(",")
      .map((item) => item.trim())
      .join("\n")
  }

  //Timestamp to add in this text file AnalyseZeitpunkt.txt
  mainFolder.file("initialPostUrl.txt", `${originalUrl}`)
  mainFolder.file("AnalyseZeitpunkt.txt", `${date}.${month}.${year}`)
  let folder1 = mainFolder.folder("Anschreiben_Basis_Daten")

  //extract from formDataValue

  // Add 7 files with different names to this folder (text content)
  folder1.file("Abs.Adresse.txt", `${formatText(senderAddress)}`)
  folder1.file("Abs.Kontakt.txt", `${formatText(senderContactdetails)}`)
  folder1.file("Abs.UnterzeichnendePerson.txt", `${fullName}`)
  folder1.file(
    "Anglagen.txt",
    `Anlage: Sachverhalt
        Informationen aus dem Profil Tatverdächtige*r:
        Screenshot Nutzerprofil auf X/Twitter
        Screenshot des Kommentars und Kontext:`
  )
  folder1.file("Betreff.txt", "Anzeige zu Kommentar auf X/Twitter")
  folder1.file("Datumszeile.txt", `${city}, den ${date}.${month}.${year}`)
  folder1.file("Empf.Adresse.txt", `${formatText(recipientAddress)}`)

  // number of folders depends on uniques username
  //run a loop

  // Create folders for each unique username in results array
  let uniqueUsernames = [...new Set(results.map((item) => item.Username))]
  for (let username of uniqueUsernames) {
    let userFolder = mainFolder.folder(username)
    let post = results.find((item) => item.Username === username)
    userFolder.file(
      `ExtraUserInfo_${post.Username}_${date}.${month}.${year}.txt`,
      ``
    )
    userFolder.file(
      `profilUrl.txt`,
      `URL Profil Tatverdächtige*r: ${post.User_Profil_URL}`
    )
    userFolder.file(
      `UserInfo_${post.Username}_${date}.${month}.${year}.txt`,
      `Biografie: ${post.scrapedData.profileBio}
      ${post.scrapedData.joiningDate}
      Folgt: ${post.scrapedData.followingCount}
      Follower: ${post.scrapedData.followersCount} `
    )
    userFolder.file(
      `userHandle.txt`,
      `Benutzername (Handle) im Profil Tatverdächtige*r: ${post.Username}`
    )
    userFolder.file(
      `screenname.txt`,
      `Anzeigename (Screenname) im Profil Tatverdächtige*r: ${post.Screenname}`
    )

    // profileScreenshot: [
    //   "blob:chrome-extension://hnaaheihinnakbnfianoeifkiledcegi/b9a33aa3-b6b1-47d1-96fb-0968401d8069"
    // ]
    userFolder.file(
      `screenshot_${post.Username}_${year}.${month}.${date}.png`,
      `${post.profileScreenshot}`
    )

    // Filter results for the current username
    let userPosts = results.filter((item) => item.Username === username)
    userPosts.forEach((post, index) => {
      // Add post information as text files
      // userFolder.file(`post_${index + 1}.txt`, `Post URL: ${post.Post_URL}\nContent: ${post.Inhalt}\nExplanation: ${post.Erklärung}`);
      // userFolder.file(`screenshot_profile_${post.Username}_${year}.${month}.${date}.png`, post.profileScreenshot[0], { binary: true });
      const tweetID = post.Post_URL.split("/").pop()
      let folder2 = userFolder.folder(tweetID)
      folder2.file(
        `AnzeigenEntwurf_${post.Username}_${tweetID}.txt`,
        `${post.Anzeige_Entwurf}`
      )
      folder2.file(
        `Post_${post.Username}_${tweetID}_${date}.${month}.${year}.txt`,
        `${post.Inhalt}`
      )
      folder2.file(`postUrl.txt`, `URL des Kommentars: ${post.Post_URL}`)

      // postScreenshot: [
      //   "blob:chrome-extension://hnaaheihinnakbnfianoeifkiledcegi/d8a6cc50-37fc-4e1d-af00-24a33a55c58f"
      // ]
      folder2.file(
        `screenshot_${post.Username}_${tweetID}_${year}.${month}.${date}.png`,
        `${post.postScreenshot}`
      )
      folder2.file(`unser_Zeichen.txt`, `Unser Zeichen: ${tweetID}`)
      folder2.file(`Verfolgungsart.txt`, `OFFIZIALDELIKT`)
      folder2.file(
        `Zeitpunkt.txt`,
        `Zeitpunkt des Kommentars: ${month}.${date}.${year} um `
      )
    })
  }
}

export function getFilename(contentURL, uid) {
  if (!contentURL) {
    contentURL = "unknown-url"
  }
  if (!uid) {
    uid = Date.now().toString(36)
  }

  let name = contentURL.split("?")[0].split("#")[0]
  name = name
    .replace(/^https?:\/\//, "")
    .replace(/[^A-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[_\-]+/, "")
    .replace(/[_\-]+$/, "")

  if (name.length > 50) {
    name = name.substring(0, 50)
  }

  const shortUID = uid.substring(0, 8)
  return `screenshot-${shortUID}-${name}-${Date.now()}.png`
}

export async function downloadZip() {
  // Generate the zip Blob
  // Generate the zip Blob
  return await zip.generateAsync({ type: "blob" })
}

// Set up the API details
const API_URL = "https://api.perplexity.ai/chat/completions"
const MODEL = "llama-3.1-70b-instruct"

// Function to get the API key and run the query

export async function callPerplexity() {
  const usePerplexity = await new Promise((resolve) => {
    chrome.storage.local.get("usePerplexity", (result) => {
      resolve(result.usePerplexity)
    })
  })

  if (usePerplexity) {
    runPerplexityQuery()
  } else {
    return
  }
}

function runPerplexityQuery(query) {
  return new Promise((resolve, reject) => {
    // Fetch the API key from storage
    chrome.storage.local.get("PERPLEXITY_API_KEY", (result) => {
      const apiKey = result.PERPLEXITY_API_KEY

      if (!apiKey) {
        console.error("API Key is not set in Chrome storage.")
        reject("API Key missing")
        return
      }

      // Set up request headers and body
      const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }

      const data = {
        model: MODEL,
        messages: [
          { role: "system", content: "Be precise and concise." },
          { role: "user", content: query }
        ],
        max_tokens: 1024,
        temperature: 0,
        top_p: 0.9
      }

      // Make the POST request to the API
      fetch(API_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data)
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`)
          return response.json()
        })
        .then((json) => {
          const content = json.choices?.[0]?.message?.content
          if (content) {
            resolve(content)
          } else {
            reject("No content received")
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          reject(error)
        })
    })
  })
}
