# 🔧 SOLUTION CORS - Google Apps Script

## 🔴 Le Problème

Vous recevez:
```
Access to fetch blocked by CORS policy
No 'Access-Control-Allow-Origin' header
```

**Cause**: Google Apps Script n'ajoute pas automatiquement les headers CORS pour les requêtes POST.

---

## ✅ La Solution

### Étape 1: Remplacer le code dans Google Apps Script

1. Allez sur [script.google.com](https://script.google.com)
2. Ouvrez votre projet
3. **Supprimez** tout le code actuel
4. **Copiez** le nouveau code de [docs/code.gs](code.gs)
5. **Remplacez** les valeurs:
   ```javascript
   const SHEET_ID = "1k3HeElkw11vwtWEBLALbSc49pbno3cRWQ_T6jFg_-9I"; // ✓ OK
   const SHEET_NAME = "Base"; // ✓ OK
   ```

### Étape 2: Redéployer

1. Cliquez **Déployer** → **Gérer les déploiements**
2. Supprimez l'ancien déploiement
3. Cliquez le **+** pour créer un nouveau
4. Type: **Application Web**
5. Exécuter en tant que: **Votre compte**
6. Accès: **N'importe qui**
7. **Déployer**
8. **Copiez la nouvelle URL**

### Étape 3: Mettre à jour le frontend

Ouvrez `identification/src/IdentificationForm.jsx` (ligne 5):

```jsx
const SCRIPT_URL = "https://script.google.com/macros/d/VOTRE_ID/usercontent/exec";
```

**⚠️ Important**: L'URL doit contenir `/macros/d/` et `/usercontent/`

---

## ✨ Nouvelles fonctionnalités du backend

Le nouveau code inclut:

✅ **Headers CORS** - Permet le POST depuis React  
✅ **Fonction doOptions()** - Gère les preflight requests  
✅ **Gestion d'erreurs** - Messages d'erreur détaillés  
✅ **Fonction testConnection()** - Testez votre connexion  

---

## 🧪 Test rapide

### 1️⃣ Depuis Apps Script
1. Cliquez **Exécuter** sur `testConnection()`
2. Vérifiez que la console affiche les headers

### 2️⃣ Depuis le navigateur
1. Lancez `npm run dev`
2. Remplissez le formulaire
3. Cliquez **Enregistrer**
4. Devrait fonctionner sans erreur CORS

---

## 📋 Structure finale

```
identification/
├── src/
│   ├── App.jsx
│   ├── IdentificationForm.jsx
│   ├── IdentificationForm.css
│   └── ...
├── docs/
│   └── code.gs  ← Nouveau backend CORS-friendly
├── package.json
└── vite.config.js
```

---

## ❓ Si ça ne marche toujours pas

**Vérifiez**:
- [ ] URL remplacée dans IdentificationForm.jsx
- [ ] Fonction `doOptions` existe dans Google Apps Script
- [ ] Feuille Google Sheet nommée exactement "Base"
- [ ] ID du Sheet correct (SHEET_ID)
- [ ] Déploiement créé en tant que "Application Web"
- [ ] La console navigateur (F12) montre quelle erreur exacte

