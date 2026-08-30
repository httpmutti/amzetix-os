import { prisma } from "@/lib/prisma";
import type { LoanStatus, PaymentMethod } from "@prisma/client";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

async function generateLoanNumber(): Promise<string> {
  const count = await prisma.loanAccount.count();
  return `LOAN-${String(count + 1).padStart(3, "0")}`;
}

export interface CreateLoanInput {
  source: string;
  principal: number;
  currency?: string;
  interestRate?: number;
  startDate: Date;
  dueDate?: Date;
  purpose?: string;
  notes?: string;
}

export async function createLoan(input: CreateLoanInput, performedById: string) {
  const loanNumber = await generateLoanNumber();
  const loan = await prisma.loanAccount.create({
    data: {
      loanNumber,
      source: input.source,
      principal: input.principal,
      currency: input.currency ?? "PKR",
      interestRate: input.interestRate,
      startDate: input.startDate,
      dueDate: input.dueDate,
      purpose: input.purpose,
      notes: input.notes,
      status: "ACTIVE",
    },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.CREATE,
    entity: "LoanAccount",
    entityId: loan.id,
    description: `Created loan ${loanNumber} from ${loan.source} — Rs. ${loan.principal}`,
  });

  return loan;
}

export async function updateLoan(
  id: string,
  data: Partial<CreateLoanInput & { status: LoanStatus }>,
  performedById: string
) {
  const old = await prisma.loanAccount.findUniqueOrThrow({ where: { id } });
  const loan = await prisma.loanAccount.update({ where: { id }, data });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.UPDATE,
    entity: "LoanAccount",
    entityId: id,
    oldValues: old as Record<string, unknown>,
    newValues: data as Record<string, unknown>,
    description: `Updated loan ${old.loanNumber}`,
  });

  return loan;
}

export async function deleteLoan(id: string, performedById: string) {
  const loan = await prisma.loanAccount.findUniqueOrThrow({ where: { id } });
  await prisma.loanAccount.delete({ where: { id } });
  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.DELETE,
    entity: "LoanAccount",
    entityId: id,
    description: `Deleted loan ${loan.loanNumber}`,
  });
}

export async function addRepayment(
  loanId: string,
  input: { amount: number; paidAt: Date; method?: PaymentMethod; referenceId?: string; note?: string },
  performedById: string
) {
  const repayment = await prisma.loanRepayment.create({
    data: {
      loanId,
      amount: input.amount,
      paidAt: input.paidAt,
      method: input.method ?? "BANK_TRANSFER",
      referenceId: input.referenceId,
      note: input.note,
    },
  });

  // Auto-mark fully repaid if total repayments ≥ principal
  const loan = await prisma.loanAccount.findUniqueOrThrow({
    where: { id: loanId },
    include: { repayments: true },
  });
  const totalRepaid = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0);
  if (totalRepaid >= Number(loan.principal) && loan.status === "ACTIVE") {
    await prisma.loanAccount.update({ where: { id: loanId }, data: { status: "FULLY_REPAID" } });
  }

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.UPDATE,
    entity: "LoanRepayment",
    entityId: repayment.id,
    description: `Repayment of Rs. ${input.amount} on loan ${loanId}`,
  });

  return repayment;
}

export async function deleteRepayment(id: string, performedById: string) {
  const rep = await prisma.loanRepayment.findUniqueOrThrow({ where: { id } });
  await prisma.loanRepayment.delete({ where: { id } });

  // Revert FULLY_REPAID if total drops below principal
  const loan = await prisma.loanAccount.findUniqueOrThrow({
    where: { id: rep.loanId },
    include: { repayments: true },
  });
  const totalRepaid = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0);
  if (totalRepaid < Number(loan.principal) && loan.status === "FULLY_REPAID") {
    await prisma.loanAccount.update({ where: { id: rep.loanId }, data: { status: "ACTIVE" } });
  }

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.DELETE,
    entity: "LoanRepayment",
    entityId: id,
    description: `Deleted repayment on loan ${rep.loanId}`,
  });
}

export async function listLoans() {
  const loans = await prisma.loanAccount.findMany({
    include: { repayments: { orderBy: { paidAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const withComputed = loans.map((loan) => {
    const totalRepaid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
    const outstanding = Number(loan.principal) - totalRepaid;
    return { ...loan, totalRepaid, outstanding };
  });

  const totalDebt = withComputed.filter((l) => l.status === "ACTIVE").reduce((s, l) => s + l.outstanding, 0);
  const totalRepaidAll = withComputed.reduce((s, l) => s + l.totalRepaid, 0);

  return { loans: withComputed, totalDebt, totalRepaidAll };
}

export async function getLoan(id: string) {
  const loan = await prisma.loanAccount.findUniqueOrThrow({
    where: { id },
    include: { repayments: { orderBy: { paidAt: "desc" } } },
  });
  const totalRepaid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
  const outstanding = Number(loan.principal) - totalRepaid;
  return { ...loan, totalRepaid, outstanding };
}
