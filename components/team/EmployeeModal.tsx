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
import { NumberInput } from "@/components/ui/number-input";
import { DateInput } from "@/components/ui/date-input";

const schema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  position: z.string().optional(),
  departmentId: z.string().optional(),
  employmentType: z.string().optional(),
  joiningDate: z.string().optional(),
  baseSalary: z.coerce.number().optional(),
  currency: z.string().optional(),
  workingHours: z.coerce.number().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const EMPLOYMENT_OPTIONS = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "INTERN", label: "Intern" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "PKR", label: "PKR" },
];

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  employmentType: string;
  joiningDate?: string | null;
  baseSalary: number | string;
  currency: string;
  workingHours: number | string;
  address?: string | null;
  notes?: string | null;
  user: { email: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  employee?: Employee | null;
}

export function EmployeeModal({ open, onClose, onSaved, employee }: Props) {
  const isEdit = !!employee;
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "USD", employmentType: "FULL_TIME", workingHours: 8 },
  });

  const employmentType = watch("employmentType") ?? "FULL_TIME";
  const currency = watch("currency") ?? "USD";

  useEffect(() => {
    fetch("/api/settings/departments").then(r => r.json()).then(d => {
      if (d.data) setDepartments(d.data.map((dep: { id: string; name: string }) => ({ value: dep.id, label: dep.name })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.user.email,
          phone: employee.phone ?? "",
          position: employee.position ?? "",
          departmentId: employee.departmentId ?? "",
          employmentType: employee.employmentType,
          joiningDate: employee.joiningDate ? employee.joiningDate.slice(0, 10) : "",
          baseSalary: Number(employee.baseSalary),
          currency: employee.currency,
          workingHours: Number(employee.workingHours),
          address: employee.address ?? "",
          notes: employee.notes ?? "",
        });
      } else {
        reset({ currency: "USD", employmentType: "FULL_TIME", workingHours: 8 });
      }
    }
  }, [open, employee, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        const res = await window.fetch(`/api/employees/${employee!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone || undefined,
            position: values.position || undefined,
            departmentId: values.departmentId || undefined,
            employmentType: values.employmentType,
            joiningDate: values.joiningDate || undefined,
            baseSalary: values.baseSalary,
            currency: values.currency,
            workingHours: values.workingHours,
            address: values.address || undefined,
            notes: values.notes || undefined,
          }),
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Employee updated");
      } else {
        // Create user first, then employee
        const userRes = await window.fetch("/api/auth/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email, name: `${values.firstName} ${values.lastName}`, role: "EMPLOYEE" }),
        });
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error ?? "User creation failed");

        const empRes = await window.fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, userId: userData.data.id }),
        });
        if (!empRes.ok) throw new Error("Employee creation failed");
        toast.success("Employee added");
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Employee" : "Add Employee"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel htmlFor="firstName">First Name</InputLabel>
            <Input id="firstName" placeholder="Ahmed" {...register("firstName")} />
            <InputError>{errors.firstName?.message}</InputError>
          </div>
          <div>
            <InputLabel htmlFor="lastName">Last Name</InputLabel>
            <Input id="lastName" placeholder="Farooq" {...register("lastName")} />
            <InputError>{errors.lastName?.message}</InputError>
          </div>
        </div>

        {!isEdit && (
          <div>
            <InputLabel htmlFor="email">Email</InputLabel>
            <Input id="email" type="email" placeholder="ahmed@agency.com" {...register("email")} />
            <InputError>{errors.email?.message}</InputError>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel htmlFor="position">Position</InputLabel>
            <Input id="position" placeholder="Designer" {...register("position")} />
          </div>
          <div>
            <InputLabel htmlFor="phone">Phone</InputLabel>
            <Input id="phone" placeholder="+92 300 0000000" {...register("phone")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel>Department</InputLabel>
            <Select
              value={watch("departmentId") ?? ""}
              onValueChange={(v) => setValue("departmentId", v)}
              options={[{ value: "", label: "— None —" }, ...departments]}
            />
          </div>
          <div>
            <InputLabel>Employment Type</InputLabel>
            <Select
              value={employmentType}
              onValueChange={(v) => setValue("employmentType", v)}
              options={EMPLOYMENT_OPTIONS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel htmlFor="joiningDate">Joining Date</InputLabel>
            <DateInput id="joiningDate" {...register("joiningDate")} />
          </div>
          <div>
            <InputLabel htmlFor="workingHours">Working Hours/Day</InputLabel>
            <NumberInput id="workingHours" {...register("workingHours")} min={1} max={24} step={0.5} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <InputLabel htmlFor="baseSalary">Base Salary</InputLabel>
            <NumberInput id="baseSalary" placeholder="0" {...register("baseSalary")} min={0} step={100} />
          </div>
          <div>
            <InputLabel>Currency</InputLabel>
            <Select
              value={currency}
              onValueChange={(v) => setValue("currency", v)}
              options={CURRENCY_OPTIONS}
            />
          </div>
        </div>

        <div>
          <InputLabel htmlFor="address">Address</InputLabel>
          <Input id="address" placeholder="City, Country" {...register("address")} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEdit ? "Save Changes" : "Add Employee"}</Button>
        </div>
      </form>
    </Modal>
  );
}
