import { Mail, MapPin, Phone, Clock } from "lucide-react";

const COMPANY = {
  name: "주식회사 98점7도",
  ceo: "염정원",
  bizNo: "501-81-27350",
  email: "yeomjw0907@onecation.co.kr",
  address: "인천광역시 연수구 송도2동 인천타워대로 99 11-12층 (송도동, 애니오션빌딩)",
  phone: "010-6333-4649",
  phoneHours: "평일 오전 10시 - 오후 7시",
  kakaoHours: "오전 9시 - 오후 12시 (연중무휴)",
} as const;

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* 회사 정보 */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">{COMPANY.name}</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>대표이사 {COMPANY.ceo}</li>
              <li>사업자등록번호 {COMPANY.bizNo}</li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="hover:text-foreground transition-colors"
                >
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>

          {/* 주소 */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">경영 · 디자인 부서</p>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{COMPANY.address}</span>
            </p>
          </div>

          {/* 연락처 및 상담시간 */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold text-foreground">상담 안내</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <a href={`tel:${COMPANY.phone.replace(/-/g, "")}`} className="hover:text-foreground transition-colors">
                  {COMPANY.phone}
                </a>
              </p>
              <div className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  <p>전화상담 · {COMPANY.phoneHours}</p>
                  <p>카톡상담 · {COMPANY.kakaoHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
