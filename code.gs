// ============================================
// Google Apps Script - Identification Backend
// ============================================
// Copiez tout ce code dans script.google.com
// ============================================

// ⚙️ CONFIGURATION
// TODO: Remplacez ces valeurs par les vôtres
const SHEET_ID = "YOUR_SHEET_ID"; // Exemple: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
const SHEET_NAME = "Sheet1"; // Remplacez par le nom de votre feuille

// ============================================
// GET ENDPOINT - Récupère les données
// ============================================
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Headers (première ligne)
    const headers = data[0];
    
    // Convertir en array d'objets
    const records = [];
    for (let i = 1; i < data.length; i++) {
      const record = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = data[i][j];
      }
      records.push(record);
    }
    
    return ContentService.createTextOutput(JSON.stringify(records))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// POST ENDPOINT - Ajoute de nouvelles données
// ============================================
function doPost(e) {
  try {
    // Parser les données reçues
    const data = JSON.parse(e.postData.contents);
    
    // Ouvrir la feuille
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // Récupérer les headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Construire la nouvelle ligne en fonction de l'ordre des headers
    const newRow = [];
    for (let header of headers) {
      newRow.push(data[header] || "");
    }
    
    // Ajouter la ligne au sheet
    sheet.appendRow(newRow);
    
    // Retourner le succès
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Données enregistrées avec succès"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Erreur: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// OPTIONNEL: Fonction de test
// ============================================
function testConnection() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    Logger.log("✓ Connexion réussie!");
    Logger.log("Dernière ligne: " + lastRow);
    Logger.log("Dernière colonne: " + lastCol);
    Logger.log("Headers: " + sheet.getRange(1, 1, 1, lastCol).getValues()[0].join(", "));
  } catch (error) {
    Logger.log("✗ Erreur de connexion: " + error.toString());
  }
}
