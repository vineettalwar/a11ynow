import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

// Pages
import Home from "@/pages/home";
import Contact from "@/pages/contact";
import AuditResult from "@/pages/audit-result";
import Services from "@/pages/services/index";
import Audits from "@/pages/services/audits";
import Remediation from "@/pages/services/remediation";
import Monitoring from "@/pages/services/monitoring";
import EAA from "@/pages/eaa";
import Work from "@/pages/work";
import Resources from "@/pages/resources/index";
import WcagGuide from "@/pages/resources/wcag-guide";
import EaaChecklist from "@/pages/resources/eaa-checklist";
import Blog from "@/pages/resources/blog";
import About from "@/pages/about";
import PrivacyPolicy from "@/pages/legal/privacy";
import AccessibilityStatement from "@/pages/legal/accessibility";

// Monitor
import MonitorPage from "@/pages/monitor";
import BatchResult from "@/pages/batch-result";

// Tools
import ToolsIndex from "@/pages/tools/index";
import ContrastChecker from "@/pages/tools/contrast-checker";
import ColourBlindness from "@/pages/tools/colour-blindness";
import ScreenReaderPreview from "@/pages/tools/screen-reader-preview";
import KeyboardTester from "@/pages/tools/keyboard-tester";
import LowVision from "@/pages/tools/low-vision";
import MobileChecklist from "@/pages/tools/mobile-checklist";
import WcagChecklist from "@/pages/tools/wcag-checklist";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/contact" component={Contact} />
        <Route path="/audit-result" component={AuditResult} />
        <Route path="/services" component={Services} />
        <Route path="/services/audits" component={Audits} />
        <Route path="/services/remediation" component={Remediation} />
        <Route path="/services/monitoring" component={Monitoring} />
        <Route path="/eaa" component={EAA} />
        <Route path="/work" component={Work} />
        <Route path="/resources" component={Resources} />
        <Route path="/resources/wcag-guide" component={WcagGuide} />
        <Route path="/resources/eaa-checklist" component={EaaChecklist} />
        <Route path="/resources/blog" component={Blog} />
        <Route path="/about" component={About} />
        <Route path="/legal/privacy" component={PrivacyPolicy} />
        <Route path="/legal/accessibility" component={AccessibilityStatement} />
        <Route path="/monitor/:token" component={MonitorPage} />
        <Route path="/batch-result" component={BatchResult} />
        <Route path="/tools" component={ToolsIndex} />
        <Route path="/tools/contrast-checker" component={ContrastChecker} />
        <Route path="/tools/colour-blindness" component={ColourBlindness} />
        <Route path="/tools/screen-reader-preview" component={ScreenReaderPreview} />
        <Route path="/tools/keyboard-tester" component={KeyboardTester} />
        <Route path="/tools/low-vision" component={LowVision} />
        <Route path="/tools/mobile-checklist" component={MobileChecklist} />
        <Route path="/tools/wcag-checklist" component={WcagChecklist} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
