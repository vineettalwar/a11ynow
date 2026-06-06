import { UrlAnalysisTool } from "@/components/tools/url-analysis-tool";

export default function HeadingStructure() {
  return (
    <UrlAnalysisTool
      config={{
        eyebrow: "Headings · Screen reader order",
        title: (
          <>
            Heading structure<br />
            <span className="heading-accent">checker.</span>
          </>
        ),
        description:
          "List every H1–H6 on a page in document order. Empty headings and skipped levels are common screen reader navigation failures.",
        itemType: "heading",
        emptyLabel: "Audit heading hierarchy on any site",
        passLabel: "valid",
        failLabel: "empty or problematic",
      }}
    />
  );
}
