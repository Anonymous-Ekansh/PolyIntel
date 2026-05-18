import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function PanelShell({
  title,
  kicker,
  action,
  children,
  className,
}: {
  title: string;
  kicker: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "h-full min-h-[340px] border border-[#1e1e3a] bg-[linear-gradient(180deg,rgba(15,15,26,0.96),rgba(11,13,21,0.96))] shadow-[0_10px_45px_rgba(0,0,0,0.32)]",
        className,
      )}
    >
      <CardHeader className="border-b border-[#1e1e3a]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-[#6f6f86]">{kicker}</div>
            <CardTitle className="mt-1 text-white">{title}</CardTitle>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-88px)] p-4">{children}</CardContent>
    </Card>
  );
}
