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
import BlogEaaEnforcement from "@/pages/resources/blog-eaa-enforcement";
import BlogWcagEcommerce from "@/pages/resources/blog-wcag-ecommerce";
import BlogAutomatedVsManual from "@/pages/resources/blog-automated-vs-manual";
import Glossary from "@/pages/resources/glossary";

// Compliance
import ComplianceIndex from "@/pages/resources/compliance/index";
import ComplianceAda from "@/pages/resources/compliance/ada";
import ComplianceSection508 from "@/pages/resources/compliance/section-508";
import ComplianceAoda from "@/pages/resources/compliance/aoda";
import ComplianceEn301549 from "@/pages/resources/compliance/en-301-549";

// Technologies
import TechnologiesIndex from "@/pages/resources/technologies/index";
import TechWordpress from "@/pages/resources/technologies/wordpress";
import TechTypo3 from "@/pages/resources/technologies/typo3";
import TechDrupal from "@/pages/resources/technologies/drupal";
import TechShopify from "@/pages/resources/technologies/shopify";
import TechReact from "@/pages/resources/technologies/react";
import TechNextjs from "@/pages/resources/technologies/nextjs";

// Guides
import GuidesIndex from "@/pages/resources/guides/index";
import GuideAria from "@/pages/resources/guides/aria";
import GuideKeyboard from "@/pages/resources/guides/keyboard-accessibility";
import GuideScreenReaders from "@/pages/resources/guides/screen-readers";

// Checklists
import ChecklistsIndex from "@/pages/resources/checklists/index";

import About from "@/pages/about";
import Pricing from "@/pages/pricing";
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
import FocusOrderVisualizer from "@/pages/tools/focus-order";
import WebsiteScannerTool from "@/pages/tools/website-scanner";
import A11yFixLanding from "@/pages/solutions/a11y-fix";
import A11yFixResult from "@/pages/a11y-fix/result";
import A11yFixPlan from "@/pages/a11y-fix/plan";
import { LegacyFixPilotRedirect } from "@/components/legacy-redirect";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/contact" component={Contact} />
        <Route path="/audit-result" component={AuditResult} />
        <Route path="/solutions/a11y-fix" component={A11yFixLanding} />
        <Route path="/a11y-fix/result" component={A11yFixResult} />
        <Route path="/a11y-fix/plan" component={A11yFixPlan} />
        <Route path="/solutions/fixpilot">
          <LegacyFixPilotRedirect to="/solutions/a11y-fix" />
        </Route>
        <Route path="/fixpilot/result">
          <LegacyFixPilotRedirect to="/a11y-fix/result" />
        </Route>
        <Route path="/services" component={Services} />
        <Route path="/services/audits" component={Audits} />
        <Route path="/services/remediation" component={Remediation} />
        <Route path="/services/monitoring" component={Monitoring} />
        <Route path="/eaa" component={EAA} />
        <Route path="/work" component={Work} />

        <Route path="/resources" component={Resources} />
        <Route path="/resources/wcag-guide" component={WcagGuide} />
        <Route path="/resources/eaa-checklist" component={EaaChecklist} />
        <Route path="/resources/glossary" component={Glossary} />
        <Route path="/resources/blog" component={Blog} />
        <Route path="/resources/blog/eaa-enforcement" component={BlogEaaEnforcement} />
        <Route path="/resources/blog/wcag-ecommerce" component={BlogWcagEcommerce} />
        <Route path="/resources/blog/automated-vs-manual" component={BlogAutomatedVsManual} />

        <Route path="/resources/guides" component={GuidesIndex} />
        <Route path="/resources/guides/wcag" component={WcagGuide} />
        <Route path="/resources/guides/aria" component={GuideAria} />
        <Route path="/resources/guides/keyboard-accessibility" component={GuideKeyboard} />
        <Route path="/resources/guides/screen-readers" component={GuideScreenReaders} />

        <Route path="/resources/checklists" component={ChecklistsIndex} />
        <Route path="/resources/checklists/eaa" component={EaaChecklist} />

        <Route path="/resources/compliance" component={ComplianceIndex} />
        <Route path="/resources/compliance/eaa" component={EAA} />
        <Route path="/resources/compliance/ada" component={ComplianceAda} />
        <Route path="/resources/compliance/section-508" component={ComplianceSection508} />
        <Route path="/resources/compliance/aoda" component={ComplianceAoda} />
        <Route path="/resources/compliance/en-301-549" component={ComplianceEn301549} />

        <Route path="/resources/technologies" component={TechnologiesIndex} />
        <Route path="/resources/technologies/wordpress" component={TechWordpress} />
        <Route path="/resources/technologies/typo3" component={TechTypo3} />
        <Route path="/resources/technologies/drupal" component={TechDrupal} />
        <Route path="/resources/technologies/shopify" component={TechShopify} />
        <Route path="/resources/technologies/react" component={TechReact} />
        <Route path="/resources/technologies/nextjs" component={TechNextjs} />

        <Route path="/about" component={About} />
        <Route path="/pricing" component={Pricing} />
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
        <Route path="/tools/focus-order" component={FocusOrderVisualizer} />
        <Route path="/tools/website-scanner" component={WebsiteScannerTool} />
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
