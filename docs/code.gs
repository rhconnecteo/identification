/*******************************************************
 * CODE.GS - Identification Backend
 * API Google Apps Script pour lire et enregistrer
 * les données de la feuille Google Sheets "Base".
 *
 * Utilise uniquement doGet() avec actions (pattern GET)
 * 
 * MAPPING automatique des noms de colonnes
 * Les colonnes du Sheet n'ont pas de numéros, on mappe par position
 *******************************************************/

// ⚙️ CONFIGURATION - À REMPLACER
const SHEET_ID = "1k3HeElkw11vwtWEBLALbSc49pbno3cRWQ_T6jFg_-9I";
const SHEET_NAME = "Base";

// MAPPING: Noms reçus du formulaire React → Index de colonne
const COLUMN_MAP = {
  'Date d\'insertion': 0,
  'Matricule': 1,
  'Nom et Prénoms': 2,
  'Contrat': 3,
  'Genre': 4,
  'Date de naissance': 5,
  'Lieu de naissance': 6,
  'Numéro CIN': 7,
  'Date de délivrance': 8,
  'Lieu de délivrance': 9,
  'Nationalité': 10,
  'Ethenie': 11,
  'Contact personnel': 12,
  'Numéro Mvola': 13,
  'Nom de personne à contact au cas d\'urgence': 14,
  'Numéro d\'urgence': 15,
  'Email personnel': 16,
  'Situation familiale': 17,
  'Nom et prénoms de conjoint': 18,
  'Date de mariage': 19,
  // Enfants 1-9 (colonnes 20-37)
  'Nom enfant 1': 20,
  'date de naissance 1': 21,
  'Nom enfant 2': 22,
  'date de naissance 2': 23,
  'Nom enfant 3': 24,
  'date de naissance 3': 25,
  'Nom enfant 4': 26,
  'date de naissance 4': 27,
  'Nom enfant 5': 28,
  'date de naissance 5': 29,
  'Nom enfant 6': 30,
  'date de naissance 6': 31,
  'Nom enfant 7': 32,
  'date de naissance 7': 33,
  'Nom enfant 8': 34,
  'date de naissance 8': 35,
  'Nom enfant 9': 36,
  // CNAPS + Vaccin (colonnes 37-38)
  'Numéro Cnaps': 37,
  'Vaccin COVID 19': 38,
  // Diplômes 1-4 (colonnes 39-46)
  'Diplomes obtenues 1': 39,
  'Domaine d\'étude 1': 40,
  'Diplomes obtenues 2': 41,
  'Domaine d\'étude 2': 42,
  'Diplomes obtenues 3': 43,
  'Domaine d\'étude 3': 44,
  'Autres': 45,
  'Domaine d\'étude 4': 46,
  // Langues 1-3 (colonnes 47-52)
  'Langues 1': 47,
  'Niveau 1': 48,
  'Langues 2': 49,
  'Niveau 2': 50,
  'Autres langues': 51,
  'Niveau 3': 52,
  // Dialecte + Niveau (colonnes 53-54)
  'Dialecte': 53,
  'Niveau': 54,
};

/* =====================================================
   1) ENTRY POINT : doGet()
   Cette fonction reçoit les requêtes HTTP GET.
   Exemple :
   - ?action=getUsers
   - ?action=saveUser&data={...}
===================================================== */
function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback; // Pour JSONP

  if (!action) {
    return outputJSON({ error: "Action manquante" }, callback);
  }

  try {
    switch (action) {

      case "getUsers":
        return outputJSON(getUsersAPI(), callback);

      case "saveUser":
        if (!e.parameter.data) {
          return outputJSON({ error: "Paramètre data manquant" }, callback);
        }

        try {
          const user = JSON.parse(decodeURIComponent(e.parameter.data));
          saveUserAPI(user);

          return outputJSON({ 
            success: true,
            message: "✓ Données enregistrées avec succès"
          }, callback);
        } catch (parseError) {
          return outputJSON({ 
            success: false,
            error: "Erreur de parsing JSON: " + parseError.toString()
          }, callback);
        }

      default:
        return outputJSON({ error: "Action invalide : " + action }, callback);
    }
  } catch (error) {
    return outputJSON({ 
      success: false,
      error: error.toString() 
    }, callback);
  }
}

/* =====================================================
   2) doOptions()
   Gère les preflight requests et CORS
===================================================== */
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type')
    .addHeader('Access-Control-Max-Age', '86400');
}

/* =====================================================
   3) outputJSON()
   Transforme un objet JS en réponse JSON lisible
   Support JSONP pour contourner CORS
===================================================== */
function outputJSON(obj, callback) {
  let output = JSON.stringify(obj);
  
  // Si callback JSONP est fourni, enveloppe dans la fonction
  if (callback) {
    output = callback + '(' + output + ')';
    return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // Pour JSON normal, ajouter les headers
  let result = ContentService.createTextOutput(output);
  result.setMimeType(ContentService.MimeType.JSON);
  return result;
}

/* =====================================================
   4) getUsersAPI()
   Récupère tous les utilisateurs enregistrés
===================================================== */
function getUsersAPI() {
  try {
    const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sh.getDataRange().getValues();
    const headers = data[0];

    const res = [];

    for (let i = 1; i < data.length; i++) {
      const matricule = (data[i][1] || "").toString().trim();

      // Passer les lignes vides
      if (!matricule) continue;

      // Construire l'objet utilisateur
      const user = {};
      
      for (let j = 0; j < headers.length; j++) {
        let value = data[i][j] || "";
        
        // Convertir les dates au bon format
        if (value instanceof Date) {
          const year = value.getFullYear();
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const day = String(value.getDate()).padStart(2, '0');
          value = `${year}-${month}-${day}`;
        }
        
        user[headers[j]] = value.toString();
      }

      user.row = i + 1;
      res.push(user);
    }

    return res;
  } catch (error) {
    throw new Error("Erreur getUsersAPI: " + error.toString());
  }
}

/* =====================================================
   5) saveUserAPI(user)
   Enregistre un nouvel utilisateur dans la feuille
   
   Utilise le COLUMN_MAP pour mapper les noms → index
===================================================== */
function saveUserAPI(user) {
  try {
    // Validation basique
    if (!user['Matricule']) {
      throw new Error("Matricule est obligatoire");
    }

    const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // Construire une ligne vide avec le bon nombre de colonnes
    const newRow = new Array(55); // 55 colonnes au total

    // Remplir avec les données du formulaire en utilisant le COLUMN_MAP
    for (let fieldName in user) {
      if (COLUMN_MAP.hasOwnProperty(fieldName)) {
        const colIndex = COLUMN_MAP[fieldName];
        let value = user[fieldName] || "";
        
        // Convertir les dates au bon format
        if (fieldName.includes("date") && fieldName.toLowerCase() !== "date d\'insertion") {
          if (value && typeof value === 'string') {
            value = new Date(value);
          }
        }
        
        newRow[colIndex] = value;
      }
    }

    // Remplir les colonnes non mappées avec des chaînes vides
    for (let i = 0; i < newRow.length; i++) {
      if (newRow[i] === undefined) {
        newRow[i] = "";
      }
    }

    // Ajouter la ligne
    sh.appendRow(newRow);
    
    Logger.log("✓ Ligne ajoutée - Matricule: " + user['Matricule']);
  } catch (error) {
    throw new Error("Erreur saveUserAPI: " + error.toString());
  }
}

/* =====================================================
   TEST - Exécuter depuis script.google.com
===================================================== */
function testConnection() {
  try {
    const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    
    console.log("✓ Connexion réussie!");
    console.log("Sheet: " + SHEET_NAME);
    console.log("Dernière ligne: " + lastRow);
    console.log("Colonnes: " + lastCol);
    console.log("\nHeaders trouvés:");
    for (let i = 0; i < headers.length; i++) {
      console.log("[Col " + i + "] " + headers[i]);
    }
    
    console.log("\n✓ COLUMN_MAP en place:");
    console.log("✓ Mapping automatique des données du formulaire aux colonnes");
  } catch (error) {
    console.log("✗ Erreur: " + error.toString());
  }
}
