"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, InputLabel } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { NumberInput } from "@/components/ui/number-input";
import { formatCurrency } from "@/lib/utils";

const SERVICE_OPTIONS = [
  { value: "", label: "No service tag" },
  { value: "WEB_DEVELOPMENT", label: "Web Development" },
  { value: "ECOMMERCE_DEVELOPMENT", label: "E-commerce Development" },
  { value: "SHOPIFY_DEVELOPMENT", label: "Shopify Development" },
  { value: "WOOCOMMERCE_DEVELOPMENT", label: "WooCommerce Development" },
  { value: "BIGCOMMERCE_DEVELOPMENT", label: "BigCommerce Development" },
  { value: "SEO", label: "SEO" },
  { value: "CONTENT_WRITING", label: "Content Writing" },
  { value: "GRAPHIC_DESIGN", label: "Graphic Design" },
  { value: "DIGITAL_MARKETING", label: "Digital Marketing" },
  { value: "WEBSITE_MANAGEMENT", label: "Website Management" },
  { value: "BUSINESS_MANAGEMENT", label: "Business Management" },
  { value: "VIRTUAL_ASSISTANCE", label: "Virtual Assistance" },
  { value: "CUSTOM_DEVELOPMENT", label: "Custom Development" },
  { value: "OTHER", label: "Other" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "PKR", label: "PKR" },
  { value: "AED", label: "AED" },
  { value: "CAD", label: "CAD" },
  { value: "AUD", label: "AUD" },
];

const DISCOUNT_OPTIONS = [
  { value: "", label: "No discount" },
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed amount" },
];

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  service: string;
}

interface ClientOption { id: string; companyName: string; currency: string }

interface InvoiceData {
  id: string;
  clientId: string;
  projectId?: string | null;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: LineItem[];
  discountType?: string | null;
  discountValue?: number;
  taxRate?: number;
  paymentTerms?: number;
  paymentLink?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
}

interface Props {
  invoice?: InvoiceData;
}

export function InvoiceForm({ invoice }: Props) {
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState(invoice?.clientId ?? "");
  const [issueDate, setIssueDate] = useState(invoice?.issueDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(invoice?.dueDate?.slice(0, 10) ?? "");
  const [currency, setCurrency] = useState(invoice?.currency ?? "PKR");
  const [items, setItems] = useState<LineItem[]>(
    invoice?.items?.length
      ? invoice.items.map(i => ({ id: i.id, description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), service: i.service ?? "" }))
      : [{ description: "", quantity: 1, unitPrice: 0, service: "" }]
  );
  const [discountType, setDiscountType] = useState(invoice?.discountType ?? "");
  const [discountValue, setDiscountValue] = useState(invoice?.discountValue ?? 0);
  const [taxRate, setTaxRate] = useState(invoice?.taxRate ?? 0);
  const [paymentTerms, setPaymentTerms] = useState(invoice?.paymentTerms ?? 30);
  const [paymentLink, setPaymentLink] = useState(invoice?.paymentLink ?? "");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [internalNotes, setInternalNotes] = useState(invoice?.internalNotes ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.fetch("/api/clients?limit=200").then(r => r.json()).then(d => setClients(d.data ?? []));
  }, []);

  // Auto-set currency from client
  useEffect(() => {
    const client = clients.find(c => c.id === clientId);
    if (client?.currency) setCurrency(client.currency);
  }, [clientId, clients]);

  const addItem = () => setItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0, service: "" }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  // Totals
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discountAmount = discountType === "percentage"
    ? (subtotal * discountValue) / 100
    : discountType === "fixed" ? Math.min(discountValue, subtotal) : 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + taxAmount;

  const handleSubmit = async (sendNow = false) => {
    if (!clientId) { toast.error("Please select a client"); return; }
    if (!dueDate) { toast.error("Due date is required"); return; }
    if (items.some(i => !i.description.trim())) { toast.error("All line items need a description"); return; }

    setSubmitting(true);
    const payload = {
      clientId,
      issueDate,
      dueDate,
      currency,
      items: items.map((item, idx) => ({
        ...(item.id && { id: item.id }),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        service: item.service || undefined,
        sortOrder: idx,
      })),
      discountType: discountType || undefined,
      discountValue: discountType ? discountValue : undefined,
      taxRate: taxRate || undefined,
      paymentTerms,
      paymentLink: paymentLink || undefined,
      notes: notes || undefined,
      internalNotes: internalNotes || undefined,
    };

    try {
      let res: Response;
      if (invoice?.id) {
        res = await window.fetch(`/api/invoices/${invoice.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await window.fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) { toast.error(json.error?.message ?? json.error ?? "Failed to save"); setSubmitting(false); return; }

      const savedId = json.data.id;

      if (sendNow) {
        await window.fetch(`/api/invoices/${savedId}/send`, { method: "POST" });
        toast.success("Invoice saved and sent");
      } else {
        toast.success(invoice?.id ? "Invoice updated" : "Invoice created");
      }

      router.push(`/invoices/${savedId}`);
    } catch {
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const clientOptions = [
    { value: "", label: "Select client…" },
    ...clients.map(c => ({ value: c.id, label: c.companyName })),
  ];

  const selectedClient = clients.find(c => c.id === clientId);

  return (
    <div className="flex gap-6 items-start">
    {/* ── Left: Form ── */}
    <div className="flex flex-col gap-6 min-w-0 flex-1 max-w-2xl">
      {/* Header fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <InputLabel>Client</InputLabel>
          <Select value={clientId} onValueChange={setClientId} options={clientOptions} />
        </div>
        <div>
          <InputLabel>Currency</InputLabel>
          <Select value={currency} onValueChange={setCurrency} options={CURRENCY_OPTIONS} />
        </div>
        <div>
          <InputLabel>Issue Date</InputLabel>
          <DateInput value={issueDate} onChange={e => setIssueDate(e.target.value)} />
        </div>
        <div>
          <InputLabel>Due Date</InputLabel>
          <DateInput value={dueDate} onChange={e => setDueDate(e.target.value)} min={issueDate} />
        </div>
        <div>
          <InputLabel>Payment Terms (days)</InputLabel>
          <NumberInput value={paymentTerms} onChange={e => setPaymentTerms(+e.target.value || 30)} min={0} step={1} />
        </div>
        <div className="sm:col-span-2">
          <InputLabel>Payment Link (optional)</InputLabel>
          <Input
            value={paymentLink}
            onChange={e => setPaymentLink(e.target.value)}
            placeholder="https://pay.stripe.com/… or any payment URL"
            type="url"
          />
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Included in the invoice email as a &ldquo;Pay Now&rdquo; button for the client.</p>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-default)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Line Items</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)] w-full">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap w-24">Service</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap w-20">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap w-28">Unit Price</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap w-28">Amount</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="px-2 py-2">
                    <Input
                      value={item.description}
                      onChange={e => updateItem(i, "description", e.target.value)}
                      placeholder="Item description…"
                    />
                  </td>
                  <td className="px-2 py-2 min-w-[140px]">
                    <Select
                      value={item.service}
                      onValueChange={v => updateItem(i, "service", v)}
                      options={SERVICE_OPTIONS}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <NumberInput
                      value={item.quantity}
                      onChange={e => updateItem(i, "quantity", +e.target.value || 1)}
                      min={0.01}
                      step={1}
                      className="text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <NumberInput
                      value={item.unitPrice}
                      onChange={e => updateItem(i, "unitPrice", +e.target.value || 0)}
                      min={0}
                      step={0.01}
                      className="text-right"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-[var(--text-primary)] tabular-nums whitespace-nowrap">
                    {formatCurrency(item.quantity * item.unitPrice, currency)}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--color-danger-500)] hover:bg-[var(--interactive-secondary-hover)] transition-colors mx-auto">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-[var(--border-default)]">
          <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <Plus size={13} /> Add line item
          </button>
        </div>
      </div>

      {/* Totals + Discount + Tax */}
      <div className="ml-auto w-full max-w-sm flex flex-col gap-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 flex flex-col gap-3">
          {/* Discount */}
          <div>
            <InputLabel>Discount</InputLabel>
            <Select value={discountType} onValueChange={setDiscountType} options={DISCOUNT_OPTIONS} />
            {discountType && (
              <div className="mt-2">
                <NumberInput
                  value={discountValue}
                  onChange={e => setDiscountValue(+e.target.value || 0)}
                  min={0}
                  max={discountType === "percentage" ? 100 : undefined}
                  step={discountType === "percentage" ? 1 : 10}
                  placeholder={discountType === "percentage" ? "0 %" : "0.00"}
                />
              </div>
            )}
          </div>

          {/* Tax */}
          <div>
            <InputLabel>Tax Rate (%)</InputLabel>
            <NumberInput value={taxRate} onChange={e => setTaxRate(+e.target.value || 0)} min={0} max={100} step={0.5} />
          </div>

          {/* Summary */}
          <div className="border-t border-[var(--border-default)] pt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal, currency)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[var(--color-danger-500)]">
                <span>Discount</span>
                <span className="tabular-nums">−{formatCurrency(discountAmount, currency)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Tax ({taxRate}%)</span>
                <span className="tabular-nums">+{formatCurrency(taxAmount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[var(--text-primary)] text-base border-t border-[var(--border-default)] pt-2 mt-1">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <InputLabel>Notes (visible to client)</InputLabel>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Payment instructions, thank you note…"
            className="w-full rounded-[var(--radius-md)] border border-[var(--border-input)] bg-[var(--surface-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none"
          />
        </div>
        <div>
          <InputLabel>Internal Notes</InputLabel>
          <textarea
            value={internalNotes}
            onChange={e => setInternalNotes(e.target.value)}
            rows={3}
            placeholder="Notes not visible to client…"
            className="w-full rounded-[var(--radius-md)] border border-[var(--border-input)] bg-[var(--surface-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-4">
        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSubmit(false)} loading={submitting}>
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit(true)} loading={submitting}>
            Save & Send
          </Button>
        </div>
      </div>
    </div>

    {/* ── Right: Live Preview (PDF-faithful) ── */}
    <div className="hidden lg:block flex-1 min-w-0 sticky top-4">
      <p className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">Live Preview</p>
      <div className="rounded-[var(--radius-lg)] overflow-hidden shadow-md" style={{border: '1px solid #e4e4e7'}}>

        {/* 1 · Dark header */}
        <div style={{backgroundColor: '#0a0a0a', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <img
            src="https://res.cloudinary.com/dxbqlflap/image/upload/v1788032834/mailenium-ai/696581f90aba04b27318a2f2/logos/c2nvizmufckmvflt6mhv.png"
            alt="Logo"
            style={{height: 26, objectFit: 'contain'}}
          />
          <span style={{color: '#a1a1aa', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase'}}>Invoice</span>
        </div>

        {/* 2 · White body */}
        <div style={{backgroundColor: '#ffffff', padding: '20px 24px'}}>

          {/* Title + Lead */}
          <p style={{fontSize: 17, fontWeight: 700, color: '#0a0a0a', margin: 0, lineHeight: 1.2}}>
            Invoice {invoice?.id ? `#${invoice.id.slice(-6).toUpperCase()}` : '#DRAFT'}
          </p>
          <p style={{fontSize: 12, color: '#52525b', margin: '4px 0 16px'}}>
            {selectedClient?.companyName
              ? `Issued to ${selectedClient.companyName}`
              : <span style={{color: '#a1a1aa', fontStyle: 'italic'}}>Select a client…</span>}
          </p>

          {/* Meta grid: 4 columns */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 12px', marginBottom: 16}}>
            {([
              {label: 'Invoice No.', value: invoice?.id ? `#${invoice.id.slice(-6).toUpperCase()}` : '#DRAFT'},
              {label: 'Issued', value: issueDate || '—'},
              {label: 'Due Date', value: dueDate || '—'},
              {label: 'Currency', value: currency},
            ] as const).map(({label, value}) => (
              <div key={label}>
                <p style={{fontSize: 8, color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px'}}>{label}</p>
                <p style={{fontSize: 10, color: '#0a0a0a', fontWeight: 600, margin: 0}}>{value}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{borderTop: '1px solid #e4e4e7', marginBottom: 14}} />

          {/* Line items table */}
          <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #e4e4e7', fontSize: 10, marginBottom: 14}}>
            <thead>
              <tr style={{backgroundColor: '#f4f4f5'}}>
                <th style={{padding: '6px 8px', textAlign: 'left', color: '#52525b', fontWeight: 600, fontSize: 9}}>Description</th>
                <th style={{padding: '6px 8px', textAlign: 'right', color: '#52525b', fontWeight: 600, fontSize: 9, width: 30}}>Qty</th>
                <th style={{padding: '6px 8px', textAlign: 'right', color: '#52525b', fontWeight: 600, fontSize: 9, width: 80}}>Unit Price</th>
                <th style={{padding: '6px 8px', textAlign: 'right', color: '#52525b', fontWeight: 600, fontSize: 9, width: 80}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.filter(i => i.description).length > 0
                ? items.filter(i => i.description).map((item, idx) => (
                    <tr key={idx} style={{borderTop: '1px solid #e4e4e7'}}>
                      <td style={{padding: '6px 8px', color: '#0a0a0a'}}>{item.description}</td>
                      <td style={{padding: '6px 8px', textAlign: 'right', color: '#52525b', fontVariantNumeric: 'tabular-nums'}}>{item.quantity}</td>
                      <td style={{padding: '6px 8px', textAlign: 'right', color: '#52525b', fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(item.unitPrice, currency)}</td>
                      <td style={{padding: '6px 8px', textAlign: 'right', color: '#0a0a0a', fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(item.quantity * item.unitPrice, currency)}</td>
                    </tr>
                  ))
                : (
                    <tr>
                      <td colSpan={4} style={{padding: '12px 8px', textAlign: 'center', color: '#a1a1aa', fontStyle: 'italic', fontSize: 10}}>Add line items on the left</td>
                    </tr>
                  )}
            </tbody>
          </table>

          {/* Subtotal / discount / tax rows (above callout) */}
          {(discountAmount > 0 || taxAmount > 0) && (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, marginBottom: 10}}>
              <div style={{display: 'flex', justifyContent: 'space-between', width: 200, fontSize: 10, color: '#52525b'}}>
                <span>Subtotal</span><span style={{fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(subtotal, currency)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{display: 'flex', justifyContent: 'space-between', width: 200, fontSize: 10, color: '#ef4444'}}>
                  <span>Discount</span><span style={{fontVariantNumeric: 'tabular-nums'}}>−{formatCurrency(discountAmount, currency)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div style={{display: 'flex', justifyContent: 'space-between', width: 200, fontSize: 10, color: '#52525b'}}>
                  <span>Tax ({taxRate}%)</span><span style={{fontVariantNumeric: 'tabular-nums'}}>+{formatCurrency(taxAmount, currency)}</span>
                </div>
              )}
            </div>
          )}

          {/* Total callout box */}
          <div style={{backgroundColor: '#f4f4f5', border: '1px solid #d4d4d8', borderRadius: 8, padding: '16px 20px', textAlign: 'center', marginBottom: notes ? 16 : 0}}>
            <p style={{fontSize: 9, color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px'}}>Total Amount Due</p>
            <p style={{fontSize: 22, fontWeight: 700, color: '#0a0a0a', margin: 0, fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(total, currency)}</p>
            {dueDate && <p style={{fontSize: 10, color: '#52525b', margin: '4px 0 0'}}>Payment due by {dueDate}</p>}
            {paymentLink && (
              <div style={{marginTop: 10, display: 'inline-block', backgroundColor: '#0a0a0a', borderRadius: 4, padding: '5px 14px'}}>
                <span style={{color: '#ffffff', fontSize: 10, fontWeight: 600}}>Pay Now →</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {notes && (
            <div style={{marginTop: 14}}>
              <p style={{fontSize: 8, color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px'}}>Notes</p>
              <p style={{fontSize: 10, color: '#52525b', whiteSpace: 'pre-line', margin: 0}}>{notes}</p>
            </div>
          )}
        </div>

        {/* 3 · Footer */}
        <div style={{backgroundColor: '#f7f7f8', borderTop: '1px solid #e4e4e7', padding: '10px 24px', textAlign: 'center'}}>
          <p style={{fontSize: 8, color: '#a1a1aa', margin: 0}}>Amzetix · This invoice was generated automatically. Please contact us for any queries.</p>
        </div>
      </div>
    </div>

    </div>
  );
}
