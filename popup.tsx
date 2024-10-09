import { CaptureAPI } from "capture-api"
import React, { useEffect, useState } from "react"
import { addTimestampToScreenshots, addToZip, getFilename } from "utility"

import "./popup.css"


function Popup() {
  
  const [openSection, setOpenSection] = useState<string | null>(
    "evaluateSection"
  )
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
    perplexityApiKey: "",
  });
  const [isTwitterHeaderDisabled, setIsTwitterHeaderDisabled] = useState(true) // Default is on (header visible)

  // const [darkMode, setDarkMode] = useState(false); // Track dark mode state
  // useEffect(() => {
  //     setupMessageListener();
  //     // Ensure "Seite Auswerten" is open by default
  //     document.getElementById("evaluateSection").open = true;
  // }, []);

  function updateProgressBar(progress) {
    setProgress(progress)
  }
  const toggleHelpSection = () => {
    setShowSettingsSection(false)
    setShowHelpSection(!showHelpSection)
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
    const { name, value } = event.target;
    setApiKeys({
      ...apiKeys,
      [name]: value,
    });
  };

  //API KEY SAVING LOGIC CHANGE
  const saveAPIKey = (param) => {
    let apiKey
    param == "openai" ? apiKey = apiKeys.openaiApiKey: apiKey = apiKeys.perplexityApiKey
    
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

  const saveAddress = (type) => {
    const address = document.getElementById(`${type}Address`).value
    chrome.storage.local.set({ [`${type}Address`]: address }, function () {
      alert(
        `${type === "sender" ? "Absender" : "Empfänger"} erfolgreich gespeichert!`
      )
    })
  }

  const saveBackgroundInfo = () => {
    const backgroundInfo = document.getElementById("backgroundInfo").value
    chrome.storage.local.set({ backgroundInfo: backgroundInfo }, function () {
      alert("Hintergrundinformationen erfolgreich gespeichert!")
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
    captureAndStoreScreenshot: function (analysisId, url, filename, directory) {
      console.log("analysisID>>>>", analysisId, "url>>>>>>", url, "filename>>", filename, "directory>>>", directory)
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

            try {
              // Capture screenshot of the current page
              const blobURLs = await new Promise((resolve, reject) => {
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
              break
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
                Disable Twitter Header
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
                <div>
                  <label htmlFor="senderAddress">
                    Absender:
                    <span
                      className="help-icon"
                      title="Geben Sie hier die Adresse des Absenders ein. Diese Daten werden nur lokal in Ihrem Browser gespeichert und ausschließlich lokal verarbeitet.">
                      ⓘ
                    </span>
                  </label>
                  <textarea id="senderAddress" name="senderAddress"></textarea>
                  <button onClick={() => saveAddress("sender")}>
                    Speichern
                  </button>

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
                    name="recipientAddress"></textarea>
                  <button onClick={() => saveAddress("recipient")}>
                    Speichern
                  </button>
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
                    name="backgroundInfo"></textarea>
                  <button onClick={saveBackgroundInfo}>Speichern</button>
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
