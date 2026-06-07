import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateLead } from "@workspace/api-client-react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LEAD_SERVICE_OPTIONS,
  PRICING_LEAD_FORM_SCHEMA,
  type LeadServiceValue,
  type PricingLeadFormValues,
} from "@/lib/lead-form";

type PricingLeadFormProps = {
  requestedService: LeadServiceValue;
};

export function PricingLeadForm({
  requestedService,
}: PricingLeadFormProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateLead();

  const form = useForm<PricingLeadFormValues>({
    resolver: zodResolver(PRICING_LEAD_FORM_SCHEMA),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      service: requestedService,
      message: "",
    },
  });

  function onSubmit(values: PricingLeadFormValues) {
    createLead.mutate(
      {
        data: {
          name: values.name.trim(),
          email: values.email.trim(),
          company: values.company.trim(),
          service: values.service,
          message: values.message.trim(),
          source: "pricing",
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

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center"
        aria-live="polite"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="font-bold font-sans">Thanks — we will be in touch.</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          We have your pricing request and will reply within one business day.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={() => {
            setSubmitted(false);
            form.reset({
              name: "",
              email: "",
              company: "",
              service: requestedService,
              message: "",
            });
          }}
        >
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold font-sans">
                    Name
                  </FormLabel>
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
                  <FormLabel className="text-xs font-semibold font-sans">
                    Work email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane@company.de"
                      autoComplete="email"
                      {...field}
                    />
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
                <FormLabel className="text-xs font-semibold font-sans">
                  Company
                </FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" autoComplete="organization" {...field} />
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
                <FormLabel className="text-xs font-semibold font-sans">
                  Interested in
                </FormLabel>
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
                <FormLabel className="text-xs font-semibold font-sans">
                  What do you need?
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your product, timeline, and where you need help."
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              "Book a scope call"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
