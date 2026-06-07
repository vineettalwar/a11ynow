import { useState, useEffect, useRef } from "react";
import { useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateLead } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, Mail, MapPin } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import {
  CONTACT_LEAD_FORM_SCHEMA,
  LEAD_SERVICE_OPTIONS,
  type ContactLeadFormValues,
} from "@/lib/lead-form";
import gsap from "gsap";

export default function Contact() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const search = useSearch();
  const createLead = useCreateLead();

  const heroRef = useSectionReveal<HTMLElement>();
  const formRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const pageRef = useRef<HTMLDivElement>(null);

  const params = new URLSearchParams(search);
  const serviceParam = params.get("service") ?? "";
  const prefilledService = LEAD_SERVICE_OPTIONS.some(
    (option) => option.value === serviceParam,
  )
    ? serviceParam
    : "";
  const prefilledUrl = params.get("url") ?? "";
  const auditIdParam = params.get("auditId") ?? "";
  const fromA11yFix = params.get("source") === "a11y-fix";
  const prefilledMessage = fromA11yFix
    ? `I ran A11y Fix on ${prefilledUrl || "my site"}${auditIdParam ? ` (audit ${auditIdParam})` : ""}. I would like help with the next steps.`
    : "";
  const defaultValues: ContactLeadFormValues = {
    name: "",
    email: "",
    company: "",
    url: prefilledUrl,
    service: prefilledService,
    message: prefilledMessage,
  };

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const buttons = el.querySelectorAll<HTMLElement>(".btn-gsap");
    const cleanups: (() => void)[] = [];
    buttons.forEach((btn) => {
      const enter = () => gsap.to(btn, { scale: 1.04, duration: 0.18, ease: "power2.out" });
      const leave = () => gsap.to(btn, { scale: 1, duration: 0.18, ease: "power2.out" });
      btn.addEventListener("mouseenter", enter);
      btn.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        btn.removeEventListener("mouseenter", enter);
        btn.removeEventListener("mouseleave", leave);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  const form = useForm<ContactLeadFormValues>({
    resolver: zodResolver(CONTACT_LEAD_FORM_SCHEMA),
    defaultValues,
  });

  function onSubmit(values: ContactLeadFormValues) {
    createLead.mutate(
      {
        data: {
          name: values.name.trim(),
          email: values.email.trim(),
          company: values.company.trim(),
          service: values.service,
          message: values.message.trim(),
          ...(values.url?.trim() ? { websiteUrl: values.url.trim() } : {}),
          ...(auditIdParam ? { auditId: auditIdParam } : {}),
          source: fromA11yFix ? "a11y-fix" : "contact",
        },
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast({
            title: "Request received",
            description: "We will reply within one business day.",
          });
        },
        onError: () => {
          toast({
            title: "Could not submit",
            description: "Please try again or email hello@accessibility.now",
            variant: "destructive",
          });
        },
      },
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col w-full">
      <section ref={heroRef} className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Bring us<br />
            <span className="heading-accent">your problem.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Send the form for a scope call. We will cover your stack, exposure, and what EAA-ready work looks like.
          </p>
        </div>
      </section>

      <section ref={formRef} className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-16">
            <div className="reveal-child md:col-span-2">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm font-sans mb-1">Email us directly</h3>
                    <a
                      href="mailto:hello@accessibility.now"
                      className="text-muted-foreground hover:text-primary transition-colors text-xs"
                    >
                      hello@accessibility.now
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm font-sans mb-1">European HQ</h3>
                    <p className="text-muted-foreground text-xs">
                      accessibility.now<br />
                      Berlin, Germany
                    </p>
                  </div>
                </div>

                <div className="border-t pt-8">
                  <p className="text-xs text-muted-foreground">
                    We typically respond within one business day.
                    Engagements start from a brief scope call - no commitment required.
                  </p>
                </div>
              </div>
            </div>

            <div className="reveal-child md:col-span-3 bg-background rounded-2xl border p-8">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="font-bold font-sans">Thanks — we will be in touch.</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    A member of the team will reply within one business day.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      form.reset(defaultValues);
                      setSubmitted(false);
                    }}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold font-sans">Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" autoComplete="name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold font-sans">Work email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="jane@company.de" autoComplete="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold font-sans">Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corp" autoComplete="organization" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold font-sans">Website URL (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold font-sans">How can we help?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEAD_SERVICE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold font-sans">Project details</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your tech stack, current challenges, and timeline..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="btn-gsap w-full h-12 text-sm font-semibold"
                      disabled={createLead.isPending}
                    >
                      {createLead.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting…
                        </>
                      ) : (
                        "Book a scope call"
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
