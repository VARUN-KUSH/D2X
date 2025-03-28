import React from "react"

import "../anzeigen_neu_gen.css"

//logs metric

// Helper function to sanitize filename parts
function sanitizeForFilename(str) {
  return str
    // Replace invalid filename characters with underscores
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    // Replace umlauts and special characters
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    // Remove any other non-ASCII characters
    .replace(/[^\x00-\x7F]/g, '_')
    // Replace multiple underscores with single one
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .trim()
    .replace(/^_+|_+$/g, '');
}

// Function to truncate parts of the filename while preserving essential information
function truncateFilename(parts, maxLength = 180) {
  // Basic structure: Anzeige_username_postid_verfolgungsart_verdacht_date.html
  const essentialParts = {
    prefix: parts.prefix,  // "Anzeige"
    username: parts.username,
    postId: parts.postId,
    verfolgungsart: parts.verfolgungsart,
    date: parts.date,
    extension: '.html'
  };

  // Calculate length of essential parts with separators
  const essentialLength = Object.values(essentialParts).join('_').length;

  // Calculate remaining space for verdacht part
  const maxVerdachtLength = maxLength - essentialLength - 1; // -1 for separator

  if (parts.verdacht && parts.verdacht.length > maxVerdachtLength) {
    // If verdacht is too long, truncate it while preserving start and end
    const halfLength = Math.floor(maxVerdachtLength / 2) - 2; // -2 for ".."
    if (halfLength > 3) { // Only truncate if we can keep at least 3 chars on each side
      parts.verdacht = parts.verdacht.substring(0, halfLength) +
        '..' +
        parts.verdacht.substring(parts.verdacht.length - halfLength);
    } else {
      // If too short, just truncate to maxLength
      parts.verdacht = parts.verdacht.substring(0, maxVerdachtLength);
    }
  }

  // Combine all parts
  return [
    essentialParts.prefix,
    essentialParts.username,
    essentialParts.postId,
    essentialParts.verfolgungsart,
    parts.verdacht,
    essentialParts.date
  ].filter(Boolean).join('_') + essentialParts.extension;
}

// Main function to modify the createHtmlDocument to include VerdachtAuf.txt content
async function getModifiedHtmlFilename(postDirectoryHandle, userHandle, postNo, offenceType, dateString) {
  try {
    // Try to read VerdachtAuf.txt
    let verdachtContent = '';
    try {
      const verdachtFileHandle = await postDirectoryHandle.getFileHandle('VerdachtAuf.txt');
      const verdachtFile = await verdachtFileHandle.getFile();
      verdachtContent = (await verdachtFile.text()).trim();
    } catch (error) {
      console.warn('VerdachtAuf.txt nicht gefunden oder nicht lesbar');
      // Continue without verdacht content
    }

    // Sanitize the verdacht content if it exists
    const sanitizedVerdacht = verdachtContent ? sanitizeForFilename(verdachtContent) : '';

    // Prepare filename parts
    const filenameParts = {
      prefix: 'Anzeige',
      username: userHandle,
      postId: postNo,
      verfolgungsart: offenceType,
      verdacht: sanitizedVerdacht,
      date: dateString
    };

    // Generate and return the truncated filename
    return truncateFilename(filenameParts);
  } catch (error) {
    console.error('Error generating filename:', error);
    // Fallback to original filename format if there's an error
    return `Anzeige_${userHandle}_${postNo}_${offenceType}_${dateString}.html`;
  }
}

const Anzeigen_neu_generieren = () => {
  function createHtmlDocument(
    userHandle,
    postNo,
    dateString,
    offenceType,
    sectionLineCounts = {}
  ) {
    // Default heights for each iframe class
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

    // Calculate heights based on line counts
    const heights = {}

    for (const className in defaultHeights) {
      if (sectionLineCounts.hasOwnProperty(className)) {
        const lineCount = sectionLineCounts[className]
        heights[className] = 30 + lineCount * 15
      } else {
        heights[className] = defaultHeights[className]
      }
    }

    // Generate CSS styles for iframes
    let iframeStyles = ""

    for (const className in heights) {
      iframeStyles += `
                    .${className} {
                        height: ${heights[className]}px;
                    }
          `
    }

    const template = `
          <!DOCTYPE html>
          <html lang="de">
          <head>
              <meta charset="UTF-8">
              <title>Anzeige_{{userHandle}}_{{postNo}}_{{offenceType}}_{{dateString}}</title>
              <style>
                  @page {
                      size: A4;
                      margin-top: 4.5cm;
                      margin-bottom: 3cm;
                      margin-left: 2.5cm;
                      margin-right: 2cm;
                  }

                  html, body {
                      width: 100%;
                      margin: 0;
                      padding: 0;
                      font-family: monospace;
                      line-height: 1;
                  }

                  .container {
                      max-width: 21cm;
                      margin: 0 auto;
                      padding: 0;
                      position: relative;
                      width: 100%;
                  }
                  
                  /* Disclaimer styles */
                  .disclaimer-page {
                      padding: 2cm;
                      font-size: 14px;
                      line-height: 1.4;
                      border-bottom: 1px dashed #ccc;
                      margin-bottom: 2cm;
                      page-break-after: always;
                  }
                  
                  .disclaimer-content {
                      max-width: 16cm;
                      margin: 0 auto;
                      background-color: #f8f8f8;
                      padding: 1.5cm;
                      border: 1px solid #ddd;
                      border-radius: 5px;
                  }
                  
                  /* Print controls */
                  .print-controls {
                      background-color: #eee;
                      padding: 10px;
                      text-align: center;
                      margin-bottom: 20px;
                      position: fixed;
                      top: 0;
                      left: 0;
                      right: 0;
                      z-index: 1000;
                      border-bottom: 1px solid #ccc;
                  }
                  
                  .print-controls button {
                      padding: 8px 15px;
                      margin: 0 5px;
                      cursor: pointer;
                      background-color: #3B82F6;
                      color: white;
                      border: none;
                      border-radius: 4px;
                  }
                  
                  .print-controls button:hover {
                      background-color: #60A5FA;
                  }
                  
                  @media print {
                      .print-controls {
                          display: none;
                      }
                      
                      .disclaimer-page.no-print {
                          display: none;
                      }
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

                  /* DIN 5008 layout classes */
                  .address-container {
                      display: grid;
                      grid-template-columns: 60% 40%;
                      gap: 0.5rem;
                      margin-bottom: 1rem;
                  }
                  
                  .left-column {
                      padding-top: 1.77cm;
                      display: flex;
                      flex-direction: column;
                      justify-content: space-between;
                  }
                  
                  .recipient-address {
                      margin-bottom: auto;
                  }
                  
                  .right-column {
                      display: flex;
                      flex-direction: column;
                      gap: 0;
                  }
                  
                  .bottom-row {
                      display: grid;
                      grid-template-columns: 60% 40%;
                      gap: 0.5rem;
                      width: 100%;
                      margin-top: 1rem;
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
              
              <script>
                  // Script to handle printing with or without disclaimer
                  function printWithDisclaimer() {
                      document.querySelector('.disclaimer-page').classList.remove('no-print');
                      window.print();
                  }
                  
                  function printWithoutDisclaimer() {
                      document.querySelector('.disclaimer-page').classList.add('no-print');
                      window.print();
                  }
                  
                  // Initialize default print setting
                  window.onload = function() {
                      // By default, don't print disclaimer
                      document.querySelector('.disclaimer-page').classList.add('no-print');
                  }
              </script>
          </head>
          <body>
              <!-- Print Controls -->
              <div class="print-controls">
                  <button onclick="printWithoutDisclaimer()" style="background-color: #3B82F6; color: white; font-weight: bold; padding: 8px 15px; margin: 0 5px; cursor: pointer; border: none; border-radius: 4px;">Drucken ohne Hinweis</button>
                  <button onclick="printWithDisclaimer()" style="background-color: #e0e0e0; color: #666; padding: 8px 15px; margin: 0 5px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px;">Drucken mit Hinweis</button>
                  <span style="margin-left: 15px; font-size: 0.9em;">Der Hinweis wird standardmäßig nicht gedruckt</span>
              </div>
          
              <!-- Disclaimer Page -->
              <div class="disclaimer-page">
                  <div class="disclaimer-content">
                      <h2>Rechtlicher Hinweis</h2>
                      <p>Dieser Anzeigenentwurf wurde automatisch durch künstliche Intelligenz erstellt. Er dient ausschließlich als Hilfestellung zur Vorbereitung einer Strafanzeige und ersetzt keine anwaltliche Beratung gemäß dem Rechtsdienstleistungsgesetz.</p>
                      <p>Bitte prüfe den Entwurf sorgfältig und eigenverantwortlich auf Richtigkeit, Vollständigkeit und rechtliche Relevanz, bevor du ihn bei Behörden einreichst. Der Anbieter übernimmt keinerlei Haftung für Fehler, Unvollständigkeiten oder rechtliche Konsequenzen, die aus der Verwendung dieses KI-generierten Entwurfs entstehen könnten.</p>
                  </div>
              </div>
          
              <!-- DIN 5008 Address Layout -->
              <div class="address-container">
                  <div class="left-column">
                      <div class="recipient-address">
                          <iframe src="Anschreiben_Basis_Daten/Empf.Adresse.txt" class="iframe-Empf_Adresse"></iframe>
                      </div>
                  </div>
                  
                  <div class="right-column">
                      <iframe src="Anschreiben_Basis_Daten/Abs.Adresse.txt" class="iframe-Abs_Adresse"></iframe>
                      <iframe src="Anschreiben_Basis_Daten/Abs.Kontakt.txt" class="iframe-Abs_Kontakt"></iframe>
                      <iframe src="{{userHandle}}/{{postNo}}/unser_Zeichen.txt" class="iframe-unser_Zeichen"></iframe>
                  </div>
              </div>
              
              <div class="bottom-row">
                  <iframe src="Anschreiben_Basis_Daten/Betreff.txt" class="iframe-Betreff"></iframe>
                  <iframe src="Anschreiben_Basis_Daten/Datumszeile.txt" class="iframe-Datumszeile"></iframe>
              </div>
          
              <!-- AnzeigenEntwurf -->
              <div class="content-block left-align">
                  <iframe src="{{userHandle}}/{{postNo}}/AnzeigenEntwurf_{{userHandle}}_{{postNo}}_{{dateString}}.txt" class="iframe-AnzeigenEntwurf"></iframe>
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
                      <iframe src="{{userHandle}}/{{postNo}}/Post_{{userHandle}}_{{postNo}}_{{dateString}}.txt" class="iframe-Post"></iframe>
                  </blockquote>
              </div>
          
              <!-- Eckdaten -->
              <div class="content-block left-align">
                  <p><strong>Eckdaten:</strong>
                      <iframe src="{{userHandle}}/{{postNo}}/Zeitpunkt.txt" class="iframe-Zeitpunkt" style="display: inline-block; vertical-align: middle;"></iframe>
                      <iframe src="{{userHandle}}/userHandle.txt" class="iframe-userHandle" style="display: inline-block; vertical-align: middle;"></iframe>
                      <iframe src="{{userHandle}}/screenname.txt" class="iframe-screenname" style="display: inline-block; vertical-align: middle;"></iframe>
                      <iframe src="{{userHandle}}/profilUrl.txt" class="iframe-profilUrl" style="display: inline-block; vertical-align: middle;"></iframe>
                      <iframe src="{{userHandle}}/{{postNo}}/postUrl.txt" class="iframe-postUrl" style="display: inline-block; vertical-align: middle;"></iframe>
                      <iframe src="initialPostUrl.txt" class="iframe-initialPostUrl" style="display: inline-block; vertical-align: middle;"></iframe>
                  </p>
              </div>
          
              <div class="page-break"></div>
          
              <!-- UserInfo Section -->
              <h2>Informationen aus dem Profil Tatverdächtige*r:</h2>
              <div class="content-block left-align">
                  <iframe src="{{userHandle}}/UserInfo_{{userHandle}}_{{dateString}}.txt" class="iframe-UserInfo"></iframe>
                  <iframe src="{{userHandle}}/ExtraUserInfo_{{userHandle}}_{{dateString}}.txt" class="iframe-ExtraUserInfo"></iframe>
              </div>
          
              <div class="page-break"></div>
          
              <!-- Screenshot of User Profile -->
              <div class="section">
                  <h2>Screenshot Nutzerprofil auf X/Twitter</h2>
                  <figure class="screenshot-section">
                      <img src="{{userHandle}}/screenshot_profile_{{userHandle}}_{{dateString}}.png" alt="Screenshot Profil" class="screenshot">
                  </figure>
              </div>
          
              <div class="page-break"></div>
          
              <!-- Screenshot of Comment and Context -->
              <div class="section">
                  <h2>Screenshot des Kommentars und Kontext:</h2>
                  <figure class="screenshot-section">
                      <img src="{{userHandle}}/{{postNo}}/screenshot_{{userHandle}}_{{postNo}}_{{dateString}}.png" alt="Screenshot Kommentar" class="screenshot">
                  </figure>
              </div>
          
          </body>
          </html>`

    return template
      .replace("{{iframeStyles}}", iframeStyles)
      .replace(/{{userHandle}}/g, userHandle)
      .replace(/{{postNo}}/g, postNo)
      .replace(/{{dateString}}/g, dateString)
      .replace(/{{offenceType}}/g, offenceType)
  }

  let parentDirectoryHandle = null
  let postOptions = {} // Object to store {userHandle}/{postNo} and their directory handles

  async function handleDirectorySelection() {
    const statusDiv = document.getElementById("status")
    statusDiv.innerText = ""

    try {
      if ("showDirectoryPicker" in window) {
        // Prompt user to select the parent directory
        parentDirectoryHandle = await window.showDirectoryPicker()
        statusDiv.innerText = "Verzeichnis Picker geladen."
        // Scan the directory to find userHandles and posts
        postOptions = {}
        for await (const [name, handle] of parentDirectoryHandle.entries()) {
          if (
            handle.kind === "directory" &&
            name !== "Anschreiben_Basis_Daten"
          ) {
            // This is a userHandle directory
            const userHandle = name
            const userDirectoryHandle = handle

            // Now, scan for postNo directories
            for await (const [
              postName,
              postHandle
            ] of userDirectoryHandle.entries()) {
              if (postHandle.kind === "directory") {
                const postNo = postName
                const optionKey = `${userHandle}/${postNo}`
                postOptions[optionKey] = {
                  userHandle: userHandle,
                  postNo: postNo,
                  userDirectoryHandle: userDirectoryHandle,
                  postDirectoryHandle: postHandle
                }
              }
            }
          }
        }

        if (Object.keys(postOptions).length === 0) {
          statusDiv.innerText = "Keine Posts gefunden."
          return
        }

        // Populate the postSelect dropdown
        const postSelect = document.getElementById("postSelect")
        postSelect.innerHTML = ""
        for (const optionKey in postOptions) {
          const option = document.createElement("option")
          option.value = optionKey
          option.text = optionKey
          option.selected = true // Alle Optionen standardmäßig ausgewählt
          postSelect.appendChild(option)
        }

        // Show the selectionDiv
        document.getElementById("selectionDiv").style.display = "block"

        statusDiv.innerText =
          "Hauptverzeichnis ausgewählt. Alle Posts sind standardmäßig ausgewählt."
      } else {
        statusDiv.innerText =
          "Der Browser unterstützt das benötigte File System Access API nicht."
      }
    } catch (error) {
      console.error(error)
      statusDiv.innerText =
        "Es gab einen Fehler beim Zugriff auf das Verzeichnis."
    }
  }

  async function generateAnzeige() {
    const statusDiv = document.getElementById("status")
    statusDiv.innerText = "Generierung gestartet..."

    try {
      const postSelect = document.getElementById("postSelect")
      const selectedOptions = Array.from(postSelect.selectedOptions).map(
        (option) => option.value
      )

      if (selectedOptions.length === 0) {
        statusDiv.innerText = "Bitte wählen Sie mindestens einen Post aus."
        return
      }

      let successCount = 0
      let failureCount = 0
      let failureDetails = ""

      for (const selectedOption of selectedOptions) {
        const { userHandle, postNo, userDirectoryHandle, postDirectoryHandle } =
          postOptions[selectedOption]

        try {
          // Access Anschreiben_Basis_Daten directory
          const baseDirHandle = await parentDirectoryHandle.getDirectoryHandle(
            "Anschreiben_Basis_Daten"
          )

          // Read offenceType from Verfolgungsart.txt in post directory
          const verfolgungsartFileHandle =
            await postDirectoryHandle.getFileHandle("Verfolgungsart.txt")
          const verfolgungsartFileData =
            await verfolgungsartFileHandle.getFile()
          const offenceType = (await verfolgungsartFileData.text()).trim()

          // Read dateString from AnzeigenEntwurf filename
          let dateString = "31.07.2024" // Default date
          for await (const [name, handle] of postDirectoryHandle.entries()) {
            if (
              handle.kind === "file" &&
              name.startsWith(`AnzeigenEntwurf_${userHandle}_${postNo}_`)
            ) {
              const dateMatch = name.match(/_(\d{2}\.\d{2}\.\d{4})\.txt$/)
              if (dateMatch) {
                dateString = dateMatch[1]
              }
              break
            }
          }

          // Prepare sectionLineCounts
          const sectionLineCounts = {}

          // Angepasste Funktion zum Lesen einer Datei und Zählen der Zeilen unter Berücksichtigung von Zeilenumbrüchen
          async function readFileAndCountLines(dirHandle, fileName) {
            const fileHandle = await dirHandle.getFileHandle(fileName)
            const fileData = await fileHandle.getFile()
            const content = await fileData.text()
            const lines = content.trim().split("\n")
            let totalLines = 0
            for (const line of lines) {
              // Berechne die Anzahl der Zeilen, die durch Zeilenumbrüche bei 75 Zeichen entstehen
              totalLines += Math.ceil(line.length / 75) || 1
            }
            return totalLines
          }

          // List of files and their corresponding iframe class names
          const filesToRead = [
            {
              dir: baseDirHandle,
              file: "Abs.Adresse.txt",
              className: "iframe-Abs_Adresse"
            },
            {
              dir: baseDirHandle,
              file: "Abs.Kontakt.txt",
              className: "iframe-Abs_Kontakt"
            },
            {
              dir: baseDirHandle,
              file: "Empf.Adresse.txt",
              className: "iframe-Empf_Adresse"
            },
            {
              dir: baseDirHandle,
              file: "Betreff.txt",
              className: "iframe-Betreff"
            },
            {
              dir: baseDirHandle,
              file: "Datumszeile.txt",
              className: "iframe-Datumszeile"
            },
            {
              dir: baseDirHandle,
              file: "Abs.UnterzeichnendePerson.txt",
              className: "iframe-Abs_UnterzeichnendePerson"
            },
            {
              dir: baseDirHandle,
              file: "Anlagen.txt",
              className: "iframe-Anlagen"
            },
            {
              dir: postDirectoryHandle,
              file: `AnzeigenEntwurf_${userHandle}_${postNo}_${dateString}.txt`,
              className: "iframe-AnzeigenEntwurf"
            },
            {
              dir: postDirectoryHandle,
              file: `Post_${userHandle}_${postNo}_${dateString}.txt`,
              className: "iframe-Post"
            },
            {
              dir: userDirectoryHandle,
              file: `UserInfo_${userHandle}_${dateString}.txt`,
              className: "iframe-UserInfo"
            },
            {
              dir: userDirectoryHandle,
              file: `ExtraUserInfo_${userHandle}_${dateString}.txt`,
              className: "iframe-ExtraUserInfo"
            }
            // Add more files as needed
          ]

          for (const fileInfo of filesToRead) {
            try {
              const lineCount = await readFileAndCountLines(
                fileInfo.dir,
                fileInfo.file
              )
              sectionLineCounts[fileInfo.className] = lineCount
            } catch (err) {
              console.warn(
                `Datei ${fileInfo.file} konnte nicht gelesen werden.`
              )
            }
          }

          // Call createHtmlDocument function
          const htmlContent = createHtmlDocument(
            userHandle,
            postNo,
            dateString,
            offenceType,
            sectionLineCounts
          )

          // Save the generated HTML file
          try {
            // Attempt to save in the parent directory
            const fileName = await getModifiedHtmlFilename(postDirectoryHandle, userHandle, postNo, offenceType, dateString);
            const saveFileHandle = await parentDirectoryHandle.getFileHandle(
              fileName,
              { create: true }
            )
            const writableStream = await saveFileHandle.createWritable()
            await writableStream.write(htmlContent)
            await writableStream.close()

            successCount++
          } catch (error) {
            console.warn(
              `Konnte Anzeige für ${selectedOption} nicht im Hauptverzeichnis speichern. Versuche, einen Speicherort auszuwählen.`
            )
            // Fallback to showSaveFilePicker
            try {
              const fileName = await getModifiedHtmlFilename(postDirectoryHandle, userHandle, postNo, offenceType, dateString);
              const saveFileHandle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [
                  {
                    description: "HTML Document",
                    accept: { "text/html": [".html"] }
                  }
                ]
              })
              const writableStream = await saveFileHandle.createWritable()
              await writableStream.write(htmlContent)
              await writableStream.close()

              successCount++
            } catch (saveError) {
              console.error(saveError)
              failureCount++
              failureDetails += ` - ${selectedOption}: ${saveError.message}\n`
            }
          }
        } catch (postError) {
          console.error(postError)
          failureCount++
          failureDetails += ` - ${selectedOption}: ${postError.message}\n`
        }
      }

      // Update status messages
      let finalStatus = `Generierung abgeschlossen. Erfolgreich: ${successCount}, Fehlgeschlagen: ${failureCount}.`
      if (failureCount > 0) {
        finalStatus += `\nFehlerdetails:\n${failureDetails}`
      }
      statusDiv.innerText = finalStatus
    } catch (error) {
      console.error(error)
      statusDiv.innerText = "Es gab einen Fehler beim Generieren der Anzeigen."
    }
  }

  return (
    <body>
      <div className="sidebar">
        <h2>Anleitung zur Nutzung des Anzeigengenerators</h2>

        <h3>Wozu dient das Tool zum Anzeigen-Neu-Generieren?</h3>
        <p>
          Dieses Tool benötigst du, wenn du Texte aus heruntergeladenen Strafanzeigenentwürfen bearbeitet hast. Es aktualisiert die Entwürfe, sodass die Änderungen korrekt angezeigt und gedruckt werden können.
        </p>

        <h3>Voraussetzungen</h3>
        <ul>
          <li>
            <strong>ZIP-Datei entpackt:</strong>
            <ul>
              <li>
                Du hast die ZIP-Datei mit den erforderlichen Ordnerstrukturen
                bereits entpackt.
              </li>
            </ul>
          </li>
        </ul>

        <h3>1. Auswahl des Hauptverzeichnisses</h3>
        <ol>
          <li>
            <strong>Klicke auf „Wähle das Hauptverzeichnis".</strong>
          </li>
          <li>
            <strong>Wähle den Ordner aus</strong>, in dem sich die entpackten Dateien
            und die Anzeigenentwürfe befinden.
          </li>
          <li>
            <strong>Bestätige die Auswahl.</strong> Eine Statusmeldung zeigt an, dass
            das Verzeichnis erfolgreich geladen wurde.
          </li>
        </ol>

        <h3>2. Auswahl der Anzeigen</h3>
        <ol>
          <li>
            <strong>
              Nach der Verzeichniswahl erscheint eine Liste von Nutzernamen und deren
              Posts, für die du Anzeigen erzeugen kannst.
            </strong>
          </li>
          <li>
            <strong>Standardmäßig sind alle ausgewählt.</strong> Möchtest du nur
            bestimmte Anzeigen generieren:
            <ul>
              <li>
                <strong>
                  Halte die Strg-Taste (Windows) oder Cmd-Taste (Mac) gedrückt.
                </strong>
              </li>
              <li>
                <strong>Klicke auf die gewünschten Anzeigen</strong>, um die Auswahl
                zu ändern.
              </li>
            </ul>
          </li>
        </ol>

        <h3>3. Generierung der Anzeigen</h3>
        <ol>
          <li>
            <strong>Klicke auf „Generiere Anzeige".</strong>
          </li>
          <li>
            <strong>Warte, bis der Prozess abgeschlossen ist.</strong> Eine
            Statusmeldung informiert dich über den Fortschritt und den Abschluss der
            Generierung.
          </li>
          <li>
            <strong>Wichtiger Hinweis:</strong> Bereits vorhandene Anzeigen mit
            demselben Namen werden automatisch vom Tool
            <strong> überschrieben</strong> und aktualisiert.
          </li>
        </ol>

        <h3>4. Abschluss und Speicherort</h3>
        <ol>
          <li>
            <strong>Nach erfolgreicher Generierung</strong> erhältst du eine
            Bestätigung im Statusbereich, dass die Anzeigen erfolgreich erstellt und
            im Hauptverzeichnis gespeichert wurden.
          </li>
        </ol>

        <h3>5. Zugriff auf die generierten Anzeigen</h3>
        <ol>
          <li>
            <strong>Öffne den Hauptordner auf deinem Computer</strong>, den du in
            Schritt 1 ausgewählt hast.
          </li>
          <li>
            <strong>Öffne die gewünschten Anzeigen</strong> in deinem Webbrowser, um
            sie anzusehen oder auszudrucken.
          </li>
        </ol>

        <hr />

        <h2>Zusätzliche Hinweise</h2>
        <ul>
          <li>
            <strong>Browserkompatibilität:</strong> Verwende einen modernen Browser
            wie <strong>Google Chrome</strong> oder <strong>Microsoft Edge</strong>,
            da das Tool die File System Access API nutzt.
          </li>
          <li>
            <strong>Dateistruktur:</strong> Stelle sicher, dass alle erforderlichen
            Dateien und Unterordner im Hauptverzeichnis vorhanden sind, damit das
            Tool korrekt funktioniert.
          </li>
          <li>
            <strong>Probleme beheben:</strong>
            <ul>
              <li>
                <strong>Fehlermeldungen:</strong> Überprüfe die Dateistruktur und
                stelle sicher, dass du die richtigen Ordner ausgewählt hast.
              </li>
            </ul>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <header>
          <h1>Anzeigen neu Generieren</h1>
        </header>

        <button id="selectDirButton" onClick={handleDirectorySelection}>
          Wähle das Hauptverzeichnis
        </button>
        <div id="status"></div>
        <div id="selectionDiv" style={{ display: "none" }}>
          <label htmlFor="postSelect">Wähle die Posts:</label>
          <select id="postSelect" multiple></select>
          <br />
          <button id="generateButton" onClick={generateAnzeige}>
            Generiere Anzeige
          </button>
        </div>
      </div>
    </body>
  )
}

export default Anzeigen_neu_generieren