import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeaturePrimary } from "@/components/landing/LandingFeaturePrimary";
import { LandingFeatureCards } from "@/components/landing/LandingFeatureCards";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata = {
  title: "ONEmarketing | 잠든 고객을 깨워주는 새로운 마케팅",
  description:
    "원마케팅(Onecation)은 광고주를 위한 B2B 마케팅 대시보드입니다. Google Ads, GA4, Meta 등 연동 성과를 한곳에서 확인하고, 리포트와 일정을 관리하세요. 데이터 100% 소유, 투명한 성과 측정.",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeaturePrimary />
        <LandingFeatureCards />
        <LandingBenefits />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
