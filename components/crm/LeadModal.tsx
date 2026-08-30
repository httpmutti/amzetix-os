"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, InputLabel, InputError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NumberInput } from "@/components/ui/number-input";
import { useCRMStore } from "@/lib/store/crm.store";
import type { Lead } from "@/lib/store/crm.store";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  country: z.string().optional(),
  service: z.string().optional(),
  estimatedValue: z.coerce.number().min(0).optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: "NEW_LEAD", label: "New Lead" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

const SERVICE_OPTIONS = [
  { value: "", label: "— None —" },
  { value: "WEB_DEVELOPMENT", label: "Web Development" },
  { value: "ECOMMERCE_DEVELOPMENT", label: "E-Commerce Development" },
  { value: "SHOPIFY_DEVELOPMENT", label: "Shopify Development" },
  { value: "WOOCOMMERCE_DEVELOPMENT", label: "WooCommerce Development" },
  { value: "SEO", label: "SEO" },
  { value: "CONTENT_WRITING", label: "Content Writing" },
  { value: "GRAPHIC_DESIGN", label: "Graphic Design" },
  { value: "DIGITAL_MARKETING", label: "Digital Marketing" },
  { value: "WEBSITE_MANAGEMENT", label: "Website Management" },
  { value: "VIRTUAL_ASSISTANCE", label: "Virtual Assistance" },
  { value: "CUSTOM_DEVELOPMENT", label: "Custom Development" },
  { value: "OTHER", label: "Other" },
];

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  lead?: Lead | null;
}

export function LeadModal({ open, onClose, lead }: LeadModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const { invalidate, fetch: refreshStore } = useCRMStore();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: lead?.name ?? "",
      company: lead?.company ?? "",
      email: lead?.email ?? "",
      phone: lead?.phone ?? "",
      country: lead?.country ?? "",
      service: lead?.service ?? "",
      estimatedValue: lead?.estimatedValue ?? undefined,
      source: lead?.source ?? "",
      status: lead?.status ?? "NEW_LEAD",
      notes: lead?.notes ?? "",
    },
  });

  const status = watch("status") ?? "NEW_LEAD";
  const service = watch("service") ?? "";

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const url = lead ? `/api/crm/${lead.id}` : "/api/crm";
      const method = lead ? "PATCH" : "POST";
      const res = await window.fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to save lead");

      toast.success(lead ? "Lead updated" : "Lead created");
      invalidate();
      refreshStore();
      reset();
      onClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lead ? "Edit Lead" : "New Lead"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit(onSubmit)} type="button">
            {lead ? "Save changes" : "Create lead"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel htmlFor="name">Name *</InputLabel>
            <Input id="name" placeholder="Contact name" {...register("name")} />
            {errors.name && <InputError>{errors.name.message}</InputError>}
          </div>
          <div>
            <InputLabel htmlFor="company">Company</InputLabel>
            <Input id="company" placeholder="Company name" {...register("company")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel htmlFor="email">Email</InputLabel>
            <Input id="email" type="email" placeholder="email@example.com" {...register("email")} />
            {errors.email && <InputError>{errors.email.message}</InputError>}
          </div>
          <div>
            <InputLabel htmlFor="phone">Phone</InputLabel>
            <Input id="phone" placeholder="+1 555 000 0000" {...register("phone")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              onValueChange={(v) => setValue("status", v)}
              options={STATUS_OPTIONS}
            />
          </div>
          <div>
            <InputLabel>Service</InputLabel>
            <Select
              value={service}
              onValueChange={(v) => setValue("service", v)}
              options={SERVICE_OPTIONS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel htmlFor="estimatedValue">Est. Value (USD)</InputLabel>
            <NumberInput id="estimatedValue" placeholder="0" {...register("estimatedValue")} min={0} step={500} />
          </div>
          <div>
            <InputLabel htmlFor="source">Source</InputLabel>
            <Input id="source" placeholder="Referral, Website…" {...register("source")} />
          </div>
        </div>

        <div>
          <InputLabel htmlFor="country">Country</InputLabel>
          <Input id="country" placeholder="United States" {...register("country")} />
        </div>

        <div>
          <InputLabel htmlFor="notes">Notes</InputLabel>
          <Textarea id="notes" rows={3} placeholder="Additional notes…" {...register("notes")} />
        </div>
      </div>
    </Modal>
  );
}
