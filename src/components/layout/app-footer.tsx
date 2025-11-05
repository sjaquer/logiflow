'use client';

import Link from 'next/link';

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0 px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <p className="text-sm text-muted-foreground">
            © {currentYear} <span className="font-semibold text-foreground">LogiFlow</span>. Todos los derechos reservados.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link 
            href="/privacy" 
            className="hover:text-foreground transition-colors hover:underline underline-offset-4"
          >
            Privacidad
          </Link>
          <span className="text-border">•</span>
          <Link 
            href="/terms" 
            className="hover:text-foreground transition-colors hover:underline underline-offset-4"
          >
            Términos
          </Link>
          <span className="text-border">•</span>
          <Link 
            href="/help" 
            className="hover:text-foreground transition-colors hover:underline underline-offset-4"
          >
            Ayuda
          </Link>
        </div>
      </div>
    </footer>
  );
}
