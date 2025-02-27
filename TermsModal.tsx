import React from "react";

interface TermsModalProps {
    alreadyAccepted: boolean;
    onAccept: () => void;
}

const TermsModalFinal: React.FC<TermsModalProps> = ({ alreadyAccepted, onAccept }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-body">

                    <h2>Nutzungsbedingungen für die Chrome-Extension "Strafanzeiger"</h2>
                    <hr />

                    {/* A. Allgemeine Nutzungsbedingungen */}
                    <h3>A. Allgemeine Nutzungsbedingungen</h3>

                    <h4>1. Geltungsbereich</h4>
                    <p>
                        1.1 Diese Nutzungsbedingungen regeln das Verhältnis zwischen dem Anbieter der Chrome-Extension <em>Strafanzeiger</em> ([Developer], im Folgenden "wir" oder "uns") und den Nutzern der Extension (im Folgenden "Sie" oder "Nutzer").
                    </p>
                    <p>
                        1.2 Die Nutzung der Extension ist ausschließlich volljährigen Privatpersonen gestattet. Eine gewerbliche Nutzung
                        oder Nutzung durch Minderjährige ist nicht erlaubt.
                    </p>
                    <p>1.3 Die Extension wird kostenlos zur Verfügung gestellt.</p>
                    <p>
                        1.4 Durch die Nutzung der Extension erklären Sie sich mit diesen Nutzungsbedingungen einverstanden. Falls Sie
                        nicht einverstanden sind, dürfen Sie die Extension nicht installieren oder verwenden.
                    </p>

                    <hr />

                    <h4>2. Vertragsgegenstand</h4>
                    <p>
                        2.1 <em>Strafanzeiger</em> ist eine Open-Source-Chrome-Extension, die Nutzern hilft, öffentlich gepostete Inhalte auf
                        X.com (ehemals Twitter) auf strafrechtliche Relevanz zu überprüfen und Beweismaterial für eine mögliche
                        Strafanzeige zu sichern.
                    </p>
                    <p>2.2 Die Extension bietet die folgenden Funktionen:</p>
                    <ul>
                        <li>
                            <strong>Automatische und manuelle Analyse von Tweets</strong> mittels KI-gestützter Bewertung (OpenAI API).
                        </li>
                        <li>
                            <strong>Beweissicherung durch Screenshots</strong> und Extraktion relevanter Profildaten.
                        </li>
                        <li>
                            <strong>Optionale Websuche nach weiteren öffentlich verfügbaren Informationen</strong> (Perplexity API).
                        </li>
                        <li>
                            <strong>Automatisierte Erstellung eines Anzeigenentwurfs</strong> auf Basis der gesammelten Informationen.
                        </li>
                    </ul>
                    <p>
                        2.3 Die Extension selbst verarbeitet Daten nur lokal auf dem Gerät des Nutzers. Externe API-Dienste (OpenAI, Perplexity)
                        werden nur auf ausdrückliche Veranlassung des Nutzers mit den erforderlichen Daten angesprochen.
                    </p>
                    <p>
                        2.4 Die Installation und Nutzung erfolgt auf eigene Verantwortung des Nutzers. Wir haben keinen Einfluss darauf,
                        wie und in welchem Umfang die Extension eingesetzt wird. Die Nutzung der durch die Extension erstellten Inhalte
                        (z. B. Anzeigenentwürfe) liegt allein in der Verantwortung des Nutzers.
                    </p>
                    <p>
                        2.5 Wir übernehmen keine Gewähr dafür, dass die Extension jederzeit fehlerfrei funktioniert, mit allen Geräten
                        kompatibel ist oder dauerhaft zur Verfügung steht.
                    </p>

                    <hr />

                    <h4>3. Pflichten und Verantwortung der Nutzer</h4>
                    <p>
                        3.1 Sie verpflichten sich, die Extension nur im Einklang mit geltenden Gesetzen und diesen Nutzungsbedingungen
                        zu verwenden. Insbesondere ist es nicht gestattet:
                    </p>
                    <ul>
                        <li>die Extension zur systematischen Erfassung oder Speicherung personenbezogener Daten Dritter ohne deren Wissen zu verwenden,</li>
                        <li>automatisierte Massenanalysen oder Data-Mining durchzuführen,</li>
                        <li>die gewonnenen Daten für Zwecke zu verwenden, die nicht der Beweissicherung und rechtlichen Verfolgung dienen.</li>
                    </ul>
                    <p>
                        3.2 Die durch die Extension erstellten Entwürfe sind lediglich Hilfsmittel. Sie sind selbst dafür verantwortlich,
                        alle Inhalte zu überprüfen und deren rechtliche Zulässigkeit sicherzustellen, bevor Sie diese weiterverwenden. Die Extension ersetzt keine Rechtsberatung.
                    </p>
                    <p>
                        3.3 Die Nutzung von API-Diensten (OpenAI, Perplexity) setzt voraus, dass der Nutzer eigenständig API-Schlüssel
                        erwirbt und sich an die jeweiligen Nutzungsbedingungen der Drittanbieter hält. Wir sind nicht verantwortlich
                        für deren Datenschutz- oder Nutzungsrichtlinien. Insbesondere verweisen wir darauf, dass für eine professionelle
                        oder gewerbliche Nutzung zusätzliche rechtliche Anforderungen bestehen können (z. B. Abschluss eines
                        Auftragsverarbeitungsvertrags), deren Einhaltung in Ihrer Verantwortung liegt.
                    </p>
                    <p>
                        3.4 Sofern die Extension im Kontext von X.com eingesetzt wird, gelten zusätzlich die Nutzungsbedingungen und
                        Richtlinien von X.com. Es obliegt Ihnen zu prüfen, ob die automatisierte Analyse von Inhalten durch die
                        Extension mit den Vorgaben von X.com vereinbar ist.
                    </p>

                    <hr />

                    {/* --- VEREINHEITLICHTES KAPITEL 4: Datenschutz & Datenverarbeitung --- */}
                    <h4>4. Datenschutz &amp; Datenverarbeitung</h4>

                    <p><strong>4.1 Verantwortlicher</strong><br />
                        Sie sind für die Datenverarbeitung im Rahmen der Nutzung der Extension verantwortlich.
                    </p>

                    <p><strong>4.2 Grundsatz</strong><br />
                        Die Extension speichert oder überträgt keine personenbezogenen Daten an den Anbieter oder Dritte,
                        außer wenn dies durch den Nutzer selbst initiiert wird (z. B. API-Abfragen an OpenAI oder Perplexity).
                    </p>

                    <p><strong>4.3 Verarbeitung personenbezogener Daten</strong><br />
                        4.3.1 Die Extension verarbeitet keine personenbezogenen Daten der Nutzer auf einem eigenen Server.
                        Alle Verarbeitungen finden lokal auf dem Rechner des Nutzers statt.<br />
                        4.3.2 Personenbezogene Daten Dritter (z. B. Tweet-Inhalte und Profildaten) werden von der Extension
                        nur zur Analyse und Beweissicherung verarbeitet. Diese Daten werden während der Verarbeitung
                        temporär im Browser gehalten und nicht an den Anbieter der Extension übertragen.<br />
                        4.3.3 Wenn der Nutzer OpenAI oder Perplexity zur Analyse nutzt, erfolgt die Datenübertragung an diese
                        Anbieter direkt durch den Nutzer. Die Datenschutzrichtlinien der jeweiligen API-Anbieter sind zu beachten.
                    </p>

                    <p><strong>4.4 Anonymisierung</strong><br />
                        Bei der automatisierten Analyse werden Benutzername und URL des Tweets anonymisiert.
                        Der Tweet-Text selbst bleibt unverändert.
                    </p>

                    <p><strong>4.5 Nutzung externer APIs</strong><br />
                        Die Nutzung der APIs von OpenAI und Perplexity erfordert eine eigenständige Registrierung
                        bei diesen Diensten durch den Nutzer. Die Datenverarbeitung unterliegt den jeweiligen
                        Datenschutzrichtlinien dieser Anbieter.
                    </p>

                    <p><strong>4.6 Datensicherheit und Sorgfaltspflicht</strong><br />
                        Der Nutzer ist selbst dafür verantwortlich, seine eigenen Daten zu sichern und
                        sicherzustellen, dass keine unrechtmäßigen oder rechtswidrigen Datenverarbeitungen vorgenommen werden.
                    </p>

                    <p><strong>4.7 Betroffenenrechte</strong><br />
                        Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer eigenen Daten, soweit diese durch die
                        Extension verarbeitet werden. Da die Extension keine zentralisierte Speicherung durchführt, liegt die
                        Verantwortung für die Verwaltung und Löschung der lokal gespeicherten Daten beim Nutzer.
                    </p>

                    <p><strong>4.8 Datenübermittlung in Drittländer</strong><br />
                        Wenn der Nutzer OpenAI oder Perplexity zur Analyse nutzt, können personenbezogene Daten in die USA übertragen
                        werden. Für diese Übermittlung gelten die Datenschutzvereinbarungen der jeweiligen API-Anbieter.
                    </p>

                    <p><strong>4.9 Speicherung und Löschung</strong><br />
                        Die Extension speichert keine personenbezogenen Daten auf einem Server. Alle Daten bleiben lokal auf dem
                        Gerät des Nutzers, bis dieser sie löscht.
                    </p>

                    <hr />

                    <h4>5. Haftungsausschluss</h4>
                    <p>5.1 Die Nutzung der Extension erfolgt auf eigene Gefahr. Wir übernehmen keine Haftung für:</p>
                    <ul>
                        <li>fehlerhafte oder unvollständige KI-Analysen,</li>
                        <li>falsche oder missverständliche Ergebnisse der API-Abfragen,</li>
                        <li>rechtliche Konsequenzen, die sich aus der Verwendung der Extension ergeben.</li>
                    </ul>
                    <p>
                        5.2 Wir garantieren nicht, dass durch die Extension erkannte Inhalte tatsächlich strafrechtlich relevant sind
                        oder dass mit der erstellten Anzeige eine behördliche Verfolgung erfolgt.
                    </p>
                    <p>
                        5.3 <strong>Rechtliche Hinweise</strong>: Soweit wir in dieser Extension oder in der zugehörigen Dokumentation
                        unverbindliche Informationen zu möglichen rechtlichen oder datenschutzrechtlichen Anforderungen geben (z. B.
                        Verweis auf EU AI Act, DSGVO, Auftragsverarbeitungsverträge oder andere Compliance-Vorgaben), stellen diese
                        Hinweise keine Rechtsberatung dar. Wir übernehmen keine Gewähr für Aktualität, Richtigkeit oder Vollständigkeit
                        solcher Informationen. Es liegt in Ihrer Verantwortung, sich eigenständig über die geltenden Rechtsvorschriften
                        und Anforderungen zu informieren, gegebenenfalls rechtlichen Rat einzuholen und für die Einhaltung aller
                        gesetzlichen Vorgaben zu sorgen.
                    </p>

                    <hr />

                    <h4>6. Rechte der Anbieter</h4>
                    <p>6.1 Wir behalten uns vor, die Extension weiterzuentwickeln, zu ändern oder einzustellen.</p>
                    <p>
                        6.2 Da die Extension lokal auf dem Gerät des Nutzers ausgeführt wird und wir keine Kontrolle über deren Nutzung
                        haben, können wir nach dem technischen Stand zur erstmaligen Veröffentlichung der Software keine technischen
                        Maßnahmen ergreifen, um einzelne Nutzer von der Nutzung auszuschließen. Sollte ein Nutzer gegen diese
                        Nutzungsbedingungen oder geltendes Recht verstoßen, behalten wir uns vor, rechtliche Schritte einzuleiten
                        oder technische Maßnahmen anzuwenden, wenn diese verfügbar werden.
                    </p>

                    <hr />

                    <h4>7. Anwendbares Recht, Schlussbestimmungen</h4>
                    <p>7.1 Es gilt das Recht der Bundesrepublik Deutschland.</p>
                    <p>
                        7.2 Sollte eine Bestimmung dieser Nutzungsbedingungen unwirksam sein oder werden, bleibt die Wirksamkeit der
                        übrigen Bestimmungen unberührt.
                    </p>

                    <hr />
                    <p>
                        Diese Nutzungsbedingungen und Datenschutzhinweise können von Zeit zu Zeit aktualisiert werden. Die jeweils
                        gültige Fassung wird in der Extension oder auf der offiziellen Webseite des Projekts zur Verfügung gestellt.
                    </p>

                    <button onClick={onAccept}>
                        {alreadyAccepted ? "✅ Bereits akzeptiert" : "Akzeptieren"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModalFinal;
