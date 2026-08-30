import { prisma } from "@/lib/prisma";

// Business days (Mon-Sat) in a given month
export function getWorkingDaysInMonth(month: number, year: number): number {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0) count++; // 0 = Sunday off; Mon–Sat work
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// Returns each Mon-Sat week fully (or partially) within the month
function getWeeksInMonth(month: number, year: number): Array<{ start: Date; end: Date }> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const weeks: Array<{ start: Date; end: Date }> = [];

  // Find first Monday on or before month start
  const first = new Date(monthStart);
  const dow = first.getDay(); // 0=Sun
  if (dow !== 1) {
    // go back to Monday
    const back = dow === 0 ? 6 : dow - 1;
    first.setDate(first.getDate() - back);
  }

  let cursor = new Date(first);
  while (cursor <= monthEnd) {
    const wStart = new Date(cursor);
    const wEnd = new Date(cursor);
    wEnd.setDate(wEnd.getDate() + 5); // Saturday
    weeks.push({ start: wStart, end: wEnd });
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

// Returns number of weeks in the month where employee tracked < 45 hours
async function countUnderhourWeeks(employeeId: string, month: number, year: number) {
  const weeks = getWeeksInMonth(month, year);
  let shortfallWeeks = 0;

  for (const { start, end } of weeks) {
    const entries = await prisma.timeEntry.findMany({
      where: {
        employeeId,
        startTime: { gte: start, lte: end },
        endTime: { not: null },
      },
      select: { duration: true },
    });
    const totalMin = entries.reduce((s, e) => s + (e.duration ?? 0), 0);
    if (totalMin < 45 * 60) shortfallWeeks++;
  }
  return shortfallWeeks;
}

export interface EmployeePayrollOverrides {
  allowances?: number;
  bonuses?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  advances?: number;
  taxDeductions?: number;
  otherDeductions?: number;
  notes?: string;
}

export async function calculateEmployeePayroll(
  employeeId: string,
  month: number,
  year: number,
  overrides: EmployeePayrollOverrides = {}
) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { baseSalary: true, currency: true, workingHours: true },
  });
  if (!employee) throw new Error("Employee not found");

  const baseSalary = Number(employee.baseSalary);
  const currency = employee.currency;

  const workingDays = getWorkingDaysInMonth(month, year);
  const dailyRate = workingDays > 0 ? baseSalary / workingDays : 0;

  // Attendance for the month
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: from, lte: to },
    },
    select: { status: true, overtimeMin: true },
  });

  let presentDays = 0;
  let absentDays = 0;
  let totalOvertimeMin = 0;

  for (const a of attendances) {
    if (a.status === "PRESENT") { presentDays += 1; totalOvertimeMin += a.overtimeMin; }
    else if (a.status === "HALF_DAY") { presentDays += 0.5; }
    else if (a.status === "ABSENT") { absentDays += 1; }
  }

  // Approved paid leave for the month
  const paidLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: "APPROVED",
      startDate: { lte: to },
      endDate: { gte: from },
      leaveType: { isPaid: true },
    },
    include: { leaveType: true },
  });

  let leaveDays = 0;
  for (const lr of paidLeaves) {
    const lrStart = lr.startDate > from ? lr.startDate : from;
    const lrEnd = lr.endDate < to ? lr.endDate : to;
    const days = Math.round((lrEnd.getTime() - lrStart.getTime()) / 86400000) + 1;
    leaveDays += days;
  }

  // Unpaid absences = working days not accounted for
  const accounted = presentDays + leaveDays;
  const unaccountedDays = Math.max(0, workingDays - accounted - absentDays);
  const totalAbsent = absentDays + unaccountedDays;
  const unpaidLeaveAmount = totalAbsent * dailyRate;

  // Fixed deductions: Rs. 500 per absent day (without approved leave)
  const ABSENT_PENALTY = 500;
  const HOURS_PENALTY = 500;
  const absentDeduction = totalAbsent * ABSENT_PENALTY;

  // Fixed deductions: Rs. 500 per week where tracked < 45 hours
  const weeklyShortfalls = await countUnderhourWeeks(employeeId, month, year);
  const hoursDeduction = weeklyShortfalls * HOURS_PENALTY;

  // Overtime (from attendance + manual override)
  const attendanceOvertimeHours = totalOvertimeMin / 60;
  const overtimeHours = overrides.overtimeHours ?? attendanceOvertimeHours;
  const hourlyRate = workingDays > 0 ? baseSalary / (workingDays * Number(employee.workingHours)) : 0;
  const overtimeRate = overrides.overtimeRate ?? hourlyRate * 1.5;
  const overtime = overtimeHours * overtimeRate;

  const allowances = overrides.allowances ?? 0;
  const bonuses = overrides.bonuses ?? 0;
  const advances = overrides.advances ?? 0;
  const taxDeductions = overrides.taxDeductions ?? 0;
  const otherDeductions = overrides.otherDeductions ?? 0;

  const grossSalary = baseSalary + allowances + bonuses + overtime;
  const totalDeductions = unpaidLeaveAmount + absentDeduction + hoursDeduction + advances + taxDeductions + otherDeductions;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    baseSalary,
    allowances,
    bonuses,
    overtime,
    grossSalary,
    deductions: totalDeductions,
    unpaidLeave: unpaidLeaveAmount,
    absentDeduction,
    hoursDeduction,
    weeklyShortfalls,
    advances,
    taxDeductions,
    otherDeductions,
    netSalary,
    workingDays,
    presentDays: Math.round(presentDays),
    leaveDays,
    absentDays: Math.round(totalAbsent),
    overtimeHours,
    currency,
  };
}

export async function createPayrollRun(month: number, year: number, createdById: string) {
  const existing = await prisma.payroll.findFirst({ where: { month, year } });
  if (existing) throw new Error(`Payroll for ${month}/${year} already exists`);

  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });

  const payroll = await prisma.payroll.create({
    data: {
      month,
      year,
      status: "DRAFT",
      createdBy: createdById,
    },
  });

  // Calculate and create employee rows in parallel
  await Promise.all(
    employees.map(async (emp) => {
      try {
        const calc = await calculateEmployeePayroll(emp.id, month, year);
        await prisma.payrollEmployee.create({
          data: {
            payrollId: payroll.id,
            employeeId: emp.id,
            baseSalary: calc.baseSalary,
            allowances: calc.allowances,
            bonuses: calc.bonuses,
            overtime: calc.overtime,
            grossSalary: calc.grossSalary,
            deductions: calc.deductions,
            unpaidLeave: calc.unpaidLeave,
            absentDeduction: calc.absentDeduction,
            hoursDeduction: calc.hoursDeduction,
            weeklyShortfalls: calc.weeklyShortfalls,
            advances: calc.advances,
            taxDeductions: calc.taxDeductions,
            otherDeductions: calc.otherDeductions,
            netSalary: calc.netSalary,
            currency: calc.currency,
            workingDays: calc.workingDays,
            presentDays: calc.presentDays,
            leaveDays: calc.leaveDays,
            absentDays: calc.absentDays,
            overtimeHours: calc.overtimeHours,
          },
        });
      } catch {
        // Skip employee if calculation fails
      }
    })
  );

  return prisma.payroll.findUnique({
    where: { id: payroll.id },
    include: {
      items: {
        include: { employee: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { employee: { firstName: "asc" } },
      },
    },
  });
}

export async function getPayrollRun(id: string) {
  return prisma.payroll.findUnique({
    where: { id },
    include: {
      items: {
        include: { employee: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { employee: { firstName: "asc" } },
      },
    },
  });
}

export async function listPayrollRuns() {
  const runs = await prisma.payroll.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      _count: { select: { items: true } },
    },
  });

  return Promise.all(
    runs.map(async (run) => {
      const totals = await prisma.payrollEmployee.aggregate({
        where: { payrollId: run.id },
        _sum: { netSalary: true, grossSalary: true },
      });
      return {
        ...run,
        totalNet: Number(totals._sum.netSalary ?? 0),
        totalGross: Number(totals._sum.grossSalary ?? 0),
      };
    })
  );
}

/** Pure function: compute net salary from pre-calculated components. */
export function computeNetSalary(params: {
  baseSalary: number;
  allowances?: number;
  bonuses?: number;
  overtime?: number;
  deductions?: number;
}): { grossSalary: number; netSalary: number } {
  const { baseSalary, allowances = 0, bonuses = 0, overtime = 0, deductions = 0 } = params;
  const grossSalary = baseSalary + allowances + bonuses + overtime;
  const netSalary = Math.max(0, grossSalary - deductions);
  return { grossSalary, netSalary };
}
