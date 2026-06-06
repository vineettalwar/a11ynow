import { UrlAnalysisTool } from "@/components/tools/url-analysis-tool";

export default function LinkTextChecker() {
  return (
    <UrlAnalysisTool
      config={{
        eyebrow: "Links · Accessible names",
        title: (
          <>
            Link text<br />
            <span className="heading-accent">checker.</span>
          </>
        ),
        description:
          "Find links with no accessible name or generic text like 'click here' and 'read more' — a top WCAG 2.4.4 failure in audits.",
        itemType: "link",
        emptyLabel: "Audit link text on any site",
        passLabel: "descriptive",
        failLabel: "need fixing",
      }}
    />
  );
}
