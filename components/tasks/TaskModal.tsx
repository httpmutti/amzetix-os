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
import { useTasksStore, type TaskSummary } from "@/lib/store/tasks.store";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  status: z.enum(["BACKLOG","TODO","IN_PROGRESS","IN_REVIEW","CLIENT_REVIEW","COMPLETED","BLOCKED"]).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
});
type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "CLIENT_REVIEW", label: "Client Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: TaskSummary | null;
  defaultProjectId?: string;
}

export function TaskModal({ open, onClose, task, defaultProjectId }: TaskModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<{ value: string; label: string }[]>([]);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const { invalidate, fetch: refreshStore } = useTasksStore();

  useEffect(() => {
    Promise.all([
      window.fetch("/api/projects?limit=100").then(r => r.json()),
      window.fetch("/api/team?limit=100").then(r => r.json()),
    ]).then(([pJson, eJson]) => {
      setProjects((pJson.projects ?? []).map((p: { id: string; name: string; projectId: string }) => ({ value: p.id, label: `${p.projectId} — ${p.name}` })));
      setEmployees((eJson.data ?? eJson.employees ?? []).map((e: { id: string; firstName: string; lastName: string }) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })));
    }).catch(() => {});
  }, []);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.project?.id ?? defaultProjectId ?? "",
      assigneeId: task?.assignee?.id ?? "",
      priority: (task?.priority ?? "MEDIUM") as FormValues["priority"],
      status: (task?.status ?? "TODO") as FormValues["status"],
      dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
      estimatedHours: task?.estimatedHours ?? undefined,
    },
  });

  const priority = watch("priority") ?? "MEDIUM";
  const status = watch("status") ?? "TODO";
  const projectId = watch("projectId") ?? "";
  const assigneeId = watch("assigneeId") ?? "";

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = task ? "PATCH" : "POST";
      const res = await window.fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          projectId: values.projectId || undefined,
          assigneeId: values.assigneeId || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(task ? "Task updated" : "Task created");
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
      title={task ? "Edit Task" : "New Task"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit(onSubmit)} type="button">
            {task ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <InputLabel htmlFor="title">Title *</InputLabel>
          <Input id="title" placeholder="Task title" {...register("title")} />
          {errors.title && <InputError>{errors.title.message}</InputError>}
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

        {projects.length > 0 && (
          <div>
            <InputLabel>Project</InputLabel>
            <Select value={projectId} onValueChange={(v) => setValue("projectId", v)} options={[{ value: "", label: "— No project —" }, ...projects]} />
          </div>
        )}

        {employees.length > 0 && (
          <div>
            <InputLabel>Assignee</InputLabel>
            <Select value={assigneeId} onValueChange={(v) => setValue("assigneeId", v)} options={[{ value: "", label: "— Unassigned —" }, ...employees]} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel htmlFor="dueDate">Due Date</InputLabel>
            <DateInput id="dueDate" {...register("dueDate")} />
          </div>
          <div>
            <InputLabel htmlFor="estimatedHours">Est. Hours</InputLabel>
            <NumberInput id="estimatedHours" placeholder="0" {...register("estimatedHours")} min={0} step={0.5} />
          </div>
        </div>

        <div>
          <InputLabel htmlFor="description">Description</InputLabel>
          <Textarea id="description" rows={3} placeholder="Task details…" {...register("description")} />
        </div>
      </div>
    </Modal>
  );
}
