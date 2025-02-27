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

                    <h3>1. Geltungsbereich</h3>
                    <p>
                        Diese Nutzungsbedingungen regeln das Verhältnis zwischen dem Anbieter der
                        Chrome-Extension Strafanzeiger ([Developer]) und den Nutzern.
                    </p>

                    <h3>2. Vertragsgegenstand</h3>
                    <p>
                        Strafanzeiger ist eine Open-Source-Chrome-Extension zur Analyse strafrechtlich
                        relevanter Inhalte auf X.com. Alle Datenverarbeitungen erfolgen lokal.
                    </p>

                    <h3>3. Pflichten und Verantwortung der Nutzer</h3>
                    <ul>
                        <li>Die Nutzung darf nur im Einklang mit geltenden Gesetzen erfolgen.</li>
                        <li>Erstellung und Nutzung von Anzeigen erfolgt in eigener Verantwortung.</li>
                        <li>API-Nutzung (OpenAI, Perplexity) erfordert eigene Registrierung.</li>
                        <li>Es gelten zusätzlich die Nutzungsbedingungen von X.com.</li>
                    </ul>

                    <h3>4. Datenschutz & Datenverarbeitung</h3>
                    <ul>
                        <li>Es werden keine personenbezogenen Daten gespeichert oder weitergegeben.</li>
                        <li>Datenübertragungen erfolgen nur durch den Nutzer (API-Abfragen).</li>
                    </ul>

                    <h3>5. Haftungsausschluss</h3>
                    <ul>
                        <li>Die Extension wird ohne Garantie bereitgestellt.</li>
                        <li>Fehlerhafte KI-Analysen können auftreten.</li>
                        <li>Rechtliche Konsequenzen aus der Nutzung liegen in der Verantwortung des Nutzers.</li>
                        <li>
                            Rechtliche Hinweise in dieser Extension sind keine Rechtsberatung.
                            Nutzer sind verpflichtet, sich eigenständig über geltendes Recht zu informieren.
                        </li>
                    </ul>

                    <h3>6. Rechte der Anbieter</h3>
                    <ul>
                        <li>Die Extension kann weiterentwickelt oder eingestellt werden.</li>
                        <li>Technische Maßnahmen zur Nutzungsbeschränkung sind derzeit nicht möglich.</li>
                    </ul>

                    <h3>7. Anwendbares Recht, Schlussbestimmungen</h3>
                    <p>Es gilt das Recht der Bundesrepublik Deutschland.</p>

                    <button onClick={onAccept}>
                        {alreadyAccepted ? "✅ Bereits akzeptiert" : "Akzeptieren"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
