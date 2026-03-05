"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section } from "./Section";

const faqs = [
  {
    q: "서비스 이용 방법이 궁금해요.",
    a: "회원가입 후 관리자 승인을 받으시면 로그인하여 이용할 수 있습니다. 대시보드에서 Google Ads, GA4, Meta 등 연동을 설정하고 성과를 확인하실 수 있습니다.",
  },
  {
    q: "서비스 가격은 어떻게 되나요?",
    a: "맞춤형 플랜으로 제공됩니다. 문의하기(yeomjw0907@onecation.co.kr)를 통해 요구사항을 알려주시면 견적을 안내해 드립니다.",
  },
  {
    q: "데이터는 안전하게 보관되나요?",
    a: "네. 암호화 저장과 접근 제어를 적용하며, 개인정보 처리방침과 데이터 삭제 안내에 따라 처리합니다. 자세한 내용은 개인정보 처리방침을 참고해 주세요.",
  },
  {
    q: "대시보드 미리보기는 어디서 볼 수 있나요?",
    a: "본 페이지의 '대시보드 미리보기' 섹션에서 스크린샷을 확인하실 수 있습니다. 실제 체험을 원하시면 회원가입 후 데모 계정으로 안내해 드릴 수 있습니다.",
  },
];

export function LandingFaq() {
  return (
    <Section>
      <div className="text-center space-y-4 mb-10 md:mb-12">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          자주 묻는 질문
        </h2>
      </div>
      <div className="max-w-2xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map(({ q, a }, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{q}</AccordionTrigger>
              <AccordionContent>{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
