import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: "section" | "div" | "header" | "footer";
}

export function Section({ children, as: Tag = "section", className, ...props }: SectionProps) {
  return (
    <Tag
      className={cn(
        "w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 lg:py-20",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
