# 🔄 Flux de données - Avant et Après

## ❌ AVANT (Problème CORS)

```
┌─────────────────────────────────────────────────────────────┐
│ React App (http://localhost:5173)                           │
│                                                              │
│  IdentificationForm.jsx                                     │
│  ├─ Collecte les données                                    │
│  └─ Envoie POST request                                     │
└─────────────┬──────────────────────────────────────────────┘
              │
              │ POST /macros/d/.../usercontent/exec
              │ ❌ CORS Error!
              │ (Pas de headers Access-Control-Allow-Origin)
              │
              ✗ Bloqué par le navigateur
              X
```

**Résultat**: Erreur 403 CORS - Requête bloquée

---

## ✅ APRÈS (Avec CORS headers)

```
┌─────────────────────────────────────────────────────────────┐
│ React App (http://localhost:5173)                           │
│                                                              │
│  IdentificationForm.jsx                                     │
│  ├─ Collecte les données du formulaire                      │
│  ├─ Prépare JSON: {date, matricule, nom, ...}              │
│  └─ POST request → SCRIPT_URL                               │
└─────────────┬──────────────────────────────────────────────┘
              │
              │ OPTIONS (preflight request)
              │ ↓
              │ GET: /macros/d/.../usercontent/exec
              │ Headers: Access-Control-Allow-Origin: *
              │ ✅ OK - Preflight réussi
              │
┌─────────────▼──────────────────────────────────────────────┐
│ Google Apps Script (script.google.com)                      │
│                                                              │
│  code.gs                                                    │
│  ├─ doOptions()  ← Gère preflight                          │
│  │  └─ Ajoute headers CORS                                  │
│  │                                                          │
│  ├─ doPost(e)    ← Reçoit les données                      │
│  │  ├─ Parse JSON                                          │
│  │  ├─ Récupère le Sheet                                   │
│  │  ├─ Construit nouvelle ligne                            │
│  │  ├─ Append to Sheet                                     │
│  │  └─ Retourne {success: true}                            │
│  │    + headers CORS                                        │
│  │                                                          │
│  └─ Response: 200 OK ✓                                     │
└─────────────┬──────────────────────────────────────────────┘
              │
              │ POST response avec CORS headers
              │ {success: true, message: "✓ Enregistré"}
              │
┌─────────────▼──────────────────────────────────────────────┐
│ Google Sheet (sheets.google.com)                            │
│                                                              │
│ Nouvelle ligne ajoutée:                                     │
│ │ Date │ Matricule │ Nom │ Contrat │ Genre │ ...          │
│ ├──────┼───────────┼─────┼─────────┼───────┼──────         │
│ │ ... │ existing rows                                       │
│ ├──────┼───────────┼─────┼─────────┼───────┤──────         │
│ │ +    │ +data1    │ +nom│ +contrat│ +M    │ ...   ✓       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Résultat**: 200 OK - Données enregistrées dans Google Sheet

---

## 🔑 Points clés

### Les 3 fonctions du backend

```javascript
// 1. Gère les OPTIONS (preflight)
function doOptions(e) {
  return addCORSHeaders(response);
}

// 2. Reçoit les GET requests
function doGet(e) {
  // Retourne les données du Sheet
  // + CORS headers
}

// 3. Reçoit les POST requests
function doPost(e) {
  // Ajoute nouvelle ligne au Sheet
  // + CORS headers
}
```

### Les headers CORS essentiels

```
Access-Control-Allow-Origin: *
├─ Permet les requêtes de n'importe quel domaine

Access-Control-Allow-Methods: GET, POST, OPTIONS
├─ Autorise ces 3 méthodes HTTP

Access-Control-Allow-Headers: Content-Type
├─ Accepte les headers Content-Type

Access-Control-Max-Age: 86400
└─ Cache les résultats du preflight pendant 24h
```

---

## 📊 Comparaison

| Aspect | ❌ Avant | ✅ Après |
|--------|----------|---------|
| **CORS Headers** | Non | Oui |
| **doOptions()** | Non | Oui |
| **Erreur navigateur** | 403 CORS | 200 OK |
| **Données stockées** | ❌ Non | ✅ Oui |
| **Frontend→Backend** | ❌ Bloqué | ✅ Autorisé |

---

## 💡 Comment ça marche

1. **Navigateur envoie preflight OPTIONS**
   - "Est-ce que je peux faire une requête POST?"
   
2. **Backend répond avec headers CORS**
   - "Oui, vous pouvez, voici les droits"
   
3. **Navigateur envoie POST réel**
   - Après vérification du preflight
   
4. **Backend traite les données**
   - Ajoute à Google Sheet
   - Retourne success

5. **Frontend affiche le succès**
   - "✓ Données enregistrées avec succès"

