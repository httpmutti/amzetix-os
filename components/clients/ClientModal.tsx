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
import { useClientsStore } from "@/lib/store/clients.store";
import type { ClientSummary } from "@/lib/store/clients.store";

const schema = z.object({
  companyName: z.string().min(1, "Company name required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  currency: z.string().optional(),
  paymentTerms: z.coerce.number().int().positive().optional(),
  status: z.enum(["LEAD","ONBOARDING","ACTIVE","PAUSED","COMPLETED","LOST"]).optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "LEAD", label: "Lead" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "LOST", label: "Lost" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
];

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  client?: ClientSummary | null;
}

export function ClientModal({ open, onClose, client }: ClientModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const { invalidate } = useClientsStore();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: client?.companyName ?? "",
      contactPerson: client?.contactPerson ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      country: client?.country ?? "",
      currency: client?.currency ?? "USD",
      status: (client?.status as FormValues["status"]) ?? "ACTIVE",
      notes: "",
    },
  });

  const status = watch("status") ?? "ACTIVE";
  const currency = watch("currency") ?? "USD";

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const url = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to save client");

      toast.success(client ? "Client updated" : "Client created");
      invalidate();
      useClientsStore.getState().fetch();
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
      title={client ? "Edit Client" : "New Client"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit(onSubmit)} type="button">
            {client ? "Save changes" : "Create client"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <InputLabel htmlFor="companyName">Company Name *</InputLabel>
            <Input id="companyName" placeholder="Acme Corp" {...register("companyName")} />
            {errors.companyName && <InputError>{errors.companyName.message}</InputError>}
          </div>
          <div>
            <InputLabel htmlFor="contactPerson">Contact Person</InputLabel>
            <Input id="contactPerson" placeholder="Jane Smith" {...register("contactPerson")} />
          </div>
          <div>
            <InputLabel>Status</InputLabel>
            <Select value={status} onValueChange={(v) => setValue("status", v as FormValues["status"])} options={STATUS_OPTIONS} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel htmlFor="email">Email</InputLabel>
            <Input id="email" type="email" placeholder="billing@company.com" {...register("email")} />
            {errors.email && <InputError>{errors.email.message}</InputError>}
          </div>
          <div>
            <InputLabel htmlFor="phone">Phone</InputLabel>
            <Input id="phone" placeholder="+1 555 000 0000" {...register("phone")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel htmlFor="country">Country</InputLabel>
            <Input id="country" placeholder="United States" {...register("country")} />
          </div>
          <div>
            <InputLabel>Currency</InputLabel>
            <Select value={currency} onValueChange={(v) => setValue("currency", v)} options={CURRENCY_OPTIONS} />
          </div>
        </div>

        <div>
          <InputLabel htmlFor="website">Website</InputLabel>
          <Input id="website" placeholder="https://company.com" {...register("website")} />
        </div>

        <div>
          <InputLabel htmlFor="notes">Notes</InputLabel>
          <Textarea id="notes" rows={2} placeholder="Internal notes…" {...register("notes")} />
        </div>
      </div>
    </Modal>
  );
}
