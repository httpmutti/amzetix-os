import { prisma } from "../lib/prisma";

async function main() {
  // Find Dev Muttitious client
  const client = await prisma.client.findFirst({
    where: { companyName: { contains: "Muttitious" } },
  });
  if (!client) { console.error("Client not found"); process.exit(1); }
  console.log("Client:", client.id, client.companyName);

  // Create a project
  const project = await prisma.project.create({
    data: {
      projectId: "PRJ-DEMO-001",
      name: "Website Redesign",
      clientId: client.id,
      status: "ACTIVE",
      description: "Full redesign of the company website including new branding, landing pages, and CMS integration.",
      startDate: new Date("2026-07-01"),
      dueDate: new Date("2026-09-30"),
      tasks: {
        create: [
          { taskId: "TSK-D-001", title: "Design mockups & wireframes", status: "COMPLETED", visibility: "CLIENT_VISIBLE" },
          { taskId: "TSK-D-002", title: "Homepage development", status: "IN_PROGRESS", visibility: "CLIENT_VISIBLE" },
          { taskId: "TSK-D-003", title: "CMS integration", status: "IN_PROGRESS", visibility: "CLIENT_VISIBLE" },
          { taskId: "TSK-D-004", title: "SEO & performance audit", status: "TODO", visibility: "CLIENT_VISIBLE" },
          { taskId: "TSK-D-005", title: "Client review & sign-off", status: "TODO", visibility: "CLIENT_VISIBLE", dueDate: new Date("2026-09-15") },
        ],
      },
      comments: {
        create: [
          {
            userId: (await prisma.user.findFirst({ where: { role: "OWNER" } }))!.id,
            content: "Mockups approved by team. Moving into development phase this week.",
            visibility: "CLIENT_VISIBLE",
          },
        ],
      },
    },
  });
  console.log("Project created:", project.id);

  // Create a second project
  const project2 = await prisma.project.create({
    data: {
      projectId: "PRJ-DEMO-002",
      name: "Brand Identity Package",
      clientId: client.id,
      status: "IN_REVIEW",
      description: "Logo design, brand guidelines, colour palette and typography system.",
      startDate: new Date("2026-06-01"),
      dueDate: new Date("2026-08-31"),
      tasks: {
        create: [
          { taskId: "TSK-D-006", title: "Logo concepts (3 directions)", status: "COMPLETED", visibility: "CLIENT_VISIBLE" },
          { taskId: "TSK-D-007", title: "Brand guidelines document", status: "IN_REVIEW", visibility: "CLIENT_VISIBLE" },
        ],
      },
    },
  });
  console.log("Project 2 created:", project2.id);

  // Find next invoice number
  const lastInv = await prisma.invoice.findFirst({ orderBy: { invoiceNumber: "desc" } });
  const nextNum = lastInv ? String(parseInt(lastInv.invoiceNumber.split("-")[2]) + 1).padStart(4, "0") : "0001";
  const invNumber = `INV-2026-${nextNum}`;

  // Create a SENT invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: invNumber,
      clientId: client.id,
      issueDate: new Date("2026-08-01"),
      dueDate: new Date("2026-08-31"),
      currency: "USD",
      subtotal: 8500,
      taxRate: 10,
      taxAmount: 850,
      discountAmount: 0,
      discountValue: 0,
      total: 9350,
      amountPaid: 0,
      balanceDue: 9350,
      status: "SENT",
      sentAt: new Date("2026-08-02"),
      notes: "Payment due within 30 days. Bank transfer details on file.",
      items: {
        create: [
          { description: "Website Redesign — Phase 1 (Design)", quantity: 1, unitPrice: 4500, amount: 4500, sortOrder: 0 },
          { description: "Website Redesign — Phase 2 (Development)", quantity: 1, unitPrice: 3500, amount: 3500, sortOrder: 1 },
          { description: "Project Management", quantity: 10, unitPrice: 50, amount: 500, sortOrder: 2 },
        ],
      },
    },
  });
  console.log("Invoice created:", invoice.invoiceNumber);

  // Create a second OVERDUE invoice
  const inv2Number = `INV-2026-${String(parseInt(nextNum) + 1).padStart(4, "0")}`;
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: inv2Number,
      clientId: client.id,
      issueDate: new Date("2026-07-01"),
      dueDate: new Date("2026-07-31"),
      currency: "USD",
      subtotal: 2000,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      discountValue: 0,
      total: 2000,
      amountPaid: 1000,
      balanceDue: 1000,
      status: "PARTIALLY_PAID",
      sentAt: new Date("2026-07-02"),
      notes: "Brand Identity Package — Deposit invoice.",
      items: {
        create: [
          { description: "Brand Identity Package — 50% Deposit", quantity: 1, unitPrice: 2000, amount: 2000, sortOrder: 0 },
        ],
      },
    },
  });
  console.log("Invoice 2 created:", invoice2.invoiceNumber);

  console.log("\n✅ Dummy data seeded for", client.companyName);
}

main().catch(console.error).finally(() => prisma.$disconnect());
