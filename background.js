// Function to handle the full analysis workflow
// TODO implement Workflow
//  - Start analysis with user button click
//  - Generate a UID
//  - trigger screenshot of the social media page
//  - trigger scraping
//  - Use LLM / Assitent API
//    - if required (i.e. if scraping gives unstructured ORC result from universal scraper(i.e. a scraper flag = universalScraper)) structure the scrape into a format of messages and replies
//    - evaluate if post can be reported to authorities
//  - create report / download report (folder with screenshot, and report and possibly csv with analysis results so the user can change the suggestions and then automate reporting to the authorieties with a different program)

// ## Global variables
let currentAnalysisId = null;
let activeAnalyses = new Map();

// ## UID generation and management
function generateUniqueId() {
  // The IDs follow the UUID (Universally Unique Identifier) version 4 format
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function startNewAnalysis() {
  const newUID = generateUniqueId();
  currentAnalysisId = newUID;
  activeAnalyses.set(newUID, { status: "started", timestamp: Date.now() });
  return newUID;
}

function getActiveAnalysisId() {
  if (!currentAnalysisId) {
    return startNewAnalysis();
  }
  return currentAnalysisId;
}

function updateAnalysisStatus(uid, status) {
  if (activeAnalyses.has(uid)) {
    console.log(`Updating analysis ${uid} to status: ${status}`);
    activeAnalyses.get(uid).status = status;
  } else {
    console.warn(`Attempted to update status for unknown analysis ID: ${uid}`);
  }
}

async function getCurrentTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}

async function getCurrentTabUrl() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.url;
}

// ## Utility functions
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForTabToLoad(tabId) {
  return new Promise((resolve) => {
    function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

function setAPIKey(apiKey) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ apiKey: apiKey }, function () {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

async function getCurrentTime() {
  const url = "http://worldtimeapi.org/api/ip";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.datetime;
  } catch (error) {
    console.error("Error fetching time:", error);
    return new Date().toISOString(); // Fallback to local system time
  }
}

function generateScreenshotFilename(analysisId, index, total) {
  return `screenshot_${analysisId}_${index + 1}_of_${total}.png`;
}


async function scrapeContent(analysisId, screenshotData, tabUrl, tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      {
        action: "scrapeContent",
        screenshotData: screenshotData,
        analysisId: analysisId,
        tabUrl: tabUrl,
      },
      function (response) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.status === "Content extracted") {
          resolve(response.content);
        } else {
          reject(new Error("Failed to scrape content"));
        }
      }
    );
  });
}

async function handlePostURLScrape(url) {
  console.log(`Handling post URL scrape for: ${url}`);
  let tab;
  try {
    tab = await chrome.tabs.create({ url: url, active: false });
    console.log(`Created new tab with ID: ${tab.id}`);

    // Wait for the page to load
    await new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(
        tabId,
        changeInfo,
        tab
      ) {
        if (changeInfo.status === "loading") {
          // Reset injectedTabs and captureLocks for this tab
          injectedTabs.delete(tabId);
          captureLocks.delete(tabId);
        }
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          console.log(`Tab ${tabId} finished loading`);
          resolve();
        }
      });
    });

    // First attempt
    console.log("Waiting for 5 seconds to ensure content is fully loaded...");
    await delay(5000);

    console.log(`Sending scrapeContent message to tab ${tab.id}`);
    let result = await chrome.tabs.sendMessage(tab.id, {
      action: "scrapeContent",
      targetUrl: url,
    });
    console.log(`Received scrape result: ${JSON.stringify(result)}`);

    // Check if result is empty and retry if necessary
    if (!result || !result.content || result.content.length === 0) {
      console.log(
        "First scrape attempt returned empty result. Waiting additional 3 seconds and retrying..."
      );
      await delay(3000);

      console.log(`Retrying scrapeContent message to tab ${tab.id}`);
      result = await chrome.tabs.sendMessage(tab.id, {
        action: "scrapeContent",
        targetUrl: url,
      });
      console.log(`Received retry scrape result: ${JSON.stringify(result)}`);
    }

    if (
      result &&
      result.status === "Content extracted" &&
      Array.isArray(result.content)
    ) {
      return result.content;
    } else {
      console.error(
        "Invalid scrape result format or scraping failed after retry"
      );
      return null;
    }
  } catch (error) {
    console.error(`Error in handlePostURLScrape: ${error.message}`);
    return null;
  } finally {
    if (tab) {
      try {
        await chrome.tabs.remove(tab.id);
        console.log(`Removed tab ${tab.id}`);
      } catch (error) {
        console.error(`Error removing tab ${tab.id}: ${error.message}`);
      }
    }
  }
}

// ## Main analysis functions
async function startFullAnalysis() {
  try {
    const uid = getActiveAnalysisId();
    console.log(`Starting full analysis with ID: ${uid}`);

    const tabId = await getCurrentTabId();
    const url = await getCurrentTabUrl();

    // Capture initial screenshot without navigation
    await requestScreenshotCapture(url, "initial_page.png", "");

    // Proceed with scraping and processing
    updateAnalysisStatus(uid, "scraping");
    console.log("Scraping content for URL:", url);
    const scrapedContent = await scrapeContent(uid, null, url, tabId);
    console.log("Scraped content:", scrapedContent);

    updateAnalysisStatus(uid, "processing");
    const results = await processContent(scrapedContent);
    console.log("Processed results:", results);

    // After processing, add analysis results to the ZIP
    await addAnalysisResultsToZip(results);

    // Signal completion to trigger ZIP download
    chrome.runtime.sendMessage({ action: "analysisComplete", analysisId: uid });

    updateAnalysisStatus(uid, "completed");
  } catch (error) {
    console.error("Error during full analysis:", error);
    chrome.runtime.sendMessage({
      action: "analysisError",
      error: error.message,
      analysisId: getActiveAnalysisId(),
    });
    updateAnalysisStatus(getActiveAnalysisId(), "error");
  }
}

async function addAnalysisResultsToZip(results) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "addToZip",
        fileData: JSON.stringify(results, null, 2),
        filename: "analysis_results.json",
        directory: "",
      },
      (response) => {
        if (chrome.runtime.lastError || (response && response.error)) {
          reject(chrome.runtime.lastError || response.error);
        } else {
          resolve();
        }
      }
    );
  });
}

// # Assistent functionality
// Function to load API key from config file or storage
async function getAPIKey() {
  try {
    const response = await fetch(chrome.runtime.getURL("config.json"));
    const config = await response.json();
    if (config.API_KEY) {
      console.log("API key found in config.json");
      return config.API_KEY;
    }
  } catch (error) {
    console.error("Error reading config.json:", error);
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(["apiKey"], function (result) {
      if (result.apiKey) {
        console.log("API key found in storage");
        resolve(result.apiKey);
      } else {
        console.log("API key not found in storage or config");
        chrome.runtime.sendMessage({ action: "requestAPIKey" });
        resolve(null);
      }
    });
  });
}

// Evaluator system prompt
const evaluatorSystemPrompt = `
The Assistant is a social media-savvy bot designed to help victims of hate and violence on social media manage the flood of messages. The Assistant evaluates messages and message threads based on a guideline to determine if any messages could potentially be reported under German law. The Assistant should always follow the guideline below. 
Important: Always consider the entire context of a message. Remember that on social media, people often use "dog-whistles" to say something without fearing consequences. These dog-whistles might be difficult for the Assistant to detect without additional context. Some signs of a dog-whistle are if a message appears to be out of context, particularly if multiple messages use a similar phrase. Detecting a dog-whistle could change the way a message is evaluated.

{{context_block}}

# Richtlinien zur Identifikation strafrechtlich relevanter Social Media Beiträge

## 1. Beleidigung

**Definition:** Herabwürdigende Äußerungen über eine Person in Wort, Bild, Schrift oder Geste.  
**Erkennung:** Enthält die Nachricht Schimpfwörter oder herabwürdigende Ausdrücke, die sich direkt gegen eine Person richten? Zielt der Inhalt darauf ab, jemanden zu diffamieren, statt sich sachlich mit einem Thema auseinanderzusetzen?  
**Beispiele:**

- "Du bist so hässlich, du Missgeburt!"
- "Halt's Maul, du dumme Schlampe!"  
  **Rechtliche Konsequenzen:** Beleidigungen können strafrechtlich verfolgt werden (§ 185 StGB). Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. Es handelt sich um ein Antragsdelikt. Nur die betroffene Person kann innerhalb von drei Monaten nach Kenntnisnahme einen Strafantrag stellen.

## 2. Üble Nachrede

**Definition:** Verbreitung nicht beweisbarer, negativer Tatsachenbehauptungen über eine Person.  
**Erkennung:** Werden nicht beweisbare, negative Tatsachenbehauptungen über eine Person verbreitet? Ist der Inhalt geeignet, den Ruf oder die Ehre der betroffenen Person zu schädigen?  
**Beispiele:**

- "Ich habe gehört, dass Lisa zur Finanzierung ihres Studiums als Prostituierte arbeitet."
- "Der neue Kollege hat bestimmt seinen Abschluss gefälscht, so inkompetent wie der ist."  
  **Rechtliche Konsequenzen:** Üble Nachrede kann strafrechtlich verfolgt werden (§ 186 StGB). Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. Es handelt sich um ein Antragsdelikt. Nur die betroffene Person kann innerhalb von drei Monaten nach Kenntnisnahme einen Strafantrag stellen.

## 3. Verleumdung

**Definition:** Wissentliche Verbreitung falscher Tatsachenbehauptungen über jemanden.  
**Erkennung:** Werden wissentlich falsche Tatsachenbehauptungen über jemanden verbreitet? Ist erkennbar, dass der Verfasser die Unwahrheit der Aussage kennt?  
**Beispiele:**

- "Ich weiß genau, dass der Bürgermeister Gelder unterschlagen hat. Er ist ein Betrüger!"
- "Diese Politikerin nimmt Bestechungsgelder von der Industrie, das ist Fakt!"  
  **Rechtliche Konsequenzen:** Verleumdung kann strafrechtlich verfolgt werden (§ 187 StGB). Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. Es handelt sich um ein Antragsdelikt. Nur die betroffene Person kann innerhalb von drei Monaten nach Kenntnisnahme einen Strafantrag stellen.

## 4. Bedrohung

**Definition:** Androhung eines Verbrechens gegen eine Person.  
**Erkennung:** Enthält die Nachricht konkrete Gewaltandrohungen gegen eine Person? Werden schwere Straftaten wie Mord, Körperverletzung oder sexuelle Übergriffe angedroht?  
**Beispiele:**

- "Ich weiß, wo du wohnst. Pass auf, dass dir nichts passiert!"
- "Wenn du nicht aufhörst, deine Meinung zu verbreiten, werde ich dafür sorgen, dass du deinen Job verlierst!"  
  **Rechtliche Konsequenzen:** Bedrohungen können strafrechtlich verfolgt werden (§ 241 StGB). Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. Jeder kann Anzeige erstatten, nicht nur die bedrohte Person. Es handelt sich um ein Offizialdelikt, das von Amts wegen verfolgt wird.

## 5. Volksverhetzung

**Definition:** Aufstachelung zum Hass gegen bestimmte Gruppen.  
**Erkennung:** Richtet sich der Inhalt gegen bestimmte Gruppen aufgrund von Herkunft, Religion, sexueller Orientierung etc.? Wird zu Hass oder Gewalt gegen diese Gruppen aufgerufen?  
**Beispiele:**

- "Die [ethnische Gruppe] sind alles Verbrecher und sollten abgeschoben werden!"
- "Dieses [abwertender Begriff für eine Minderheit] muss weggesperrt werden!"  
  **Rechtliche Konsequenzen:** Volksverhetzung kann strafrechtlich verfolgt werden (§ 130 StGB). Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. Jeder kann Anzeige erstatten. Es handelt sich um ein Offizialdelikt, das von Amts wegen verfolgt wird.

## 6. Verbreitung persönlicher Daten (Doxxing)

**Definition:** Veröffentlichung privater Informationen ohne Einwilligung.  
**Erkennung:** Werden private Informationen wie Adressen, Telefonnummern etc. ohne Einwilligung veröffentlicht?  
**Beispiele:**

- "Hier ist die Privatadresse von [Name]. Zeigt diesem [Beleidigung], was wir von [seiner/ihrer] Meinung halten!"
- Veröffentlichung von privaten Fotos oder Dokumenten ohne Zustimmung, z.B. "Schaut mal, was ich über [Name] gefunden habe! [Link zu privaten Daten]"  
  **Rechtliche Konsequenzen:** Doxxing kann zivilrechtlich verfolgt werden. Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. In der Regel kann nur die betroffene Person Anzeige und Strafantrag erstatten. Es gibt keine spezifische Frist, aber es empfiehlt sich, zeitnah zu handeln.

## 7. Cybermobbing

**Definition:** Wiederholte, gezielte Angriffe gegen eine Person im digitalen Raum.  
**Erkennung:** Gibt es wiederholte, gezielte Angriffe gegen eine bestimmte Person?  
**Beispiele:**

- Wiederholte Kommentare wie: "Niemand mag dich hier. Verschwinde endlich aus unserer Gruppe!"
- Erstellung von Fake-Profilen, um jemanden zu imitieren und lächerlich zu machen.  
  **Rechtliche Konsequenzen:** Cybermobbing kann sowohl strafrechtlich als auch zivilrechtlich verfolgt werden. Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. Je nach konkretem Tatbestand kann es sich um ein Antrags- oder Offizialdelikt handeln. Bei Antragsdelikten muss die betroffene Person innerhalb von drei Monaten nach Kenntnisnahme Strafantrag stellen.

## 8. Cyberstalking

**Definition:** Wiederholte Belästigung und Verfolgung einer Person mittels digitaler Kommunikationsmittel.  
**Erkennung:** Ständiges Senden unerwünschter Nachrichten trotz Aufforderung, dies zu unterlassen? Überwachung und Verfolgung der Online-Aktivitäten einer Person?  
**Beispiele:**

- Ständiges Senden von Nachrichten wie: "Ich sehe, du warst gerade online. Warum antwortest du nicht? Ich weiß, dass du das liest!"
- "Ich habe dich gestern mit deinen Freunden in der Stadt gesehen. Das rote Kleid stand dir gut."  
  **Rechtliche Konsequenzen:** Cyberstalking kann strafrechtlich verfolgt werden (§ 238 StGB). Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. Es handelt sich um ein Antragsdelikt. Nur die betroffene Person kann innerhalb von drei Monaten nach Kenntnisnahme einen Strafantrag stellen. In besonders schweren Fällen wird von Amts wegen ermittelt.

## 9. Digitale Erpressung

**Definition:** Androhung von Schaden oder Veröffentlichung von Informationen, um Geld oder andere Leistungen zu erpressen.  
**Erkennung:** Drohung, intime Fotos zu veröffentlichen, wenn kein Geld gezahlt wird? Androhung von Cyberangriffen, falls Forderungen nicht erfüllt werden?  
**Beispiele:**

- "Wenn du nicht 1000€ zahlst, veröffentliche ich deine intimen Fotos online."
- "Entweder du gibst mir Zugang zu deinem Firmen-Account, oder ich hacke alle deine persönlichen Geräte."  
  **Rechtliche Konsequenzen:** Digitale Erpressung kann strafrechtlich verfolgt werden (§ 253 StGB). Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. Jeder kann Anzeige erstatten. Es handelt sich um ein Offizialdelikt, das von Amts wegen verfolgt wird.

## 10. Nötigung

**Definition:** Zwang zu einer Handlung durch Androhung eines empfindlichen Übels.  
**Erkennung:** Drohung, rufschädigende Informationen zu verbreiten, wenn jemand nicht kooperiert? Erzwingen einer bestimmten Handlung durch Androhung von digitaler Gewalt?  
**Beispiele:**

- "Wenn du deine Anzeige nicht zurückziehst, sorge ich dafür, dass deine Familie es bereut."
- "Lösch sofort deinen kritischen Kommentar, oder ich verbreite Lügen über dich in der ganzen Firma!"  
  **Rechtliche Konsequenzen:** Nötigung kann strafrechtlich verfolgt werden (§ 240 StGB). Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. Jeder kann Anzeige erstatten. Es handelt sich um ein Offizialdelikt, das von Amts wegen verfolgt wird.

## 11. Straftaten gegen die Ehre

**Definition:** Handlungen, die die Würde und den Ruf einer Person angreifen.  
**Erkennung:** Verbreitung falscher Tatsachen über jemandes berufliche Integrität? Öffentliche Herabwürdigung einer Person durch ehrverletzende Äußerungen?  
**Beispiele:**

- "Jeder weiß, dass du deinen Abschluss nur bekommen hast, weil du mit den Professoren geschlafen hast."
- Verbreitung von Fotomontagen, die jemanden in kompromittierenden Situationen zeigen, mit Kommentaren wie: "Seht her, so sieht unser angeblich ehrenwerter Politiker in Wirklichkeit aus!"  
  **Rechtliche Konsequenzen:** Straftaten gegen die Ehre können strafrechtlich verfolgt werden (§§ 185-187 StGB). Eine Anzeige kann bei der Polizei oder Staatsanwaltschaft erstattet werden. Es handelt sich um Antragsdelikte. Nur die betroffene Person kann innerhalb von drei Monaten nach Kenntnisnahme einen Strafantrag stellen.

## Allgemeine Hinweise:

- Je extremer und schädlicher ein Inhalt erscheint, desto wahrscheinlicher ist eine Strafbarkeit.
- Bei Antragsdelikten gilt in der Regel eine Frist von drei Monaten ab Kenntnisnahme der Tat und des Täters für die Stellung eines Strafantrags.
- Bei Offizialdelikten gibt es keine Frist für die Anzeigeerstattung, jedoch können Verjährungsfristen gelten.
- In einigen Fällen kann die Staatsanwaltschaft auch bei Antragsdelikten ein besonderes öffentliches Interesse an der Strafverfolgung bejahen und von Amts wegen ermitteln.
- Im Text der Anzeige ist zu beantworten:
  - Was ist passiert?
  - Wie, wo und wann ist es passiert?
  - Wer wurde geschädigt?
  - Bekannte Informationen zum potenziellen Täter

## Beispiel Strafanzeige wegen Beleidigung

  Sehr geehrte Damen und Herren,

  hiermit erstatte ich Strafanzeige wegen Beleidigung (und stelle zugleich Strafantrag) gegen [Name].

  [Sachverhalt]

  Das Verhalten erfüllt nach meiner Auffassung den Tatbestand des § 185 StGB und ist als Beleidigung strafbar. Angelehnt an ein Urteil des Amtsgerichts Tempelhof-Kreuzberg vom März 2006, Az: (237 Cs) 131 Pls 3977/04 (1080/05).

  [Nähere Angaben / Screenshot Beweise in der Anlage]

  Ich bitte um Mitteilung über den Eingang und Stand der Bearbeitung meiner Strafanzeige.

  Mit freundlichen Grüßen,  
  [Vor- und Familienname]

## Beispiel Strafanzeige wegen Volksverhetzung

  Sehr geehrte Damen und Herren,

  hiermit erstatte ich Strafanzeige wegen Volksverhetzung gegen [Name], [Anschrift], ggf. „unbekannt“.

  [Sachverhalt]

  Ich bitte um Mitteilung über den Eingang und Stand der Bearbeitung meiner Strafanzeige.

  Mit freundlichen Grüßen,  
  [Vor- und Familienname]  

  **Anlagen:**  
  [Aufzählung Anlagen / Screenshot Beweise]

The Assistant must perform an evaluation for every single message in the messages provided. 
The assistant must follow the given JSON format strictly for the response and avoid any statements outside of the JSON format. Answer in the following JSON FORMAT ONLY.

{
  "Posts": [
    {
      "ID": "UNIQUE_POST_ID",
      "Post_URL": "postUrl",
      "Username": "handle",
      "Screenname": "screenname",
      "User_Profil_URL": "userProfileUrl"
      "Veröffentlichungszeitpunkt": "time",
      "Inhalt": "ZITAT_ODER_BESCHREIBUNG_DES_POSTS",
      "Straftatbestand": [
        "BELEIDIGUNG",
        "UEBLE_NACHREDE",
        "VERLEUMDUNG",
        "BEDROHUNG",
        "VOLKSVERHETZUNG",
        "DOXXING",
        "CYBERMOBBING",
        "CYBERSTALKING",
        "DIGITALE_ERPRESSUNG",
        "NOETIGUNG",
        "EHRVERLETZUNG"
      ],
      "Schweregrad": [
        "NIEDRIG",
        "MITTEL",
        "HOCH"
      ],
      "Verfolgungsart": [
        "ANTRAGSDELIKT",
        "OFFIZIALDELIKT"
      ],
      "Antragsfrist": [
        "DREI_MONATE",
        "KEINE_FRIST"
      ],
      "Antragsberechtigte": [
        "NUR_BETROFFENER",
        "JEDER"
      ],
      "Wiederholung": [
        "EINMALIG",
        "WIEDERHOLT",
        "NICHT_BEKANNT"
      ],
      "Ziel": [
        "PERSON",
        "GRUPPE"
      ],
      "Inhaltliche_Merkmale": [
        {
          "Merkmal": "SCHIMPFWOERTER",
          "Zitat": "RELEVANTES_ZITAT"
        },
        {
          "Merkmal": "HERABWUERDIGENDE_AUSDRUECKE",
          "Zitat": "RELEVANTES_ZITAT"
        },
        {
          "Merkmal": "TATSACHENBEHAUPTUNG",
          "Zitat": "RELEVANTES_ZITAT"
        },
        {
          "Merkmal": "GEWALTANDROHUNG",
          "Zitat": "RELEVANTES_ZITAT"
        },
        {
          "Merkmal": "HASS_AUFRUF",
          "Zitat": "RELEVANTES_ZITAT"
        },
        {
          "Merkmal": "PRIVATE_DATEN",
          "Zitat": "RELEVANTES_ZITAT"
        },
        {
          "Merkmal": "FALSCHE_TATSACHEN",
          "Zitat": "RELEVANTES_ZITAT"
        }
      ],
      "Vorsatz": [
        "WISSENTLICH_FALSCH",
        "NICHT_BEWEISBAR"
      ],
      "Potenzielle_Konsequenzen": [
        "RUF_SCHAEDIGUNG",
        "PSYCHISCHE_BELASTUNG",
        "MATERIELLE_SCHAEDEN"
      ],
      "Reichweite": [
        "INTERN",
        "OEFFENTLICH",
        "UNBEKANNT"
      ],
      "Plattformen": [
        "Facebook",
        "X_Twitter",
        "Instagram",
        "LinkedIn",
        "TikTok",
        "Telegram",
        "WhatsApp",
        "Signal",
        "Threema",
        "Reddit",
        "YouTube",
        "Snapchat",
        "Pinterest",
        "Tumblr",
        "Mastodon",
        "Clubhouse",
        "Discord",
        "Twitch",
        "UNBEKANNT",
        "OTHER"
      ],
      "Wahrscheinlichkeit_der_Strafbarkeit": [
        "GERING",
        "MITTEL",
        "HOCH"
      ],
      "Schriftliche_Bewertung": "DETAILLIERTE_BEWERTUNG_DES_POSTS",
      "Anzeige_Entwurf": "TEXTENTWURF_FUER_EINE_ANZEIGE"
    }
  ]
}
`;

// Function to create an OpenAI Assistant
async function createAssistant(apiKey) {
  let backgroundInfo = "";
  try {
    const result = await chrome.storage.local.get(["backgroundInfo"]);
    backgroundInfo = result.backgroundInfo || "";
  } catch (error) {
    console.error("Error retrieving background info:", error);
  }

  let systemPromptWithContext = evaluatorSystemPrompt;
  if (backgroundInfo.trim() !== "") {
    const contextBlock = `
# Context by the user
Additional context provided by the user to be considered during analysis:
${backgroundInfo}
# End of user context
`;
    // Use a regular expression to safely replace the placeholder
    systemPromptWithContext = evaluatorSystemPrompt.replace(
      /\{\{context_block\}\}\n*/g,
      contextBlock
    );
  } else {
    // If no context, just remove the placeholder
    systemPromptWithContext = evaluatorSystemPrompt.replace(
      /\{\{context_block\}\}\n*/g,
      ""
    );
  }

  const response = await fetch("https://api.openai.com/v1/assistants", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({
      name: "D2X Evaluation Assistant",
      instructions: systemPromptWithContext,
      model: "gpt-4o", // TODO replace with "gpt-4o-mini" when openai api is back
      tools: [{ type: "code_interpreter" }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create assistant: ${response.statusText}`);
  }

  return await response.json();
}

// Function to create a Thread
async function createThread(apiKey) {
  const response = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Failed to create thread: ${response.statusText}`);
  }

  return await response.json();
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
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content:
          typeof content === "string" ? content : JSON.stringify(content),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to add message: ${response.statusText}`);
  }

  return await response.json();
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
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to run assistant: ${response.statusText}`);
  }

  return await response.json();
}

// Function to check the status of a Run
async function checkRunStatus(apiKey, threadId, runId) {
  try {
    const response = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Run status check failed:", errorData);
      throw new Error(
        `Failed to check run status: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in checkRunStatus:", error);
    throw error;
  }
}

// Function to get messages from a Thread
async function getMessages(apiKey, threadId) {
  const response = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get messages: ${response.statusText}`);
  }

  return await response.json();
}

function parseAssistantResponse(response) {
  console.log("Parsing assistant response:", response);
  let content = response.text.value;

  // Remove JSON code block markers if present
  if (content.startsWith("```json")) {
    content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
    console.log("Removed JSON code block markers. Content:", content);
  }

  try {
    const parsedContent = JSON.parse(content);
    console.log("Successfully parsed content:", parsedContent);
    return parsedContent;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    console.log("Raw content that failed to parse:", content);
    return { Posts: [{ rawContent: content }] };
  }
}

// Function to process content with batching and error handling
async function processContent(messages) {
  try {
    const uid = getActiveAnalysisId();
    console.log(`Processing content for analysis ID: ${uid}`);
    updateAnalysisStatus(uid, "processing");
    const API_KEY = await getAPIKey();
    if (!API_KEY) {
      throw new Error(
        "API Key not set. Please set your API key in the extension options."
      );
    }

    let assistant;
    try {
      assistant = await createAssistant(API_KEY);
      console.log(`Created assistant with ID: ${assistant.id}`);
    } catch (error) {
      console.error("Error creating assistant:", error);
      throw error;
    }

    const batchSize = 2;
    const results = [];
    const totalBatches = Math.ceil(messages.length / batchSize);

    for (let i = 0; i < messages.length; i += batchSize) {
      const currentBatch = Math.floor(i / batchSize) + 1;
      const progress = (currentBatch / totalBatches) * 100;

      chrome.runtime.sendMessage({
        action: "progressUpdate",
        progress: progress,
        currentBatch: currentBatch,
        totalBatches: totalBatches,
        analysisId: uid,
      });

      const batch = messages.slice(i, i + batchSize);
      console.log(
        `Processing batch ${currentBatch} of ${totalBatches}. Progress: ${progress}%`
      );
      console.log(`Batch ${currentBatch} content: ${JSON.stringify(batch)}`);

      let retries = 3;
      while (retries > 0) {
        try {
          const thread = await createThread(API_KEY);
          console.log(
            `Created thread with ID: ${thread.id} for batch ${currentBatch}`
          );

          for (const message of batch) {
            await addMessage(API_KEY, thread.id, message);
            console.log(`Added message to thread ${thread.id}`);
          }

          console.log(`Starting run for thread ${thread.id}`);
          const run = await runAssistant(API_KEY, thread.id, assistant.id);
          console.log(
            `Finished run for thread ${thread.id} with run ID: ${run.id}`
          );

          let runStatus;
          let retryCount = 0;
          do {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            try {
              runStatus = await checkRunStatus(API_KEY, thread.id, run.id);
              console.log(
                `Run status for run ID ${run.id}: ${runStatus.status}`
              );
            } catch (error) {
              console.error(
                `Error checking run status (attempt ${retryCount + 1}):`,
                error
              );
              if (++retryCount > 3) throw error;
            }
          } while (runStatus.status !== "completed");

          const threadMessages = await getMessages(API_KEY, thread.id);
          const assistantResponses = threadMessages.data.filter(
            (msg) => msg.role === "assistant"
          );

          console.log(
            `Raw assistant responses for thread ${thread.id}:`,
            JSON.stringify(assistantResponses, null, 2)
          );

          assistantResponses.forEach((msg, index) => {
            console.log(`Processing response ${index + 1}:`, msg.content[0]);
            const parsedContent = parseAssistantResponse(msg.content[0]);
            if (parsedContent.Posts) {
              results.push(...parsedContent.Posts);
            } else {
              console.warn(
                "Parsed content does not contain Posts array:",
                parsedContent
              );
            }
          });

          chrome.runtime.sendMessage({
            action: "batchComplete",
            currentBatch: currentBatch,
            totalBatches: totalBatches,
            analysisId: uid,
          });

          break;
        } catch (error) {
          console.error(
            `Error processing batch (attempt ${4 - retries}):`,
            error
          );
          if (--retries === 0) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    console.log("Final processed results:", JSON.stringify(results, null, 2));

    // Identify reportable posts
    const reportablePosts = results.filter(
      (post) => post.Anzeige_Entwurf && post.Anzeige_Entwurf.trim() !== ""
    );
    console.log("Reportable posts:", reportablePosts);

    // Capture screenshots for reportable posts and user profiles
    if (reportablePosts.length > 0) {
      await captureReportablePostScreenshots(reportablePosts);
    }

    updateAnalysisStatus(uid, "completed");
    return { Posts: results, analysisId: uid };
  } catch (error) {
    console.error("Error in content analysis:", error);
    chrome.runtime.sendMessage({
      action: "analysisError",
      error: error.message,
      analysisId: getActiveAnalysisId(),
    });
    updateAnalysisStatus(getActiveAnalysisId(), "error");
    throw error;
  }
}

// Neue Funktion zur Verarbeitung erfasster Screenshots
async function captureReportablePostScreenshots(reportablePosts) {
  const capturedProfiles = new Set();
  let originalTab;
  let originalUrl;

  try {
    // Get the current active tab and its URL
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    originalTab = tabs[0];
    originalUrl = originalTab.url;

    for (const post of reportablePosts) {
      try {
        // Navigate to post URL if necessary
        if (originalTab.url !== post.Post_URL) {
          await chrome.tabs.update(originalTab.id, { url: post.Post_URL });
          await waitForTabToLoad(originalTab.id);
        }

        // Capture post screenshot
        await requestScreenshotCapture(
          post.Post_URL,
          `post_${post.ID}.png`,
          `${post.Username}/Post_${post.ID}`
        );

        // Optional delay
        await delay(2000);

        // Capture user profile screenshot if not already done
        if (!capturedProfiles.has(post.User_Profil_URL)) {
          if (originalTab.url !== post.User_Profil_URL) {
            await chrome.tabs.update(originalTab.id, {
              url: post.User_Profil_URL,
            });
            await waitForTabToLoad(originalTab.id);
          }

          await requestScreenshotCapture(
            post.User_Profil_URL,
            `profile_${post.Username}.png`,
            `${post.Username}`
          );

          capturedProfiles.add(post.User_Profil_URL);
          await delay(2000);
        }
      } catch (error) {
        console.error(
          `Error capturing screenshots for post ${post.ID}:`,
          error
        );
      }
    }

    // Navigate back to the original URL
    if (originalTab.url !== originalUrl) {
      await chrome.tabs.update(originalTab.id, { url: originalUrl });
    }
  } catch (error) {
    console.error(`Error in captureReportablePostScreenshots:`, error);
  }
}

/*  TODO - delete if no longer needed
// Neue Funktion zur Verarbeitung erfasster Screenshots
async function captureScreenshot(url, filename) {
  console.log(`Attempting to capture screenshot for URL: ${url}`);

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab) {
      throw new Error("No active tab found");
    }

    // Navigate to the new URL
    await chrome.tabs.update(tab.id, { url: url });

    // Wait for the page to load
    await new Promise((resolve) => {
      function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }
      chrome.tabs.onUpdated.addListener(listener);
    });

    // Add a delay to ensure the page is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Request screenshot capture from popup
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "captureScreenshot",
          analysisId: getActiveAnalysisId(),
          tabId: tab.id,
          url: url,
          filename: filename,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });

    if (!response || !response.success) {
      throw new Error(
        response ? response.error : "Failed to capture screenshot"
      );
    }

    return response.screenshotUrls;
  } catch (error) {
    console.error(`Error capturing screenshot for ${url}:`, error);
    throw error;
  }
}
*/

function requestScreenshotCapture(url, filename, directory) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "captureScreenshot",
        analysisId: getActiveAnalysisId(),
        url: url,
        filename: filename,
        directory: directory,
      },
      (response) => {
        if (chrome.runtime.lastError || (response && response.error)) {
          reject(chrome.runtime.lastError || response.error);
        } else {
          resolve();
        }
      }
    );
  });
}

// Neue Funktion zum Hinzufügen von Zeitstempeln zu Screenshots
async function addTimestampToScreenshots(screenshotFiles, time, url) {
  return Promise.all(
    screenshotFiles.map((file, index) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const bannerHeight = 80;
          canvas.width = img.width;
          canvas.height = img.height + bannerHeight;

          ctx.drawImage(img, 0, bannerHeight, img.width, img.height);

          ctx.fillStyle = "#f0f0f0";
          ctx.fillRect(0, 0, canvas.width, bannerHeight);
          ctx.fillStyle = "#000000";
          ctx.font = "14px Arial";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";

          const timestamp = `Captured on: ${new Date(time).toUTCString()}`;
          const urlText = `URL: ${url}`;
          const idText = `Analysis ID: ${getActiveAnalysisId()}`;
          const partText = `Part ${index + 1} of ${screenshotFiles.length}`;

          ctx.fillText(timestamp, 10, bannerHeight / 5);
          ctx.fillText(urlText, 10, (bannerHeight / 5) * 2);
          ctx.fillText(idText, 10, (bannerHeight / 5) * 3);
          ctx.fillText(partText, 10, (bannerHeight / 5) * 4);

          canvas.toBlob(function (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          }, "image/png");
        };

        img.onerror = function (error) {
          reject(
            new Error(`Fehler beim Laden des Screenshot-Bildes ${index + 1}`)
          );
        };

        img.src = file;
      });
    })
  );
}

// # Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message in background:", request);

  if (!request.action) {
    console.log("Message without action, ignoring:", request);
    return;
  }

  (async () => {
    try {
      switch (request.action) {
        case "startAnalysis":
          await startFullAnalysis();
          sendResponse({ analysisId: getActiveAnalysisId() });
          break;

        case "getCurrentTime":
          const time = await getCurrentTime();
          sendResponse({ time: time });
          break;

        case "getActiveAnalysisId":
          sendResponse({ analysisId: getActiveAnalysisId() });
          break;

        //case "storeScreenshot":
        //await storeScreenshot(request.analysisId, request.screenshot);
        //sendResponse({ status: "Screenshot stored successfully" });
        //break;

        case "scrapeContent":
          const content = await scrapeContent(
            request.analysisId,
            request.screenshotData
          );
          sendResponse({ status: "Content scraped", content: content });
          break;

        case "scrapePostURL":
          const scrapedPost = await handlePostURLScrape(request.url);
          sendResponse(scrapedPost);
          break;

        case "setAPIKey":
          await setAPIKey(request.apiKey);
          sendResponse({ status: "API Key set successfully" });
          break;

        //        case "screenshotCaptured":
        //          await handleCapturedScreenshot(request);
        //          break;

        case "screenshotError":
          console.error("Fehler bei der Screenshot-Erfassung:", request.error);
          break;

        default:
          console.warn("Unhandled message action:", request.action);
          sendResponse({
            status: "Error",
            message: "Unhandled message action",
          });
          break;
      }
    } catch (error) {
      console.error("Error in message handler:", error);
      sendResponse({ status: "Error", message: error.message });
    }
  })();

  return true; // Indicates that the response is sent asynchronously
});

console.log("Background script loaded");
