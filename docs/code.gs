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

      case "sendEmail":
        if (!e.parameter.data) {
          return outputJSON({ error: "Paramètre data manquant" }, callback);
        }

        try {
          const userData = JSON.parse(decodeURIComponent(e.parameter.data));
          sendEmailAPI(userData);

          return outputJSON({ 
            success: true,
            message: "✓ Email envoyé avec succès"
          }, callback);
        } catch (parseError) {
          return outputJSON({ 
            success: false,
            error: "Erreur envoi email: " + parseError.toString()
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

/* =====================================================
   6) sendEmailAPI(userData)
   Envoie un email HTML au collaborateur avec TOUTES ses infos
   Email depuis: rhbiconnecteo@gmail.com
===================================================== */
function sendEmailAPI(userData) {
  try {
    const emailDestination = userData['Email personnel'];
    
    if (!emailDestination || !emailDestination.includes('@')) {
      throw new Error("Email invalide ou manquant: " + emailDestination);
    }

    const htmlContent = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:800px;margin:0 auto;padding:20px;background-color:#f5f5f5}.header{background:linear-gradient(to right,#667eea,#764ba2);color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center}.header h1{margin:0;font-size:24px}.content{background:white;padding:20px}.section{margin-bottom:30px;border-left:4px solid #667eea;padding-left:15px}.section h2{color:#667eea;font-size:16px;margin:0 0 15px 0}.field{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:10px}.field-item{}.label{font-weight:bold;color:#555;font-size:12px}.value{color:#333;font-size:14px;margin-top:3px}.footer{background:#f9f9f9;padding:15px;text-align:center;font-size:12px;color:#999}table{width:100%;border-collapse:collapse;margin-top:10px}table td{padding:8px;border-bottom:1px solid #eee}.date-badge{background:#667eea;color:white;padding:10px;border-radius:4px;text-align:center;margin-bottom:20px}</style></head><body><div class="container"><div class="header"><h1>📋 Confirmation d'Enregistrement</h1><p>Vos informations ont été enregistrées avec succès</p></div><div class="content"><div class="date-badge"><strong>Date d'insertion:</strong> ${userData['Date d\'insertion'] || '-'}</div><div class="section"><h2>👤 Informations Personnelles</h2><div class="field"><div class="field-item"><div class="label">Matricule</div><div class="value">${userData['Matricule'] || '-'}</div></div><div class="field-item"><div class="label">Contrat</div><div class="value">${userData['Contrat'] || '-'}</div></div></div><div class="field"><div class="field-item"><div class="label">Nom</div><div class="value">${userData['Nom et Prénoms'] || '-'}</div></div><div class="field-item"><div class="label">Genre</div><div class="value">${userData['Genre'] || '-'}</div></div></div><div class="field"><div class="field-item"><div class="label">Date de naissance</div><div class="value">${userData['Date de naissance'] || '-'}</div></div><div class="field-item"><div class="label">Lieu de naissance</div><div class="value">${userData['Lieu de naissance'] || '-'}</div></div></div><div class="field"><div class="field-item"><div class="label">Adresse</div><div class="value">${userData['Adresse'] || '-'}</div></div><div class="field-item"><div class="label">Nationalité</div><div class="value">${userData['Nationalité'] || '-'}</div></div></div><div class="field"><div class="field-item"><div class="label">Ethnie</div><div class="value">${userData['Ethenie'] || '-'}</div></div><div class="field-item"><div class="label">Dialecte / Niveau</div><div class="value">${userData['Dialecte'] || '-'} / ${userData['Niveau'] || '-'}</div></div></div></div><div class="section"><h2>🆔 Carte Nationale d'Identité</h2><div class="field"><div class="field-item"><div class="label">Numéro CIN</div><div class="value">${userData['Numéro CIN'] || '-'}</div></div><div class="field-item"><div class="label">Date de délivrance</div><div class="value">${userData['Date de délivrance'] || '-'}</div></div></div></div><div class="section"><h2>📞 Contact</h2><div class="field"><div class="field-item"><div class="label">Contact personnel</div><div class="value">${userData['Contact personnel'] || '-'}</div></div><div class="field-item"><div class="label">Numéro Mvola</div><div class="value">${userData['Numéro Mvola'] || '-'}</div></div></div><div class="field"><div class="field-item"><div class="label">Email</div><div class="value">${userData['Email personnel'] || '-'}</div></div></div></div><div class="section"><h2>🗣️ Langues</h2><table><tr><td><strong>Langue</strong></td><td><strong>Niveau</strong></td></tr><tr><td>${userData['Langues 1'] || '-'}</td><td>${userData['Niveau 1'] || '-'}</td></tr><tr><td>${userData['Langues 2'] || '-'}</td><td>${userData['Niveau 2'] || '-'}</td></tr><tr><td>${userData['Autres langues'] || '-'}</td><td>${userData['Niveau 3'] || '-'}</td></tr></table></div><div class="section"><h2>🎓 Formation</h2><table><tr><td><strong>Diplôme</strong></td><td><strong>Domaine</strong></td></tr><tr><td>${userData['Diplomes obtenues 1'] || '-'}</td><td>${userData['Domaine d\'étude 1'] || '-'}</td></tr><tr><td>${userData['Diplomes obtenues 2'] || '-'}</td><td>${userData['Domaine d\'étude 2'] || '-'}</td></tr><tr><td>${userData['Diplomes obtenues 3'] || '-'}</td><td>${userData['Domaine d\'étude 3'] || '-'}</td></tr></table></div></div><div class="footer"><p>Email from <strong>RHBI Connecteo</strong> Identification System</p><p>© 2026 - All rights reserved</p></div></div></body></html>`;

    GmailApp.sendEmail(
      emailDestination,
      "✓ Confirmation d'Enregistrement - " + (userData['Nom et Prénoms'] || 'Collaborateur'),
      "",
      {
        htmlBody: htmlContent,
        from: "rhbiconnecteo@gmail.com",
        replyTo: "rhbiconnecteo@gmail.com"
      }
    );

    Logger.log("✓ Email envoyé à: " + emailDestination);
  } catch (error) {
    throw new Error("Erreur sendEmailAPI: " + error.toString());
  }
}
