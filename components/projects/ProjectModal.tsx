"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, InputLabel, InputError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { NumberInput } from "@/components/ui/number-input";
import { useProjectsStore } from "@/lib/store/projects.store";
import type { ProjectSummary } from "@/lib/store/projects.store";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  clientId: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["PLANNED","ACTIVE","ON_HOLD","IN_REVIEW","CLIENT_REVIEW","COMPLETED","CANCELLED"]).optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  budget: z.coerce.number().optional(),
  currency: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
});
type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "CLIENT_REVIEW", label: "Client Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "PKR", label: "PKR" },
  { value: "AED", label: "AED" },
];

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: ProjectSummary | null;
}

export function ProjectModal({ open, onClose, project }: ProjectModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);
  const { invalidate, fetch: refreshStore } = useProjectsStore();

  useEffect(() => {
    fetch("/api/clients?limit=100").then(r => r.json()).then(json => {
      setClients((json.clients ?? []).map((c: { id: string; companyName: string }) => ({ value: c.id, label: c.companyName })));
    }).catch(() => {});
  }, []);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? "",
      clientId: project?.client?.id ?? "",
      description: project?.description ?? "",
      status: (project?.status ?? "PLANNED") as FormValues["status"],
      priority: (project?.priority ?? "MEDIUM") as FormValues["priority"],
      startDate: project?.startDate ? project.startDate.slice(0, 10) : "",
      dueDate: project?.dueDate ? project.dueDate.slice(0, 10) : "",
      budget: project?.budget ?? undefined,
      currency: project?.currency ?? "USD",
      estimatedHours: project?.estimatedHours ?? undefined,
    },
  });

  const status = watch("status") ?? "PLANNED";
  const priority = watch("priority") ?? "MEDIUM";
  const currency = watch("currency") ?? "USD";
  const clientId = watch("clientId") ?? "";

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const url = project ? `/api/projects/${project.id}` : "/api/projects";
      const method = project ? "PATCH" : "POST";
      const res = await window.fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, clientId: values.clientId || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(project ? "Project updated" : "Project created");
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
      title={project ? "Edit Project" : "New Project"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit(onSubmit)} type="button">
            {project ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <InputLabel htmlFor="name">Project Name *</InputLabel>
          <Input id="name" placeholder="Website Redesign" {...register("name")} />
          {errors.name && <InputError>{errors.name.message}</InputError>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel>Status</InputLabel>
            <Select value={status} onValueChange={(v) => setValue("status", v as FormValues["status"])} options={STATUS_OPTIONS} />
          </div>
          <div>
            <InputLabel>Priority</InputLabel>
            <Select value={priority} onValueChange={(v) => setValue("priority", v as FormValues["priority"])} options={PRIORITY_OPTIONS} />
          </div>
        </div>

        {clients.length > 0 && (
          <div>
            <InputLabel>Client</InputLabel>
            <Select
              value={clientId}
              onValueChange={(v) => setValue("clientId", v)}
              options={[{ value: "", label: "— No client —" }, ...clients]}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel htmlFor="startDate">Start Date</InputLabel>
            <DateInput id="startDate" {...register("startDate")} />
          </div>
          <div>
            <InputLabel htmlFor="dueDate">Due Date</InputLabel>
            <DateInput id="dueDate" {...register("dueDate")} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <InputLabel htmlFor="budget">Budget</InputLabel>
            <NumberInput id="budget" placeholder="0" {...register("budget")} min={0} step={100} />
          </div>
          <div>
            <InputLabel>Currency</InputLabel>
            <Select value={currency} onValueChange={(v) => setValue("currency", v)} options={CURRENCY_OPTIONS} />
          </div>
        </div>

        <div>
          <InputLabel htmlFor="estimatedHours">Estimated Hours</InputLabel>
          <NumberInput id="estimatedHours" placeholder="0" {...register("estimatedHours")} min={0} step={0.5} />
        </div>

        <div>
          <InputLabel htmlFor="description">Description</InputLabel>
          <Textarea id="description" rows={2} placeholder="Project overview…" {...register("description")} />
        </div>
      </div>
    </Modal>
  );
}
