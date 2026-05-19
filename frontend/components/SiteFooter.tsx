import Link from "next/link";

import { GuavaLogo } from "@/components/GuavaLogo";
import { footerSectionsByLocale, type Locale } from "@/lib/site-pages";

export function SiteFooter({ locale = "zh" }: { locale?: Locale }) {
  const footerSections = footerSectionsByLocale[locale];

  return (
    <footer className="mt-20 border-t-2 border-black bg-white/40 pt-16 pb-12 mx-6">
      <div className="max-w-[1300px] mx-auto text-center md:text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <GuavaLogo size={28} />
              <div className="text-4xl font-extrabold italic text-[#1a1a1a]">GUAVA</div>
            </div>
            <p className="text-xs text-gray-500 font-serif leading-relaxed max-w-sm mx-auto md:mx-0">
              Guava delivers enterprise-grade editorial infrastructure, premium research access, and accountable
              publishing workflows for modern intelligence products.
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-5">
              <h5 className="font-sans font-black text-[10px] uppercase tracking-[0.2em] text-[#990000]">{section.title}</h5>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.slug}>
                    <Link
                      href={`/${locale}/info/${link.slug}`}
                      className="text-[11px] font-sans font-bold text-gray-500 hover:text-black cursor-pointer"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest">
          <div>© 2026 GUAVA INTELLIGENCE NETWORK.</div>
          <div className="flex gap-8">
            <span className="flex items-center gap-1.5 text-green-600">
              Network <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Synced
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
