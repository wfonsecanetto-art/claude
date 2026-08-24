import { BRAND, DEMO_NOTICE, FOOTER } from "@/content/site";
import { Logo } from "./ui/Logo";

export function Footer() {
  return (
    <footer className="border-hairline border-t">
      <div className="container-valor py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo />
            <p className="text-gray-valor mt-4 max-w-xs text-xs leading-relaxed">
              {BRAND.legalName} · {BRAND.tagline}
            </p>
          </div>

          <nav aria-label="Rodapé">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
              {FOOTER.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-valor hover:text-lime text-xs tracking-wide transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-hairline mt-12 border-t pt-8">
          <p className="text-gray-valor max-w-3xl text-[0.6875rem] leading-relaxed">
            {DEMO_NOTICE}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-valor text-[0.6875rem] tracking-[0.16em] uppercase">
              {FOOTER.copyright}
            </p>
            <p className="text-gray-valor text-[0.6875rem] tracking-[0.16em] uppercase">
              Projeto piloto · versão 0.1
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
