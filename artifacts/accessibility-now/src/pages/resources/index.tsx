import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckSquare, FileText, ArrowRight } from "lucide-react";

const resources = [
  {
    href: "/resources/wcag-guide",
    icon: BookOpen,
    title: "WCAG Guide",
    description: "A plain-language breakdown of WCAG 2.1/2.2 levels and the POUR principles for developers.",
  },
  {
    href: "/resources/eaa-checklist",
    icon: CheckSquare,
    title: "EAA Checklist",
    description: "An interactive checklist covering the key requirements for EAA compliance.",
  },
  {
    href: "/resources/blog",
    icon: FileText,
    title: "Engineering Blog",
    description: "Technical deep-dives into accessible component patterns and state management.",
  },
];

export default function Resources() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Guides and<br />
            <span className="heading-accent">references.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Guides, checklists, and insights to help your engineering team build more accessible products.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map(({ href, icon: Icon, title, description }) => (
              <Link key={href} href={href} className="block group">
                <Card className="border shadow-none group-hover:shadow-sm transition-shadow h-full">
                  <CardContent className="p-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-base font-bold font-sans mb-3">{title}</h2>
                    <p className="text-muted-foreground text-xs mb-6">{description}</p>
                    <span className="text-primary text-sm font-medium font-sans flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Read more <ArrowRight className="w-4 h-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
