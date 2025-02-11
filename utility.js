import JSZip from "jszip.min.js"

import { generateHtmlReport } from "./generateHtmlReport.js"

let zip = null

// Add safeValue helper function
const safeValue = (value) => {
  if (value === null || value === undefined) return ""
  return value
}

function modifyUrl(url) {
  // Find the base URL by splitting at the first "/status/" or anything after "https://x.com/"
  const baseUrl = url.split("x.com/")[0] + "x.com/"

  // Append "username" to the base URL
  const modifiedUrl = baseUrl + "username"

  return modifiedUrl
}
function generateSubsumptionDetails(post) {
  // Filter Subsumtions to include only those with "HOCH" or "MITTEL" and sort them by priority ("HOCH" first)
  const relevantSubsumtions = post.Subsumtion
    ?.filter(sub => sub.Strafwahrsch === "HOCH" || sub.Strafwahrsch === "MITTEL") // Include only "HOCH" and "MITTEL"
    .sort((a, b) => (a.Strafwahrsch === "HOCH" ? -1 : 1)); // Ensure "HOCH" entries appear first

  // If relevant Subsumtions exist, construct the string
  if (relevantSubsumtions && relevantSubsumtions.length > 0) {
    return relevantSubsumtions
      .map(sub => `${sub.Verdacht}.${sub.Strafwahrsch}`) // Combine "Verdacht" and "Strafwahrsch"
      .join("_"); // Join entries with an underscore
  }

  // Return an empty string if no relevant Subsumtions are found
  return "";
}



// Function to generate the HTML Report name
function generateFileName(post, tweetId, date, month, year) {
  // Get the Subsumption details as a string
  const subsumptionDetails = generateSubsumptionDetails(post);

  // If there are Subsumption details, include them in the file name
  if (subsumptionDetails) {
    return `Anzeige_${post.Username}_${tweetId}_${post.Verfolgungsart}_${subsumptionDetails}_${date}.${month}.${year}.html`;
  }

  // Fallback: Original file name format if no relevant Subsumtions exist
  return `Anzeige_${post.Username}_${tweetId}_${post.Verfolgungsart}_${date}.${month}.${year}.html`;
}



function generateUserInfoContent(post) {
  // First try Perplexity known_info
  if (post.perplexityresponse?.known_info) {
    return post.perplexityresponse.known_info.replace(/\\n/g, "\n")
  }
  // Fallback to scraped data
  return `
    - User-Name: ${safeValue(post.Screenname)}
    - User-Handle: ${safeValue(post.Username)}
    - Beschreibung: ${safeValue(post.scrapedData?.profilebiodata)}
    - Konto erstellt: ${safeValue(post.scrapedData?.userJoindate)}
    - Ort: ${safeValue(post.scrapedData?.userlocation)}
    - URL: ${safeValue(post.scrapedData?.userUrl)}
    - Anzahl Konten denen dieser User folgt: ${safeValue(post.scrapedData?.followingCount)}
    - Anzahl Konten die diesem User folgen: ${safeValue(post.scrapedData?.followersCount)}
    - Geboren am ${safeValue(post.scrapedData?.userBirthdate)}`
}

function generateExtraUserInfoContent(post) {
  const onlineData = post.perplexityresponse?.online_praesenz
  const weitereInfo = post.perplexityresponse?.weitere_informationen_zur_person

  // If both are empty, return empty string
  if (
    (!onlineData || onlineData.trim() === "") &&
    (!weitereInfo || weitereInfo.trim() === "")
  ) {
    return ""
  }

  // Combine the information
  const combinedInfo = [onlineData, weitereInfo]
    .filter((info) => info && info.trim() !== "")
    .join("\n\n")

  return `Weitere Informationen aus einer automatisierten Online-Recherche, die möglicherweise mit Tatverdächtigen*r zusammenhängen:\n\n\n${combinedInfo}`
}

export async function capturereportablessandchangetoURLs(
  currentTab,
  filename,
  resolve,
  reject,
  progressCallback,
  directory,
  analysisId,
  time
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

    // Step 5: Process the screenshot and add timestamps using addTimestampToScreenshots
    const processedScreenshot = await addTimestampToScreenshots(
      [screenshotBlobUrl], // Screenshot file array (only 1 in this case)
      time, // Timestamp
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
  analysisId,
  filename
) {
  return Promise.all(
    screenshotFiles.map((file, index) => {
      return new Promise((resolve, reject) => {
        let newUrl = url
        if (filename === "initial_page.png") {
          newUrl = modifyUrl(url)
        }

        const img = new Image()
        img.onload = function () {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          const bannerHeight = 250
          canvas.width = img.width
          canvas.height = img.height + bannerHeight

          ctx.drawImage(img, 0, bannerHeight, img.width, img.height)

          ctx.fillStyle = "#f0f0f0"
          ctx.fillRect(0, 0, canvas.width, bannerHeight)
          ctx.fillStyle = "#000000"
          ctx.font = "44px Arial"
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

// export async function addToZip(fileData, filename, directory) {
//   console.log(
//     "filename>>>>>>",
//     filename,
//     "fileData>>>>>>>>>>>",
//     fileData,
//     "directory::::::::",
//     directory
//   )

//   // No need to fetch; `fileData` is already a Blob
//   const blobData = fileData

//   if (directory) {
//     zip.folder(directory).file(filename, blobData, { binary: true })
//   } else {
//     zip.file(filename, blobData, { binary: true })
//   }

//   await downloadallfullfilesZip()
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

async function getoriginalUrl() {
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
  const originalUrl = backgroundInfo?.originalPost
  return originalUrl
}

export async function downloadprofilereport(results) {
  let now = new Date()
  let year = now.getFullYear()
  let month = String(now.getMonth() + 1).padStart(2, "0") // Months are 0-indexed, so we add 1
  let date = String(now.getDate()).padStart(2, "0")
  let hours = String(now.getHours()).padStart(2, "0")
  let minutes = String(now.getMinutes()).padStart(2, "0")
  let seconds = String(now.getSeconds()).padStart(2, "0")
  zip = null
  zip = new JSZip()
  let mainFolder = zip.folder("Strafanz_Report") // Main folder
  let formData = {}
  try {
    formData = await getFormData()
    console.log("Retrieved formData:", formData)
  } catch (error) {
    console.error("Error retrieving form data:", error)
  }
  const {
    senderAddress = "",
    recipientAddress = "",
    senderContactdetails = "",
    city = "",
    fullName = ""
  } = formData || {}

  // Helper function to format data with new lines
  function formatText(text = "") {
    if (!text) return ""
    return text
      .split(",")
      .map((item) => item.trim())
      .join("\n")
  }

  //Timestamp to add in this text file AnalyseZeitpunkt.txt
  // mainFolder.file("initialPostUrl.txt", `URL des Ausgangsposts: ${""}`)
  const originalUrl = await getoriginalUrl()

  mainFolder.file(
    "initialPostUrl.txt",
    (() => {
      if (!originalUrl) return ""
      if (typeof originalUrl === "string" && originalUrl.trim() === "")
        return ""

      return `URL des Ausgangsposts: ${originalUrl}`
    })()
  )
  mainFolder.file("AnalyseZeitpunkt.txt", `${date}.${month}.${year}`)

  let folder1 = mainFolder.folder("Anschreiben_Basis_Daten")

  //extract from formDataValue

  // Add 7 files with different names to this folder (text content)
  folder1.file("Abs.Adresse.txt", `${formatText(senderAddress)}`)
  folder1.file("Abs.Kontakt.txt", `${formatText(senderContactdetails)}`)
  folder1.file("Abs.UnterzeichnendePerson.txt", `${fullName}`)
  folder1.file(
    "Anlagen.txt",
    `Anlagen: Sachverhalt, Infos zum Profil Tatverdächtige*r, Screenshot Nutzerprofil, Screenshot Kommentar`
  )
  folder1.file("Betreff.txt", "Anzeige zu Kommentar auf X/Twitter")
  folder1.file("Datumszeile.txt", `${city}, den ${date}.${month}.${year}`)
  folder1.file("Empf.Adresse.txt", `${formatText(recipientAddress)}`)

  console.log("About to generate Übersicht.html in downloadprofilereport")
  function generateVerdachtStrafwahrscheinlichkeit(post) {
    if (!post.Subsumtion || !Array.isArray(post.Subsumtion)) return "";
    return post.Subsumtion
      .map(item => `${item.Verdacht}:${item.Strafwahrsch}`)
      .join("; ");
  }
  
  function generateOverviewHtml(results, date, month, year) {
    // Precompute the data array for each post
    const postsArray = results.map(post => {
      const tweetId = post.postUrl ? post.postUrl.split("/").pop() : "";
      const fileName = generateFileName(post, tweetId, date, month, year);
      const verdacht = generateVerdachtStrafwahrscheinlichkeit(post);
      return {
        post: post.Inhalt || "",
        verdacht: verdacht,
        bewertung: post.Schriftliche_Bewertung || "",
        id: tweetId,
        link: fileName
      };
    });
  
    // Return the full HTML as a string. All resources are embedded, so it works as a local file.
    return `<!DOCTYPE html>
  <html lang="de">
  <head>
    <meta charset="UTF-8">
    <title>Übersicht Strafanzeigenentwürfe</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; }
      .container { max-width: 90%; margin: 0 5%; }
      .column-filter { width: 90%; padding: 4px; margin: 4px 0; border: 1px solid #ddd; border-radius: 3px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background-color: #f5f5f5; cursor: pointer; }
      th:hover { background-color: #e5e5e5; }
      th::after { content: '↕'; margin-left: 5px; opacity: 0.5; }
      th.asc::after { content: '↑'; opacity: 1; }
      th.desc::after { content: '↓'; opacity: 1; }
      tr:hover { background-color: #f9f9f9; }
      .filter-cell { padding: 4px; background-color: #f9f9f9; }
      .active-filters { margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 4px; }
      .filter-tag { display: inline-block; padding: 4px 8px; margin: 2px; background-color: #e0e0e0; border-radius: 4px; font-size: 0.9em; }
      .filter-tag button { margin-left: 5px; border: none; background: none; cursor: pointer; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Übersicht der Strafanzeigen</h1>
      
      <div id="activeFilters" class="active-filters" style="display: none;">
        <strong>Aktive Filter:</strong>
        <div id="filterTags"></div>
      </div>
  
      <table id="overviewTable">
        <thead>
          <tr class="filter-row">
            <th class="filter-cell"><input type="text" class="column-filter" data-column="post" placeholder="Filter Post..."></th>
            <th class="filter-cell"><input type="text" class="column-filter" data-column="verdacht" placeholder="Filter Verdacht..."></th>
            <th class="filter-cell"><input type="text" class="column-filter" data-column="bewertung" placeholder="Filter Bewertung..."></th>
            <th class="filter-cell"><input type="text" class="column-filter" data-column="id" placeholder="Filter ID..."></th>
          </tr>
          <tr>
            <th data-sort="post">Post</th>
            <th data-sort="verdacht">Verdacht:Strafwahrscheinlichkeit</th>
            <th data-sort="bewertung">Bewertung</th>
            <th data-sort="id">ID</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
  
    <script>
      // Embed the precomputed posts array
      const posts = ${JSON.stringify(postsArray)};
      let currentSort = { column: '', direction: '' };
      let activeFilters = {};
      let filteredData = [...posts];
  
      // Render the table rows based on the data provided
      function renderTable(data) {
        const tbody = document.querySelector('#overviewTable tbody');
        tbody.innerHTML = '';
        data.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = \`
            <td>\${item.post}</td>
            <td>\${item.verdacht}</td>
            <td>\${item.bewertung}</td>
            <td><a href="\${item.link}" target="_blank">\${item.id}</a></td>
          \`;
          tbody.appendChild(row);
        });
      }
  
      // Update active filters display
      function updateActiveFiltersDisplay() {
        const filterTags = document.getElementById('filterTags');
        const activeFiltersContainer = document.getElementById('activeFilters');
        filterTags.innerHTML = '';
        const hasActiveFilters = Object.values(activeFilters).some(filter => filter);
        activeFiltersContainer.style.display = hasActiveFilters ? 'block' : 'none';
        Object.entries(activeFilters).forEach(([column, value]) => {
          if (value) {
            const tag = document.createElement('span');
            tag.className = 'filter-tag';
            tag.innerHTML = \`\${column}: \${value} <button onclick="clearFilter('\${column}')">&times;</button>\`;
            filterTags.appendChild(tag);
          }
        });
      }
  
      // Clear an individual filter and reapply filters
      function clearFilter(column) {
        activeFilters[column] = '';
        document.querySelector(\`input[data-column="\${column}"]\`).value = '';
        applyFilters();
      }
  
      // Apply all active filters
      function applyFilters() {
        filteredData = posts.filter(item => {
          return Object.entries(activeFilters).every(([column, filterValue]) => {
            if (!filterValue) return true;
            return item[column].toLowerCase().includes(filterValue.toLowerCase());
          });
        });
        updateActiveFiltersDisplay();
        renderTable(filteredData);
      }
  
      // Sort the data by the given column
      function sortData(column) {
        const direction = column === currentSort.column && currentSort.direction === 'asc' ? 'desc' : 'asc';
        filteredData.sort((a, b) => {
          const aVal = a[column].toLowerCase();
          const bVal = b[column].toLowerCase();
          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
          return 0;
        });
        document.querySelectorAll('th[data-sort]').forEach(th => {
          th.classList.remove('asc', 'desc');
          if (th.dataset.sort === column) {
            th.classList.add(direction);
          }
        });
        currentSort = { column, direction };
        renderTable(filteredData);
      }
  
      // Set up filter event listeners
      document.querySelectorAll('.column-filter').forEach(input => {
        input.addEventListener('input', (e) => {
          const column = e.target.dataset.column;
          activeFilters[column] = e.target.value;
          applyFilters();
        });
      });
  
      // Set up header sorting event listeners
      document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
          sortData(th.dataset.sort);
        });
      });
  
      // Initial render of the table
      renderTable(posts);
    </script>
  </body>
  </html>`;
  }
  
  const overviewHtml = generateOverviewHtml(results, date, month, year);
  mainFolder.file("Übersicht.html", overviewHtml);  
  console.log("Added Übersicht.html to mainFolder")

  // number of folders depends on uniques username
  //run a loop

  // Create folders for each unique username in results array
  let uniqueUsernames = [...new Set(results.map((item) => item.Username))]
  for (let username of uniqueUsernames) {
    const userFolder = mainFolder.folder(username)
    const post = results.find((item) => item.Username === username)

    userFolder.file(
      `ExtraUserInfo_${post.Username}_${date}.${month}.${year}.txt`,
      generateExtraUserInfoContent(post)
    )
    userFolder.file(
      `profilUrl.txt`,
      `URL Profil Tatverdächtige*r: ${post.userProfileUrl || ""}`
    )
    // userFolder.file(
    //   `UserInfo_${post.Username}_${date}.${month}.${year}.txt`,
    //   `Biografie: ${post.scrapedData?.profilebiodata}
    //   ${post.scrapedData?.userJoindate}
    //   Folgt: ${post.scrapedData?.followingCount}
    //   Follower: ${post.scrapedData?.followersCount} `
    // )
    userFolder.file(
      `UserInfo_${post.Username}_${date}.${month}.${year}.txt`,
      generateUserInfoContent(post)
    )

    userFolder.file(
      `userHandle.txt`,
      `Benutzername (Handle) im Profil Tatverdächtige*r: ${post.Username}`
    )
    userFolder.file(
      `screenname.txt`,
      `Anzeigename (Screenname) im Profil Tatverdächtige*r: ${post.Screenname}`
    )
  }
}
export async function downloadpostreport(results) {
  let now = new Date()
  let year = now.getFullYear()
  let month = String(now.getMonth() + 1).padStart(2, "0") // Months are 0-indexed, so we add 1
  let day = String(now.getDate()).padStart(2, "0")
  let hours = String(now.getHours()).padStart(2, "0")
  let minutes = String(now.getMinutes()).padStart(2, "0")
  let seconds = String(now.getSeconds()).padStart(2, "0")

  // // Create folder name in format Strafanz_Report_year.month.date.time
  // let folderName = `Strafanz_Report_${year}.${month}.${date}.${hours}.${minutes}.${seconds}`
  zip = null
  zip = new JSZip()

  let mainFolder = zip.folder("Strafanz_Report") // Main folder
  let formData = {}
  try {
    formData = await getFormData()
    console.log("Retrieved formData:", formData)
  } catch (error) {
    console.error("Error retrieving form data:", error)
  }
  const {
    senderAddress = "",
    recipientAddress = "",
    senderContactdetails = "",
    city = "",
    fullName = ""
  } = formData || {}

  // Helper function to format data with new lines
  function formatText(text = "") {
    if (!text) return ""
    return text
      .split(",")
      .map((item) => item.trim())
      .join("\n")
  }

  // Helper function to safely format date
  function formatDateTime(dateValue) {
    try {
      // If dateValue is already a valid Date object
      if (dateValue instanceof Date && !isNaN(dateValue)) {
        return dateValue
          .toISOString()
          .replace(/T/, " ")
          .replace(/Z/, "")
          .replace(
            /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}).*$/,
            (_, y, m, d, h, min) => `${d}.${m}.${y} ${h}:${min}`
          )
      }

      // If dateValue is a string or number, try to create a Date object
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date value")
      }

      return date
        .toISOString()
        .replace(/T/, " ")
        .replace(/Z/, "")
        .replace(
          /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}).*$/,
          (_, y, m, d, h, min) => `${d}.${m}.${y} ${h}:${min}`
        )
    } catch (error) {
      console.warn(`Error formatting date: ${error.message}`, dateValue)
      return "" // Return empty string instead of current date
    }
  }



  const originalUrl = await getoriginalUrl()
  mainFolder.file(
    "initialPostUrl.txt",
    (() => {
      if (!originalUrl) return ""
      if (typeof originalUrl === "string" && originalUrl.trim() === "")
        return ""

      return `URL des Ausgangsposts: ${originalUrl}`
    })()
  )
  mainFolder.file("AnalyseZeitpunkt.txt", `${day}.${month}.${year}`)

  let folder1 = mainFolder.folder("Anschreiben_Basis_Daten")

  //extract from formDataValue

  // Add 7 files with different names to this folder (text content)
  folder1.file("Abs.Adresse.txt", `${formatText(senderAddress)}`)
  folder1.file("Abs.Kontakt.txt", `${formatText(senderContactdetails)}`)
  folder1.file("Abs.UnterzeichnendePerson.txt", `${fullName}`)
  folder1.file(
    "Anlagen.txt",
    `Anlagen: Sachverhalt, Infos zum Profil Tatverdächtige*r, Screenshot Nutzerprofil, Screenshot Kommentar`
  )
  folder1.file("Betreff.txt", "Anzeige zu Kommentar auf X/Twitter")
  folder1.file("Datumszeile.txt", `${city}, den ${day}.${month}.${year}`)
  folder1.file("Empf.Adresse.txt", `${formatText(recipientAddress)}`)

  // number of folders depends on uniques username
  //run a loop

  // Create folders for each unique username in results array
  let uniqueUsernames = [...new Set(results.map((item) => item.Username))]
  for (let username of uniqueUsernames) {
    const userFolder = mainFolder.folder(username)
    const post = results.find((item) => item.Username === username)

    userFolder.file(
      `ExtraUserInfo_${post.Username}_${date}.${month}.${year}.txt`,
      generateExtraUserInfoContent(post)
    )

    userFolder.file(
      `profilUrl.txt`,
      `URL Profil Tatverdächtige*r: ${post.userProfileUrl || ""}`
    )
    // userFolder.file(
    //   `UserInfo_${post.Username}_${day}.${month}.${year}.txt`,
    //   `Biografie: ${post.scrapedData?.profilebiodata}
    //   ${post.scrapedData?.userJoindate}
    //   Folgt: ${post.scrapedData?.followingCount}
    //   Follower: ${post.scrapedData?.followersCount} `
    // )

    userFolder.file(
      `UserInfo_${post.Username}_${date}.${month}.${year}.txt`,
      generateUserInfoContent(post)
    )

    userFolder.file(
      `userHandle.txt`,
      `Benutzername (Handle) im Profil Tatverdächtige*r: ${post.Username}`
    )
    userFolder.file(
      `screenname.txt`,
      `Anzeigename (Screenname) im Profil Tatverdächtige*r: ${post.Screenname}`
    )

    // Filter results for the current username
    let userPosts = results.filter((item) => item.Username === username)
    console.log("userPosts>>>>>>>>>>>", userPosts)

    for (let post of userPosts) {
      const tweetId = post.postUrl.split("/").pop()
      let folder2 = userFolder.folder(tweetId)
      const formattedText = post.Anzeige_Entwurf.replace(/\\n/g, "\n")
      folder2.file(
        `AnzeigenEntwurf_${post.Username}_${tweetId}_${day}.${month}.${year}.txt`,
        formattedText
      )

      folder2.file(
        `Post_${post.Username}_${tweetId}_${day}.${month}.${year}.txt`,
        `${post.Inhalt}`
      )
      folder2.file(`postUrl.txt`, `URL des Kommentars: ${post.postUrl}`)

      // Entscheidungstext basierend auf dem Flag
      const decisionText = post.Post_selbst_ist_anzeigbar_flag ? "Ja" : "Nein"

      // Initialisierung des Prüfungstextes
      let prüfungText = "Prüfungen:\n\n"

      // Überprüfen, ob Subsumtion vorhanden ist und dann durchlaufen
      if (
        post.Subsumtion &&
        Array.isArray(post.Subsumtion) &&
        post.Subsumtion.length > 0
      ) {
        post.Subsumtion.forEach((item, index) => {
          prüfungText +=
            `  > Verdacht: ${item.Verdacht}\n` +
            `  > Subsumtion: ${item.Subsumtion}\n` +
            `  > Strafwahrscheinlichkeit: ${item.Strafwahrsch}\n\n`
        })
      } else {
        prüfungText += "Keine Prüfungen vorhanden.\n\n"
      }

      // Zusammensetzen des gesamten Textes
      const textBegründung =
        `Post:\n${post.Inhalt}\n\n` +
        `Erläuterung:\n${post.Erklärung}\n\n` +
        `${prüfungText}` +
        `Bewertung:\n${post.Schriftliche_Bewertung}\n\n` +
        `Modell Entscheidung, ob der Post anzeigbar ist: ${decisionText}`

      // Ersetzen von doppelten Backslashes mit einfachen Zeilenumbrüchen
      const formattedTextBegründung = textBegründung.replace(/\\n/g, "\n")

      // Erstellen und Speichern der Textdatei mit dem gewünschten Namen
      folder2.file(
        `BegründungDerAnzeige_${post.Username}_${tweetId}_${day}.${month}.${year}.txt`,
        formattedTextBegründung
      )

      folder2.file(`unser_Zeichen.txt`, `Unser Zeichen: ${tweetId}`)
      folder2.file(`Verfolgungsart.txt`, `${post.Verfolgungsart}`)
      // folder2.file(
      //   `Zeitpunkt.txt`,
      //   // `Zeitpunkt des Kommentars: ${day}.${month}.${year} um ${hours}:${minutes} Uhr`
      //   `Zeitpunkt des Kommentars: ${new Date(post?.Veröffentlichungszeitpunkt)
      //     .toISOString()
      //     .replace(/T/, " ")
      //     .replace(/Z/, "")
      //     .replace(
      //       /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}).*$/,
      //       (_, y, m, d, h, min) => `${d}.${m}.${y} ${h}:${min}`
      //     )} Uhr`
      // )
      // Use in your code
      folder2.file(
        `Zeitpunkt.txt`,
        `Zeitpunkt des Kommentars: ${formatDateTime(post.Veröffentlichungszeitpunkt)}${formatDateTime(post.Veröffentlichungszeitpunkt) ? " Uhr" : ""}`
      )
    }
  }
}

export async function downloadScreenshots(screenshotBlob, filename, directory) {
  // Create new JSZip instance
  const zip = new JSZip()

  // Convert blob URL to actual blob
  const response = await fetch(screenshotBlob)
  const blobData = await response.blob()

  // Create directory structure
  const folders = directory.split("/")
  let currentFolder = zip

  // Create nested folders
  for (const folder of folders) {
    currentFolder = currentFolder.folder(folder)
  }

  // Add the screenshot to the deepest folder
  currentFolder.file(filename, blobData)

  // Generate the zip file
  const content = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9
    }
  })

  // Create download link and trigger download
  const downloadUrl = URL.createObjectURL(content)
  const link = document.createElement("a")
  link.href = downloadUrl
  link.download = "screenshots.zip"
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(downloadUrl)
}

export async function createFinalReport(results, originalUrl = "") {
  // Validate required input
  if (!Array.isArray(results)) {
    console.error("Results must be an array")
    return
  }

  // First subfolder: "Anschreiben_Basis_Daten"
  let now = new Date()
  let year = now.getFullYear()
  let month = String(now.getMonth() + 1).padStart(2, "0") // Months are 0-indexed, so we add 1
  let date = String(now.getDate()).padStart(2, "0")
  let hours = String(now.getHours()).padStart(2, "0")
  let minutes = String(now.getMinutes()).padStart(2, "0")
  let seconds = String(now.getSeconds()).padStart(2, "0")

  // Create folder name in format Strafanzeiger_Report_year.month.date.time
  zip = new JSZip()
  let folderName = `Strafanz_Report_${year}.${month}.${date}.${hours}.${minutes}.${seconds}`
  let mainFolder = zip.folder(folderName) // Main folder
  let formData = {}
  try {
    formData = await getFormData()
    console.log("Retrieved formData:", formData)
  } catch (error) {
    console.error("Error retrieving form data:", error)
  }
  const {
    senderAddress = "",
    recipientAddress = "",
    senderContactdetails = "",
    city = "",
    fullName = ""
  } = formData || {}

  // Helper function to format data with new lines
  function formatText(text = "") {
    if (!text) return ""
    return text
      .split(",")
      .map((item) => item.trim())
      .join("\n")
  }

  //Timestamp to add in this text file AnalyseZeitpunkt.txt
  // mainFolder.file(
  //   "initialPostUrl.txt",
  //   `URL des Ausgangsposts: ${originalUrl || ""}`
  // )

  if(originalUrl.trim() === "") {
    originalUrl = await getoriginalUrl()
  }

  mainFolder.file(
    "initialPostUrl.txt",
    (() => {
      if (!originalUrl) return ""
      if (typeof originalUrl === "string" && originalUrl.trim() === "") 
        return ""

      return `URL des Ausgangsposts: ${originalUrl}`
    })()
  )

  mainFolder.file("AnalyseZeitpunkt.txt", `${date}.${month}.${year}`)

  let folder1 = mainFolder.folder("Anschreiben_Basis_Daten")

  //extract from formDataValue

  // Add 7 files with different names to this folder (text content)
  folder1.file("Abs.Adresse.txt", `${formatText(senderAddress)}`)
  folder1.file("Abs.Kontakt.txt", `${formatText(senderContactdetails)}`)
  folder1.file("Abs.UnterzeichnendePerson.txt", `${fullName}`)
  folder1.file(
    "Anlagen.txt",
    `Anlagen: Sachverhalt, Infos zum Profil Tatverdächtige*r, Screenshot Nutzerprofil, Screenshot Kommentar`
  )
  folder1.file("Betreff.txt", "Anzeige zu Kommentar auf X/Twitter")
  folder1.file("Datumszeile.txt", `${city}, den ${date}.${month}.${year}`)
  folder1.file("Empf.Adresse.txt", `${formatText(recipientAddress)}`)

  console.log("About to generate Übersicht.html in createFinalReport")
  function generateVerdachtStrafwahrscheinlichkeit(post) {
    if (!post.Subsumtion || !Array.isArray(post.Subsumtion)) return "";
    return post.Subsumtion
      .map(item => `${item.Verdacht}:${item.Strafwahrsch}`)
      .join("; ");
  }
  
  function generateOverviewHtml(results, date, month, year) {
    // Precompute the data array for each post
    const postsArray = results.map(post => {
      const tweetId = post.postUrl ? post.postUrl.split("/").pop() : "";
      const fileName = generateFileName(post, tweetId, date, month, year);
      const verdacht = generateVerdachtStrafwahrscheinlichkeit(post);
      return {
        post: post.Inhalt || "",
        verdacht: verdacht,
        bewertung: post.Schriftliche_Bewertung || "",
        id: tweetId,
        link: fileName
      };
    });
  
    // Return the full HTML as a string. All resources are embedded, so it works as a local file.
    return `<!DOCTYPE html>
  <html lang="de">
  <head>
    <meta charset="UTF-8">
    <title>Übersicht Strafanzeigenentwürfe</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; }
      .container { max-width: 90%; margin: 0 5%; }
      .column-filter { width: 90%; padding: 4px; margin: 4px 0; border: 1px solid #ddd; border-radius: 3px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background-color: #f5f5f5; cursor: pointer; }
      th:hover { background-color: #e5e5e5; }
      th::after { content: '↕'; margin-left: 5px; opacity: 0.5; }
      th.asc::after { content: '↑'; opacity: 1; }
      th.desc::after { content: '↓'; opacity: 1; }
      tr:hover { background-color: #f9f9f9; }
      .filter-cell { padding: 4px; background-color: #f9f9f9; }
      .active-filters { margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 4px; }
      .filter-tag { display: inline-block; padding: 4px 8px; margin: 2px; background-color: #e0e0e0; border-radius: 4px; font-size: 0.9em; }
      .filter-tag button { margin-left: 5px; border: none; background: none; cursor: pointer; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Übersicht der Strafanzeigen</h1>
      
      <div id="activeFilters" class="active-filters" style="display: none;">
        <strong>Aktive Filter:</strong>
        <div id="filterTags"></div>
      </div>
  
      <table id="overviewTable">
        <thead>
          <tr class="filter-row">
            <th class="filter-cell"><input type="text" class="column-filter" data-column="post" placeholder="Filter Post..."></th>
            <th class="filter-cell"><input type="text" class="column-filter" data-column="verdacht" placeholder="Filter Verdacht..."></th>
            <th class="filter-cell"><input type="text" class="column-filter" data-column="bewertung" placeholder="Filter Bewertung..."></th>
            <th class="filter-cell"><input type="text" class="column-filter" data-column="id" placeholder="Filter ID..."></th>
          </tr>
          <tr>
            <th data-sort="post">Post</th>
            <th data-sort="verdacht">Verdacht:Strafwahrscheinlichkeit</th>
            <th data-sort="bewertung">Bewertung</th>
            <th data-sort="id">ID</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
  
    <script>
      // Embed the precomputed posts array
      const posts = ${JSON.stringify(postsArray)};
      let currentSort = { column: '', direction: '' };
      let activeFilters = {};
      let filteredData = [...posts];
  
      // Render the table rows based on the data provided
      function renderTable(data) {
        const tbody = document.querySelector('#overviewTable tbody');
        tbody.innerHTML = '';
        data.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = \`
            <td>\${item.post}</td>
            <td>\${item.verdacht}</td>
            <td>\${item.bewertung}</td>
            <td><a href="\${item.link}" target="_blank">\${item.id}</a></td>
          \`;
          tbody.appendChild(row);
        });
      }
  
      // Update active filters display
      function updateActiveFiltersDisplay() {
        const filterTags = document.getElementById('filterTags');
        const activeFiltersContainer = document.getElementById('activeFilters');
        filterTags.innerHTML = '';
        const hasActiveFilters = Object.values(activeFilters).some(filter => filter);
        activeFiltersContainer.style.display = hasActiveFilters ? 'block' : 'none';
        Object.entries(activeFilters).forEach(([column, value]) => {
          if (value) {
            const tag = document.createElement('span');
            tag.className = 'filter-tag';
            tag.innerHTML = \`\${column}: \${value} <button onclick="clearFilter('\${column}')">&times;</button>\`;
            filterTags.appendChild(tag);
          }
        });
      }
  
      // Clear an individual filter and reapply filters
      function clearFilter(column) {
        activeFilters[column] = '';
        document.querySelector(\`input[data-column="\${column}"]\`).value = '';
        applyFilters();
      }
  
      // Apply all active filters
      function applyFilters() {
        filteredData = posts.filter(item => {
          return Object.entries(activeFilters).every(([column, filterValue]) => {
            if (!filterValue) return true;
            return item[column].toLowerCase().includes(filterValue.toLowerCase());
          });
        });
        updateActiveFiltersDisplay();
        renderTable(filteredData);
      }
  
      // Sort the data by the given column
      function sortData(column) {
        const direction = column === currentSort.column && currentSort.direction === 'asc' ? 'desc' : 'asc';
        filteredData.sort((a, b) => {
          const aVal = a[column].toLowerCase();
          const bVal = b[column].toLowerCase();
          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
          return 0;
        });
        document.querySelectorAll('th[data-sort]').forEach(th => {
          th.classList.remove('asc', 'desc');
          if (th.dataset.sort === column) {
            th.classList.add(direction);
          }
        });
        currentSort = { column, direction };
        renderTable(filteredData);
      }
  
      // Set up filter event listeners
      document.querySelectorAll('.column-filter').forEach(input => {
        input.addEventListener('input', (e) => {
          const column = e.target.dataset.column;
          activeFilters[column] = e.target.value;
          applyFilters();
        });
      });
  
      // Set up header sorting event listeners
      document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
          sortData(th.dataset.sort);
        });
      });
  
      // Initial render of the table
      renderTable(posts);
    </script>
  </body>
  </html>`;
  }
  
  const overviewHtml = generateOverviewHtml(results, date, month, year);
  mainFolder.file("Übersicht.html", overviewHtml);  
  console.log("Added Übersicht.html to mainFolder")


  // number of folders depends on uniques username
  //run a loop

  // Create folders for each unique username in results array
  let uniqueUsernames = [...new Set(results.map((item) => item.Username))]
  for (let username of uniqueUsernames) {
    const userFolder = mainFolder.folder(username)
    const post = results.find((item) => item.Username === username)

    // userFolder.file(
    //   `ExtraUserInfo_${post.Username}_${date}.${month}.${year}.txt`,

    //   post.perplexityresponse?.online_praesenz ? `Weitere Informationen aus einer automatisierten Online-Recherche, die möglicherweise mit Tatverdächtigen*r zusammenhängen:
    //   ${post.perplexityresponse?.online_praesenz || ""}`: ""
    // )

    userFolder.file(
      `ExtraUserInfo_${post.Username}_${date}.${month}.${year}.txt`,
      generateExtraUserInfoContent(post)
    )

    userFolder.file(
      `profilUrl.txt`,
      `URL Profil Tatverdächtige*r: ${post.userProfileUrl || ""}`
    )
    // userFolder.file(
    //   `UserInfo_${post.Username}_${date}.${month}.${year}.txt`,
    //   `
    //   - User-Name: ${post.Screenname}
    //   - User-Handle: ${post.Username}
    //   - Beschreibung: ${post.scrapedData?.profilebiodata}
    //   - Konto erstellt: ${post.scrapedData?.userJoindate}
    //   - Ort: ${post.scrapedData.userlocation}
    //   - URL: ${post.scrapedData.userUrl}
    //   - Anzahl Konten denen dieser User folgt: ${post.scrapedData?.followingCount}
    //   - Anzahl Konten die diesem User folgen: ${post.scrapedData?.followersCount}
    //   - Geboren am ${post.scrapedData.userBirthdate}`
    // )

    userFolder.file(
      `UserInfo_${post.Username}_${date}.${month}.${year}.txt`,
      generateUserInfoContent(post)
    )

    userFolder.file(
      `userHandle.txt`,
      `Benutzername (Handle) im Profil Tatverdächtige*r: ${post.Username}`
    )
    userFolder.file(
      `screenname.txt`,
      `Anzeigename (Screenname) im Profil Tatverdächtige*r: ${post.Screenname}`
    )

    const response = await fetch(post.profileScreenshot[0])

    if (response.ok) {
      const blobData = await response.blob()
      console.log("blobData>>>>..", blobData)
      userFolder.file(
        `screenshot_profile_${post.Username}_${date}.${month}.${year}.png`,
        blobData,
        { binary: true }
      )
    }

    // Filter results for the current username
    let userPosts = results.filter((item) => item.Username === username)
    console.log("userPosts>>>>>>>>>>>", userPosts)

    for (let post of userPosts) {
      const tweetId = post.postUrl.split("/").pop()
      let folder2 = userFolder.folder(tweetId)
      const formattedText = post.Anzeige_Entwurf.replace(/\\n/g, "\n")
      folder2.file(
        `AnzeigenEntwurf_${post.Username}_${tweetId}_${date}.${month}.${year}.txt`,
        formattedText
      )

      folder2.file(
        `VerdachtAuf.txt`,
        generateSubsumptionDetails(post)
      )

      folder2.file(
        `Post_${post.Username}_${tweetId}_${date}.${month}.${year}.txt`,
        `${post.Inhalt}`
      )
      folder2.file(`postUrl.txt`, `URL des Kommentars: ${post.postUrl}`)

      // Entscheidungstext basierend auf dem Flag
      const decisionText = post.Post_selbst_ist_anzeigbar_flag ? "Ja" : "Nein"

      // Initialisierung des Prüfungstextes
      let prüfungText = "Prüfungen:\n\n"

      // Überprüfen, ob Subsumtion vorhanden ist und dann durchlaufen
      if (
        post.Subsumtion &&
        Array.isArray(post.Subsumtion) &&
        post.Subsumtion.length > 0
      ) {
        post.Subsumtion.forEach((item, index) => {
          prüfungText +=
            `  > Verdacht: ${item.Verdacht}\n` +
            `  > Subsumtion: ${item.Subsumtion}\n` +
            `  > Strafwahrscheinlichkeit: ${item.Strafwahrsch}\n\n`
        })
      } else {
        prüfungText += "Keine Prüfungen vorhanden.\n\n"
      }

      // Zusammensetzen des gesamten Textes
      const textBegründung =
        `Post:\n${post.Inhalt}\n\n` +
        `Erläuterung:\n${post.Erklärung}\n\n` +
        `${prüfungText}` +
        `Rechtfertigungsargumente:\n${post.Rechtfertigungsargumente}\n\n` +
        `Bewertung:\n${post.Schriftliche_Bewertung}\n\n` +
        `Modell Entscheidung, ob der Post anzeigbar ist: ${decisionText}`

      // Ersetzen von doppelten Backslashes mit einfachen Zeilenumbrüchen
      const formattedTextBegründung = textBegründung.replace(/\\n/g, "\n")

      // Erstellen und Speichern der Textdatei mit dem gewünschten Namen
      folder2.file(
        `BegründungDerAnzeige_${post.Username}_${tweetId}_${date}.${month}.${year}.txt`,
        formattedTextBegründung
      )

      try {
        const postResponse = await fetch(post.postScreenshot[0])
        if (postResponse.ok) {
          console.log("postResponse>>>>>>>>", postResponse)
          const postblobData = await postResponse.blob()
          console.log("postblobData>>>>>>>>>>.", postblobData)

          folder2.file(
            `screenshot_${post.Username}_${tweetId}_${date}.${month}.${year}.png`,
            postblobData,
            { binary: true }
          )
        }
      } catch (error) {
        console.error("Error fetching post screenshot:", error)
      }

      folder2.file(`unser_Zeichen.txt`, `Unser Zeichen: ${tweetId}`)
      folder2.file(`Verfolgungsart.txt`, `${post.Verfolgungsart}`)
      folder2.file(
        `Zeitpunkt.txt`,
        // `Zeitpunkt des Kommentars: ${post.Veröffentlichungszeitpunkt} Uhr`
        `Zeitpunkt des Kommentars: ${new Date(post.Veröffentlichungszeitpunkt)
          .toISOString()
          .replace(/T/, " ")
          .replace(/Z/, "")
          .replace(
            /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}).*$/,
            (_, y, m, d, h, min) => `${d}.${m}.${y} ${h}:${min}`
          )} Uhr`
      )
      const dateString = `${date}.${month}.${year}`
      if (!post.Username || !tweetId || !dateString || !post.Verfolgungsart) {
        console.error("Missing required inputs:", { post, tweetId, dateString })
        return
      }
      try {
        const fileContents = {
            AnzeigenEntwurf: post.Anzeige_Entwurf?.replace(/\\n/g, "\n") || "",
            Abs_Adresse: formatText(senderAddress),
            Abs_Kontakt: formatText(senderContactdetails),
            Empf_Adresse: formatText(recipientAddress),
            Betreff: "Anzeige zu Kommentar auf X/Twitter",
            Datumszeile: `${city}, den ${date}.${month}.${year}`,
            Abs_UnterzeichnendePerson: fullName,
            Anlagen: `Anlagen: Sachverhalt, Infos zum Profil Tatverdächtige*r, Screenshot Nutzerprofil, Screenshot Kommentar`,
            AnalyseZeitpunkt: `${date}.${month}.${year}`,
            Post: post.Inhalt || "",
            Zeitpunkt: `Zeitpunkt des Kommentars: ${new Date(post.Veröffentlichungszeitpunkt)
                .toISOString()
                .replace(/T/, " ")
                .replace(/Z/, "")
                .replace(
                    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}).*$/,
                    (_, y, m, d, h, min) => `${d}.${m}.${y} ${h}:${min}`
                )} Uhr`,
            userHandle: `Benutzername (Handle) im Profil Tatverdächtige*r: ${post.Username}`,
            screenname: `Anzeigename (Screenname) im Profil Tatverdächtige*r: ${post.Screenname || ""}`,
            profilUrl: `URL Profil Tatverdächtige*r: ${post.userProfileUrl || ""}`,
            postUrl: `URL des Kommentars: ${post.postUrl || ""}`,
            initialPostUrl: originalUrl ? `URL des Ausgangsposts: ${originalUrl}` : "",
            UserInfo: generateUserInfoContent(post),
            ExtraUserInfo: generateExtraUserInfoContent(post)
        };
    
        const htmlreport = generateHtmlReport(
            post.Username,
            tweetId,
            dateString,
            post.Verfolgungsart,
            fileContents
        );
        console.log("Generated HTML Report:", htmlreport)

mainFolder.file(
  generateFileName(post, tweetId, date, month, year), // Generated file name
  htmlreport // The file content
);
      } catch (error) {
        console.error("Error generating HTML report:", error)

        // Optional: If the error stack or specific input details are important for debugging, log them as well
        console.error("Stack Trace:", error.stack)
        console.log("Input Details:", {
          Username: post.Username,
          TweetID: tweetId,
          DateString: dateString,
          Verfolgungsart: post.Verfolgungsart
        })
      }
    }
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

// export async function downloadallfullfilesZip() {
//   // Generate the zip Blob
//   // Generate the zip Blob
//   // Generate the zip Blob
//   const zipBlob = await zip.generateAsync({ type: "blob" })

//   // Create a download link
//   const url = URL.createObjectURL(zipBlob)
//   const a = document.createElement("a")
//   a.href = url
//   a.download = "archive.zip"
//   document.body.appendChild(a)
//   a.click()
//   URL.revokeObjectURL(url)
// }

export async function downloadZip() {
  // Generate the zip Blob
  // Generate the zip Blob
  return await zip.generateAsync({ type: "blob" })
}

// Function to get the API key and run the query
export async function isPerplexityEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get("usePerplexity", (result) => {
      resolve(!!result.usePerplexity); // Convert to boolean (true/false)
    });
  });
}

export async function callPerplexity(query) {
  const usePerplexity = await isPerplexityEnabled()

  console.log("usePerplexity>>>>>>>>.", usePerplexity)
  if (usePerplexity) {
    try {
      const perplexityResponse = await runPerplexityQuery(query)
      console.log("perplexityresponse>>>>>>>>>>>", perplexityResponse)
      return perplexityResponse
    } catch (error) {
      console.error("Error calling Perplexity API:", error)
      return null // Return null if an error occurs to handle gracefully
    }
  } else {
    return
  }
}

async function runPerplexityQuery(query) {
  return await new Promise((resolve, reject) => {
    // Fetch the API key from storage
    chrome.storage.local.get("perplexityApiKey", (result) => {
      const apiKey = result.perplexityApiKey

      if (!apiKey) {
        console.error("API Key is not set in Chrome storage.")
        // sendMessageToPopup("Der Perplexity-API-Schlüssel fehlt.")
        return
      }

      // Set up the API details
      const API_URL = "https://api.perplexity.ai/chat/completions"
      const MODEL = "llama-3.1-sonar-huge-128k-online"

      // Set up request headers and body
      const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }

      const data = {
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "Be precise and concise. Only output valid json as requested by the user. No text outside that json"
          },
          { role: "user", content: query }
        ],
        max_tokens: 2048, // old:1024 - theoretical max:127072
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

export async function fetchEvaluation(
  apiKey,
  promptText,
  jsonSchema,
  posts,
  batchSize = 5
) {
  // Helper function to make a single API call
  const fetchBatch = async (batch) => {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o", // Use the faster model
            messages: [
              { role: "system", content: promptText },
              { role: "user", content: JSON.stringify({ posts: batch }) }
            ],
            response_format: {
              type: "json_schema",
              json_schema: jsonSchema
            },
            temperature: 0
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `API request failed: ${response.status} - ${JSON.stringify(errorData)}`
        )
      }

      return await response.json()
    } catch (error) {
      console.error("Error processing batch:", batch, error)
      throw error
    }
  }

  // Split posts into smaller batches
  const batches = []
  for (let i = 0; i < posts.length; i += batchSize) {
    batches.push(posts.slice(i, i + batchSize))
  }

  // Process all batches in parallel
  try {
    const results = await Promise.all(batches.map((batch) => fetchBatch(batch)))
    console.log("results>>>>>", results)
    return results // Combine results from all batches
  } catch (error) {
    console.error("Error during parallel processing:", error)
    throw error
  }
}
