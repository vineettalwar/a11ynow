import { Card, CardContent } from "@/components/ui/card";

const articles = [
  {
    title: "Building Accessible Dialogs in React",
    date: "October 12, 2023",
    excerpt: "Focus management, ARIA roles, and keyboard trapping: everything you need to know to build compliant modal dialogs.",
    category: "Engineering",
  },
  {
    title: "Why the EAA Applies to B2B SaaS Too",
    date: "September 28, 2023",
    excerpt: "Many B2B companies mistakenly believe the EAA only affects consumer e-commerce. Here's why that assumption is legally risky.",
    category: "Compliance",
  },
  {
    title: "Automated Scanners Catch 30% of Violations",
    date: "August 15, 2023",
    excerpt: "Relying on Lighthouse or axe-core alone will leave you non-compliant. Why manual testing with real screen readers is non-negotiable.",
    category: "Testing",
  },
];

export default function Blog() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Engineering<br />
            <span className="heading-accent">perspectives.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Technical deep-dives, compliance updates, and accessibility patterns from our engineering team.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article, index) => (
              <Card key={index} className="border shadow-none hover:shadow-sm transition-shadow cursor-pointer group">
                <CardContent className="p-8">
                  <div className="flex justify-between items-center mb-5 text-xs">
                    <span className="font-bold text-primary uppercase tracking-wider font-sans">{article.category}</span>
                    <span className="text-muted-foreground font-mono">{article.date}</span>
                  </div>
                  <h2 className="text-base font-bold font-sans mb-3 group-hover:text-primary transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-muted-foreground text-xs">{article.excerpt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
