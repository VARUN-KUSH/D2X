import React, { useState } from 'react';
import './popup.css';

function Popup() {
    const [analysisId, setAnalysisId] = useState('');
    const [showHelpSection, setShowHelpSection] = useState(false);
    const [showSettingsSection, setShowSettingsSection] = useState(false);

    const toggleHelpSection = () => setShowHelpSection(!showHelpSection);
    const toggleSettingsSection = () => setShowSettingsSection(!showSettingsSection);

    return (
        <div>
            <header>
                <h1>D2X</h1>
                <div className="header-icons">
                    <span id="mainHelpIcon" className="main-icon" title="Über D2X" onClick={toggleHelpSection}>ⓘ</span>
                    <span id="settingsToggle" className="main-icon" title="Einstellungen" onClick={toggleSettingsSection}>⚙️</span>
                </div>
            </header>

            <div id="analysisIdSection">
                Analysis ID: <span id="analysisId">{analysisId}</span>
            </div>

            <main>
                {showHelpSection && (
                    <section id="mainHelpSection">
                        <h2>Über D2X</h2>
                        <p>D2X ist eine Erweiterung zur automatischen Auswertung von Social-Media-Beiträgen und zur Erstellung von Berichten über potenziell illegale Inhalte zur Einreichung bei Behörden.</p>
                        <p>Die Erweiterung führt folgende Schritte aus:</p>
                        <ol>
                            <li>Erfassung von Screenshots der aktuellen Seite</li>
                            <li>Extraktion relevanter Inhalte</li>
                            <li>KI-gestützte Analyse der Inhalte</li>
                            <li>Erstellung eines Berichts mit Empfehlungen</li>
                            <li>Zusammenstellung aller Beweise in einer ZIP-Datei</li>
                        </ol>
                        <p>Alle sensitiven Daten werden lokal in Ihrem Browser verarbeitet und nur die für die Analyse notwendigen Informationen an die KI-Dienste übermittelt.</p>
                    </section>
                )}

                {showSettingsSection && (
                    <section id="settingsSection">
                        <h2>Einstellungen</h2>
                        <details id="apiKeysSection">
                            <summary>API Keys</summary>
                            <div>
                                <label htmlFor="openaiApiKey">
                                    OpenAI API-Schlüssel:
                                    <span className="help-icon" title="Der API-Key wird benötigt, um die KI-Services von OpenAI zu nutzen. Er wird lokal im Browser gespeichert und bei Anfragen an OpenAI gesendet.">ⓘ</span>
                                </label>
                                <input type="password" id="openaiApiKey" name="openaiApiKey" />
                                <button id="saveOpenaiKey">API-Schlüssel speichern</button>

                                <label htmlFor="perplexityApiKey">
                                    Perplexity API-Schlüssel:
                                    <span className="help-icon" title="Der API-Key wird benötigt, um die KI-Services von Perplexity.ai zu nutzen. Er wird lokal im Browser gespeichert und bei Anfragen an Perplexity.ai gesendet.">ⓘ</span>
                                </label>
                                <input type="password" id="perplexityApiKey" name="perplexityApiKey" />
                                <button id="savePerplexityKey">API-Schlüssel speichern</button>
                            </div>
                        </details>

                        <details id="addressSection">
                            <summary>Adressdaten</summary>
                            <div>
                                <label htmlFor="senderAddress">
                                    Absender:
                                    <span className="help-icon" title="Geben Sie hier die Adresse des Absenders ein. Diese Daten werden nur lokal in Ihrem Browser gespeichert und ausschließlich lokal verarbeitet.">ⓘ</span>
                                </label>
                                <textarea id="senderAddress" name="senderAddress"></textarea>
                                <button id="saveSenderAddress">Speichern</button>

                                <label htmlFor="recipientAddress">
                                    Empfänger:
                                    <span className="help-icon" title="Geben Sie hier die Adresse des Empfängers ein. Diese Daten werden nur lokal in Ihrem Browser gespeichert und ausschließlich lokal verarbeitet.">ⓘ</span>
                                </label>
                                <textarea id="recipientAddress" name="recipientAddress"></textarea>
                                <button id="saveRecipientAddress">Speichern</button>
                            </div>
                        </details>

                        <details id="backgroundInfoSection">
                            <summary>Hintergrundinformationen</summary>
                            <div>
                                <label htmlFor="backgroundInfo">
                                    Hintergrundinformationen:
                                    <span className="help-icon" title="Geben Sie hier zusätzliche Hintergrundinformationen ein. Diese Informationen werden an OpenAI gesendet, um bei der Bewertung der Nachrichten berücksichtigt zu werden.">ⓘ</span>
                                </label>
                                <textarea id="backgroundInfo" name="backgroundInfo"></textarea>
                                <button id="saveBackgroundInfo">Speichern</button>
                            </div>
                        </details>
                    </section>
                )}

                <section id="mainActions">
                    <details id="evaluateSection" open>
                        <summary>Seite Auswerten</summary>
                        <div>
                            <button id="evaluatePage" title="Führt eine automatische Auswertung der Seite aus, inklusive Screenshots, Profilsuchen und Beweissicherungen, und stellt die Ergebnisse zum Download bereit.">Seite auswerten</button>
                        </div>
                    </details>

                    <details id="screenshotSection">
                        <summary>Screenshots erstellen</summary>
                        <div>
                            <button id="fullPageScreenshot" title="Erstellt einen Screenshot der gesamten Webseite, einschließlich der Bereiche, die aktuell nicht sichtbar sind.">Ganze Seite</button>
                            <button id="visibleAreaScreenshot" title="Erstellt einen Screenshot des aktuell sichtbaren Bereichs der Webseite.">Angezeigter Bereich</button>
                        </div>
                    </details>

                    <details id="profileSection">
                        <summary>Profilrecherche</summary>
                        <div>
                            <label htmlFor="profileUrl">Profil-URL: <span className="help-icon" title="Geben Sie hier die URL des Benutzerprofils ein, das untersucht werden soll.">ⓘ</span></label>
                            <input type="text" id="profileUrl" name="profileUrl" />
                            <label htmlFor="knownProfileInfo">Bekannte Profilinformationen: <span className="help-icon" title="Geben Sie hier zusätzliche Informationen ein, die als Ergänzung für die Recherche an Perplexity.ai gesendet werden.">ⓘ</span></label>
                            <textarea id="knownProfileInfo" name="knownProfileInfo"></textarea>
                            <button id="searchProfile" title="Startet eine Recherche des angegebenen Profils mithilfe von Perplexity.ai.">Profil recherchieren</button>
                        </div>
                    </details>
                </section>

                <section id="progressSection" style={{ display: 'none' }}>
                    <div id="progressBar">
                        <div id="progressBarFill"></div>
                    </div>
                    <div id="progressText">Wird bearbeitet...</div>
                </section>

                <section id="resultsSection" style={{ display: 'none' }}>
                    <button id="downloadResults" title="Speichert die bisher erstellten Ergebnisse in einem ZIP-Ordner, der im Download-Ordner abgelegt wird.">Ergebnisse herunterladen</button>
                    <div id="results"></div>
                </section>
            </main>
        </div>
    );
}

export default Popup;

