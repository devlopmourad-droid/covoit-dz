/**
 * RÈGLES MÉTIER DÉPENDANT DU DROIT ALGÉRIEN
 * ==========================================
 * Toutes les valeurs de ce fichier sont des HYPOTHÈSES DE TRAVAIL
 * raisonnables pour permettre le développement, PAS des avis juridiques.
 * Elles DOIVENT être revues et validées par un professionnel du droit
 * (assurance, location entre particuliers, protection des données) et
 * un assureur agréé en Algérie avant toute mise en production réelle.
 *
 * Centraliser ces valeurs ICI (plutôt que de les disperser dans le code)
 * permet de les ajuster en un seul endroit une fois la validation faite,
 * et sert de checklist explicite pour l'équipe juridique/produit.
 */
export const BUSINESS_RULES = {
  /** Âge minimum pour s'inscrire comme conducteur/propriétaire. */
  MIN_DRIVER_AGE: 21,

  /**
   * Ancienneté minimale du permis de conduire, en années.
   * Getaround (France) utilise généralement 2-3 ans ; à confirmer pour
   * l'Algérie.
   */
  MIN_LICENSE_SENIORITY_YEARS: 2,

  /** Délai d'annulation gratuite avant le début de la location. */
  FREE_CANCELLATION_WINDOW_HOURS: 48,

  /**
   * Commission plateforme prélevée sur le loyer, en pourcentage.
   * Valeur de départ arbitraire ; à ajuster selon le modèle économique.
   */
  PLATFORM_SERVICE_FEE_PERCENT: 15,

  /** Caution par défaut si le propriétaire n'en définit pas. */
  DEFAULT_DEPOSIT_DZD: 50000,

  /**
   * Statut légal des formules de "protection/assurance" proposées :
   * tant que ce statut vaut 'pending_legal_validation', l'app doit
   * afficher clairement qu'il s'agit d'une caution/garantie contractuelle
   * entre particuliers et NON d'un produit d'assurance agréé, sauf
   * partenariat effectif avec un assureur.
   */
  PROTECTION_PLAN_LEGAL_STATUS: 'pending_legal_validation' as const,

  /** Devise de la plateforme. */
  CURRENCY: 'DZD',

  /** Délai de rétractation / droit de réflexion éventuel (non déterminé). */
  COOLING_OFF_PERIOD_HOURS: 0,
};
