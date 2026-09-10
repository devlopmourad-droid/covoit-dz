import React from 'react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="mt-20 bg-darkbg text-white">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <Logo variant="dark" className="h-14" />
        <p className="mt-4 max-w-md text-sm text-white/60">
          NQASMO — la plateforme d'autopartage entre particuliers en Algérie.
          Plus de liberté, plus de partage, une même route.
        </p>
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-white/40">
          <span>© {new Date().getFullYear()} NQASMO</span>
          <span>@nedd</span>
        </div>
      </div>
    </footer>
  );
}
