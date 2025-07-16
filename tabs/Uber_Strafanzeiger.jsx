// App.js
import React, { useState } from "react";
import "../css/Uber_Strafanz.css";

const sections = [
  {
    title: "Willkommen bei Strafanzeiger!",
    links: [
      {
        name: "Willkommen",
        href: "#willkommen",
      },
    ],
  },
  {
    title: "🆘 Hilfe in akuten Situationen",
    links: [
      {
        name: "Du bist nicht allein. Hol dir Unterstützung",
        href: "#du-bist-nicht-allein-hol-dir-unterstutzung",
      },
      {
        name: "Wenn du gerade dringend jemanden zum Reden brauchst",
        href: "#wenn-du-gerade-dringend-jemanden-zum-reden-brauchst",
      },
      {
        name: "Nächste Schritte, die du jetzt gehen kannst",
        href: "#nächste-schritte-die-du-jetzt-gehen-kannst",
      },
    ],
  },
  {
    title: "Was ist Strafanzeiger?",
    links: [
      {
        name: "Hauptfunktionen auf einen Blick",
        href: "#hauptfunktionen-auf-einen-blick",
      },
      { name: "Wichtig zu wissen", href: "#wichtig-zu-wissen" },
    ],
  },
  {
    title: "⚠️ Wichtige Hinweise",
    links: [
      { name: "Rechtlicher Hinweis", href: "#rechtlicher-hinweis" },
      {
        name: "Nutzung von X.com (Twitter)",
        href: "#nutzung-von-xcom-twitter",
      },
      { name: "KI-gestützte Analyse", href: "#ki-gestützte-analyse" },
      { name: "Datenschutz & Privatsphäre", href: "#datenschutz-privatsphäre" },
      {
        name: "Technische Voraussetzungen",
        href: "#technische-voraussetzungen",
      },
      { name: "Performance & Nutzung", href: "#performance-nutzung" },
      { name: "Haftungsausschluss", href: "#haftungsausschluss" },
    ],
  },
  {
    title: "Erste Schritte",
    links: [
      {
        name: "Zugriff auf die Einstellungen",
        href: "#zugriff-auf-die-einstellungen",
      },
      { name: "1. API-Keys einrichten", href: "#1-api-keys-einrichten" },
      {
        name: "2. Adressdaten eingeben",
        href: "#2-adressdaten-eingeben",
      },
      { name: "3. Weitere Einstellungen", href: "#3-weitere-einstellungen" },
    ],
  },
  {
    title: "Grundfunktionen",
    links: [
      { name: "Die Benutzeroberfläche", href: "#die-benutzeroberfläche" },
      { name: "Hintergrundinformationen", href: "#hintergrundinformationen" },
      {
        name: "Automatische Auswertung einer Seite",
        href: "#automatische-auswertung-einer-seite",
      },
      { name: "Manuelle Funktionen", href: "#manuelle-funktionen" },
      { name: "Nach der Analyse", href: "#nach-der-analyse" },
    ],
  },
  {
    title: "Arbeiten mit Anzeigenentwürfen",
    links: [
      { name: "Die ZIP-Datei", href: "#die-zip-datei" },
      { name: "Sich Übersicht verschaffen", href: "#ubersicht" },
      { name: "Struktur und Inhalte", href: "#struktur-und-inhalte" },
      { name: "Anzeigenentwürfe anpassen", href: "#anzeigenentwürfe-anpassen" },
      { name: "Anzeigen neu generieren", href: "#anzeigen-neu-generieren" },
      { name: "Anzeigen drucken", href: "#anzeigen-drucken" },
      { name: "Strafanzeigen Einreichen", href: "#strafanzeigen-einreichen" },
    ],
  },
  {
    title: "Fehlerbehebung",
    links: [
      { name: "Allgemeine Probleme", href: "#allgemeine-probleme" },
      {
        name: "Wenn etwas nicht funktioniert",
        href: "#wenn-etwas-nicht-funktioniert",
      },
      { name: "Besonderheiten", href: "#besonderheiten" },
    ],
  },
  {
    title: "Praxis Tipps",
    links: [
      { name: "Für bessere Ergebnisse", href: "#für-bessere-ergebnisse" },
      { name: "Für die Bedienung", href: "#für-die-bedienung" },
      { name: "Für das Arbeiten mit den Ergebnissen", href: "#für-das-arbeiten-mit-den-ergebnissen" },
      {
        name: "Einschränkungen",
        href: "#einschränkungen-die-du-kennen-solltest",
      },
    ],
  },
];

function App() {
  const [collapsed, setCollapsed] = useState(
    sections.reduce((acc, section) => {
      acc[section.title] = true; // Standardmäßig alle Abschnitte sind kollabiert
      return acc;
    }, {})
  );

  const toggleSection = (title) => {
    setCollapsed((prevState) => ({
      ...prevState,
      [title]: !prevState[title],
    }));
  };

  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <nav className="sidebar">
        {sections.map((section) => (
          <div key={section.title}>
            <h2
              onClick={() => {
                toggleSection(section.title);
                const element = document.getElementById(
                  section.links.length > 0
                    ? section.links[0].href.substring(1)
                    : ""
                );
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={collapsed[section.title] ? "collapsed" : ""}
            >
              {section.title}
            </h2>
            <ul className={collapsed[section.title] ? "" : "expanded"}>
              {section.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="content">
        <h1 id="strafanzeiger_chrome_extension">
          <em>Strafanzeiger</em> Chrome Extension
        </h1>

        <h2 id="willkommen">Willkommen bei <em>Strafanzeiger</em>!</h2>
        <p> <strong>Je mehr wir uns mit Anzeigen gegen Hass wehren, desto stärker wird die Strafverfolgung, desto klarer die Grenze für akzeptables Verhalten und desto deutlicher das Signal gegen Hass.</strong> </p>
        <p>
          <em>Strafanzeiger</em> ist dein digitaler Assistent für den Umgang mit
          strafrechtlich relevanten Kommentaren auf X (ehemals Twitter). Die
          Extension hilft dir, Hasskommentare und andere illegale Inhalte zu
          dokumentieren und rechtliche Schritte einzuleiten.
        </p>
        <p>Diese Anleitung begleitet dich durch:</p>
        <ul>
          <li>Sofortmaßnahmen in akuten Situationen</li>
          <li>Einrichtung und Grundeinstellungen der Extension</li>
          <li>Dokumentation und Analyse von problematischen Inhalten</li>
          <li>Erstellung und Bearbeitung von Anzeigen</li>
        </ul>

        <h2 id="hilfe-in-einer-akuten-schwierigen-oder-belastenden-situation">
          Hilfe in einer akuten, schwierigen oder belastenden Situation
        </h2>
        <p>
          <strong>Bleib ruhig, atme tief durch und handle überlegt.</strong>
          <br />
          Es ist normal, dass du dich in einer solchen Situation überwältigt
          fühlst. Nimm dir einen Moment Zeit, um zur Ruhe zu kommen. Atme tief
          ein und aus, bevor du die nächsten Schritte gehst.
        </p>

        <h3 id="du-bist-nicht-allein-hol-dir-unterstutzung">
          Du bist nicht allein. Hol dir Unterstützung
        </h3>
        <p>
          Du musst diese Situation nicht alleine bewältigen. Es gibt Menschen
          und Organisationen, die für Dich da sind und dir jetzt helfen können.
        </p>

        <h4 id="hier-findest-du-unterstutzung">
          Hier findest du Unterstützung:
        </h4>
        <ul>
          <li>
            <strong>HateAid – Unterstützung bei digitaler Gewalt</strong>
            <br />
            HateAid bietet dir praktische Hinweise, persönliche Beratung und
            Unterstützung bei rechtlichen Schritten.
            <br />
            👉{" "}
            <a
              href="https://hateaid.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Zur Webseite von HateAid
            </a>
            <br />
            📧 E-Mail: beratung@hateaid.org
            <br />
            📞 Telefon: 030 / 252 088 38
          </li>
          <li>
            <strong>
              Meldestelle REspect! – Unterstützung bei Hetze im Netz
            </strong>
            <br />
            Diese Stelle hilft dir, Hass und Hetze zu melden und gibt konkrete
            Hilfestellungen.
            <br />
            👉{" "}
            <a
              href="https://meldestelle-respect.de/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Zur Meldestelle REspect!
            </a>
          </li>
          <li>
            <strong>
              Die Starke Stelle – Beratung für öffentliche Mandatsträger:innen
            </strong>
            <br />
            Spezialisierte Beratung und Vermittlung für Personen in öffentlichen
            Ämtern.
            <br />
            👉{" "}
            <a
              href="https://www.stark-im-amt.de/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Zur Starken Stelle
            </a>
          </li>
        </ul>

        <h3 id="wenn-du-gerade-dringend-jemanden-zum-reden-brauchst">
          Wenn du gerade dringend jemanden zum Reden brauchst:
        </h3>
        <ul>
          <li>
            <strong>Telefonseelsorge (24/7 erreichbar)</strong>
            <br />
            Hier kannst du anonym und kostenlos mit jemandem sprechen, der dir
            zuhört.
            <br />
            📞 Telefon: 0800 111 0 111 oder 0800 111 0 222
            <br />
            👉{" "}
            <a
              href="https://www.telefonseelsorge.de/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Zur Telefonseelsorge
            </a>
          </li>
          <li>
            <strong>
              Nummer gegen Kummer (für Kinder, Jugendliche und Eltern)
            </strong>
            <br />
            Ein offenes Ohr für Kinder, Jugendliche und Eltern, die
            Unterstützung suchen.
            <br />
            📞 Kinder und Jugendliche: 116 111
            <br />
            📞 Elterntelefon: 0800 111 0 550
            <br />
            👉{" "}
            <a
              href="https://www.nummergegenkummer.de/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mehr erfahren
            </a>
          </li>
        </ul>

        <h3 id="nächste-schritte-die-du-jetzt-gehen-kannst">
          Nächste Schritte, die du jetzt gehen kannst:
        </h3>
        <ol>
          <li>
            <strong>Beweise sichern</strong>
            <br />
            Die <em>Strafanzeiger</em> Extension hilft dir dabei, Screenshots mit
            Zeitstempeln und andere Dokumente automatisch zu erstellen, um
            strafrechtlich relevante Kommentare zur Anzeige zu bringen.
          </li>
          <li>
            <strong>Inhalte melden</strong>
            <br />
            Viele Plattformen wie X bieten Funktionen, um rechtswidrige Inhalte
            zu melden. Nutze diese Option, um Hasspostings zu melden.
            <br />
            ⚠️ Stelle sicher, dass du vorher alle Beweise gesichert hast.
          </li>
          <li>
            <strong>Rechtliche Schritte prüfen</strong>
            <br />
            Mit der Extension kannst du Entwürfe für Strafanzeigen erstellen.
            Diese kannst Du:
            <ul>
              <li>
                Online einreichen: 👉{" "}
                <a
                  href="https://portal.onlinewache.polizei.de/de/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Zur Online-Wache
                </a>
              </li>
              <li>Persönlich bei einer Polizeidienststelle einreichen.</li>
            </ul>
          </li>
        </ol>

        <h2 id="was-ist-strafanzeiger">Was ist <em>Strafanzeiger</em>?</h2>
        <p>
          <em>Strafanzeiger</em> ist dein digitaler Assistent für den Umgang mit
          problematischen Kommentaren auf X (ehemals Twitter). Die Extension
          analysiert Kommentare auf mögliche Rechtsverstöße gegen deutsches
          Recht, erstellt automatisch die notwendige Dokumentation und generiert
          Anzeigenentwürfe - und macht es dir damit deutlich leichter, gegen
          Hasskommentare und andere illegale Inhalte vorzugehen.
        </p>
        <p>
          <strong id="hauptfunktionen-auf-einen-blick">
            Hauptfunktionen auf einen Blick:
          </strong>
        </p>
        <ul>
          <li>🔍 Automatische Analyse von Kommentaren auf Rechtsverstöße</li>
          <li>📸 Automatische Dokumentation durch Screenshots</li>
          <li>🔎 Optionale Zusatzrecherche zu Profilen</li>
          <li>📝 Erstellung von Anzeigenentwürfen</li>
          <li>✏️ Einfache Bearbeitung der Entwürfe</li>
        </ul>

        <p>
          <strong id="wichtig-zu-wissen">Wichtig zu wissen:</strong>
        </p>
        <ul>
          <li>
            <em>Strafanzeiger</em> kann aktuell nur Texte und Emojis in Kommentaren
            analysieren
          </li>
          <li>
            Bilder, Videos oder andere Medieninhalte können nicht automatisch
            ausgewertet werden
          </li>
          <li>
            Bilder werden per Screenshot gesichert. Dokumentiere andere Inhalte
            zusätzlich manuell.
          </li>
        </ul>

        <h2 id="wichtige-hinweise">⚠️ Wichtige Hinweise</h2>

        <h3 id="rechtlicher-hinweis">Rechtlicher Hinweis</h3>
        <ul>
          <li>Strafanzeiger dient der Beweissicherung und dem erstellen von Entwürfen für Strafanzeigen und darf nur für diesen Zweck verwendet werden. Die Nutzung der Anwendung und der gesicherten Beweise (wie z.B. Screenshots) für andere Zwecke, als die strafrechtliche Verfolgung, ist nicht Zweck von Strafanzeiger.</li>
          <li>Du musst dich an die Nutzungsbedingungen halten, die du beim ersten Programmstart akzeptieren musst und die du durch einen Klick auf das §-Symbol in der Menüleiste erneut lesen kannst.</li>
          <li>Das Programm wird ohne eine Zusicherung oder ein Erfolgsversprechen bereitgestellt. Du nutzt es auf eigenes Risiko und trägst die Kosten für mögliche Probleme. Der Anbieter haftet nicht für Schäden, die durch die Nutzung entstehen, auch nicht bei Hinweis auf mögliche Risiken.</li>
          <li>
            <em>Strafanzeiger</em> erstellt nur Entwürfe für Anzeigen - keine
            rechtsverbindlichen Dokumente
          </li>
          <li><em>Strafanzeiger</em> ersetzt keine juristische Beratung</li>
          <li>
            Du bist selbst dafür verantwortlich:
            <ul>
              <li>Alle generierten Dokumente zu prüfen</li>
              <li>Die Anzeigen bei den Behörden einzureichen</li>
              <li>Die Richtigkeit der Angaben sicherzustellen</li>
            </ul>
          </li>
          <li>Bedenke, dass eine wissentlich falsche Verdächtigung nach § 164 StGB strafbar sein kann.</li>
          <li>Bei Unsicherheiten: Sprich mit einem Anwalt</li>
        </ul>

        <h3 id="nutzung-von-xcom-twitter">Nutzung von X.com (Twitter)</h3>
        <ul>
          <li>
            Diese Extension muss im Einklang mit den{" "}
            <a
              href="https://x.com/de/tos"
              target="_blank"
              rel="noopener noreferrer"
            >
              X Terms of Service
            </a>{" "}
            genutzt werden
          </li>
          <li>
            Für das automatische Auslesen von Seiten benötigst du in der Regel
            eine Genehmigung von X
          </li>
          <li>
            Alternativen:
            <ol>
              <li>Nutzung der X API (erfordert Developer Account - und wird erst in einer zukünftigen Version unterstützt)</li>
              <li>Manuelles Kopieren der relevanten Inhalte</li>
            </ol>
          </li>
        </ul>

        <h3 id="ki-gestützte-analyse">KI-gestützte Analyse</h3>
        <ul>
          <li>
            Die Extension nutzt KI-Technologie für die Analyse von Kommentaren
          </li>
          <li>
            KI-Systeme können Fehler machen oder Sachverhalte falsch einschätzen
          </li>
          <li>
            <strong>Wichtig</strong>: Prüfe alle Anzeigenentwürfe vor dem
            Absenden
          </li>
          <li>Passe die Entwürfe bei Bedarf an deine Anforderungen an</li>
          <li>
            Die Ergebnisse sind nicht garantiert konsistent:
            <ul>
              <li>
                Die gleiche Analyse kann unterschiedliche Ergebnisse liefern, wenn du sie z.B. erneut durchführst.
              </li>
              <li>
                Gerade Grenzfälle werden manchmal unterschiedlich bewertet
              </li>
            </ul>
          </li>
          <li>
            Technische Einschränkungen:
            <ul>
              <li>Die Extension kann ausfallen oder Fehler machen</li>
              <li>Updates können die Funktionsweise verändern</li>
              <li>Keine Garantie für dauerhafte Verfügbarkeit</li>
            </ul>
          </li>
        </ul>

        <h3 id="datenschutz-privatsphäre">Datenschutz & Privatsphäre</h3>
        <ul>
          <li>
            Die Verarbeitung erfolgt größtenteils lokal auf deinem Rechner
          </li>
          <li>
            Deine persönlichen Daten, die du im <em>Adressdaten</em>-Bereich der
            Einstellungen hinterlegst, werden für das Anschreiben der Anzeige
            genutzt und ausschließlich lokal gespeichert und lokal verarbeitet.
          </li>
          <li>
            An OpenAI werden zur Analyse gesendet:
            <ul>
              <li>Textinhalte des zu untersuchenden Post mit Zeitstempel</li>
              <li>Anonymisierte: Nutzernamen, User-Handles (auch in den URLs)</li>
              <li>Dein OpenAI API-Key</li>
              <li>
                Deine für die KI hinterlegten Informationen aus dem Bereich{" "}
                <em>Hintergrundinformationen</em>
              </li>
              <li>
                Bei automatischer Auswertung werden die von Dir geschriebenen Posts mit Deinem x User-Namen/-Handle als Kontext automatisch an OpenAi weitergegeben.
              </li>
              <li>Bei manueller Kommentaranalyse werden alle dort angegebenen Informationen an OpenAI geschickt. Inklusive ggf. von dir dort angegebener Nutzernamen/Handle und URL.</li>
            </ul>
          </li>
          <li>
            Bei aktivierter Profilrecherche werden an Perplexity gesendet:
            <ul>
              <li>Profilinformationen der zu untersuchenden Profile</li>
              <li>Dein Perplexity API-Key</li>
            </ul>
          </li>
          <li>
            Zusätzliche API-Nutzung:
            <ul>
              <li>
                Die Extension ruft timeapi.io für aktuelle Datums- und
                Zeitangaben auf
              </li>
              <li>
                Dabei werden nur die für einen HTTPS-Aufruf notwendigen
                Informationen (z.B. IP) übermittelt
              </li>
              <li>Keine weiteren persönlichen Daten werden geteilt</li>
            </ul>
          </li>
          <li>
            Datenspeicherung:
            <ul>
              <li>Analysedaten werden beim Schließen des Browsers gelöscht</li>
              <li>
                Deine Einstellungen bleiben im Browser gespeichert, bis der
                Browser-Cache gelöscht wird
              </li>
              <li>
                Die heruntergeladenen ZIP-Dateien mit Anzeigen bleiben auf
                deinem Rechner erhalten
              </li>
            </ul>
          </li>
          <li>
            Datenweitergabe durch die Anzeige:
            <ul>
              <li>
                Bedenke, dass du durch die Anzeige Daten weiter gibst (z.B. die
                Absenderadresse, Kontaktdaten und Namen)
              </li>
              <li>
                Auch die Screenshots können Hinweise enthalten, von welchem
                Account aus die Screenshots gemacht wurden - z.B. dein
                Profilbild
              </li>
              <li>
                Diese Daten werden durch die Anzeige Polizei und
                Staatsanwaltschaft bekannt und können bei einer Anklage der
                Gegenseite bekannt werden
              </li>
            </ul>
          </li>
        </ul>
        <p>
          👉 Wie du deine privaten Daten bei einer Anzeige schützen kannst,
          findest du{" "}
          <strong>
            <a href="#schutz-privater-daten">hier: Schutz privater Daten</a>
          </strong>
          .
        </p>

        <h3 id="technische-voraussetzungen">Technische Voraussetzungen</h3>
        <p>
          <strong>Browser-Kompatibilität:</strong>
        </p>
        <ul>
          <li>Entwickelt und getestet für Google Chrome</li>
          <li>
            Funktioniert eventuell auch mit anderen Chromium-basierten Browsern
            (Edge, Opera)
          </li>
          <li>Für das Drucken wird Firefox empfohlen (Erfahrungsgemäß beste Formatierung)</li>
        </ul>

        <h3 id="performance-nutzung">Performance & Nutzung</h3>
        <ul>
          <li>
            Die Analyse kann je nach Anzahl der Kommentare einige Zeit dauern
          </li>
          <li>Führe immer nur eine Analyse gleichzeitig durch</li>
          <li>
            Bei laufender Analyse: Lass die Extension ihre Arbeit machen und
            vermeide Interaktionen mit dem Browser
          </li>
        </ul>

        <h3 id="haftungsausschluss">Haftungsausschluss</h3>
        <p>Die Nutzung der Extension erfolgt auf eigene Gefahr:</p>
        <ul>
          <li>Keine Haftung für Schäden durch die Nutzung der Extension</li>
          <li>Keine Garantie für die Richtigkeit der Analyseergebnisse</li>
          <li>Keine Haftung für rechtliche Konsequenzen</li>
          <li>
            Du bist selbst verantwortlich für:
            <ul>
              <li>Einhaltung der X.com Nutzungsbedingungen</li>
              <li>Prüfung der generierten Dokumente</li>
              <li>Korrekte Einreichung von Anzeigen</li>
            </ul>
          </li>
        </ul>

        <h1 id="erste-schritte">Erste Schritte</h1>

        <h2 id="zugriff-auf-die-einstellungen">
          Zugriff auf die Einstellungen
        </h2>
        <p>
          Klicke in der Extension auf das ⚙️-Symbol, um zu den Einstellungen zu
          gelangen. Hier richtest du alles ein, was <em>Strafanzeiger</em> für die Arbeit
          benötigt.
        </p>

        <h2 id="1-api-keys-einrichten">1. API-Keys einrichten</h2>

        <h3 id="openai-api-key-erforderlich">OpenAI API-Key (erforderlich)</h3>
        <p>
          Der OpenAI API-Key wird für die Analyse der Kommentare benötigt. So
          erhältst du ihn:
        </p>
        <ol>
          <li>
            <p>OpenAI-Account erstellen</p>
            <ul>
              <li>
                Besuche{" "}
                <a
                  href="https://openai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  openai.com
                </a>
              </li>
              <li>Klicke auf "Sign Up"</li>
              <li>Registriere dich mit E-Mail oder Google/Microsoft-Konto</li>
              <li>Verifiziere dein Konto</li>
            </ul>
          </li>
          <li>
            <p>Zahlungsinformationen hinzufügen</p>
            <ul>
              <li>Klicke auf dein Profilsymbol (oben rechts)</li>
              <li>Wähle "Manage Account"</li>
              <li>Gehe zum Bereich "Billing"</li>
              <li>Klicke auf "Add Payment Method"</li>
              <li>Gib deine Kreditkarteninformationen ein und speichere sie</li>
            </ul>
          </li>
          <li>
            <p>API-Key generieren</p>
            <ul>
              <li>Klicke auf das Zahnradsymbol für Settings (oben rechts)</li>
              <li>Wähle "API Keys" im Menü links</li>
              <li>Klicke "Create New Secret Key"</li>
              <li>
                <strong>Wichtig</strong>: Kopiere den Key sofort — er wird nur
                einmal angezeigt!
              </li>
            </ul>
          </li>
          <li>
            <p>Key in <em>Strafanzeiger</em> einfügen</p>
            <ul>
              <li>Füge den kopierten Key in das Feld "OpenAI API Key" ein</li>
              <li>Klicke auf "Speichern"</li>
            </ul>
          </li>
        </ol>
        <p>
          💡 <strong>Hinweis zu Kosten</strong>: Die Nutzung der OpenAI API
          verursacht geringe Kosten im Cent-Bereich pro Analyse. Du kannst in
          deinem OpenAI-Account Limits setzen, um die Kosten zu kontrollieren.
        </p>

        <h3 id="perplexity-api-key-optional">Perplexity API-Key (optional)</h3>
        <p>Wenn du zusätzliche Profilrecherchen nutzen möchtest:</p>
        <ol>
          <li>
            <p>Perplexity-Konto erstellen</p>
            <ul>
              <li>
                Besuche{" "}
                <a
                  href="https://www.perplexity.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  perplexity.ai
                </a>
              </li>
              <li>Klicke auf "Sign Up"</li>
              <li>Registriere dich und verifiziere deine E-Mail</li>
            </ul>
          </li>
          <li>
            <p>API-Key generieren</p>
            <ul>
              <li>Gehe zu den Kontoeinstellungen</li>
              <li>Suche nach "API" oder "API-Einstellungen"</li>
              <li>Füge eine Zahlungsmethode hinzu</li>
              <li>Erwerbe Guthaben nach Bedarf</li>
              <li>Generiere einen neuen API-Key</li>
            </ul>
          </li>
          <li>
            <p>Key in <em>Strafanzeiger</em> einfügen</p>
            <ul>
              <li>Füge den Key in das Feld "Perplexity API Key" ein</li>
              <li>Klicke auf "Speichern"</li>
            </ul>
          </li>
        </ol>
        <p>
          💡 <strong>Hinweis zu Kosten</strong>: Auch die Nutzung der Perplexity
          API verursacht geringe Kosten im Cent-Bereich pro Profilrecherche.
          Über die Perplexity-Platform kannst du dein Budget verwalten.
          Wenn du zeitweise Perplexity nicht verwenden willst, kannst du in den Einstellungen "Profilsuche mit Perplexity" deaktivieren.
        </p>

        <h2 id="2-adressdaten-eingeben">
          2. Adressdaten eingeben
        </h2>

        <h3 id="persönliche-daten">Persönliche Daten</h3>
        <p>
          Diese Informationen werden nur lokal verarbeitet und ausschließlich
          für die Erstellung der Anzeigenbriefe verwendet:
        </p>
        <ul>
          <li>
            <strong>Absenderadresse</strong>: Eine ladungsfähige Postanschrift -
            D.h. eine vollständige, erreichbare physische Adresse, an die
            gerichtliche oder amtliche Schriftstücke rechtssicher zugestellt
            werden können - die aber nicht deine private Adresse sein muss
          </li>
          <li>
            <strong>Stadt</strong>: Wird im Briefkopf der Anzeige verwendet
          </li>
          <li>
            <strong>Name für Unterschrift</strong>: Dein Name mit dem du die
            Anzeige unterschreibst
          </li>
          <li>
            <strong>Kontaktdaten</strong> (optional): E-Mail und/oder Telefon für schnelle Erreichbarkeit
          </li>
          <li>
            <strong>Empfängeradresse</strong>: Adresse der zuständigen
            Polizeidienststelle oder Staatsanwaltschaft
          </li>
        </ul>
        <p>
          ⚠️ <strong>Wichtig</strong>: Im Falle eines Strafverfahrens können
          alle angegebenen Kontaktdaten dem Anwalt der Gegenseite und
          möglicherweise auch der beschuldigten Person zugänglich gemacht
          werden.
        </p>
        <p>
          💡 <strong>Tipp</strong>: Wenn bestimmte Daten nicht auf dem Brief
          erscheinen sollen, lass die entsprechenden Felder einfach leer.
        </p>
        <p>
          Wie du deine privaten Daten bei einer Anzeige schützen kannst, findest
          du <a href="#schutz-privater-daten">hier: Schutz privater Daten</a>.
        </p>

        <h3 id="schutz-privater-daten">Schutz privater Daten</h3>
        <p>So kannst du deine Privatsphäre bei einer Anzeige schützen:</p>

        <ul>
          <li>
            <strong>Anzeigen benötigen eine "ladungsfähige" Adresse von dir</strong>:
            <ul>
              <li>Es muss nicht deine private Adresse sein</li>
              <li>
                Wichtig ist: An dieser Adresse müssen Behördenschreiben
                zugestellt werden können. <em>E-Mail-Adresse oder Postfach reichen
                  nicht aus.</em>
              </li>
              <li>
                Es kann z.B. die Adresse eines Anwalts oder einer Beratungsstelle
                sein. Ggf. der Anzeige eine Einverständniserklärung der
                angegebenen Person beifügen.
              </li>
            </ul>
          </li>
          <li>
            <strong>Alternative Kontaktdaten - Wenn du gerne Kontaktdaten angeben willst</strong>:
            <ul>
              <li>Separate E-Mail-Adresse für behördliche Kommunikation</li>
              <li>
                Virtuelle Telefonnummer mit Weiterleitung zum privaten Anschluss
                (z.B. über{" "}
                <a
                  href="https://www.fonial.de/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  fonial.de
                </a>
                )
              </li>
              <li>Diese Kontaktmöglichkeiten können dann später einfach deaktiviert werden</li>
              <li>Grundsätzlich musst du E-Mail oder Telefonnummer nicht angeben</li>
            </ul>
          </li>
          <p>
            💡 <strong>Tipp</strong>: Wenn bestimmte Daten nicht auf dem Brief
            erscheinen sollen, lass die entsprechenden Felder in den Einstellungen einfach leer.
            Denk daran, nach dem Eintragen auf "Speichern" zu klicken.
            Falls du schon die Anzeigenentwürfe heruntergeladen hast, kannst du die Adressdaten auch einfach in den Dateien
            im Ordner Anschreiben_Basis_Daten ändern - diese werden dann in die Anzeigenentwürfe übernommen.
          </p>
          <li>
            <strong>Screenshots Anpassen</strong>:
            <ul>
              <li>
                Auch wenn du die Menüleiste von X.com in den Einstellungen
                ausblendest, können Screenshots Hinweise auf den Account
                enhalten, der für die Screenshots genutzt wurde z.B. das Profilbild
              </li>
              <li>
                Wenn nötig, kannst du die Screenshot-Dateien in einem Grafikprogramm öffnen und den unteren Teil wegschneiden, falls er nicht benötigt wird. Damit niemand das Beweismittel infrage stellen kann, solltest du nur in dringenden Fällen etwas selbst schwärzen – und dann so, dass es offensichtlich ist und der Screenshot noch als unverändertes Beweismittel gelten kann. Änderungen werden dann auch automatisch in den Anzeigen übernommen.
              </li>
              <li>Achte darauf den Inhalt nicht zu verändern</li>
              <li>Wenn du Dich entscheidest Screenshots anzupassen behalte eine Kopie des Originals</li>
            </ul>
          </li>
          <li>
            <strong>Unterstützung</strong>:
            <ul>
              <li>
                Beratungsstellen können dir helfen, sichere Kontaktoptionen
                einzurichten
              </li>
              <li>
                Bei Sicherheitsbedenken: Sprich direkt bei der Anzeigenstellung
                mit der Polizei
              </li>
            </ul>
          </li>
        </ul>
        <h2 id="3-weitere-einstellungen">3. Weitere Einstellungen</h2>

        <h3 id="menü-auf-xcom-ausblenden">Menü auf X.com ausblenden</h3>
        <ul>
          <li>
            <strong>Was</strong>: Blendet die linke Menüleiste von X.com in
            Screenshots aus. Auch dein Profilbild wird im der Liste der Posts in der Regel ausgeblendet.
          </li>
          <li>
            <strong>Warum</strong>:
            <ul>
              <li>Macht die Screenshots übersichtlicher</li>
              <li>Hilft bei der Anonymisierung mit welchen Account die Screenshots gemacht wurden</li>
            </ul>
          </li>
          <li>
            💡 <strong>Tipp</strong>: Auch wenn das Menü und Profilbilder im Verlauf ausgeblendet werden, können
            dein Profilbild oder Username an anderen Stellen auftauchen
          </li>
        </ul>

        <h3 id="profilsuche-mit-perplexity">Profilsuche mit Perplexity</h3>
        <ul>
          <li>
            <strong>Was</strong>: Sucht zusätzliche Online-Informationen zu
            Profilen
          </li>
          <li>
            <strong>Warum</strong>: Kann weitere relevante Informationen zu
            problematischen Accounts finden
          </li>
          <li>
            <strong>Hinweis</strong>: Benötigt einen Perplexity API-Key
          </li>
        </ul>

        <h1 id="grundfunktionen">Grundfunktionen</h1>

        <h2 id="die-benutzeroberfläche">Die Benutzeroberfläche</h2>
        <p><em>Strafanzeiger</em> ist einfach aufgebaut:</p>
        <ul>
          <li>
            <strong><em>Strafanzeiger</em></strong>: Titel der Extension
          </li>
          <li>
            <strong>📝</strong>: Link zum Anzeigen-neu-generieren-Tool
          </li>
          <li>
            <strong>§</strong>: Link zu den Nutzungsbedigungen
          </li>
          <li>
            <strong>ⓘ</strong>: Diese Anleitung
          </li>
          <li>
            <strong>⚙️</strong>: Einstellungen
          </li>
          <li>
            <em>Analysis ID</em>: Automatisch generierte ID für deine
            aktuelle Analyse. Taucht in den Screenshot-Zeitstempeln auf.
          </li>
          <li>
            <strong>Hauptmenü</strong>:
            <ul>
              <li>Hintergrundinformationen</li>
              <li>Automatische Auswertung:</li>
              <ul>
                <li>Seite automatisch auswerten</li>
              </ul>
              <li>Manuelle Auswertung:</li>
              <ul>
                <li>Kommentaranalyse</li>
                <li>Screenshots erstellen</li>
                <li>Profilrecherche</li>
              </ul>

            </ul>
          </li>
        </ul>
        <h2 id="hintergrundinformationen">Hintergrundinformationen</h2>
        <p>Diese Informationen helfen der OpenAI KI bei der Bewertung der Posts. Es gibt drei wichtige Felder:</p>

        <ul>
          <li>
            <em>Meine Profil URL</em>:
            <ul>
              <li>Gib hier die URL deines X Profils ein (z.B. https://x.com/meinUserHandle)</li>
              <li>Bei der automatischen Auswertung wird dein User-Handel verwendet, um deine Posts zu identifizieren und als Kontext für die Bewertungen an OpenAi gesendet (inkl. Screen-Name und Handle).</li>
              <li>Auch bei der manuellen Auswertung wird Dein User-Handle/Profil URL an OpenAI gesendet - allerdings nicht automatisch deine Posts.</li>
            </ul>
          </li>
          <li>
            <em>URL von meinem ursprünglichen Post</em>:
            <ul>
              <li>Füge hier die URL deines ursprünglichen Posts ein auf den sich die Kommentare beziehen (z.B. https://x.com/meinUserHandle/status/1234567890123456789)</li>
              <li>Diese URL wird später in der Anzeige als Link eingefügt</li>
            </ul>
          </li>
          <li>
            <em>Hintergrundinformationen</em>:
            <ul>
              <li>Hier kannst du alles eintragen, was man wissen muss, um die Hasskommentare zu verstehen</li>
              <li>BEI MANUELLER ANALYSE: Füge hier auch ein, was du gepostet hast, z.B.: "Ich habe folgendes geschrieben, worauf die Leute reagieren: [Deine Posts]"</li>
              <li>Diese Informationen helfen OpenAI, den Kontext der Kommentare besser zu verstehen</li>
            </ul>
          </li>
        </ul>

        <p>💡 <strong>Tipps</strong>:</p>
        <ul>
          <li>Schreib einfach so, als würdest du einer Person erklären, die die Kommentare für dich prüfen soll</li>
          <li>Je mehr Kontext du angibst, desto besser kann die KI die Situation einschätzen</li>
          <li>Die Informationen werden gespeichert und können später bearbeitet werden</li>
        </ul>

        <p>⚠️ <strong>Wichtige Hinweise</strong>:</p>
        <ul>
          <li>Alle eingegebenen Informationen werden für die Analyse an OpenAI gesendet</li>
          <li>Die Informationen werden lokal in deinem Browser gespeichert, bis du sie änderst</li>
          <li>Klicke nach der Eingabe auf "Speichern", um die Informationen zu sichern</li>
          <li>Mit "Bearbeiten" kannst du die gespeicherten Informationen später anpassen</li>
        </ul>

        <h2 id="automatische-auswertung-einer-seite">
          Automatische Auswertung einer Seite
        </h2>
        <p>
          Die schnellste Art, problematische Kommentare zu finden und zu
          dokumentieren:
        </p>
        <ol>
          <li>Öffne deinen Post mit den Kommentaren auf X.com</li>
          <li>Prüfe, dass Du alle wichtigen <em>Hintergrundinformationen</em> angegeben hast</li>
          <li>Klicke auf den Button "Seite automatisch auswerten"</li>
        </ol>

        <h3 id="was-passiert-dann">Was passiert dann?</h3>
        <ol>
          <li><em>Strafanzeiger</em> analysiert alle Kommentare auf der Seite</li>
          <li>
            Bei problematischen Kommentaren:
            <ul>
              <li>Screenshot des Kommentars</li>
              <li>Screenshot des Userprofils</li>
              <li>Optional: Profilrecherche mit Perplexity</li>
            </ul>
          </li>
          <li>
            Am Ende wird automatisch eine ZIP-Datei mit allen Anzeigenentwürfen
            heruntergeladen
          </li>
        </ol>

        <p>
          ⚠️ <strong>Wichtige Hinweise</strong>:
        </p>
        <ul>
          <li>Führe immer nur eine Analyse gleichzeitig durch</li>
          <li>
            Der Vorgang kann einige Zeit dauern:
            <ul>
              <li>Einen Post lesen: ~0,5 Sekunden</li>
              <li>Post-Bewertung: ~0,5 Sekunden pro Post (aber mindestens 1 min)</li>
              <li>
                Screenshots & Profilanalyse: ~50 Sekunden pro relevantem
                Profil/Kommentar
              </li>
            </ul>
          </li>
          <li>
            Während der Analyse:
            <ul>
              <li>Lass die Extension ihre Arbeit machen</li>
              <li>Vermeide Interaktionen mit dem Browser</li>
              <li>
                Ein Fortschrittsbalken und Statustext zeigen dir, was gerade
                passiert
              </li>
            </ul>
          </li>
          <li>Die ZIP-Datei wird in deinem Download-Ordner gespeichert</li>
        </ul>

        <h2 id="manuelle-funktionen">Manuelle Funktionen</h2>
        <p>
          Manchmal möchtest du gezielt einzelne Posts oder Profile untersuchen.
          Dafür gibt es diese Optionen:
        </p>

        <h3 id="kommentaranalyse">Kommentaranalyse</h3>
        <ol>
          <li>Klappe "Kommentaranalyse" auf</li>
          <li>
            Füge die URL des Kommentars ein (Format:
            https://x.com/userhandle/status/Zahlen) 💡 <strong>Tipp</strong>:
            Die URL findest du in der Adresszeile deines Browsers, wenn du den
            Kommentar geöffnet hast
          </li>
          <li>
            Kopiere den kompletten Kommentar mit Kontext in das zweite Feld. <strong>User Name, @User Handle, Datum/Uhrzeit sind zwingend notwendig,</strong> wenn Du einen Anzeigenentwurf erstellen willst. Du kannst sie auch anonymisieren, aber dann werden sie so in den Entwurf übernommen.
            <pre>
              Max Beispielmann
              <br />
              @beispiel_user
              <br />
              Dies ist ein Beispielkommentar
              <br />
              11:42 vorm. · 1. Januar 2024
            </pre>
            💡 <strong>Tipp</strong>: Damit das Modell den Post besser bewerten kann, hinterlege im Abschnitt <em>Hintergrundinformationen</em> auch den Inhalt deines ursprünglichen Posts. Denn bei der manuellen Analyse kann <em>Strafanzeiger</em> diese Information nicht selbst finden kann.
          </li>
        </ol>

        <h3 id="screenshots-erstellen">Screenshots erstellen</h3>
        <ol>
          <li>Öffne die Seite, die du dokumentieren möchtest</li>
          <li>Klappe "Screenshots erstellen" auf</li>
          <li>
            Wähle:
            <ul>
              <li><strong>"Ganze Seite - Post"</strong> für einen Screenshot der kompletten Seite (für Posts)</li>
              <li><strong>"Angezeigter Bereich - Profil"</strong> für nur den aktuell sichtbaren Teil (für Profile)</li>
            </ul>
          </li>
          <li>Der Screenshot wird automatisch gespeichert</li>
        </ol>
        <p>
          💡 <strong>Tipp</strong>: Wenn du einen neuen Screenshot der gleichen
          Seite machst, wird der alte überschrieben.
        </p>

        <h3 id="profilrecherche">Profilrecherche</h3>
        <ol>
          <li>Klappe "Profilrecherche" auf</li>
          <li>
            Kopiere die URL des Profils aus der Adresszeile deines Browsers
            (Format: https://x.com/userhandle) in das Feld "Profil-URL:"
          </li>
          <li>
            Markiere alle Informationen im Profil (Name, Userhandle, Bio, etc.)
            und kopiere sie in das Feld "Bekannte Profilinformationen"
            <ul>
              <li>
                Du kannst hier auch weitere dir bekannte Informationen zu dem
                Profil ergänzen
              </li>
            </ul>
          </li>
          <li>
            Die Informationen werden gespeichert und (wenn aktiviert) an
            Perplexity für weitere Recherche gesendet
          </li>
        </ol>

        <p>💡 <strong>Tipp</strong>: Wenn du zu einem anzeigbaren Post alle manuellen Schritte durchgeführt hast (Screenshots von Post und Profil, Profilrecherche und Kommentaranalyse), wird beim Download automatisch ein Strafanzeigenentwurf erstellt.</p>
        <h2 id="nach-der-analyse">Nach der Analyse</h2>
        <ul>
          <li>
            Bei automatischer Auswertung: Die ZIP-Datei wird automatisch
            heruntergeladen
          </li>
          <li>
            Bei manueller Analyse: Du kannst die Ergebnisse später herunterladen
          </li>
          <li>Alle Analysedaten werden beim Schließen des Browsers gelöscht</li>
          <li>Die ZIP-Dateien bleiben in deinem Download-Ordner erhalten</li>
        </ul>
        <p>
          Im nächsten Abschnitt erfährst du, wie du mit den generierten
          Anzeigenentwürfen arbeitest.
        </p>

        <h1 id="arbeiten-mit-anzeigenentwürfen">
          Arbeiten mit Anzeigenentwürfen
        </h1>

        <h2 id="die-zip-datei">Die ZIP-Datei</h2>
        <p>
          Nach jeder Analyse erstellt <em>Strafanzeiger</em> einen ZIP-Ordner mit dem
          Namen "Strafanz_Report" und einem Zeitstempel. Dieser wird:
        </p>
        <ul>
          <li>Bei automatischer Analyse: Direkt heruntergeladen</li>
          <li>Bei manueller Analyse: ⬇️ Zum Download angeboten</li>
        </ul>

        <h3 id="ubersicht">Sich Übersicht verschaffen</h3>
        <p>
          Am einfachsten verschaffst du dir eine Übersicht mit der Datei <strong>Übersicht.html</strong>, die Du im Ordner auf oberster Ebene mit den Anzeigeentwürfen findest.
          Damit kannst du schnell die:
        </p>
        <ul>
          <li>Inhalte der Posts</li>
          <li>schriftliche Bewertung der KI</li>
          <li>Tatbestand und Einstufung (HOCH, MITTEL, NIEDRIG)</li>
        </ul>
        <p>filtern und sortieren und dann ggf. direkt mit einem Klick auf die ID den Anzeigenentwurf öffnen.</p>
        <h3 id="struktur-und-inhalte">Struktur und Inhalte</h3>

        <h4 id="auf-der-hauptebene-findest-du">
          Auf der Hauptebene findest du:
        </h4>
        <ul>
          <li>
            <strong>Übersicht.html</strong>: Hier kannst Du Dir schnell einen Überblick verschaffen welche Anzeigen für dich relevant sind
          </li>
          <li>
            <strong>Anzeige[@handle][TweetID][DELIKTART][Verdacht.Strafwahrscheinlichkeit][Datum].html</strong>:
            Die fertigen Anzeigen
          </li>
          <li>
            <strong>initialPostUrl.txt</strong>: URL des ursprünglichen Posts
          </li>
          <li>
            <strong>AnalyseZeitpunkt.txt</strong>: Zeitpunkt der Analyse
          </li>
        </ul>

        <h4 id="im-ordner-anschreiben-basis-daten">
          Im Ordner "Anschreiben_Basis_Daten":
        </h4>
        <p>Hier liegen die Grundinformationen für alle Anzeigen:</p>
        <ul>
          <li>Abs.Adresse.txt: Deine Absenderadresse</li>
          <li>Abs.Kontakt.txt: Deine Kontaktdaten</li>
          <li>Empf.Adresse.txt: Adresse des Empfängers</li>
          <li>Betreff.txt: Betreffzeile</li>
          <li>Datumszeile.txt: Text der Datumszeile im Brief</li>
          <li>Abs.UnterzeichnendePerson.txt: Name für die Unterschrift</li>
          <li>Anlagen.txt: Anlagenverzeichnis</li>
        </ul>

        <h4 id="für-jeden-user-gibt-es-einen-ordner-handle">
          Für jeden User gibt es einen Ordner (@handle):
        </h4>
        <p>Basis-Informationen zum User:</p>
        <ul>
          <li>userHandle.txt: @handle des Users</li>
          <li>screenname.txt: Anzeigename</li>
          <li>profilUrl.txt: Link zum Profil</li>
          <li>UserInfo_[@handle][Datum].txt: Profilinformationen</li>
          <li>
            ExtraUserInfo_[@handle][Datum].txt: Zusatzinfos (z.B. von Perplexity)
          </li>
          <li>
            screenshotprofile_[@handle]_[Datum].png: Screenshot des Profils
          </li>
        </ul>

        <h4 id="für-jeden-problematischen-kommentar-ein-unterordner-tweetid">
          Für jeden problematischen Kommentar ein Unterordner (TweetID):
        </h4>
        <p>Details zum spezifischen Kommentar:</p>
        <ul>
          <li>Verfolgungsart.txt: Antrags- oder Offizialdelikt</li>
          <li>
            AnzeigenEntwurf_[@handle]_[TweetID]_[Datum].txt: Text für die Anzeige
          </li>
          <li>Post_[@handle]_[TweetID]_[Datum].txt: Original Kommentartext</li>
          <li>Zeitpunkt.txt: Zeitpunkt des Posts</li>
          <li>postUrl.txt: Link zum Kommentar</li>
          <li>screenshot_[@handle]_[TweetID].png: Screenshot des Kommentars</li>
          <li>BegründungDerAnzeige_[@handle]_[TweetID]_[Datum].txt: Begründung warum die KI von OpenAI eine Anzeige für gegeben hält.</li>
        </ul>

        <h2 id="anzeigenentwürfe-anpassen">Anzeigenentwürfe anpassen</h2>
        <p>Du kannst alle Inhalte der Anzeigen bearbeiten:</p>

        <h3 id="texte-ändern">Texte ändern</h3>
        <ol>
          <li>Öffne die entsprechende .txt-Datei im Texteditor</li>
          <li>Bearbeite den Inhalt</li>
          <li>Speichere die Datei</li>
          <li>
            <strong>Wichtig</strong>: Generiere die Anzeigen neu (siehe unten)
          </li>
        </ol>

        <h3 id="screenshots-austauschen">Screenshots austauschen</h3>
        <ol>
          <li>Erstelle einen neuen Screenshot</li>
          <li>Speichere ihn mit dem exakt gleichen Dateinamen wie der alte</li>
        </ol>
        <h3 id="wichtige-regeln-beim-arbeiten-mit-anzeigeentwürfen">
          ⚠️ <strong>Wichtige Regeln</strong>:
        </h3>
        <ul>
          <li>Dateinamen nicht ändern</li>
          <li>Dateien nicht verschieben</li>
          <li>Ordnerstruktur beibehalten</li>
          <li>Lieber Dateien leeren als löschen</li>
        </ul>
        <p>
          💡 <strong>Tipp</strong>: Wenn du bestimmte Informationen nicht in der
          Anzeige haben möchtest (z.B. deine Telefonnummer), leere einfach die
          entsprechende Textdatei.
        </p>

        <h2 id="anzeigen-neu-generieren">Anzeigen neu generieren</h2>
        <p><strong>Nach Änderungen müssen die Anzeigen neu generiert werden</strong>, damit die Inhalte beim Drucken richtig angezeigt werden:</p>
        <ol>
          <li>Öffne die <em>Strafanzeiger</em> Extension</li>
          <li>Klicke auf das 📝-Symbol in der oberen Leiste</li>
          <li>
            Folge den Anweisungen auf der Seite:
            <ul>
              <li>
                Wähle den Ordner aus, in dem du Änderungen vorgenommen hast
              </li>
              <li>
                Wähle aus, ob du alle oder nur bestimmte Anzeigen neu generieren
                möchtest
              </li>
            </ul>
          </li>
          <li>
            Die aktualisierten Anzeigen werden direkt im ausgewählten Ordner
            gespeichert
          </li>
        </ol>
        <p>
          💡 <strong>Tipp</strong>: Das Neu-Generieren ist immer dann nötig,
          wenn du Inhalte in den Textdateien geändert oder Screenshots
          ausgetauscht hast. Die Anzeigen passen sich dann automatisch an die
          neuen Inhalte an.
        </p>

        <h2 id="anzeigen-drucken">Anzeigen drucken</h2>
        <ol>
          <li>Öffne die Anzeige (.html-Datei) möglichst in Firefox</li>
          <li>Wähle im Browser-Menü "Drucken" (oder Strg+P)</li>
          <li>
            Passe die Druckeinstellungen an:
            <ul>
              <li>Papierformat: A4</li>
              <li>
                Header und Footer ausschalten (diese enthalten oft störende
                Browser-Informationen)
              </li>
              <li>
                Skalierung anpassen, falls Inhalte nicht optimal auf die Seiten
                passen
              </li>
              <li>Seitenränder in der Regel auf Standardeinstellung lassen</li>
            </ul>
          </li>
          <li>In der Vorschau prüfen, ob alles gut aussieht</li>
          <li>
            Wähle:
            <ul>
              <li>"Als PDF speichern" oder</li>
              <li>Direkt auf Papier drucken</li>
            </ul>
          </li>
        </ol>
        <p>
          💡 <strong>Tipp</strong>: Firefox eignet sich am besten zum Drucken
          der Anzeigen und bietet die beste Kontrolle über das Layout. Andere
          Browser können zu Formatierungsproblemen führen.
        </p>

        {/* Neuer Unterabschnitt "Strafanzeigen Einreichen" */}
        <h2 id="strafanzeigen-einreichen">Strafanzeigen Einreichen</h2>
        <p>
          Nachdem du deine Anzeigen erstellt hast, kannst du diese wie
          folgt einreichen:
        </p>
        <ul>
          <li>
            Online einreichen: 👉{" "}
            <a
              href="https://portal.onlinewache.polizei.de/de/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Zur Online-Wache
            </a>
          </li>
          <li>Persönlich bei einer Polizeidienststelle einreichen.</li>
        </ul>

        <h1 id="fehlerbehebung">Fehlerbehebung</h1>

        <h2 id="allgemeine-probleme">Allgemeine Probleme</h2>

        <h3 id="die-analyse-startet-nicht-oder-bricht-ab">
          Die Analyse startet nicht oder bricht ab
        </h3>
        <ol>
          <li>
            Prüfe, ob der OpenAI API-Key korrekt eingegeben und gespeichert
            wurde
          </li>
          <li>Lade die X.com-Seite neu und starte die Extension neu</li>
          <li>Starte einen neuen Analysevorgang</li>
        </ol>

        <h3 id="die-zip-datei-wird-nicht-heruntergeladen">
          Die ZIP-Datei wird nicht heruntergeladen
        </h3>
        <ol>
          <li>
            <em>Strafanzeiger</em> versucht die ZIP-Datei automatisch im Download-Ordner
            zu speichern. Je nach Browsereinstellungen kann es sein, dass der
            Browser dich fragt, wo du die Datei speichern möchtest.
          </li>
          <li>
            Prüfe die Download-Einstellungen deines Browsers:
            <ul>
              <li>Sind Downloads von ZIP-Dateien erlaubt?</li>
              <li>Ist der Download-Ordner zugänglich?</li>
            </ul>
          </li>
        </ol>

        <h3 id="screenshots-sind-unvollständig">
          Screenshots sind unvollständig
        </h3>
        <ol>
          <li>Stelle sicher, dass die Seite vollständig geladen ist</li>
          <li>Scrolle einmal durch die gesamte Seite</li>
          <li>Erstelle den Screenshot erneut</li>
        </ol>
        <h2 id="wenn-etwas-nicht-funktioniert">
          Wenn etwas nicht funktioniert
        </h2>
        <p>Bei Problemen kannst du folgende Schritte ausprobieren:</p>
        <ol>
          <li>
            Einfache Lösungen zuerst:
            <ul>
              <li>Seite neu laden</li>
              <li>Extension schließen und wieder öffnen</li>
              <li>Browser neu starten</li>
            </ul>
          </li>
          <li>
            Wenn das nicht hilft:
            <ul>
              <li>API-Keys auf Gültigkeit prüfen</li>
              <li>Browser-Cache leeren</li>
              <li>Extension in einem anderen Browser testen (z.B. Edge)</li>
            </ul>
          </li>
        </ol>

        <h2 id="besonderheiten">Besonderheiten</h2>

        <h3 id="unterschiedliche-ergebnisse-bei-gleichen-kommentaren">
          Unterschiedliche Ergebnisse bei gleichen Kommentaren
        </h3>
        <ul>
          <li>
            Die KI-Analyse arbeitet wie ein Mensch nicht 100% deterministisch
          </li>
          <li>Bei Grenzfällen können unterschiedliche Bewertungen entstehen</li>
          <li>
            Analysiere kritische Fälle ggf. mehrfach und prüfe die Ergebnisse
            sorgfältig.
            <ul><li>Dabei kann dir u.a. die Datei <em>BegründungDerAnzeige</em> helfen, die du
              in jedem Ordner (userhandle/TweetID) zu jedem Kommentar mit Anzeigenentwurf findest.</li>
              <li>Die Datei enthält die Argumentationskette mit der das KI Modell
                von OpenAI, zu seiner Entscheidung gekommen ist.</li></ul>
          </li>
        </ul>

        <h3 id="lange-analysezeiten">Lange Analysezeiten</h3>
        <ul>
          <li>
            Die Verarbeitung erfolgt nacheinander (bzw. bei der Kommentar Analyse auch teilweise parallel) und braucht pro Kommentar etwa:
            <ul>
              <li>15 Sekunden für die Analyse</li>
              <li>10 Sekunden für Screenshots und Profilanalyse</li>
            </ul>
          </li>
          <li>
            Bei vielen Kommentaren kann der Vorgang entsprechend lange dauern
          </li>
          <li>💡 <strong>Tipp</strong>: Lass die Extension einfach ihre Arbeit machen und verwende den Browser in der Zeit nicht. Achte darauf, dass du vom Betriebssystem nicht automatisch abgemeldet wirst.</li>
        </ul>
        <h1 id="best-practices">Praxis Tipps</h1>

        <h2 id="für-bessere-ergebnisse">Für bessere Ergebnisse</h2>
        <ul>
          <li>
            Gib der KI möglichst viel Kontext in den Hintergrundinformationen
          </li>
          <li>
            Kopiere bei manueller Analyse immer den kompletten Kontext eines
            Kommentars
          </li>
        </ul>

        <h2 id="für-die-bedienung">Für die Bedienung</h2>
        <ul>
          <li>Führe immer nur eine Analyse gleichzeitig durch</li>
          <li>Vermeide Browser-Interaktionen während der Analyse</li>
          <li>Achte darauf, dass das Browser-Tab mit x.com das du auswerten willst das aktive Tab ist</li>
          <li>Achte darauf, dass du während der Analyse vom Betriebssystem nicht automatisch abgemeldet wirst.</li>
        </ul>
        <h2 id="für-das-arbeiten-mit-den-ergebnissen">Für das Arbeiten mit den Ergebnissen</h2>
        <ul>
          <li>Prüfe die generierten Anzeigen vor dem Versand</li>
          <li>Dokumentiere wichtige Änderungen in den Anzeigenentwürfen</li>
          <li>Wenn du dich entscheidest Screenshots anzupassen behalte eine Kopie des Originals</li>
        </ul>
        <p>
          ⚠️ <strong>Schütze dich:</strong>
          <ul>
            <li>Mache regelmäßige Pausen</li>
            <li>Versuch mental Abstand von den Inhalten zu halten, um dich nicht zu sehr zu belasten</li>
            <li>Hole dir bei Bedarf Unterstützung</li>
            <ul> <li>Siehe <em>Hilfe in akuten Situationen</em> am Anfang dieser Anleitung</li> <li>Jemand der die Anzeigen mit dir oder für dich bearbeiten kann.</li></ul>
            <li>Denk daran: <strong>Du tust etwas wichtiges gegen Hass im Netz!</strong></li>
          </ul>
        </p>
        <h2 id="einschränkungen-die-du-kennen-solltest">Einschränkungen die du kennen solltest</h2>
        <h3 id="browser-interaktion">Browser-Interaktion</h3>
        <ul>
          <li>
            Während der automatischen Analyse steuert die Extension den Browser
          </li>
          <li>Keine manuelle Navigation oder Interaktion in dieser Zeit</li>
          <li>Die Extension kehrt automatisch zur Ausgangsseite zurück</li>
        </ul>

        <h3 id="dateimanagement">Dateimanagement</h3>
        <ul>
          <li>Anzeigen können nur im vorgegebenen Format gespeichert werden</li>
          <li>Ordnerstruktur und Dateinamen müssen beibehalten werden</li>
          <li>Speichere leere Dateien statt Dateien zu löschen</li>
        </ul>

        <h3 id="ki-analyse">KI-Analyse</h3>
        <ul>
          <li>Nicht jeder problematische Kommentar wird eindeutig erkannt</li>
          <li>Die Analyse kann gerade bei Grenzfällen unterschiedlich ausfallen</li>
          <li>Bilde dir immer ein eigenes Urteil, ob du eine Anzeige gerechtfertigt findest - auch hier kann das Modell falsch liegen</li>
          <ul><li>Das Lesen der jeweiligen <em>BegründungDerAnzeige</em> Datei kann dir ggf. dabei helfen</li></ul>
          <li>Perplexity findet nicht immer zusätzliche Informationen</li>
          <li>Prüfe Links die die KI ggf. ausgibt. Diese können u.U. falsch sein. Außerdem kann im Netz nie ausgeschlossen werden dass ein Link bösartig ist.</li>
        </ul>
        <p>
          💡 <strong>Tipp</strong>: Wenn du unsicher bist, ob ein
          Kommentar relevant ist:
          <ul><ul>
            <li>Analysiere ihn erneut manuell</li>
            <li>
              Gib der KI zusätzlichen Kontext in den <em>Hintergrundinformationen</em> -
              z.B. auch eine Beschreibung des Bildes wenn der Kommentar eines
              enthält.
            </li>
          </ul></ul>
        </p>

      </div>
    </div>
  );
}

export default App;
