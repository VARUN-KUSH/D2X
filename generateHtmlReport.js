/**
 * Generates an HTML report based on the provided inputs.
 *
 * @param {string} userProfileSubfolderName - Name of the subfolder containing the user profile.
 * @param {string} postDataSubfolderName - Name of the sub-subfolder containing the post data.
 * @param {string} dateString - Date string required for the file names (e.g., "31.07.2024").
 * @param {string} Verfolgungsart - Content of the "Verfolgungsart.txt" file.
 * @param {Object} [fileContents={}] - Optional. An object containing the contents of various .txt files.
 *                                     Example:
 *                                     {
 *                                       "AnzeigenEntwurf": "Content of AnzeigenEntwurf.txt",
 *                                       "Abs_Adresse": "Content of Abs.Adresse.txt",
 *                                       "Abs_Kontakt": "Content of Abs.Kontakt.txt",
 *                                       "Empf_Adresse": "Content of Empf.Adresse.txt",
 *                                       "Betreff": "Content of Betreff.txt",
 *                                       "Datumszeile": "Content of Datumszeile.txt",
 *                                       "Abs_UnterzeichnendePerson": "Content of Abs.UnterzeichnendePerson.txt",
 *                                       "Anlagen": "Content of Anlagen.txt",
 *                                       "AnalyseZeitpunkt": "Content of AnalyseZeitpunkt.txt",
 *                                       "Post": "Content of Post.txt",
 *                                       "Zeitpunkt": "Content of Zeitpunkt.txt",
 *                                       "userHandle": "Content of userHandle.txt",
 *                                       "screenname": "Content of screenname.txt",
 *                                       "profilUrl": "Content of profilUrl.txt",
 *                                       "postUrl": "Content of postUrl.txt",
 *                                       "initialPostUrl": "Content of initialPostUrl.txt",
 *                                       "UserInfo": "Content of UserInfo.txt",
 *                                       "ExtraUserInfo": "Content of ExtraUserInfo.txt"
 *                                     }
 * @returns {string} - The generated HTML content as a string.
 */
function generateHtmlReport(
  
  username,
  tweetId,
  dateString,
  Verfolgungsart,
  fileContents
) {
  // Define the HTML template with placeholders
  console.log("username>>>>>>>>", username, "tweetID>>>>>>>>>>>>.", tweetId, "dateString>>>>>>>", dateString)
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <title>Anzeige_${username}_${tweetId}_${Verfolgungsart}_${dateString}</title>
        <style>
            @page {
                size: A4;
                margin-top: 3cm;
                margin-bottom: 3cm;
                margin-left: 2cm;
                margin-right: 2cm;
            }
    
            html, body {
                width: 100%;
                margin: 0;
                padding: 0;
                font-family: monospace;
                line-height: 1.6;
            }
    
            .container {
                max-width: 21cm;
                margin: 0 auto;
                padding: 0;
                position: relative;
                width: 100%;
            }
    
            .right-align {
                text-align: right;
                position: relative;
            }
    
            .right-align iframe {
                position: relative;
                right: 0;
                width: 50%;
            }
    
            .left-align {
                text-align: left;
            }
    
            .address-block, .subject, .date-line, .content-block, .signature, .attachments {
                clear: both;
            }
    
            h1, h2 {
                color: #333;
            }
    
            .screenshot-section {
                display: block;
                margin: 0;
                width: 100%;
            }
    
            .screenshot-section figcaption,
            .screenshot-section h2 {
                margin: 0;
                padding: 0;
                font-size: 0.95em;
                line-height: 1.2;
                page-break-after: avoid;
                break-after: avoid;
            }
    
            .screenshot {
                display: block;
                width: 100%;
                height: auto;
                margin: 0;
                margin-top: -0.2cm;
                object-fit: contain; /* Ensure image fits within container */
            }
    
            iframe {
                width: 100%;
                border: none;
                overflow: hidden;
            }
    
            /* Adjusted initial heights based on content size */
            {{iframeStyles}}
    
            /* Additional styles for page breaks and section boundaries */
            .page-break {
                page-break-before: always;
            }
    
            .section {
                page-break-inside: avoid;
            }
    
            @media print {
                /* Any print-specific styles can go here */
            }
        </style>
    </head>
    <body>
    
        <!-- Abs.Adresse.txt -->
        <div class="address-block right-align">
            <iframe src="Anschreiben_Basis_Daten/Abs.Adresse.txt" class="iframe-Abs_Adresse"></iframe>
        </div>
    
        <!-- Abs.Kontakt.txt -->
        <div class="address-block right-align">
            <iframe src="Anschreiben_Basis_Daten/Abs.Kontakt.txt" class="iframe-Abs_Kontakt"></iframe>
        </div>
    
        <!-- unser_Zeichen.txt -->
        <div class="address-block right-align">
            <iframe src="${username}/${tweetId}/unser_Zeichen.txt" class="iframe-unser_Zeichen"></iframe>
        </div>
    
        <!-- Empf.Adresse.txt -->
        <div class="address-block left-align">
            <iframe src="Anschreiben_Basis_Daten/Empf.Adresse.txt" class="iframe-Empf_Adresse"></iframe>
        </div>
    
        <!-- Betreff.txt -->
        <div class="subject left-align">
            <iframe src="Anschreiben_Basis_Daten/Betreff.txt" class="iframe-Betreff"></iframe>
        </div>
    
        <!-- Datumszeile.txt -->
        <div class="date-line right-align">
            <iframe src="Anschreiben_Basis_Daten/Datumszeile.txt" class="iframe-Datumszeile"></iframe>
        </div>
    
        <!-- AnzeigenEntwurf -->
        <div class="content-block left-align">
            <iframe src="${username}/${tweetId}/AnzeigenEntwurf_${username}_${tweetId}_${dateString}.txt" class="iframe-AnzeigenEntwurf"></iframe>
        </div>
    
        <!-- Abs.UnterzeichnendePerson.txt -->
        <div class="signature left-align">
            <iframe src="Anschreiben_Basis_Daten/Abs.UnterzeichnendePerson.txt" class="iframe-Abs_UnterzeichnendePerson"></iframe>
        </div>
    
        <!-- Anlagen.txt -->
        <div class="attachments left-align">
            <iframe src="Anschreiben_Basis_Daten/Anlagen.txt" class="iframe-Anlagen"></iframe>
        </div>
    
        <div class="page-break"></div>
    
        <!-- Sachverhalt Section -->
        <h1>Sachverhalt</h1>
    
        <div class="content-block left-align">
            <p>
                Am <iframe src="AnalyseZeitpunkt.txt" class="iframe-AnalyseZeitpunkt" style="display: inline-block; vertical-align: middle;"></iframe>
                wurde bei der Sichtung der Plattform x.com/Twitter folgender Inhalt festgestellt.
            </p>
        </div>
    
        <!-- Kommentar im Textformat -->
        <div class="content-block">
            <p><strong>Kommentar im Textformat:</strong></p>
            <blockquote>
                <iframe src="${username}/${tweetId}/Post_${username}_${tweetId}_${dateString}.txt" class="iframe-Post"></iframe>
            </blockquote>
        </div>
    
        <!-- Eckdaten -->
        <div class="content-block left-align">
            <p><strong>Eckdaten:</strong>
                <iframe src="${username}/${tweetId}/Zeitpunkt.txt" class="iframe-Zeitpunkt" style="display: inline-block; vertical-align: middle;"></iframe>
                <iframe src="${username}/userHandle.txt" class="iframe-userHandle" style="display: inline-block; vertical-align: middle;"></iframe>
                <iframe src="${username}/screenname.txt" class="iframe-screenname" style="display: inline-block; vertical-align: middle;"></iframe>
                <iframe src="${username}/profilUrl.txt" class="iframe-profilUrl" style="display: inline-block; vertical-align: middle;"></iframe>
                <iframe src="${username}/${tweetId}/postUrl.txt" class="iframe-postUrl" style="display: inline-block; vertical-align: middle;"></iframe>
                <iframe src="initialPostUrl.txt" class="iframe-initialPostUrl" style="display: inline-block; vertical-align: middle;"></iframe>
            </p>
        </div>
    
        <div class="page-break"></div>
    
        <!-- UserInfo Section -->
        <h2>Informationen aus dem Profil Tatverdächtige*r:</h2>
        <div class="content-block left-align">
            <iframe src="${username}/UserInfo_${username}_${dateString}.txt" class="iframe-UserInfo"></iframe>
            <iframe src="${username}/ExtraUserInfo_${username}_${dateString}.txt" class="iframe-ExtraUserInfo"></iframe>
        </div>
    
        <div class="page-break"></div>
    
        <!-- Screenshot of User Profile -->
        <div class="section">
            <h2>Screenshot Nutzerprofil auf X/Twitter</h2>
            <figure class="screenshot-section">
                <img src="${username}/screenshot_profile_${username}_${dateString}.png" alt="Screenshot Profil" class="screenshot">
            </figure>
        </div>
    
        <div class="page-break"></div>
    
        <!-- Screenshot of Comment and Context -->
        <div class="section">
            <h2>Screenshot des Kommentars und Kontext:</h2>
            <figure class="screenshot-section">
                <img src="${username}/${tweetId}/screenshot_${username}_${tweetId}_${dateString}.png" alt="Screenshot Kommentar" class="screenshot">
            </figure>
        </div>
    
    </body>
    </html>`

  // Define default heights for each iframe class
  const defaultHeights = {
    "iframe-Abs_Adresse": 75,
    "iframe-Abs_Kontakt": 60,
    "iframe-unser_Zeichen": 45,
    "iframe-Empf_Adresse": 75,
    "iframe-Betreff": 45,
    "iframe-Datumszeile": 45,
    "iframe-AnzeigenEntwurf": 340,
    "iframe-Abs_UnterzeichnendePerson": 45,
    "iframe-Anlagen": 85,
    "iframe-AnalyseZeitpunkt": 45,
    "iframe-Post": 170,
    "iframe-Zeitpunkt": 45,
    "iframe-userHandle": 45,
    "iframe-screenname": 45,
    "iframe-profilUrl": 45,
    "iframe-postUrl": 45,
    "iframe-initialPostUrl": 45,
    "iframe-UserInfo": 170,
    "iframe-ExtraUserInfo": 170
  }

  /**
   * Calculates the number of lines in a text considering word wrap at 75 characters.
   *
   * @param {string} content - The text content to analyze.
   * @returns {number} - The total number of lines.
   */
  function calculateLineCount(content) {
    if (!content) return 0
    const lines = content.split("\n")
    let totalLines = 0
    lines.forEach((line) => {
      totalLines += Math.ceil(line.length / 75) || 1
    })
    return totalLines
  }

  /**
   * Sanitizes input to prevent injection attacks.
   *
   * @param {string} input - The input string to sanitize.
   * @returns {string} - The sanitized string.
   */
  //   function sanitizeInput(input) {
  //     const map = {
  //       "&": "&amp;",
  //       "<": "&lt;",
  //       ">": "&gt;",
  //       '"': "&quot;",
  //       "'": "&#039;"
  //     }
  //     return String(input).replace(/[&<>"']/g, function (m) {
  //       return map[m]
  //     })
  //   }

  /**
   * Generates CSS styles for iframes based on their calculated heights.
   *
   * @param {Object} heights - An object mapping iframe class names to their heights.
   * @returns {string} - The generated CSS styles as a string.
   */
  function generateIframeStyles(heights) {
    let styles = ""
    for (const className in heights) {
      styles += `
    .${className} {
        height: ${heights[className]}px;
    }
    `
    }
    return styles
  }

  // Calculate heights based on fileContents
  const heights = { ...defaultHeights }
  for (const className in heights) {
    const key = className.replace("iframe-", "") // e.g., "Abs_Adresse"
    if (fileContents[key]) {
      const lineCount = calculateLineCount(fileContents[key])
      heights[className] = 30 + lineCount * 15
    }
  }

  // Generate CSS styles for iframes
  const iframeStyles = generateIframeStyles(heights)

//   // Replace placeholders in the template
  let htmlContent = htmlTemplate.replace("{{iframeStyles}}", iframeStyles)
//   // .replace(/{{userHandle}}/g, sanitizeInput(userProfileSubfolderName))
//   // .replace(/{{postNo}}/g, sanitizeInput(postDataSubfolderName))
//   // .replace(/{{dateString}}/g, sanitizeInput(dateString))
//   // .replace(/{{Verfolgungsart}}/g, sanitizeInput(Verfolgungsart))

  return htmlContent
}

// If using ES modules, uncomment the following line:
export { generateHtmlReport }
