import Link from "next/link";
import { notFound } from "next/navigation";

import { GuavaLogo } from "@/components/GuavaLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { isSupportedLocale, sitePages, sitePageSlugs, supportedLocales, type Locale } from "@/lib/site-pages";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return supportedLocales.flatMap((locale) => sitePageSlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) {
    return { title: "Page Not Found | Guava" };
  }

  const page = sitePages[slug];
  if (!page) {
    return { title: "Page Not Found | Guava" };
  }

  const content = page.locales[locale];
  return {
    title: `${content.title} | Guava`,
    description: content.summary,
  };
}

function getLocaleUi(locale: Locale) {
  return locale === "zh"
    ? {
        back: "返回首页",
        network: "情报网络",
        record: "文档记录",
        updated: "最近更新",
        summary:
          "这些页面用于支撑生产部署、客户支持、法务审阅、企业尽调与开发者接入说明。",
        switchLabel: "EN",
      }
    : {
        back: "Back to Front Page",
        network: "Intelligence Network",
        record: "Policy Record",
        updated: "Last Updated",
        summary:
          "These pages are designed to support production deployment, customer support readiness, legal review, and enterprise due diligence.",
        switchLabel: "中文",
      };
}

export default async function StaticInfoPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const page = sitePages[slug];
  if (!page) {
    notFound();
  }

  const content = page.locales[locale];
  const ui = getLocaleUi(locale);
  const oppositeLocale: Locale = locale === "zh" ? "en" : "zh";

  return (
    <div className="min-h-screen bg-[#FFF1E5] text-[#333333] font-serif">
      <nav className="border-b border-black/10 px-6 py-4 bg-[#FFF1E5]/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <GuavaLogo size={28} />
            <div>
              <div className="text-2xl font-black italic tracking-tight text-black">GUAVA</div>
              <div className="font-sans text-[9px] font-black uppercase tracking-[0.35em] text-[#990000]">
                {ui.network}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/${oppositeLocale}/info/${slug}`}
              className="border border-[#990000]/25 px-3 py-2 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#990000] hover:bg-[#990000] hover:text-white transition-colors"
            >
              {ui.switchLabel}
            </Link>
            <Link
              href="/"
              className="border border-black px-3 py-2 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white transition-colors"
            >
              {ui.back}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1300px] mx-auto px-6 py-16">
        <section className="border-b border-black/10 pb-10 mb-12">
          <div className="font-sans text-[10px] font-black uppercase tracking-[0.3em] text-[#990000] mb-4">
            {content.eyebrow}
          </div>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <h1 className="text-4xl md:text-6xl font-black leading-[1.02] tracking-tight text-black">
                {content.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-black/70">{content.summary}</p>
            </div>
            <aside className="border-t-2 border-black pt-5">
              <div className="font-sans text-[10px] font-black uppercase tracking-[0.25em] text-black/40">
                {ui.record}
              </div>
              <div className="mt-4 text-sm text-black/70 leading-relaxed">
                <div className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#990000]">
                  {ui.updated}
                </div>
                <div className="mt-1">{content.updatedAt}</div>
              </div>
              <div className="mt-6 text-sm text-black/70 leading-relaxed">{ui.summary}</div>
            </aside>
          </div>
        </section>

        <section className="grid gap-8">
          {content.sections.map((section) => (
            <article key={section.heading} className="border-b border-black/10 pb-8 last:border-b-0">
              <h2 className="text-2xl md:text-3xl font-black italic text-black mb-5">{section.heading}</h2>
              <div className="space-y-4 text-[17px] leading-8 text-black/75">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
