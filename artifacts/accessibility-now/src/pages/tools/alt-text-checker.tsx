import { UrlAnalysisTool } from "@/components/tools/url-analysis-tool";

export default function AltTextChecker() {
  return (
    <UrlAnalysisTool
      config={{
        eyebrow: "Images · Playwright render",
        title: (
          <>
            Alt text<br />
            <span className="heading-accent">checker.</span>
          </>
        ),
        description:
          "Find images missing alt attributes on any public URL. Decorative images with empty alt are flagged as passing; missing alt attributes are failures.",
        itemType: "image",
        emptyLabel: "Check image alt text on any site",
        passLabel: "passed",
        failLabel: "issues",
      }}
    />
  );
}
