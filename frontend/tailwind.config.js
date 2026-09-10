/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Charte NQASMO — voir docs/BRAND.md pour la charte complète.
        // Les valeurs suivent le document texte de la charte (déclaré comme
        // "source de vérité" en section 35), pas les planches image dont les
        // teintes de l'orange/bleu variaient légèrement d'un fichier à l'autre.
        brand: {
          DEFAULT: '#00B894', // vert principal
          light: '#E6F7F1', // vert clair (fonds doux, badges)
          dark: '#0B3D4E', // bleu/vert foncé (titres, navigation, confiance)
        },
        accent: '#EF674F', // orange — usage limité (alertes non critiques, promos)
        muted: '#6B7280', // gris — texte secondaire
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#F7F9F9',
        },
        // Mode sombre — pas un simple inversion, valeurs dédiées (section 22)
        darkbg: {
          DEFAULT: '#071E27',
          surface: '#0B3D4E',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        arabic: ['"Noto Sans Arabic"', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        btn: '14px',
        field: '13px',
        modal: '22px',
      },
    },
  },
  plugins: [],
};
