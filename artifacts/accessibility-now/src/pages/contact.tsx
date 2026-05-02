import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().min(2, "Company is required"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  service: z.string().min(1, "Please select a service"),
  message: z.string().min(10, "Please provide more details"),
});

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", company: "", url: "", service: "", message: "" },
  });

  function onSubmit(_values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Request received",
        description: "We'll be in touch within 1 business day to schedule your scope call.",
      });
      form.reset();
    }, 1000);
  }

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Bring us<br />
            <span className="heading-accent">your problem.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Fill out the form to request a scope call. We'll discuss your technical architecture,
            current risk profile, and roadmap to EAA compliance.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-16">
            <div className="md:col-span-2">
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
                      accessibility.now by sometech.work<br />
                      Berlin, Germany
                    </p>
                  </div>
                </div>

                <div className="border-t pt-8">
                  <p className="text-xs text-muted-foreground">
                    We typically respond within one business day.
                    Engagements start from a brief scope call — no commitment required.
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 bg-background rounded-2xl border p-8">
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
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold font-sans">Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corp" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="audit">Full Accessibility Audit</SelectItem>
                            <SelectItem value="remediation">Remediation & Development</SelectItem>
                            <SelectItem value="monitoring">Ongoing Monitoring</SelectItem>
                            <SelectItem value="unsure">Not sure — need a consultation</SelectItem>
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
                    className="w-full h-12 text-sm font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Book a scope call"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
