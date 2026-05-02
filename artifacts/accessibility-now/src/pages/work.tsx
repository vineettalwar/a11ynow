import { Card, CardContent } from "@/components/ui/card";

export default function Work() {
  const caseStudies = [
    {
      industry: "Fintech",
      challenge: "A leading European neo-bank needed to meet EAA requirements before a major funding round, facing 847 distinct accessibility violations across their core web application.",
      outcome: "We embedded with their frontend team, remediating all blocking issues and establishing accessible component patterns.",
      results: "EAA-ready in 6 weeks. 0 critical violations remaining. Internal team trained on accessible React patterns."
    },
    {
      industry: "Healthcare",
      challenge: "A telehealth platform was inaccessible to screen reader users, preventing visually impaired patients from booking appointments independently.",
      outcome: "Complete overhaul of the booking flow keyboard navigation and ARIA state management.",
      results: "100% independent booking success rate for screen reader users. Passed rigorous third-party manual audit."
    },
    {
      industry: "Retail",
      challenge: "An enterprise e-commerce brand with a complex mega-menu and filtering system that trapped keyboard focus and lacked semantic structure.",
      outcome: "Redesigned the navigation architecture and filter interactions to be fully operable via keyboard.",
      results: "Compliance achieved 3 months ahead of EAA deadline. 15% increase in conversion rate among keyboard-only users."
    },
    {
      industry: "Government",
      challenge: "A municipal services portal required strict EN 301 549 compliance, dealing with legacy PDF forms and complex data tables.",
      outcome: "Converted legacy PDFs to accessible web forms and implemented semantic table structures with proper headers.",
      results: "Full compliance with public sector regulations. 40% reduction in support calls related to form completion."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
      <div className="mb-16 text-center">
        <h1 className="text-5xl font-bold mb-6">Case Studies</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We've helped European enterprises bridge the gap between compliance mandates and technical execution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {caseStudies.map((study, index) => (
          <Card key={index} className="border-2 shadow-none">
            <CardContent className="p-8">
              <div className="text-sm font-bold text-primary uppercase tracking-wider mb-4">{study.industry}</div>
              <h3 className="text-xl font-bold mb-4">The Challenge</h3>
              <p className="text-muted-foreground mb-6">{study.challenge}</p>
              
              <h3 className="text-xl font-bold mb-4">The Outcome</h3>
              <p className="text-muted-foreground mb-6">{study.outcome}</p>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="font-bold text-sm uppercase tracking-wider mb-2 text-gray-500">Results</div>
                <p className="font-medium">{study.results}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
