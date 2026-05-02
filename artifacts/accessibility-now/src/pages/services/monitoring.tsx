import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function Monitoring() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-6">Ongoing Monitoring</h1>
        <p className="text-xl text-muted-foreground">
          Accessibility is a continuous process. We ensure your application remains compliant as you ship new features.
        </p>
      </div>

      <div className="bg-white border rounded-3xl p-8 md:p-12 mb-12">
        <h2 className="text-3xl font-bold mb-8">Retainer Benefits</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Monthly re-scans</h3>
              <p className="text-muted-foreground">Automated sweeps across your critical user journeys to catch low-hanging fruit.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Regression alerts</h3>
              <p className="text-muted-foreground">Immediate notification when new deployments break existing accessibility features.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Compliance dashboard</h3>
              <p className="text-muted-foreground">Real-time tracking of your accessibility posture, perfect for stakeholder reporting.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">On-demand consultation</h3>
              <p className="text-muted-foreground">Direct access to our senior accessibility engineers for architecture reviews and technical advice.</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-6">Protect your compliance investment.</h2>
        <Button asChild className="h-14 rounded-full px-10 text-lg font-bold">
          <Link href="/contact">Start a retainer</Link>
        </Button>
      </div>
    </div>
  );
}
