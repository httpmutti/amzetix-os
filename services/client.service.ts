import { prisma } from "@/lib/prisma";
import type { ClientStatus } from "@prisma/client";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

// Auto-generate client ID
async function generateClientId(): Promise<string> {
  const count = await prisma.client.count();
  return `CLT-${String(count + 1).padStart(4, "0")}`;
}

export interface CreateClientInput {
  companyName: string;
  contactPerson?: string;
  email?: string;
  billingEmail?: string;
  phone?: string;
  country?: string;
  address?: string;
  website?: string;
  taxId?: string;
  paymentTerms?: number;
  currency?: string;
  accountManagerId?: string;
  status?: ClientStatus;
  startDate?: Date;
  notes?: string;
  tags?: string[];
}

export async function createClient(input: CreateClientInput, performedById: string) {
  const clientId = await generateClientId();

  const client = await prisma.client.create({
    data: {
      clientId,
      companyName: input.companyName,
      contactPerson: input.contactPerson,
      email: input.email,
      billingEmail: input.billingEmail,
      phone: input.phone,
      country: input.country,
      address: input.address,
      website: input.website,
      taxId: input.taxId,
      paymentTerms: input.paymentTerms ?? 30,
      currency: input.currency ?? "USD",
      accountManagerId: input.accountManagerId,
      status: input.status ?? "ACTIVE",
      startDate: input.startDate,
      notes: input.notes,
      tags: input.tags ?? [],
    },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.CREATE,
    entity: "Client",
    entityId: client.id,
    newValues: { companyName: client.companyName, clientId: client.clientId },
    description: `Created client ${client.companyName} (${client.clientId})`,
  });

  return client;
}

export async function updateClient(
  id: string,
  input: Partial<CreateClientInput>,
  performedById: string
) {
  const old = await prisma.client.findUniqueOrThrow({ where: { id } });

  const client = await prisma.client.update({
    where: { id },
    data: input,
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.UPDATE,
    entity: "Client",
    entityId: id,
    oldValues: { status: old.status, companyName: old.companyName },
    newValues: { status: client.status, companyName: client.companyName },
    description: `Updated client ${client.companyName}`,
  });

  return client;
}

export async function softDeleteClient(id: string, performedById: string) {
  const client = await prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.SOFT_DELETE,
    entity: "Client",
    entityId: id,
    description: `Deleted client ${client.companyName}`,
  });

  return client;
}

export interface ClientFilters {
  status?: ClientStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function listClients(filters: ClientFilters = {}) {
  const { status, search, page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = filters;

  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(search && {
      OR: [
        { companyName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { contactPerson: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: { projects: true, invoices: true },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total, pages: Math.ceil(total / limit), page };
}

export async function getClientById(id: string) {
  return prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: {
      contacts: true,
      projects: {
        where: { deletedAt: null },
        select: { id: true, name: true, status: true, dueDate: true },
      },
      invoices: {
        where: { deletedAt: null },
        select: { id: true, invoiceNumber: true, total: true, amountPaid: true, balanceDue: true, status: true, issueDate: true },
        orderBy: { issueDate: "desc" },
        take: 10,
      },
      onboarding: true,
    },
  });
}

export async function getClientFinancials(clientId: string) {
  const [invoices, payments, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { clientId, deletedAt: null },
      select: { total: true, amountPaid: true, balanceDue: true, status: true },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { clientId, deletedAt: null },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { clientId, deletedAt: null, status: { not: "REJECTED" } },
    }),
  ]);

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = Number(payments._sum.amount ?? 0);
  const outstanding = invoices
    .filter((i) => ["SENT", "PARTIALLY_PAID"].includes(i.status))
    .reduce((s, i) => s + Number(i.balanceDue), 0);
  const overdue = invoices
    .filter((i) => i.status === "OVERDUE")
    .reduce((s, i) => s + Number(i.balanceDue), 0);
  const directExpenses = Number(expenses._sum.amount ?? 0);

  return { totalInvoiced, totalPaid, outstanding, overdue, directExpenses };
}
