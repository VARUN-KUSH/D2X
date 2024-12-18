import React from "react"

import "../main.css"

//logs metric

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
            </head>
            <body>
            
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
            const saveFileHandle = await parentDirectoryHandle.getFileHandle(
              `Anzeige_${userHandle}_${postNo}_${offenceType}_${dateString}.html`,
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
              const saveFileHandle = await window.showSaveFilePicker({
                suggestedName: `Anzeige_${userHandle}_${postNo}_${offenceType}_${dateString}.html`,
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

        <h3>Voraussetzungen</h3>
        <ul>
          <li>
            <strong>ZIP-Datei entpackt:</strong>
            <ul>
              <li>
                Sie haben die ZIP-Datei mit den erforderlichen Ordnerstrukturen
                bereits entpackt.
              </li>
            </ul>
          </li>
          <li>
            <strong>Tool geöffnet:</strong>
            <ul>
              <li>
                Sie haben die Datei <strong>Anzeige_neu_generieren.html</strong>{" "}
                im entpackten Ordner in Ihrem Webbrowser geöffnet.
              </li>
            </ul>
          </li>
        </ul>

        <h3>1. Auswahl des Hauptverzeichnisses</h3>
        <ol>
          <li>
            <strong>Klicken Sie auf „Wähle das Hauptverzeichnis“. </strong>
          </li>
          <li>
            <strong>Wählen Sie den Ordner aus</strong>, in dem sich die
            entpackten Dateien und <strong>Anzeige_neu_generieren.html</strong>{" "}
            befinden.
          </li>
          <li>
            <strong>Bestätigen Sie die Auswahl.</strong> Eine Statusmeldung
            zeigt an, dass das Verzeichnis erfolgreich geladen wurde.
          </li>
        </ol>

        <h3>2. Auswahl der Anzeigen</h3>
        <ol>
          <li>
            <strong>
              Nach der Verzeichniswahl erscheint eine Liste von Nutzernamen und
              deren Posts, für die Sie Anzeigen erzeugen können.
            </strong>
          </li>
          <li>
            <strong>Standardmäßig sind alle ausgewählt.</strong> Möchten Sie nur
            bestimmte Anzeigen generieren:
            <ul>
              <li>
                <strong>
                  Halten Sie die Strg-Taste (Windows) oder Cmd-Taste (Mac)
                  gedrückt.
                </strong>
              </li>
              <li>
                <strong>Klicken Sie auf die gewünschten Anzeigen</strong>, um
                die Auswahl zu ändern.
              </li>
            </ul>
          </li>
        </ol>

        <h3>3. Generierung der Anzeigen</h3>
        <ol>
          <li>
            <strong>Klicken Sie auf „Generiere Anzeige“. </strong>
          </li>
          <li>
            <strong>Warten Sie, bis der Prozess abgeschlossen ist.</strong> Eine
            Statusmeldung informiert Sie über den Fortschritt und den Abschluss
            der Generierung.
          </li>
          <li>
            <strong>Wichtiger Hinweis:</strong> Bereits vorhandene Anzeigen mit
            demselben Namen werden automatisch vom Tool{" "}
            <strong>überschrieben</strong> und aktualisiert.
          </li>
        </ol>

        <h3>4. Abschluss und Speicherort</h3>
        <ol>
          <li>
            <strong>Nach erfolgreicher Generierung</strong> erhalten Sie eine
            Bestätigung im Statusbereich, dass die Anzeigen erfolgreich erstellt
            und im Hauptverzeichnis gespeichert wurden.
          </li>
        </ol>

        <h3>5. Zugriff auf die generierten Anzeigen</h3>
        <ol>
          <li>
            <strong>Öffnen Sie den Hauptordner auf Ihrem Computer</strong>, den
            Sie in Schritt 1 ausgewählt haben.
          </li>
          <li>
            <strong>Öffnen Sie die gewünschten Anzeigen</strong> in Ihrem
            Webbrowser, um sie anzusehen oder auszudrucken.
          </li>
        </ol>

        <hr />

        <h2>Zusätzliche Hinweise</h2>
        <ul>
          <li>
            <strong>Browserkompatibilität:</strong> Verwenden Sie einen modernen
            Browser wie <strong>Google Chrome</strong> oder{" "}
            <strong>Microsoft Edge</strong>, da das Tool die File System Access
            API nutzt.
          </li>
          <li>
            <strong>Dateistruktur:</strong> Stellen Sie sicher, dass alle
            erforderlichen Dateien und Unterordner im Hauptverzeichnis vorhanden
            sind, damit das Tool korrekt funktioniert.
          </li>
          <li>
            <strong>Probleme beheben:</strong>
            <ul>
              <li>
                <strong>Fehlermeldungen:</strong> Überprüfen Sie die
                Dateistruktur und stellen Sie sicher, dass Sie die richtigen
                Ordner ausgewählt haben.
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
