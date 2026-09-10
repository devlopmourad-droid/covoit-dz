# NQASMO — Système de design (frontend web)

Ce document résume comment la charte graphique NQASMO (fournie séparément)
a été traduite en code. Toute nouvelle interface doit repartir de
`tailwind.config.js`, pas réinventer des couleurs/tailles à la main.

## Tokens appliqués

| Rôle | Valeur | Classe Tailwind |
|---|---|---|
| Vert principal | `#00B894` | `bg-brand`, `text-brand` |
| Vert clair | `#E6F7F1` | `bg-brand-light` |
| Bleu foncé | `#0B3D4E` | `bg-brand-dark`, `text-brand-dark` |
| Orange accent | `#EF674F` | `bg-accent`, `text-accent` |
| Gris texte secondaire | `#6B7280` | `text-muted` |

**Note sur les couleurs** : le document texte de la charte et les deux
planches image fournies donnaient des valeurs légèrement différentes pour
le bleu foncé (`#0B3D4E` vs `#014D4E`) et l'orange (`#EF674F` vs `#FF6B4A`).
Le texte se déclarant lui-même "source de vérité" (section 35), ce sont ses
valeurs qui sont implémentées ici. À signaler si ce n'était pas
l'intention.

Rayons : `rounded-card` (18px), `rounded-btn` (14px), `rounded-field` (13px).
Police : Montserrat (texte latin), Noto Sans Arabic (prévue, pas encore
branchée — voir "Ce qui n'est pas fait" ci-dessous).

## Assets

Trois fichiers extraits des planches fournies par recadrage (pas de
regénération) :
- `src/assets/logo-full.png` — logo complet, fond clair
- `src/assets/logo-dark.png` — logo compact, fond sombre (footer)
- `src/assets/icon-app.png` — icône carrée arrondie (favicon, app icon)

Ne pas dupliquer ces imports ailleurs : passer par `<Logo variant="..." />`.

## Ce qui respecte la charte

- Palette et typographie appliquées de façon cohérente via les tokens
  Tailwind (pas de couleur codée en dur dans les composants)
- Boutons : primaire (vert plein), secondaire (contour bleu foncé) —
  conformes à la section 10
- Cartes véhicule : structure conforme à la section 17 (marque/modèle,
  année, carburant, boîte, distance, note, prix/jour)
- Prix toujours en `font-bold`, format "X DA / jour" (section 18)
- Empty state avec illustration route minimaliste plutôt qu'un message nu
  (section 21)
- Accessibilité : focus visible, `prefers-reduced-motion` respecté (brief
  frontend-design)

## Ce qui N'est PAS fait (périmètre volontairement réduit)

La charte fournie couvre 35 sections et ~26 écrans. Une v1 complète et
honnête ne peut pas tout couvrir d'un coup — liste explicite de ce qui
reste, pour ne pas laisser croire que c'est fait :

- **Arabe / RTL** : aucune traduction, aucun layout RTL. La police Noto
  Sans Arabic est chargée mais inutilisée. C'est le plus gros chantier
  restant de la charte (sections 7, 8).
- **Mode sombre** : tokens définis (`darkbg`, `darkbg-surface`) mais aucun
  toggle ni styles conditionnels écrits.
- **Onboarding, splash screen animé** : non commencés (sections 25, 26).
- **Carte interactive** : la recherche utilise la géolocalisation
  navigateur mais affiche une liste, pas une carte (section 15).
- **Back-office admin stylisé** : les endpoints existent côté backend,
  aucune interface web dédiée (section 30).
- **Upload de photos véhicule** : le backend n'a pas encore cette
  fonctionnalité (voir `docs/ROADMAP.md`), donc les cartes véhicule
  utilisent un espace réservé graphique (route stylisée) plutôt qu'une
  vraie photo.
