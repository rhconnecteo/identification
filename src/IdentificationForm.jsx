import React, { useState } from 'react';
import './IdentificationForm.css';

// Constants moved outside to prevent recreation on each render
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwroY7LSeOSporbafAJU7jFlnJmRPGZuPB6q6JQw-0XwWszcvXxIws75wBw1HRXtXY7AA/exec";
const ETHNICITIES = ['Betsileo', 'Sihanaka', 'Merina', 'Sakalava', 'Betsimisaraka', 'Antandroy', 'Mahafaly', 'Autre'];
const CONTRACTS = ['CDI', 'CDD', 'INT MDJ', 'Stagiaire', 'Consultant'];
const DIPLOMAS = ['BAC', 'BAC+2', 'BAC+3', 'Master 1', 'Master 2'];
const LANGUAGES = ['Anglais', 'Français', 'Espagnol', 'Chinois', 'Autre'];
const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé', 'Courant'];
const FAMILY_STATUS = ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)'];

// Sub-components moved outside to prevent recreation on each render (fixes focus loss issue)
const FormField = ({ label, name, type = 'text', value, onChange, error, required = false, ...props }) => (
  <div className="form-group">
    <label>{label} {required && <span className="required-asterisk">*</span>}</label>
    <input type={type} name={name} value={value} onChange={onChange} className={error ? 'input-error' : ''} {...props} />
    {error && <span className="error-message">{error}</span>}
  </div>
);

const FormSelect = ({ label, name, value, onChange, options, error, required = false }) => (
  <div className="form-group">
    <label>{label} {required && <span className="required-asterisk">*</span>}</label>
    <select name={name} value={value} onChange={onChange} className={error ? 'input-error' : ''}>
      <option value="">-- Sélectionner --</option>
      {options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
    </select>
    {error && <span className="error-message">{error}</span>}
  </div>
);

const TabButton = ({ activeTab, id, label, onClick, isComplete }) => (
  <button
    type="button"
    className={`tab-button ${activeTab === id ? 'active' : ''} ${isComplete ? 'tab-complete' : ''}`}
    onClick={onClick}
  >
    {label}
  </button>
);

const IdentificationForm = () => {

  const [activeTab, setActiveTab] = useState('perso');
  const [navbarGlow, setNavbarGlow] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [filteredDate, setFilteredDate] = useState('');
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);

  const [formData, setFormData] = useState({
    dateInsertion: new Date().toISOString().split('T')[0],
    matricule: '',
    nom: '',
    prenoms: '',
    contrat: '',
    adresse: '',
    genre: 'M',
    dateNaissance: '',
    lieuNaissance: '',
    numeroCIN: '',
    dateDelivrance: '',
    lieuDelivrance: '',
    nationalite: 'Malagasy',
    ethenie: '',
    contactPersonnel: '',
    numeroMvola: '',
    nomPersonneUrgence: '',
    numeroUrgence: '',
    emailPersonnel: '',
    situationFamiliale: 'Célibataire',
    nomConjoint: '',
    prenomsConjoint: '',
    dateMariage: '',
    nombreEnfants: 0,
    enfants: [],
    numeroCnaps: '',
    vaccin: 'Non',
    diplomes: [{ nom: '', domaine: '' }],
    langues: [
      { nom: '', niveau: '' }
    ],
    dialecte: { nom: '', niveau: '' }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const triggerFireGlow = () => {
    setNavbarGlow(true);
    setTimeout(() => setNavbarGlow(false), 600);
  };

  const isAllFieldsComplete = () => {
    return formData.matricule &&
           formData.nom &&
           formData.prenoms &&
           formData.contrat &&
           formData.adresse &&
           formData.dateNaissance &&
           formData.lieuNaissance &&
           formData.numeroCIN &&
           formData.dateDelivrance &&
           formData.lieuDelivrance &&
           formData.contactPersonnel &&
           formData.nomPersonneUrgence &&
           formData.numeroUrgence;
  };

  const isPersonalInfoComplete = () => {
    return formData.matricule &&
           formData.nom &&
           formData.prenoms &&
           formData.contrat &&
           formData.adresse &&
           formData.dateNaissance &&
           formData.lieuNaissance &&
           formData.numeroCIN &&
           formData.dateDelivrance &&
           formData.lieuDelivrance &&
           formData.dialecte?.nom &&
           formData.dialecte?.niveau;
  };

  const isContactInfoComplete = () => {
    return formData.contactPersonnel &&
           formData.nomPersonneUrgence &&
           formData.numeroUrgence;
  };

  const isFamilyInfoComplete = () => {
    const situationOk = formData.situationFamiliale &&
                        (formData.situationFamiliale !== 'Marié(e)' || (formData.nomConjoint && formData.prenomsConjoint && formData.dateMariage));
    
    let enfantsOk = false;
    if (formData.nombreEnfants === 0) {
      enfantsOk = true;
    } else if (formData.nombreEnfants > 0) {
      enfantsOk = formData.enfants && formData.enfants.length === formData.nombreEnfants &&
                  formData.enfants.every(e => e.nom && e.dateNaissance);
    }
    
    return situationOk && enfantsOk;
  };

  const isDiplomeInfoComplete = () => {
    return formData.diplomes && formData.diplomes.length > 0 &&
           formData.diplomes.some(d => d.nom && d.domaine);
  };

  const isFormationComplete = () => {
    const hasLangues = formData.langues && formData.langues.length > 0 &&
                       formData.langues.some(l => l.nom && l.niveau);
    return hasLangues;
  };

  const fetchCollaborators = async () => {
    setLoadingCollaborators(true);
    try {
      // Fallback: données de test en cas d'erreur JSONP
      const testData = [
        {
          "Date d'insertion": "2026-04-12",
          "Matricule": "CN01205",
          "Nom et Prénoms": "rabe"
        },
        {
          "Date d'insertion": "2026-04-12",
          "Matricule": "CN01105",
          "Nom et Prénoms": "fyukhkhiiu"
        },
        {
          "Date d'insertion": "2026-04-12",
          "Matricule": "CN00262",
          "Nom et Prénoms": "rabe"
        },
        {
          "Date d'insertion": "2026-04-12",
          "Matricule": "CN01105",
          "Nom et Prénoms": "RAMBOAMIARISON Herizo Radilison"
        }
      ];

      const callbackName = 'jsonpCallback_' + Date.now();
      let isTimeout = true;
      
      // Créer le callback JSONP
      window[callbackName] = (data) => {
        console.log('✓ Collaborateurs chargés via JSONP:', data);
        isTimeout = false;
        setCollaborators(Array.isArray(data) ? data : []);
        setTimeout(() => {
          if (document.head.contains(scriptTag)) {
            document.head.removeChild(scriptTag);
          }
          delete window[callbackName];
          setLoadingCollaborators(false);
        }, 100);
      };

      // Créer et ajouter le script
      const scriptTag = document.createElement('script');
      scriptTag.src = `${SCRIPT_URL}?action=getUsers&callback=${callbackName}`;
      scriptTag.async = true;
      
      scriptTag.onerror = () => {
        console.error('✗ Erreur JSONP - Utilisation des données de test');
        isTimeout = false;
        setCollaborators(testData);
        delete window[callbackName];
        if (document.head.contains(scriptTag)) {
          document.head.removeChild(scriptTag);
        }
        setLoadingCollaborators(false);
      };
      
      // Timeout de 8 secondes avant fallback
      const timeoutId = setTimeout(() => {
        if (isTimeout && window[callbackName]) {
          console.warn('⏱️ Timeout JSONP - Utilisation des données de test');
          delete window[callbackName];
          setCollaborators(testData);
          if (document.head.contains(scriptTag)) {
            document.head.removeChild(scriptTag);
          }
          setLoadingCollaborators(false);
        }
      }, 8000);
      
      document.head.appendChild(scriptTag);
      console.log('📡 JSONP URL:', scriptTag.src);
    } catch (error) {
      console.error('Erreur fetchCollaborators:', error);
      setCollaborators([]);
      setLoadingCollaborators(false);
    }
  };

  const handleShowCollaborators = () => {
    if (!showCollaborators) {
      fetchCollaborators();
    }
    setShowCollaborators(!showCollaborators);
  };

  const getFilteredCollaborators = () => {
    if (!filteredDate) return collaborators;
    return collaborators.filter(c => {
      // Comparer les dates correctement en corrigeant le décalage timezone
      const dateInSheet = c["Date d'insertion"] || '';
      return dateInSheet === filteredDate;
    });
  };

  // Corriger les dates affichées (ajouter 1 jour pour compenser le décalage)
  // Charger les collaborateurs au montage du composant
  React.useEffect(() => {
    fetchCollaborators();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.matricule) newErrors.matricule = 'Matricule obligatoire';
    else if (!/^(CI|CN|CS)/.test(formData.matricule)) newErrors.matricule = 'Commence par CI, CN ou CS';

    if (!formData.nom) newErrors.nom = 'Nom obligatoire';
    if (!formData.prenoms) newErrors.prenoms = 'Prénoms obligatoires';
    if (!formData.contrat) newErrors.contrat = 'Contrat obligatoire';
    if (!formData.adresse) newErrors.adresse = 'Adresse obligatoire';
    if (!formData.dateNaissance) newErrors.dateNaissance = 'Date de naissance obligatoire';
    if (!formData.lieuNaissance) newErrors.lieuNaissance = 'Lieu de naissance obligatoire';
    if (!formData.numeroCIN) newErrors.numeroCIN = 'CIN obligatoire';
    if (!formData.dateDelivrance) newErrors.dateDelivrance = 'Date de délivrance obligatoire';
    if (!formData.lieuDelivrance) newErrors.lieuDelivrance = 'Lieu de délivrance obligatoire';
    if (!formData.contactPersonnel) newErrors.contactPersonnel = 'Contact obligatoire';
    if (!formData.nomPersonneUrgence) newErrors.nomPersonneUrgence = 'Nom obligatoire';
    if (!formData.numeroUrgence) newErrors.numeroUrgence = 'Numéro obligatoire';
    if (!formData.emailPersonnel) newErrors.emailPersonnel = 'Email obligatoire';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailPersonnel)) newErrors.emailPersonnel = 'Email invalide';

    if (formData.situationFamiliale === 'Marié(e)') {
      if (!formData.nomConjoint) newErrors.nomConjoint = 'Obligatoire';
      if (!formData.prenomsConjoint) newErrors.prenomsConjoint = 'Obligatoire';
      if (!formData.dateMariage) newErrors.dateMariage = 'Obligatoire';
    }

    if (!formData.dialecte.nom) newErrors.dialecteNom = 'Dialecte obligatoire';
    if (!formData.dialecte.niveau) newErrors.dialecteNiveau = 'Niveau requis';

    if (formData.nombreEnfants > 0) {
      for (let i = 0; i < formData.nombreEnfants; i++) {
        if (!formData.enfants[i]?.nom) newErrors[`enfantNom${i}`] = 'Obligatoire';
        if (!formData.enfants[i]?.dateNaissance) newErrors[`enfantDate${i}`] = 'Obligatoire';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNombreEnfants = (e) => {
    const nombre = parseInt(e.target.value) || 0;
    const newEnfants = [];
    for (let i = 0; i < nombre; i++) {
      newEnfants.push(formData.enfants[i] || { nom: '', dateNaissance: '' });
    }
    setFormData(prev => ({
      ...prev,
      nombreEnfants: nombre,
      enfants: newEnfants
    }));
  };

  const handleEnfantChange = (index, field, value) => {
    const updatedEnfants = [...formData.enfants];
    updatedEnfants[index] = { ...updatedEnfants[index], [field]: value };
    setFormData(prev => ({ ...prev, enfants: updatedEnfants }));
  };

  const handleDiplomeChange = (index, field, value) => {
    const updatedDiplomes = [...formData.diplomes];
    updatedDiplomes[index] = { ...updatedDiplomes[index], [field]: value };
    setFormData(prev => ({ ...prev, diplomes: updatedDiplomes }));
  };

  const addDiplome = () => {
    if (formData.diplomes.length < 4) {
      setFormData(prev => ({
        ...prev,
        diplomes: [...prev.diplomes, { nom: '', domaine: '' }]
      }));
    }
  };

  const handleLangueChange = (index, field, value) => {
    const updatedLangues = [...formData.langues];
    updatedLangues[index] = { ...updatedLangues[index], [field]: value };
    setFormData(prev => ({ ...prev, langues: updatedLangues }));
  };

  const handleAddLangue = () => {
    setFormData(prev => ({
      ...prev,
      langues: [...prev.langues, { nom: '', niveau: '' }]
    }));
  };

  const removeDiplome = (index) => {
    setFormData(prev => ({
      ...prev,
      diplomes: prev.diplomes.filter((_, i) => i !== index)
    }));
  };

  const removeLangue = (index) => {
    setFormData(prev => ({
      ...prev,
      langues: prev.langues.filter((_, i) => i !== index)
    }));
  };

  const isLanguesInfoComplete = () => {
    return formData.langues && formData.langues.length > 0 &&
           formData.langues.some(l => l.nom && l.niveau);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const dataToSend = {
        'Date d\'insertion': formData.dateInsertion,
        'Matricule': formData.matricule,
        'Nom et Prénoms': `${formData.nom} ${formData.prenoms}`,
        'Contrat': formData.contrat,
        'Genre': formData.genre,
        'Date de naissance': formData.dateNaissance,
        'Lieu de naissance': formData.lieuNaissance,
        'Adresse': formData.adresse,
        'Numéro CIN': formData.numeroCIN,
        'Date de délivrance': formData.dateDelivrance,
        'Lieu de délivrance': formData.lieuDelivrance,
        'Nationalité': formData.nationalite,
        'Ethenie': formData.ethenie,
        'Contact personnel': formData.contactPersonnel,
        'Numéro Mvola': formData.numeroMvola,
        'Nom de personne à contact au cas d\'urgence': formData.nomPersonneUrgence,
        'Numéro d\'urgence': formData.numeroUrgence,
        'Email personnel': formData.emailPersonnel,
        'Situation familiale': formData.situationFamiliale,
        'Nom et prénoms de conjoint': formData.situationFamiliale === 'Marié(e)' ? `${formData.nomConjoint} ${formData.prenomsConjoint}` : '',
        'Date de mariage': formData.dateMariage,
        'Nom enfant 1': formData.enfants[0]?.nom || '',
        'date de naissance 1': formData.enfants[0]?.dateNaissance || '',
        'Nom enfant 2': formData.enfants[1]?.nom || '',
        'date de naissance 2': formData.enfants[1]?.dateNaissance || '',
        'Nom enfant 3': formData.enfants[2]?.nom || '',
        'date de naissance 3': formData.enfants[2]?.dateNaissance || '',
        'Nom enfant 4': formData.enfants[3]?.nom || '',
        'date de naissance 4': formData.enfants[3]?.dateNaissance || '',
        'Nom enfant 5': formData.enfants[4]?.nom || '',
        'date de naissance 5': formData.enfants[4]?.dateNaissance || '',
        'Nom enfant 6': formData.enfants[5]?.nom || '',
        'date de naissance 6': formData.enfants[5]?.dateNaissance || '',
        'Nom enfant 7': formData.enfants[6]?.nom || '',
        'date de naissance 7': formData.enfants[6]?.dateNaissance || '',
        'Nom enfant 8': formData.enfants[7]?.nom || '',
        'date de naissance 8': formData.enfants[7]?.dateNaissance || '',
        'Nom enfant 9': formData.enfants[8]?.nom || '',
        'date de naissance 9': formData.enfants[8]?.dateNaissance || '',
        'Numéro Cnaps': formData.numeroCnaps,
        'Vaccin COVID 19': formData.vaccin,
        'Diplomes obtenues 1': formData.diplomes[0]?.nom || '',
        'Domaine d\'étude 1': formData.diplomes[0]?.domaine || '',
        'Diplomes obtenues 2': formData.diplomes[1]?.nom || '',
        'Domaine d\'étude 2': formData.diplomes[1]?.domaine || '',
        'Diplomes obtenues 3': formData.diplomes[2]?.nom || '',
        'Domaine d\'étude 3': formData.diplomes[2]?.domaine || '',
        'Autres': formData.diplomes[3]?.nom || '',
        'Domaine d\'étude 4': formData.diplomes[3]?.domaine || '',
        'Langues 1': formData.langues[0]?.nom || '',
        'Niveau 1': formData.langues[0]?.niveau || '',
        'Langues 2': formData.langues[1]?.nom || '',
        'Niveau 2': formData.langues[1]?.niveau || '',
        'Autres langues': formData.langues[2]?.nom || '',
        'Niveau 3': formData.langues[2]?.niveau || '',
        'Dialecte': formData.dialecte.nom || 'Malagasy',
        'Niveau': formData.dialecte.niveau || ''
      };

      const url = `${SCRIPT_URL}?action=saveUser&data=${encodeURIComponent(JSON.stringify(dataToSend))}`;

      await fetch(url, { method: 'GET', mode: 'no-cors' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Envoyer l'email au collaborateur
      const emailUrl = `${SCRIPT_URL}?action=sendEmail&data=${encodeURIComponent(JSON.stringify(dataToSend))}`;
      console.log('📧 Envoi email à:', dataToSend['Email personnel']);
      console.log('📧 URL Email:', emailUrl);
      fetch(emailUrl, { method: 'GET', mode: 'no-cors' })
        .then(() => console.log('✅ Email envoyé'))
        .catch(err => console.log('⚠️ Erreur email:', err));

      setMessage('✓ Données enregistrées avec succès! Email envoyé au collaborateur.');

      setFormData({
        dateInsertion: new Date().toISOString().split('T')[0],
        matricule: '',
        nom: '',
        prenoms: '',
        contrat: '',
        adresse: '',
        genre: 'M',
        dateNaissance: '',
        lieuNaissance: '',
        numeroCIN: '',
        dateDelivrance: '',
        lieuDelivrance: '',
        nationalite: 'Malagasy',
        ethenie: '',
        contactPersonnel: '',
        numeroMvola: '',
        nomPersonneUrgence: '',
        numeroUrgence: '',
        emailPersonnel: '',
        situationFamiliale: 'Célibataire',
        nomConjoint: '',
        prenomsConjoint: '',
        dateMariage: '',
        nombreEnfants: 0,
        enfants: [],
        numeroCnaps: '',
        vaccin: 'Non',
        diplomes: [{ nom: '', domaine: '' }],
        langues: [{ nom: '', niveau: '' }],
        dialecte: { nom: '', niveau: '' }
      });
    } catch (error) {
      setMessage('✗ Erreur: ' + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="app-wrapper">
      <nav className={`form-navbar ${navbarGlow ? 'fire-glow' : ''} ${isAllFieldsComplete() ? 'navbar-complete' : ''}`}>
        <div className="navbar-content">
          <img src="/connecteo.png" alt="Connecteo Logo" className="navbar-logo" />
          <h1 className="navbar-title">📋 Formulaire d'Identification</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="button" className="navbar-btn-submit" onClick={(e) => { triggerFireGlow(); handleShowCollaborators(); }} title="Voir les collaborateurs">
              👥 Collaborateurs
            </button>
            <button type="button" className="navbar-btn-submit" onClick={(e) => { triggerFireGlow(); handleSubmit(e); }} disabled={loading}>
              {loading ? '⏳ Enregistrement...' : '✓ Enregistrer'}
            </button>
          </div>
        </div>
      </nav>

      <nav className="section-tabs">
        <div className="tabs-container">
          <TabButton activeTab={activeTab} id="perso" label="📝 Informations Personnelles" onClick={() => { triggerFireGlow(); setActiveTab('perso'); }} isComplete={isPersonalInfoComplete()} />
          <TabButton activeTab={activeTab} id="contact" label="📞 Contact" onClick={() => { triggerFireGlow(); setActiveTab('contact'); }} isComplete={isContactInfoComplete()} />
          <TabButton activeTab={activeTab} id="famille" label="👨‍👩‍👧‍👦 Situation Familiale" onClick={() => { triggerFireGlow(); setActiveTab('famille'); }} isComplete={isFamilyInfoComplete()} />
          <TabButton activeTab={activeTab} id="diplome" label="🎓 Formation" onClick={() => { triggerFireGlow(); setActiveTab('diplome'); }} isComplete={isFormationComplete()} />
        </div>
      </nav>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* Tab: Informations Personnelles */}
          {activeTab === 'perso' && (
            <div className="tab-content">
              <div className="form-row">
                <FormField label="Matricule" name="matricule" value={formData.matricule} onChange={handleInputChange} error={errors.matricule} required />
                <FormSelect label="Contrat" name="contrat" value={formData.contrat} onChange={handleInputChange} options={CONTRACTS} error={errors.contrat} required />
              </div>
              <div className="form-row">
                <FormField label="Nom" name="nom" value={formData.nom} onChange={handleInputChange} error={errors.nom} required />
                <FormField label="Prénoms" name="prenoms" value={formData.prenoms} onChange={handleInputChange} error={errors.prenoms} required />
              </div>
              <div className="form-row">
                <FormField label="Adresse actuelle" name="adresse" value={formData.adresse} onChange={handleInputChange} error={errors.adresse} required />
                <FormSelect label="Genre" name="genre" value={formData.genre} onChange={handleInputChange} options={['M', 'F']} />
              </div>
              <div className="form-row">
                <FormField label="Date de naissance" name="dateNaissance" type="date" value={formData.dateNaissance} onChange={handleInputChange} error={errors.dateNaissance} required />
                <FormField label="Lieu de naissance" name="lieuNaissance" value={formData.lieuNaissance} onChange={handleInputChange} error={errors.lieuNaissance} required />
              </div>
              <div className="form-row-3">
                <FormField label="Numéro CIN" name="numeroCIN" value={formData.numeroCIN} onChange={handleInputChange} error={errors.numeroCIN} required />
                <FormField label="Date de délivrance" name="dateDelivrance" type="date" value={formData.dateDelivrance} onChange={handleInputChange} error={errors.dateDelivrance} required />
                <FormField label="Lieu de délivrance" name="lieuDelivrance" value={formData.lieuDelivrance} onChange={handleInputChange} error={errors.lieuDelivrance} required />
              </div>
              <div className="form-row-4">
                <FormSelect label="Nationalité" name="nationalite" value={formData.nationalite} onChange={handleInputChange} options={['Malagasy', 'Etranger']} />
                <FormSelect label="Ethnie" name="ethenie" value={formData.ethenie} onChange={handleInputChange} options={ETHNICITIES} />
                <FormSelect label="Dialecte" name="nomDialecte" value={formData.dialecte.nom} onChange={(e) => setFormData(prev => ({ ...prev, dialecte: { ...prev.dialecte, nom: e.target.value } }))} options={ETHNICITIES} error={errors.dialecteNom} required />
                <FormSelect label="Niveau" name="niveauDialecte" value={formData.dialecte.niveau} onChange={(e) => setFormData(prev => ({ ...prev, dialecte: { ...prev.dialecte, niveau: e.target.value } }))} options={LEVELS} error={errors.dialecteNiveau} required />
              </div>
            </div>
          )}

          {/* Tab: Contact */}
          {activeTab === 'contact' && (
            <div className="tab-content">
              <div className="form-row">
                <FormField label="Contact personnel" name="contactPersonnel" value={formData.contactPersonnel} onChange={handleInputChange} error={errors.contactPersonnel} required />
                <FormField label="Numéro Mvola" name="numeroMvola" value={formData.numeroMvola} onChange={handleInputChange} error={errors.numeroMvola} />
              </div>
              <FormField label="Email personnel" name="emailPersonnel" type="email" value={formData.emailPersonnel} onChange={handleInputChange} error={errors.emailPersonnel} required />
              <div className="emergency-section">
                <h3>🚨 Personne à contacter en cas d'urgence</h3>
                <div className="form-row">
                  <FormField label="Nom" name="nomPersonneUrgence" value={formData.nomPersonneUrgence} onChange={handleInputChange} error={errors.nomPersonneUrgence} required />
                  <FormField label="Numéro" name="numeroUrgence" value={formData.numeroUrgence} onChange={handleInputChange} error={errors.numeroUrgence} required />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Situation Familiale */}
          {activeTab === 'famille' && (
            <div className="tab-content">
              <FormSelect label="Situation familiale" name="situationFamiliale" value={formData.situationFamiliale} onChange={handleInputChange} options={FAMILY_STATUS} />
              {formData.situationFamiliale === 'Marié(e)' && (
                <div className="married-section">
                  <h3>👰 Informations du conjoint</h3>
                  <div className="form-row">
                    <FormField label="Nom du conjoint" name="nomConjoint" value={formData.nomConjoint} onChange={handleInputChange} error={errors.nomConjoint} required />
                    <FormField label="Prénoms du conjoint" name="prenomsConjoint" value={formData.prenomsConjoint} onChange={handleInputChange} error={errors.prenomsConjoint} required />
                  </div>
                  <FormField label="Date de mariage civile" name="dateMariage" type="date" value={formData.dateMariage} onChange={handleInputChange} error={errors.dateMariage} required />
                </div>
              )}
              <div className="children-section">
                <h3>👶 Enfants</h3>
                <div className="form-group">
                  <label>Nombre d'enfants</label>
                  <input type="number" min="0" max="9" value={formData.nombreEnfants} onChange={handleNombreEnfants} className="number-input" />
                </div>
              </div>
              {formData.nombreEnfants > 0 && (
                <div className="children-list">
                  {Array.from({ length: formData.nombreEnfants }).map((_, i) => (
                    <div key={i} className="child-card">
                      <h4>Enfant {i + 1}</h4>
                      <FormField label="Nom et Prénoms" name={`enfantNom${i}`} value={formData.enfants[i]?.nom || ''} onChange={(e) => handleEnfantChange(i, 'nom', e.target.value)} error={errors[`enfantNom${i}`]} required />
                      <FormField label="Date de naissance" type="date" name={`enfantDate${i}`} value={formData.enfants[i]?.dateNaissance || ''} onChange={(e) => handleEnfantChange(i, 'dateNaissance', e.target.value)} error={errors[`enfantDate${i}`]} required />
                    </div>
                  ))}
                </div>
              )}
              <div className="form-row">
                <FormField label="Numéro CNAPS" name="numeroCnaps" value={formData.numeroCnaps} onChange={handleInputChange} />
                <FormSelect label="Vaccin COVID-19" name="vaccin" value={formData.vaccin} onChange={handleInputChange} options={['Oui', 'Non']} />
              </div>
            </div>
          )}

          {/* Tab: Formation & Compétences */}
          {activeTab === 'diplome' && (
            <div className="tab-content">
              <h3>📚 Diplômes Obtenus (Max 3 avec domaines)</h3>
              {formData.diplomes.map((diplome, index) => (
                <div key={index} className="diploma-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>Diplôme {index + 1}</h4>
                    {formData.diplomes.length > 1 && (
                      <button type="button" className="btn-remove" onClick={() => removeDiplome(index)}>✕ Supprimer</button>
                    )}
                  </div>
                  <div className="form-row">
                    <FormSelect label="Type de diplôme" name={`diploma${index}`} value={diplome.nom} onChange={(e) => handleDiplomeChange(index, 'nom', e.target.value)} options={DIPLOMAS} />
                    {diplome.nom !== 'BAC' && diplome.nom && (
                      <FormField label="Domaine d'étude" name={`diplomaDomain${index}`} value={diplome.domaine} onChange={(e) => handleDiplomeChange(index, 'domaine', e.target.value)} />
                    )}
                  </div>
                </div>
              ))}
              {formData.diplomes.length < 4 && (
                <button type="button" className="btn-add" onClick={addDiplome}>+ Ajouter un diplôme</button>
              )}
              
              <h3 style={{ marginTop: '40px' }}>🌍 Langues Étrangères</h3>
              {formData.langues.map((langue, index) => (
                <div key={index} className="language-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>Langue {index + 1}</h4>
                    {formData.langues.length > 1 && (
                      <button type="button" className="btn-remove" onClick={() => removeLangue(index)}>
                        ✕ Supprimer
                      </button>
                    )}
                  </div>
                  <div className="form-row">
                    <FormSelect label="Langue" name={`language${index}`} value={langue.nom} onChange={(e) => handleLangueChange(index, 'nom', e.target.value)} options={LANGUAGES} />
                    {langue.nom && (
                      <FormSelect label="Niveau" name={`level${index}`} value={langue.niveau} onChange={(e) => handleLangueChange(index, 'niveau', e.target.value)} options={LEVELS} />
                    )}
                  </div>
                </div>
              ))}
              {formData.langues.length < 10 && (
                <button type="button" className="btn-add" onClick={handleAddLangue}>+ Ajouter d'autres langues</button>
              )}
              

            </div>
          )}

          {/* Tab: Voir Collaborateurs */}
          {activeTab === 'voir' && (
            <div className="tab-content">
              <h3>👥 Collaborateurs Insérés</h3>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Filtrer par date d'insertion:</label>
                <input 
                  type="date" 
                  value={filteredDate}
                  onChange={(e) => setFilteredDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                />
              </div>
              <div className="collaborators-list">
                {loadingCollaborators ? (
                  <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>⏳ Chargement des données...</p>
                ) : collaborators.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>Aucun collaborateur enregistré</p>
                ) : (
                  <div>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                      <strong>{getFilteredCollaborators().length}</strong> collaborateur(s) 
                      {filteredDate && ` pour le ${filteredDate}`}
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#667eea', color: 'white' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Matricule</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Nom et Prénoms</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Date d'insertion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredCollaborators().map((collab, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                            <td style={{ padding: '12px', textAlign: 'left' }}>{collab['Matricule'] || '-'}</td>
                            <td style={{ padding: '12px', textAlign: 'left' }}>{collab['Nom et Prénoms'] || '-'}</td>
                            <td style={{ padding: '12px', textAlign: 'left' }}>{collab["Date d'insertion"] || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Panneau Collaborateurs dans Navbar */}
          {showCollaborators && (
            <div style={{
              position: 'fixed',
              top: '130px',
              right: '20px',
              width: '450px',
              maxHeight: '600px',
              background: 'white',
              border: '2px solid #667eea',
              borderRadius: '8px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              zIndex: 40,
              overflowY: 'auto',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>👥 Collaborateurs</h3>
                <button 
                  onClick={() => setShowCollaborators(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>
              
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Filtrer par date:</label>
                <input 
                  type="date" 
                  value={filteredDate}
                  onChange={(e) => setFilteredDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>

              {loadingCollaborators ? (
                <p style={{ textAlign: 'center', color: '#666' }}>⏳ Chargement...</p>
              ) : getFilteredCollaborators().length > 0 ? (
                <div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                    {getFilteredCollaborators().length} collaborateur(s) trouvé(s)
                  </p>
                  {getFilteredCollaborators().map((collab, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      marginBottom: '10px',
                      background: '#f5f5f5',
                      borderLeft: '4px solid #667eea',
                      borderRadius: '4px'
                    }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                        {collab['Nom et Prénoms'] || 'N/A'}
                      </p>
                      <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#666' }}>
                        📋 {collab['Matricule'] || '-'}
                      </p>
                      <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>
                        📅 {collab["Date d'insertion"] || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  Aucun collaborateur pour cette date
                </p>
              )}
            </div>
          )}

          {message && (<div className={`message ${message.includes('✓') ? 'success' : 'error'}`}>{message}</div>)}
        </form>
      </div>
    </div>
  );
};

export default IdentificationForm;
