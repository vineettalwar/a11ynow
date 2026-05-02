import { Card, CardContent } from "@/components/ui/card";

export default function Blog() {
  const articles = [
    {
      title: "Building Accessible Dialogs in React",
      date: "October 12, 2023",
      excerpt: "Focus management, ARIA roles, and keyboard trapping: everything you need to know to build compliant modal dialogs.",
      category: "Engineering"
    },
    {
      title: "Why the EAA Deadline Matters for B2B SaaS",
      date: "September 28, 2023",
      excerpt: "Many B2B companies mistakenly believe the EAA only applies to consumer e-commerce. Here's why that assumption is legally risky.",
      category: "Compliance"
    },
    {
      title: "Automated Scanners Are Lying to You",
      date: "August 15, 2023",
      excerpt: "Relying on Lighthouse or axe-core will leave you non-compliant. Why manual testing with screen readers is non-negotiable.",
      category: "Testing"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
      <div className="mb-16">
        <h1 className="text-5xl font-bold mb-6">Engineering Blog</h1>
        <p className="text-xl text-muted-foreground">
          Technical deep-dives, compliance updates, and accessibility best practices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {articles.map((article, index) => (
          <Card key={index} className="border-2 shadow-none hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                <span className="font-bold text-primary uppercase tracking-wider">{article.category}</span>
                <span>{article.date}</span>
              </div>
              <h2 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{article.title}</h2>
              <p className="text-muted-foreground">{article.excerpt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
