import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function Remediation() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-6">Remediation & Development</h1>
        <p className="text-xl text-muted-foreground">
          We don't just report problems—we fix them. Our engineers work alongside your team to implement robust accessibility solutions.
        </p>
      </div>

      <div className="bg-white border rounded-3xl p-8 md:p-12 mb-12">
        <h2 className="text-3xl font-bold mb-8">How we work</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Sprint-based delivery</h3>
              <p className="text-muted-foreground">We integrate into your agile workflow, delivering fixes in manageable increments.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Direct Pull Requests</h3>
              <p className="text-muted-foreground">Our engineers write the code and submit PRs directly to your repositories.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Annotated Code</h3>
              <p className="text-muted-foreground">Complex fixes are thoroughly documented to upskill your internal team.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Jira-ready tickets</h3>
              <p className="text-muted-foreground">For tasks better handled internally, we provide detailed acceptance criteria and technical implementation specs.</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-6">Need engineering support for compliance?</h2>
        <Button asChild className="h-14 rounded-full px-10 text-lg font-bold">
          <Link href="/contact">Discuss your roadmap</Link>
        </Button>
      </div>
    </div>
  );
}
