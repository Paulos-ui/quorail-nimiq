import type { Language } from "./translations";
const patterns: [RegExp, Record<Exclude<Language, "en">, string>][] = [
  [
    /^(.+) NIM short after recorded commitments and reserve\.$/,
    {
      es: "Faltan $1 NIM tras compromisos y reserva.",
      de: "Nach Verpflichtungen und Reserve fehlen $1 NIM.",
      fr: "Il manque $1 NIM après engagements et réserve.",
    },
  ],
  [
    /^(.+) NIM above your reserve after recorded commitments\.$/,
    {
      es: "$1 NIM sobre la reserva tras los compromisos.",
      de: "$1 NIM über der Reserve nach Verpflichtungen.",
      fr: "$1 NIM au-dessus de la réserve après engagements.",
    },
  ],
  [
    /^Reserve first at risk: (.+)$/,
    {
      es: "Primera fecha de riesgo para la reserva: $1",
      de: "Reserve erstmals gefährdet: $1",
      fr: "Première date de risque pour la réserve : $1",
    },
  ],
  [
    /^Last checked (.+)\. Read from Nimiq Pay’s current payment account\. Incoming top-ups may still be pending\.$/,
    {
      es: "Última consulta: $1. Saldo de la cuenta de pago actual de Nimiq Pay. Las recargas pueden seguir pendientes.",
      de: "Zuletzt geprüft: $1. Guthaben des aktuellen Nimiq-Pay-Zahlungskontos. Aufladungen können noch ausstehen.",
      fr: "Dernière vérification : $1. Solde du compte de paiement actuel Nimiq Pay. Les recharges peuvent rester en attente.",
    },
  ],
  [
    /^Last export requested: (.+)\. Check that the file was saved\.$/,
    {
      es: "Última exportación solicitada: $1. Comprueba que se guardó el archivo.",
      de: "Letzter Export angefordert: $1. Prüfe, ob die Datei gespeichert wurde.",
      fr: "Dernier export demandé : $1. Vérifiez que le fichier a été enregistré.",
    },
  ],
  [
    /^Collect (.+) NIM into your connected planning account\. Incoming contributions do not mark the outgoing bill as paid\.$/,
    {
      es: "Recoge $1 NIM en tu cuenta conectada. Las contribuciones no marcan la factura saliente como pagada.",
      de: "Sammle $1 NIM auf dem verbundenen Konto. Beiträge markieren die ausgehende Rechnung nicht als bezahlt.",
      fr: "Collectez $1 NIM sur le compte connecté. Les contributions ne marquent pas la facture sortante comme payée.",
    },
  ],
  [
    /^Payment submitted but storage failed\. Export your plan now\. Transaction: (.+)$/,
    {
      es: "Pago enviado, pero falló el almacenamiento. Exporta el plan ahora. Transacción: $1",
      de: "Zahlung eingereicht, Speicherung fehlgeschlagen. Exportiere jetzt den Plan. Transaktion: $1",
      fr: "Paiement envoyé, mais stockage échoué. Exportez le plan maintenant. Transaction : $1",
    },
  ],
  [
    /^This board uses (.+)\. Switch the wallet network first\.$/,
    {
      es: "Este tablero usa $1. Cambia primero la red de la cartera.",
      de: "Diese Übersicht verwendet $1. Wechsle zuerst das Wallet-Netzwerk.",
      fr: "Ce tableau utilise $1. Changez d’abord le réseau du portefeuille.",
    },
  ],
  [
    /^(.+) timed out\. Check Nimiq Pay's connection, then try Refresh\. No payment was sent by this check\.$/,
    {
      es: "La consulta agotó el tiempo. Comprueba la conexión de Nimiq Pay y actualiza. Esta consulta no envió pagos.",
      de: "Zeitüberschreitung bei der Abfrage. Prüfe Nimiq Pay und aktualisiere. Diese Prüfung hat keine Zahlung gesendet.",
      fr: "Délai de consultation dépassé. Vérifiez la connexion Nimiq Pay puis actualisez. Cette vérification n’a envoyé aucun paiement.",
    },
  ],
  [
    /^You win\. Try another round\.$/,
    {
      es: "Has ganado. Prueba otra ronda.",
      de: "Du gewinnst. Versuche eine neue Runde.",
      fr: "Vous gagnez. Essayez une nouvelle manche.",
    },
  ],
  [
    /^Bot wins\. Try another round\.$/,
    {
      es: "Gana el bot. Prueba otra ronda.",
      de: "Der Bot gewinnt. Versuche eine neue Runde.",
      fr: "Le robot gagne. Essayez une nouvelle manche.",
    },
  ],
  [
    /^Checkmate\. Black wins\.$/,
    {
      es: "Jaque mate. Ganan negras.",
      de: "Schachmatt. Schwarz gewinnt.",
      fr: "Échec et mat. Les noirs gagnent.",
    },
  ],
  [
    /^Checkmate\. White wins\.$/,
    {
      es: "Jaque mate. Ganan blancas.",
      de: "Schachmatt. Weiß gewinnt.",
      fr: "Échec et mat. Les blancs gagnent.",
    },
  ],
  [
    /^White to move( • Check)?\.$/,
    { es: "Turno de blancas.", de: "Weiß am Zug.", fr: "Aux blancs de jouer." },
  ],
  [
    /^Black to move( • Check)?\.$/,
    {
      es: "Turno de negras.",
      de: "Schwarz am Zug.",
      fr: "Aux noirs de jouer.",
    },
  ],
];
export function translatePattern(language: Language, text: string) {
  if (language === "en") return undefined;
  for (const [regex, values] of patterns)
    if (regex.test(text)) {
      const result = text.replace(regex, values[language]);
      return text.includes(" • Check")
        ? result + { es: " Jaque.", de: " Schach.", fr: " Échec." }[language]
        : result;
    }
}
