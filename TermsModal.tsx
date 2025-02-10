// TermsModal.tsx
import React from "react";

interface TermsModalProps {
    alreadyAccepted: boolean;
    onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ alreadyAccepted, onAccept }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Nutzungsbedingungen (Entwurf)</h2>
                <div className="modal-body">
                    <p>
                        Willkommen bei der Strafanzeiger-Chrome-Extension! Bitte beachten Sie,
                        dass die folgenden Nutzungsbedingungen ein Entwurf sind und ausschließlich
                        zur Information dienen. Sie können Änderungen unterliegen.
                    </p>
                    <h3>1. Allgemeine Bestimmungen</h3>
                    <ul>
                        <li>
                            Die Strafanzeiger-Chrome-Extension wird von der Firma JAKBU bereitgestellt
                            und steht unter der MIT-Lizenz zur Verfügung.
                        </li>
                        <li>
                            Durch die Nutzung der Extension erklären Sie sich mit diesen
                            Nutzungsbedingungen einverstanden. Falls Sie mit diesen Bedingungen
                            nicht einverstanden sind, nutzen Sie die Extension bitte nicht.
                        </li>
                    </ul>

                    <h3>2. Bestimmungsgemäße Nutzung</h3>
                    <ul>
                        <li>
                            Die Extension dient ausschließlich dazu, strafrechtlich relevante Inhalte
                            auf X (ehemals Twitter) zu analysieren und rechtliche Schritte vorzubereiten.
                            Jede andere Nutzung, insbesondere missbräuchliche oder rechtswidrige
                            Anwendungen, ist verboten.
                        </li>
                        <li>
                            Beispiele für missbräuchliche Nutzung:
                            <ul>
                                <li>Erstellen und Einreichen von Anzeigen, die nicht gerechtfertigt sind.</li>
                                <li>
                                    Nutzung der Extension zur systematischen Überwachung oder Belästigung
                                    anderer Personen.
                                </li>
                            </ul>
                        </li>
                    </ul>

                    <h3>3. Haftungsausschluss</h3>
                    <ul>
                        <li>
                            Die Extension wird ohne Garantie bereitgestellt. Der Anbieter übernimmt
                            keine Haftung für:
                            <ul>
                                <li>Schäden, die durch die Nutzung entstehen.</li>
                                <li>Fehlerhafte oder unvollständige Ergebnisse der Analyse.</li>
                                <li>Etwaige rechtliche Konsequenzen, die aus der Nutzung resultieren.</li>
                            </ul>
                        </li>
                        <li>
                            Nutzer tragen die volle Verantwortung für:
                            <ul>
                                <li>Die Richtigkeit der erstellten Dokumente.</li>
                                <li>Die Einhaltung der Nutzungsbedingungen von X.com.</li>
                                <li>Die korrekte Einreichung von Anzeigen bei den Behörden.</li>
                            </ul>
                        </li>
                    </ul>

                    <h3>4. Rechtliche Hinweise</h3>
                    <ul>
                        <li>
                            Die Extension erstellt lediglich Entwürfe für Strafanzeigen und ersetzt
                            keine juristische Beratung.
                        </li>
                        <li>
                            Nutzer sollten die generierten Dokumente sorgfältig prüfen und sich im
                            Zweifelsfall an einen Anwalt wenden.
                        </li>
                        <li>
                            Die Nutzung der Extension zur Erstellung von Screenshots darf nur erfolgen,
                            wenn dies gerechtfertigt ist, da Screenshots urheberrechtlich geschützte
                            Inhalte enthalten können.
                        </li>
                    </ul>

                    <h3>5. Datenschutz</h3>
                    <ul>
                        <li>
                            Die Verarbeitung der Daten erfolgt überwiegend lokal auf dem Rechner des Nutzers.
                        </li>
                        <li>
                            Persönliche Daten, wie Adressinformationen, werden nur für die Erstellung
                            von Strafanzeigen verwendet und nicht an Dritte weitergegeben, es sei denn,
                            dies ist im Rahmen der Strafanzeige erforderlich.
                        </li>
                        <li>
                            Zur Analyse werden Textinhalte und Metadaten an OpenAI oder Perplexity
                            gesendet. Der Nutzer ist verantwortlich für die sorgfältige Eingabe und
                            Prüfung der Informationen.
                        </li>
                    </ul>

                    <h3>6. Technische Einschränkungen</h3>
                    <ul>
                        <li>
                            Die Extension wurde für Google Chrome entwickelt und getestet. Eine Nutzung
                            in anderen Browsern erfolgt auf eigenes Risiko.
                        </li>
                        <li>
                            Bei der automatischen Analyse steuert die Extension den Browser. Manuelle
                            Eingriffe während des Analyseprozesses können die Ergebnisse beeinträchtigen.
                        </li>
                        <li>
                            Ergebnisse der KI-gestützten Analyse können variieren, insbesondere bei
                            Grenzfällen.
                        </li>
                    </ul>

                    <h3>7. Lizenz und Open-Source-Nutzung</h3>
                    <ul>
                        <li>
                            Die Extension steht unter der MIT-Lizenz zur Verfügung. Der Quellcode kann
                            öffentlich eingesehen, genutzt und verändert werden, unter Beachtung der
                            Lizenzbedingungen.
                        </li>
                        <li>Hinweise zur Lizenz sind im Quellcode enthalten.</li>
                    </ul>

                    <h3>8. Änderungen der Nutzungsbedingungen</h3>
                    <ul>
                        <li>
                            JAKBU behält sich das Recht vor, diese Nutzungsbedingungen jederzeit zu ändern.
                            Die geänderten Bedingungen werden mit der nächsten Version der Extension
                            bereitgestellt.
                        </li>
                    </ul>

                    <h3>9. Kontakt</h3>
                    <p>
                        Für Fragen oder Hinweise wenden Sie sich bitte an JAKBU über die entsprechenden
                        Open-Source-Kanäle (z. B. GitHub).
                    </p>

                    <button onClick={onAccept}>
                        {alreadyAccepted ? "✅ Bereits akzeptiert" : "Akzeptieren"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
