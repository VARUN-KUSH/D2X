import { CaptureAPI } from "capture-api"
import React, { useEffect, useState } from "react"
import {
  addTimestampToScreenshots,
  addToZip,
  capturereportablessandchangetoURLs,
  getFilename
} from "utility"

import "./popup.css"

function Popup() {
  const [base64data, setBase64Data] = useState(null);
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

  const handleBackgroundInfo = (e) => {
    setbackgroundInfo(e.target.value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Save the formData locally using chrome.storage.local
    chrome.storage.local.set({ formData }, () => {
      console.log("Data saved locally", formData)
    })
  }

  function updateProgressBar(progress) {
    setProgress(progress)
  }
  const toggleHelpSection = () => {
    setShowSettingsSection(false)
    setShowHelpSection(!showHelpSection)
  }

  const toggledownloadSection = () => {
    if (!base64data) return;

    // Decode base64 data and create a Blob
    const byteCharacters = atob(base64data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const zipBlob = new Blob([byteArray], { type: "application/zip" });

    // Create a URL for the Blob and download it
    const url = URL.createObjectURL(zipBlob);
    const downloadName = "D2X_Report.zip";

    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.click();

    // Clean up the URL after download
    URL.revokeObjectURL(url);
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
    chrome.storage.local.set({ usePerplexity: isChecked })
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

  //API KEY SAVING LOGIC CHANGE
  const saveAPIKey = (param) => {
    let apiKey
    param == "openai"
      ? (apiKey = apiKeys.openaiApiKey)
      : (apiKey = apiKeys.perplexityApiKey)

    chrome.runtime.sendMessage(
      { action: "setAPIKey", apiKey: apiKey, keyType: param },
      function (response) {
        if (response && response.status === "API Key set successfully") {
          alert(
            `${param.charAt(0).toUpperCase() + param.slice(1)} API-Schlüssel erfolgreich gespeichert!`
          )
        } else {
          alert(
            `Fehler beim Speichern des ${param} API-Schlüssels: ` +
              (response ? response.message : "Unbekannter Fehler")
          )
        }
      }
    )
  }

  // const saveAddress = (type) => {
  //   const address = document.getElementById(`${type}Address`)
  //   chrome.storage.local.set({ [`${type}Address`]: address }, function () {
  //     alert(
  //       `${type === "sender" ? "Absender" : "Empfänger"} erfolgreich gespeichert!`
  //     )
  //   })
  // }

  const saveBackgroundInfo = () => {
    // Trim and validate the backgroundInfo string
    const trimmedBackgroundInfo = backgroundInfo.trim()

    // Check if the trimmed backgroundInfo is empty
    if (trimmedBackgroundInfo === "") {
      console.log("Empty input detected. Skipping save.")
      return
    }
    // Remove the assistant ID from chrome.storage.local
    chrome.storage.local.remove("Assistantid", function () {
      console.log("Assistant ID removed from local storage.")
    })
    chrome.storage.local.set({ backgroundInfo: backgroundInfo }, function () {
      alert("Hintergrundinformationen erfolgreich gespeichert!")
      setbackgroundInfopresent(true)
    })
  }

  useEffect(() => {
    chrome.storage.local.get(["backgroundInfo"], function (result) {
      setbackgroundInfo(result.backgroundInfo)
    })
  }, [])

  const deleteBackgroundInfo = () => {
    // Remove the assistant ID from chrome.storage.local
    chrome.storage.local.remove("Assistantid", function () {
      console.log("Assistant ID removed from local storage.")
    })

    chrome.storage.local.remove("backgroundInfo", () => {
      console.log("Background info removed.")
      setbackgroundInfo("")
      setbackgroundInfopresent(false)
    })
  }

  const triggerFullAnalysis = () => {
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
                blobURLs = await new Promise((resolve, reject) => {
                  capturereportablessandchangetoURLs(
                    currentTab,
                    filename || getFilename(url, analysisId),
                    resolve,
                    reject,
                    (progress) => updateProgressBar(progress * 100),
                    directory,
                    analysisId
                  )
                })
                resolve(blobURLs)
              } else {
                blobURLs = await new Promise((resolve, reject) => {
                  CaptureAPI.captureToFiles(
                    currentTab,
                    filename || getFilename(url, analysisId),
                    resolve,
                    reject,
                    (progress) => updateProgressBar(progress * 100)
                  )
                })

                console.log("Blobsul>>>>>>>>>>>>>>", blobURLs)
                const timeResponse = await chrome.runtime.sendMessage({
                  action: "getCurrentTime"
                })
                const processedScreenshots = await addTimestampToScreenshots(
                  blobURLs,
                  timeResponse.time,
                  url,
                  analysisId
                )

                console.log(
                  "processedScreenshots>>>>>>>>>>>>>>>>>",
                  processedScreenshots
                )
                // Add processed screenshots to ZIP
                for (let i = 0; i < processedScreenshots.length; i++) {
                  const response = await fetch(processedScreenshots[i])
                  const blob = await response.blob()
                  const fileName = filename || `screenshot_${i + 1}.png`
                  addToZip(blob, fileName, directory)
                }

                resolve()
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

            case "captureScreenshot":
              await screenshot.captureAndStoreScreenshot(
                request.analysisId,
                request.url,
                request.filename,
                request.directory
              )
              sendResponse({ success: true })
              return true
            // break
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
              const base64data = request.base64data;
              console.log("base64data>>>>>>>>>>>", base64data)
              setBase64Data(base64data);
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
        <div className="header-icons">
        {base64data && (
          <span
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
            id="mainHelpIcon"
            className="main-icon"
            title="Über D2X"
            onClick={toggleHelpSection}>
            ⓘ
          </span>
          <span
            id="settingsToggle"
            className="main-icon"
            title="Einstellungen"
            onClick={toggleSettingsSection}>
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
              <details id="apiKeysSection">
                <summary onClick={() => toggleSubSection("apiKeysSection")}>
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
                    />
                    <button onClick={() => saveAPIKey("openai")}>
                      API-Schlüssel speichern
                    </button>

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
                    />
                    <button onClick={() => saveAPIKey("perplexity")}>
                      API-Schlüssel speichern
                    </button>
                  </div>
                )}
              </details>

              <details id="addressSection">
                <summary onClick={() => toggleSubSection("addressSection")}>
                  Adressdaten
                </summary>
                <form onSubmit={handleSubmit}>
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
                    />

                    <button type="submit">Speichern</button>
                  </div>
                </form>
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
                    onChange={handleBackgroundInfo}></textarea>
                  {backgroundInfopresent ? (
                    <button
                      onClick={deleteBackgroundInfo}
                      style={{
                        backgroundColor: "red",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        cursor: "pointer"
                      }}>
                      Löschen
                    </button>
                  ) : (
                    <button
                      onClick={saveBackgroundInfo}
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
              <button
                id="fullPageScreenshot"
                title="Erstellt einen Screenshot der gesamten Webseite, einschließlich der Bereiche, die aktuell nicht sichtbar sind.">
                Ganze Seite
              </button>
              <button
                id="visibleAreaScreenshot"
                title="Erstellt einen Screenshot des aktuell sichtbaren Bereichs der Webseite.">
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
              <input type="text" id="profileUrl" name="profileUrl" />
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
                name="knownProfileInfo"></textarea>
              <button
                id="searchProfile"
                title="Startet eine Recherche des angegebenen Profils mithilfe von Perplexity.ai.">
                Profil recherchieren
              </button>
            </div>
          </details>
        </section>

        {showProgressBar && (
          <section id="progressSection">
            <div id="progressBar">
              <div id="progressBarFill" style={{ width: `${progress}%` }}></div>
            </div>
            <div id="progressText">
              Wird bearbeitet... {Math.round(progress)}%
            </div>
          </section>
        )}

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

export default Popup
