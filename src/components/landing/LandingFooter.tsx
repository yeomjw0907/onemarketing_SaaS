import Link from "next/link";
import { Section } from "./Section";

const COMPANY = {
  name: "주식회사 98점7도",
  email: "yeomjw0907@onecation.co.kr",
  phone: "010-6333-4649",
  address1: "인천시 연수구 인천타워대로 99 11층 (송도동)",
  address2: "경기도 수원시 영통구 광교로 145 씨동 2층 (이의동)",
};

const footerLinks = [
  { href: "#features", label: "서비스 소개" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보 처리방침" },
];

export function LandingFooter() {
  return (
    <footer className="w-full bg-foreground text-[hsl(var(--background))]">
      <Section as="div" className="py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo-light.png" alt="ONEmarketing" className="h-8 w-auto opacity-90" />
            </div>
            <p className="text-sm opacity-90">{COMPANY.name}</p>
            <div className="space-y-1 text-sm opacity-80">
              <p>
                <a href={`mailto:${COMPANY.email}`} className="inline-block py-1 hover:underline">
                  {COMPANY.email}
                </a>
              </p>
              <p>
                <a href={`tel:${COMPANY.phone.replace(/-/g, "")}`} className="inline-block py-1 hover:underline">
                  {COMPANY.phone}
                </a>
              </p>
              <p>{COMPANY.address1}</p>
              <p>{COMPANY.address2}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="opacity-80 hover:opacity-100 hover:underline underline-offset-2"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-10 pt-8 border-t border-white/20 text-center text-sm opacity-70">
          © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </p>
      </Section>
    </footer>
  );
}
