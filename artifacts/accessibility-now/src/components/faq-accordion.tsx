import { useState } from "react";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q),
      )
    : items;

  return (
    <div className="reveal-body">
      {/* Search input */}
      <div className="relative mb-6">
        <label htmlFor="faq-search" className="sr-only">Search frequently asked questions</label>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          id="faq-search"
          type="search"
          placeholder="Search questions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          style={{ fontFamily: "var(--app-font-mono)" }}
        />
        {q && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {filtered.map((item, i) => (
            <AccordionItem
              key={item.question}
              value={`item-${i}`}
              className="border-b border-border"
            >
              <AccordionTrigger className="text-sm font-semibold text-left py-5 hover:no-underline hover:text-primary transition-colors">
                <HighlightedText text={item.question} query={q} />
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm pb-5 leading-relaxed">
                <HighlightedText text={item.answer} query={q} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="py-10 text-center rounded-xl border border-dashed border-border">
          <p className="text-sm font-semibold font-sans mb-1">No matching questions</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>
            Try a different term, or{" "}
            <button
              onClick={() => setQuery("")}
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              clear the search
            </button>
            .
          </p>
        </div>
      )}

      {q && filtered.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>
          {filtered.length} of {items.length} question{items.length !== 1 ? "s" : ""} match
        </p>
      )}
    </div>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const idx = remaining.toLowerCase().indexOf(query);
    if (idx === -1) {
      parts.push(remaining);
      break;
    }
    if (idx > 0) parts.push(remaining.slice(0, idx));
    parts.push(
      <mark key={key++} className="bg-primary/15 text-foreground rounded-sm px-0.5 not-italic">
        {remaining.slice(idx, idx + query.length)}
      </mark>,
    );
    remaining = remaining.slice(idx + query.length);
  }

  return <>{parts}</>;
}
