import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckSquare, FileText } from "lucide-react";

export default function Resources() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
      <div className="mb-16 text-center">
        <h1 className="text-5xl font-bold mb-6">Resources</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Guides, checklists, and insights to help your engineering team build more accessible products.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link href="/resources/wcag-guide" className="block group">
          <Card className="border-2 shadow-none group-hover:border-primary/50 transition-colors h-full">
            <CardContent className="p-8">
              <BookOpen className="w-10 h-10 text-primary mb-6" />
              <h2 className="text-2xl font-bold mb-4">WCAG Guide</h2>
              <p className="text-muted-foreground">
                A plain-language breakdown of WCAG levels and the POUR principles for developers.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/resources/eaa-checklist" className="block group">
          <Card className="border-2 shadow-none group-hover:border-primary/50 transition-colors h-full">
            <CardContent className="p-8">
              <CheckSquare className="w-10 h-10 text-primary mb-6" />
              <h2 className="text-2xl font-bold mb-4">EAA Checklist</h2>
              <p className="text-muted-foreground">
                An interactive checklist covering the key requirements for EAA compliance.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/resources/blog" className="block group">
          <Card className="border-2 shadow-none group-hover:border-primary/50 transition-colors h-full">
            <CardContent className="p-8">
              <FileText className="w-10 h-10 text-primary mb-6" />
              <h2 className="text-2xl font-bold mb-4">Engineering Blog</h2>
              <p className="text-muted-foreground">
                Technical deep-dives into accessible component patterns and state management.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
