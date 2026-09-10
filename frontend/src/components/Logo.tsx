import React from 'react';
import logoFull from '../assets/logo-full.png';
import logoDark from '../assets/logo-dark.png';
import iconApp from '../assets/icon-app.png';

/**
 * Composant Logo centralisé — toutes les pages doivent passer par ici
 * plutôt que d'importer les fichiers image directement, pour garder un
 * point de contrôle unique sur l'utilisation du logo (charte NQASMO,
 * section 3 : "Le logo doit être cohérent partout").
 */
export default function Logo({
  variant = 'full',
  className = '',
}: {
  variant?: 'full' | 'dark' | 'icon';
  className?: string;
}) {
  if (variant === 'dark') return <img src={logoDark} alt="NQASMO" className={className} />;
  if (variant === 'icon') return <img src={iconApp} alt="NQASMO" className={className} />;
  return <img src={logoFull} alt="NQASMO — نتقاسموا الطريق" className={className} />;
}
