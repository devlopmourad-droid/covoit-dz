# Points nécessitant une validation juridique/assurantielle (Algérie)

Cette liste rassemble tout ce qui, dans le code, est marqué comme une
hypothèse de travail plutôt qu'une décision validée. À faire valider par
un avocat et/ou un assureur agréé en Algérie avant toute mise en
production réelle.

| Sujet | Valeur actuelle (hypothèse) | Fichier |
|---|---|---|
| Âge minimum conducteur/propriétaire | 21 ans | `backend/src/config/business-rules.config.ts` |
| Ancienneté minimale du permis | 2 ans | idem |
| Délai d'annulation gratuite | 48h avant le départ | idem |
| Commission plateforme | 15% du loyer | idem |
| Caution par défaut | 50 000 DZD | idem |
| Statut légal des "formules de protection" | `pending_legal_validation` — ce sont des garanties contractuelles entre particuliers, PAS un produit d'assurance agréé | `backend/database/schema.sql` (table `protection_plans`) |
| Politique de pénalité en cas d'annulation tardive | non définie (tracée mais pas facturée) | `backend/src/modules/bookings/bookings.service.ts` |
| Documents d'identité/permis requis, conservation, RGPD-équivalent algérien | table `user_documents` prête, pas de politique de rétention définie | `backend/database/schema.sql` |
| Fiscalité (TVA, déclaration des revenus des propriétaires) | non traitée | — |
| Facturation / conformité comptable algérienne | non traitée | — |

Aucune de ces valeurs ne doit être présentée à un utilisateur final comme
un conseil juridique ou une garantie d'assurance réelle tant qu'elles
n'ont pas été validées par un professionnel compétent en Algérie.
