"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, AlertCircle, Check, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

interface CSVColumnMapping {
  csvHeader: string;
  userField: string;
  required: boolean;
  example: string;
}

export default function ImportUsersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'results'>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [mapping, setMapping] = useState<CSVColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<{
    total: number;
    created: number;
    errors: number;
    errorDetails: { row: number; errors: string[] }[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dragActive, setDragActive] = useState(false);
  
  // État pour suivre le traitement du fichier
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  // Champs utilisateur disponibles pour le mapping
  const userFields = [
    { id: 'name', label: 'Nom complet', required: true },
    { id: 'email', label: 'Email', required: true },
    { id: 'password', label: 'Mot de passe', required: false },
    { id: 'position', label: 'Poste', required: false },
    { id: 'hourlyRate', label: 'Forfait horaire', required: false },
    { id: 'company', label: 'Entreprise', required: false },
    { id: 'accountStatus', label: 'Statut du compte', required: false },
    { id: 'isAdmin', label: 'Administrateur', required: false },
  ];

  // Modèle CSV attendu
  const expectedFormat = [
    { field: 'name', description: 'Nom complet de l\'utilisateur' },
    { field: 'email', description: 'Adresse email (sera utilisée pour la connexion)' },
    { field: 'password', description: 'Mot de passe temporaire (optionnel)' },
    { field: 'position', description: 'Poste occupé dans l\'entreprise' },
    { field: 'hourlyRate', description: 'Forfait horaire (ex: 35h, 39h, etc.)' },
    { field: 'company', description: 'Nom de l\'entreprise' },
    { field: 'accountStatus', description: 'Statut du compte (PENDING, APPROVED, REJECTED)' },
    { field: 'isAdmin', description: 'Droits administrateur (true/false)' },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Réinitialiser les états précédents
    setValidationErrors([]);
    setIsProcessingFile(true);
    
    try {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) {
        setIsProcessingFile(false);
        return;
      }
      
      console.log("Fichier sélectionné:", selectedFile.name, "Type:", selectedFile.type, "Taille:", Math.round(selectedFile.size / 1024), "KB");
      
      // Vérifier la taille du fichier (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en octets
      if (selectedFile.size > maxSize) {
        setValidationErrors([
          `Le fichier "${selectedFile.name}" est trop volumineux (${Math.round(selectedFile.size / 1024)} KB).`,
          `La taille maximale autorisée est de 5 MB (5120 KB).`
        ]);
        
        // Réinitialiser le champ de fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsProcessingFile(false);
        return;
      }
      
      // Vérifier l'extension du fichier
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      // Vérifier si c'est un fichier Excel
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setValidationErrors([
          `Le fichier "${selectedFile.name}" est un fichier Excel (.${fileExtension}), pas un fichier CSV.`,
          'Veuillez enregistrer votre fichier au format CSV (séparateur point-virgule) depuis Excel :',
          '1. Dans Excel, cliquez sur "Fichier" > "Enregistrer sous"',
          '2. Sélectionnez "CSV (séparateur point-virgule) (*.csv)"',
          '3. Cliquez sur "Enregistrer"'
        ]);
        
        // Réinitialiser le champ de fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsProcessingFile(false);
        return;
      }
      
      // Vérifier si c'est bien un fichier CSV ou texte
      if (fileExtension !== 'csv' && fileExtension !== 'txt') {
        setValidationErrors([
          `Le fichier "${selectedFile.name}" a une extension .${fileExtension}, qui n'est pas un format CSV reconnu.`,
          'Veuillez utiliser un fichier .csv avec des en-têtes correspondant au format attendu.'
        ]);
        
        // Réinitialiser le champ de fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsProcessingFile(false);
        return;
      }
      
      setFile(selectedFile);
      parseCSVFile(selectedFile);
    } catch (error) {
      console.error("Erreur lors du traitement du fichier:", error);
      setValidationErrors(["Une erreur s'est produite lors du traitement du fichier. Veuillez réessayer."]);
      setIsProcessingFile(false);
      
      // Réinitialiser le champ de fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const parseCSVFile = (file: File) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          console.log("Fichier CSV chargé");
          const content = e.target?.result as string;
          
          // Vérifier si le contenu du fichier semble être binaire
          if (content.substring(0, 2) === "PK" || /[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\xFF]/.test(content.substring(0, 20))) {
            console.error("Détection de contenu binaire dans le fichier");
            setValidationErrors([
              "Le fichier semble être au format binaire, pas un CSV valide.",
              "Si vous avez édité ce fichier dans Excel, assurez-vous de l'enregistrer au format CSV (séparateur point-virgule).",
              "Conseil: utilisez le bouton 'Télécharger modèle CSV' pour obtenir un modèle valide."
            ]);
            
            // Réinitialiser le fichier
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setIsProcessingFile(false);
            return;
          }
          
          // Détecter le délimiteur (point-virgule ou virgule)
          const delimiter = content.includes(';') ? ';' : ',';
          const lines = content.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length === 0) {
            setValidationErrors(['Le fichier CSV est vide.']);
            setIsProcessingFile(false);
            return;
          }
          
          if (lines.length > 0) {
            // Extraire les en-têtes (première ligne)
            const headers = lines[0].split(delimiter).map(header => header.trim());
            
            // Vérifier la validité des en-têtes
            if (headers.length < 2) {
              console.error("Pas assez d'en-têtes détectés", headers);
              setValidationErrors([
                `Seulement ${headers.length} en-tête(s) détecté(s) dans le fichier.`,
                "Le fichier doit contenir au minimum les colonnes 'name' et 'email'.",
                "Vérifiez le délimiteur utilisé - nous attendons un CSV avec séparateur point-virgule (;)."
              ]);
              
              // Réinitialiser le fichier
              setFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              setIsProcessingFile(false);
              return;
            }
            
            console.log("En-têtes détectés:", headers);
            setCsvHeaders(headers);
            
            // Normaliser les en-têtes pour enlever les BOM, espaces supplémentaires, etc.
            const normalizedHeaders = headers.map(header => {
              // Enlever le BOM (Byte Order Mark) qui peut apparaître au début du fichier
              let cleaned = header.replace(/^\uFEFF/, '');
              // Enlever les espaces et convertir en minuscules pour la comparaison
              cleaned = cleaned.trim().toLowerCase();
              return cleaned;
            });
            
            // Créer un mapping initial (à configurer par l'utilisateur)
            const initialMapping: CSVColumnMapping[] = [];
            
            // Pour chaque en-tête, essayer de trouver un champ correspondant
            for (let i = 0; i < headers.length; i++) {
              const header = headers[i];
              const normalizedHeader = normalizedHeaders[i];
              
              // Tenter de détecter automatiquement les champs par nom
              let matchingField = null;
              
              // Vérifier les correspondances exactes en premier (sensible à la casse)
              matchingField = userFields.find(field => 
                field.id === header || field.label === header
              );
              
              // Si pas de correspondance exacte, essayer une correspondance insensible à la casse
              if (!matchingField) {
                matchingField = userFields.find(field => 
                  field.id.toLowerCase() === normalizedHeader || 
                  field.label.toLowerCase() === normalizedHeader
                );
              }
              
              // Si toujours pas de correspondance, essayer avec des variations connues
              if (!matchingField) {
                // Map des variations connues pour chaque champ
                const fieldVariations: Record<string, string[]> = {
                  'name': ['nom', 'fullname', 'nom complet', 'complete name', 'full name'],
                  'email': ['mail', 'e-mail', 'courriel', 'email address', 'adresse email'],
                  'password': ['pass', 'mdp', 'mot de passe', 'password'],
                  'position': ['job', 'post', 'poste', 'title', 'fonction', 'job title'],
                  'hourlyRate': ['hourly_rate', 'hourly', 'forfait', 'forfait_horaire', 'horaire', 'taux horaire', 'rate'],
                  'company': ['enterprise', 'entreprise', 'societe', 'organization', 'organisation'],
                  'accountStatus': ['account_status', 'status', 'statut', 'etat', 'état', 'statut_du_compte'],
                  'isAdmin': ['is_admin', 'admin', 'administrateur', 'is administrator', 'is administrateur']
                };
                
                // Vérifier chaque champ pour des variations possibles
                for (const [fieldId, variations] of Object.entries(fieldVariations)) {
                  if (variations.includes(normalizedHeader)) {
                    matchingField = userFields.find(field => field.id === fieldId);
                    break;
                  }
                }
              }
              
              // Ajouter au mapping
              initialMapping.push({
                csvHeader: header,
                userField: matchingField ? matchingField.id : '',
                required: matchingField ? matchingField.required : false,
                example: lines.length > 1 ? lines[1].split(delimiter)[i] : ''
              });
            }
            
            console.log("Mapping initial:", initialMapping);
            
            // Vérifier que les champs obligatoires sont mappés
            const requiredFields = userFields.filter(field => field.required);
            let allRequiredFieldsMapped = true;
            
            for (const requiredField of requiredFields) {
              if (!initialMapping.some(m => m.userField === requiredField.id)) {
                allRequiredFieldsMapped = false;
                console.warn(`Champ obligatoire non mappé: ${requiredField.label}`);
              }
            }
            
            if (!allRequiredFieldsMapped) {
              console.warn("Tous les champs obligatoires ne sont pas mappés automatiquement.");
            }
            
            setMapping(initialMapping);
            
            // Prévisualisation des données (jusqu'à 5 lignes)
            const previewRows = [];
            for (let i = 1; i < Math.min(lines.length, 6); i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(delimiter).map(val => val.trim());
                const rowObject: Record<string, string> = {};
                
                headers.forEach((header, index) => {
                  rowObject[header] = index < values.length ? values[index] : '';
                });
                
                previewRows.push(rowObject);
              }
            }
            
            setCsvPreview(previewRows);
            setStep('mapping');
          }
        } catch (error) {
          console.error("Erreur lors de l'analyse du fichier CSV:", error);
          setValidationErrors(["Erreur lors de l'analyse du fichier CSV. Vérifiez le format et réessayez."]);
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setIsProcessingFile(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error("Erreur lors de la lecture du fichier:", error);
        setValidationErrors(['Erreur lors de la lecture du fichier.']);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsProcessingFile(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error("Exception lors du traitement du fichier:", error);
      setValidationErrors(["Une erreur inattendue s'est produite lors du traitement du fichier."]);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsProcessingFile(false);
    }
  };

  const handleMappingChange = (csvHeader: string, userField: string) => {
    setMapping(prev => 
      prev.map(item => 
        item.csvHeader === csvHeader ? { ...item, userField } : item
      )
    );
  };

  const validateMapping = () => {
    const errors = [];
    
    // Vérifier que tous les champs requis sont mappés
    const unmappedRequiredFields = [];
    for (const field of userFields) {
      if (field.required && !mapping.some(m => m.userField === field.id)) {
        unmappedRequiredFields.push(field);
      }
    }
    
    if (unmappedRequiredFields.length > 0) {
      const fieldNames = unmappedRequiredFields.map(f => f.label).join(", ");
      errors.push(`Le(s) champ(s) "${fieldNames}" est/sont requis mais n'est/ne sont pas mappé(s). Veuillez associer une colonne CSV à chaque champ requis.`);
      
      // Donner des suggestions pour chaque champ non mappé
      for (const field of unmappedRequiredFields) {
        const possibleColumns = mapping
          .filter(m => !m.userField) // Colonnes non utilisées
          .map(m => m.csvHeader);
          
        if (possibleColumns.length > 0) {
          errors.push(`Suggestion pour "${field.label}": utilisez l'une des colonnes disponibles: ${possibleColumns.join(", ")}`);
        } else {
          errors.push(`Aucune colonne disponible pour "${field.label}". Veuillez vérifier votre fichier CSV.`);
        }
      }
    }
    
    // Vérifier qu'il n'y a pas de doublons dans le mapping
    const mappedFields = mapping.filter(m => m.userField).map(m => m.userField);
    const duplicateFields = mappedFields.filter((field, index) => 
      field && mappedFields.indexOf(field) !== index
    );
    
    if (duplicateFields.length > 0) {
      // Trouver quels sont les champs en double
      const uniqueDuplicates = [...new Set(duplicateFields)];
      for (const duplicate of uniqueDuplicates) {
        const field = userFields.find(f => f.id === duplicate);
        const columns = mapping
          .filter(m => m.userField === duplicate)
          .map(m => m.csvHeader)
          .join(", ");
          
        errors.push(`Le champ "${field?.label || duplicate}" est mappé plusieurs fois (colonnes: ${columns}). Veuillez choisir une seule colonne.`);
      }
    }
    
    console.log("Validation du mapping:", errors.length > 0 ? "Erreurs détectées" : "OK");
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handlePreview = () => {
    if (validateMapping()) {
      setStep('preview');
    }
  };

  const importUsers = async () => {
    setStep('importing');
    
    try {
      // Construction du FormData pour l'upload
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('mapping', JSON.stringify(mapping));
      
      const response = await fetch('/api/admin/import-users', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Une erreur est survenue lors de l\'importation.');
      }
      
      setImportResults(result);
      setStep('results');
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setValidationErrors([error instanceof Error ? error.message : 'Une erreur est survenue']);
      setStep('preview');
    }
  };

  const resetImport = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvPreview([]);
    setMapping([]);
    setValidationErrors([]);
    setImportResults(null);
    setStep('upload');
    
    // Réinitialiser l'input de fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fonction pour télécharger un modèle CSV
  const downloadCsvTemplate = () => {
    // Créer les en-têtes
    const headers = expectedFormat.map(f => f.field).join(';');
    
    // Créer une ligne d'exemple
    const example = ["Jean Dupont", "jean.dupont@example.com", "P@ssw0rd", "Développeur", "35h", "Acme Inc", "PENDING", "false"].join(';');
    
    // Ajouter une ligne vide pour que l'utilisateur puisse facilement remplir
    const emptyLine = new Array(expectedFormat.length).fill('').join(';');
    
    // Créer le contenu du fichier (ajouter un BOM pour UTF-8)
    // Le retour à la ligne CRLF (\r\n) est plus compatible avec Excel sur Windows
    const content = `\uFEFF${headers}\r\n${example}\r\n${emptyLine}`;
    
    // Vérification du contenu
    console.log("Contenu du modèle CSV:", content.substring(0, 100) + "...");
    
    // Créer un blob et un lien de téléchargement avec l'encodage explicite
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_import_utilisateurs.csv');
    
    // Ajouter temporairement le lien au document
    document.body.appendChild(link);
    link.click();
    
    // Nettoyage
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log("Modèle CSV téléchargé");
    }, 100);
  };

  // Gérer les événements de drag and drop
  const handleDrag = (e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'événement de drag:", error);
    }
  };

  // Gérer le dépôt du fichier
  const handleDrop = (e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0];
        console.log("Fichier déposé:", droppedFile.name);
        
        // Utiliser le même traitement que pour le sélecteur de fichier
        const fileEvent = {
          target: {
            files: e.dataTransfer.files
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        
        handleFileChange(fileEvent);
      }
    } catch (error) {
      console.error("Erreur lors du drop de fichier:", error);
      setValidationErrors(["Une erreur s'est produite lors du dépôt du fichier. Veuillez essayer de le sélectionner manuellement."]);
    }
  };

  // Fonction pour passer à une étape spécifique
  const goToStep = (requestedStep: 'upload' | 'mapping' | 'preview' | 'results') => {
    // On ne peut pas revenir en arrière depuis l'étape results
    if (step === 'results' && requestedStep !== 'results') {
      return;
    }
    
    // On ne peut pas aller à l'étape preview sans un mapping valide
    if (requestedStep === 'preview' && !validateMapping()) {
      return;
    }
    
    // On ne peut pas aller aux résultats directement
    if (requestedStep === 'results') {
      return;
    }
    
    // Si on essaie d'aller à une étape suivante, il faut valider les étapes intermédiaires
    if (step === 'upload' && (requestedStep === 'preview' || requestedStep === 'mapping')) {
      if (!file) {
        setValidationErrors(["Veuillez d'abord sélectionner un fichier CSV."]);
        return;
      }
    }
    
    setStep(requestedStep);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Importation d'utilisateurs</h1>
        <Link 
          href="/admin/dashboard" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Retour au tableau de bord
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Importation CSV d'utilisateurs</CardTitle>
          <CardDescription>
            Importez plusieurs utilisateurs à la fois à partir d'un fichier CSV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Indicateurs d'étape améliorés et interactifs */}
            <div className="flex items-center justify-between gap-2">
              {/* Étape 1 - Upload */}
              <button 
                type="button"
                onClick={() => goToStep('upload')}
                className={`relative w-16 flex flex-col items-center ${step !== 'upload' && step !== 'results' ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
                disabled={step === 'results'}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-white border-2 border-primary text-primary'}`}>
                  1
                </div>
                <span className="text-xs text-center">Upload</span>
                {/* Ligne de connexion */}
                <div className={`absolute top-6 left-[calc(100%-14px)] h-[2px] w-[calc(100%+24px)] ${(step === 'preview' || step === 'results') ? 'bg-gradient-to-r from-primary to-muted' : 'bg-muted'}`}></div>
              </button>
              
              {/* Étape 2 - Mapping */}
              <button 
                type="button"
                onClick={() => goToStep('mapping')}
                className={`relative w-16 flex flex-col items-center ${file && step !== 'mapping' && step !== 'results' ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity ${!file ? 'opacity-50' : ''}`}
                disabled={!file || step === 'results'}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step === 'mapping' ? 'bg-primary text-primary-foreground' : step === 'preview' || step === 'results' ? 'bg-white border-2 border-primary text-primary' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
                <span className="text-xs text-center">Mapping</span>
                {/* Ligne de connexion */}
                <div className={`absolute top-6 left-[calc(100%-14px)] h-[2px] w-[calc(100%+24px)] ${(step === 'preview' || step === 'results') ? 'bg-gradient-to-r from-primary to-muted' : 'bg-muted'}`}></div>
              </button>
              
              {/* Étape 3 - Preview */}
              <button 
                type="button"
                onClick={() => goToStep('preview')}
                className={`relative w-16 flex flex-col items-center ${(step === 'mapping' || step === 'preview') ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity ${!(step === 'mapping' || step === 'preview' || step === 'results') ? 'opacity-50' : ''}`}
                disabled={!(step === 'mapping' || step === 'preview')}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step === 'preview' ? 'bg-primary text-primary-foreground' : step === 'results' ? 'bg-white border-2 border-primary text-primary' : 'bg-muted text-muted-foreground'}`}>
                  3
                </div>
                <span className="text-xs text-center">Aperçu</span>
                {/* Ligne de connexion */}
                <div className={`absolute top-6 left-[calc(100%-14px)] h-[2px] w-[calc(100%+24px)] ${step === 'results' ? 'bg-gradient-to-r from-primary to-muted' : 'bg-muted'}`}></div>
              </button>
              
              {/* Étape 4 - Résultats */}
              <button 
                type="button"
                className="relative w-16 flex flex-col items-center"
                disabled
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step === 'results' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  4
                </div>
                <span className="text-xs text-center">Résultats</span>
              </button>
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {step === 'upload' && (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                  <h3 className="text-lg font-medium text-amber-800 mb-2">Format CSV attendu</h3>
                  <p className="text-sm text-amber-700 mb-3">
                    Votre fichier CSV doit contenir les colonnes suivantes (l'ordre n'est pas important, séparateur point-virgule ';') :
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-amber-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Colonne</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Description</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Obligatoire</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-200">
                        {expectedFormat.map((format, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-amber-50' : 'bg-amber-100'}>
                            <td className="px-3 py-2 text-sm font-medium text-amber-900">{format.field}</td>
                            <td className="px-3 py-2 text-sm text-amber-800">{format.description}</td>
                            <td className="px-3 py-2 text-sm text-amber-800">
                              {format.field === 'name' || format.field === 'email' ? 'Oui' : 'Non'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm text-amber-700">
                      Le statut du compte peut être "PENDING" (en attente), "APPROVED" (approuvé) ou "REJECTED" (rejeté).<br />
                      Pour les droits administrateur, utilisez "true" ou "false". Par défaut "false".
                    </p>
                    <Button 
                      variant="outline" 
                      className="text-amber-800 border-amber-300 hover:bg-amber-100"
                      onClick={downloadCsvTemplate}
                    >
                      Télécharger modèle CSV
                    </Button>
                  </div>
                </div>

                {/* Zone de drag and drop améliorée */}
                <div 
                  className="w-full"
                  onDragEnter={handleDrag}
                >
                  <label 
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center border-2 ${dragActive ? 'border-primary bg-primary/5' : 'border-dashed border-gray-300'} rounded-lg p-12 space-y-4 transition-colors cursor-pointer ${isProcessingFile ? 'opacity-70 pointer-events-none' : ''}`}
                  >
                    {isProcessingFile ? (
                      <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
                    ) : (
                      <UploadCloud className={`h-12 w-12 ${dragActive ? 'text-primary' : 'text-gray-400'}`} />
                    )}
                    <div className="text-center">
                      <h3 className="text-lg font-medium">
                        {isProcessingFile ? "Traitement du fichier..." : "Déposez votre fichier CSV ici"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {isProcessingFile ? "Veuillez patienter" : "ou cliquez pour sélectionner un fichier"}
                      </p>
                    </div>
                    <div className="relative w-full max-w-sm">
                      <Input
                        id="file-upload"
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                        disabled={isProcessingFile}
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Format accepté : fichier CSV avec en-têtes, séparateur point-virgule (;)</p>
                      <p>Taille maximale : 5 MB</p>
                    </div>
                    <div className="max-w-md text-sm p-3 bg-blue-50 text-blue-700 rounded">
                      <p className="font-medium mb-1">Important :</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Utilisez exclusivement le format CSV avec séparateur point-virgule (;)</li>
                        <li>Si vous éditez avec Excel, assurez-vous d&apos;enregistrer au format &quot;CSV (séparateur: point-virgule)&quot;</li>
                        <li>Veillez à conserver les noms de colonnes exacts du modèle téléchargeable</li>
                        <li>En cas de problème d&apos;importation, téléchargez à nouveau le modèle et utilisez-le comme base</li>
                      </ul>
                    </div>
                  </label>
                  {dragActive && (
                    <div 
                      className="fixed inset-0 w-full h-full z-50"
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={handleDrop}
                    ></div>
                  )}
                </div>
              </div>
            )}

            {step === 'mapping' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuration du mapping</h3>
                <p className="text-sm text-gray-500">
                  Associez chaque colonne de votre CSV à un champ utilisateur. Les champs marqués d'un * sont obligatoires.
                </p>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colonne CSV</TableHead>
                      <TableHead>Exemple de données</TableHead>
                      <TableHead>Champ utilisateur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mapping.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.csvHeader}</TableCell>
                        <TableCell className="font-mono text-xs">{item.example}</TableCell>
                        <TableCell>
                          <select
                            value={item.userField}
                            onChange={(e) => handleMappingChange(item.csvHeader, e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">-- Ne pas utiliser --</option>
                            {userFields.map(field => (
                              <option 
                                key={field.id} 
                                value={field.id}
                                disabled={mapping.some(m => m.userField === field.id && m.csvHeader !== item.csvHeader)}
                              >
                                {field.label}{field.required ? ' *' : ''}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetImport}>Retour</Button>
                  <Button onClick={handlePreview}>Aperçu et validation</Button>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Aperçu des données à importer</h3>
                <p className="text-sm text-gray-500">
                  Vérifiez les données avant de lancer l'importation. Assurez-vous que le mapping est correct.
                </p>
                
                <div className="border rounded-md overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {userFields.map(field => mapping.some(m => m.userField === field.id) && (
                          <TableHead key={field.id}>{field.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {userFields.map(field => {
                            const matchedMapping = mapping.find(m => m.userField === field.id);
                            return matchedMapping ? (
                              <TableCell key={field.id}>{row[matchedMapping.csvHeader]}</TableCell>
                            ) : null;
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Attention</AlertTitle>
                  <AlertDescription>
                    <p>Vous allez importer {csvPreview.length} utilisateurs (prévisualisation des {Math.min(csvPreview.length, 5)} premiers).</p>
                    <p>Les utilisateurs seront créés avec le statut indiqué dans la colonne "accountStatus". Si cette colonne n&apos;est pas présente ou vide, ils seront créés avec le statut "PENDING" (en attente).</p>
                    <p>Les utilisateurs seront créés avec les droits administrateur selon la valeur de "isAdmin". Si cette colonne n&apos;est pas présente ou vide, ils n&apos;auront pas de droits administrateur.</p>
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('mapping')}>Retour</Button>
                  <Button onClick={importUsers}>Lancer l'importation</Button>
                </div>
              </div>
            )}

            {step === 'importing' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="h-12 w-12 rounded-full border-4 border-t-primary animate-spin"></div>
                <h3 className="text-lg font-medium">Importation en cours...</h3>
                <p className="text-sm text-gray-500">Veuillez patienter pendant le traitement des données.</p>
              </div>
            )}

            {step === 'results' && importResults && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Check className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-medium">Importation terminée</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 flex flex-col items-center">
                      <p className="text-3xl font-bold">{importResults.total}</p>
                      <p className="text-sm text-gray-500">Total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 flex flex-col items-center">
                      <p className="text-3xl font-bold text-green-500">{importResults.created}</p>
                      <p className="text-sm text-gray-500">Créés</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 flex flex-col items-center">
                      <p className="text-3xl font-bold text-red-500">{importResults.errors}</p>
                      <p className="text-sm text-gray-500">Erreurs</p>
                    </CardContent>
                  </Card>
                </div>
                
                {importResults.errors > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Détails des erreurs</h4>
                    <div className="max-h-60 overflow-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ligne</TableHead>
                            <TableHead>Erreurs</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResults.errorDetails.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.row}</TableCell>
                              <TableCell>
                                <ul className="list-disc pl-4">
                                  {error.errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                  ))}
                                </ul>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetImport}>Nouvelle importation</Button>
                  <Button onClick={() => window.location.href = '/admin/dashboard'}>Retour au tableau de bord</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 