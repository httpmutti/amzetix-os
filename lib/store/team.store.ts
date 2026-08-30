import { createEntityStore } from "./createStore";

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position?: string | null;
  status: string;
  employmentType: string;
  baseSalary: number | string;
  currency: string;
  workingHours: number | string;
  department?: { name: string; id: string } | null;
  departmentId?: string | null;
  user: { id: string; email: string };
  profileImage?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  joiningDate?: string | null;
}

export const useTeamStore = createEntityStore<Employee[]>("/api/employees?limit=200");
