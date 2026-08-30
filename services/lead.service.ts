import { prisma } from "@/lib/prisma";
import type { LeadStatus, Service } from "@prisma/client";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export interface CreateLeadInput {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  country?: string;
  website?: string;
  service?: Service;
  estimatedValue?: number;
  currency?: string;
  source?: string;
  assignedToId?: string;
  status?: LeadStatus;
  notes?: string;
  nextFollowUp?: Date;
}

export interface ListLeadsFilters {
  status?: LeadStatus;
  service?: Service;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function listLeads(filters: ListLeadsFilters = {}) {
  const { status, service, search, page = 1, limit = 50, sortBy = "createdAt", sortOrder = "desc" } = filters;

  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(service && { service }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { company: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.lead.count({ where }),
  ]);

  return { leads, total, pages: Math.ceil(total / limit), page };
}

export async function getLeadById(id: string) {
  return prisma.lead.findFirst({ where: { id, deletedAt: null } });
}

export async function createLead(input: CreateLeadInput, performedById: string) {
  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      country: input.country,
      website: input.website,
      service: input.service,
      estimatedValue: input.estimatedValue,
      currency: input.currency ?? "USD",
      source: input.source,
      assignedToId: input.assignedToId,
      status: input.status ?? "NEW_LEAD",
      notes: input.notes,
      nextFollowUp: input.nextFollowUp,
    },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.CREATE,
    entity: "Lead",
    entityId: lead.id,
    newValues: { name: lead.name, status: lead.status },
    description: `Created lead: ${lead.name}${lead.company ? ` from ${lead.company}` : ""}`,
  });

  return lead;
}

export async function updateLead(id: string, input: Partial<CreateLeadInput>, performedById: string) {
  const old = await prisma.lead.findUniqueOrThrow({ where: { id } });

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...input,
      ...(input.status === "CONTACTED" || input.status === "QUALIFIED" ? { lastContactDate: new Date() } : {}),
    },
  });

  if (old.status !== lead.status) {
    await createAuditLog({
      performedById,
      action: AUDIT_ACTIONS.STATUS_CHANGE,
      entity: "Lead",
      entityId: lead.id,
      oldValues: { status: old.status },
      newValues: { status: lead.status },
      description: `Lead "${lead.name}" moved from ${old.status} → ${lead.status}`,
    });
  } else {
    await createAuditLog({
      performedById,
      action: AUDIT_ACTIONS.UPDATE,
      entity: "Lead",
      entityId: lead.id,
      description: `Updated lead: ${lead.name}`,
    });
  }

  return lead;
}

export async function deleteLead(id: string, performedById: string) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id } });

  await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.SOFT_DELETE,
    entity: "Lead",
    entityId: id,
    description: `Deleted lead: ${lead.name}`,
  });
}

export async function convertLeadToClient(id: string, performedById: string) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id, deletedAt: null } });

  const count = await prisma.client.count();
  const clientId = `CLT-${String(count + 1).padStart(4, "0")}`;

  const client = await prisma.client.create({
    data: {
      clientId,
      companyName: lead.company ?? lead.name,
      contactPerson: lead.name,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      website: lead.website,
      currency: lead.currency,
      status: "ONBOARDING",
    },
  });

  await prisma.lead.update({
    where: { id },
    data: { status: "WON", clientId: client.id, convertedAt: new Date() },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: "Lead",
    entityId: id,
    newValues: { status: "WON", clientId: client.id },
    description: `Lead "${lead.name}" converted to client ${clientId}`,
  });

  return client;
}
