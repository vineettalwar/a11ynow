"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportPrintToolbar({ title }: { title: string }) {
  return (
    <div className="report-print-toolbar sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur print:hidden">
      <p className="text-sm font-semibold font-sans">{title}</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print / Save as PDF
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => window.close()}>
          Close
        </Button>
      </div>
    </div>
  );
}
