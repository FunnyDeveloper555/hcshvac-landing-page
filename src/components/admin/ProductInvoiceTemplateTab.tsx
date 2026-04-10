import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProductInvoiceTemplateTabProps {
  invoiceLineDescription: string;
  setInvoiceLineDescription: (v: string) => void;
  invoiceUnitPriceText: string;
  setInvoiceUnitPriceText: (v: string) => void;
  invoiceFootNotes: string;
  setInvoiceFootNotes: (v: string) => void;
  invoicePaymentPlan: string;
  setInvoicePaymentPlan: (v: string) => void;
  invoiceTerms: string;
  setInvoiceTerms: (v: string) => void;
  invoiceShipVia: string;
  setInvoiceShipVia: (v: string) => void;
  invoiceNotes: string;
  setInvoiceNotes: (v: string) => void;
  saveButton: React.ReactNode;
}

const ProductInvoiceTemplateTab = ({
  invoiceLineDescription, setInvoiceLineDescription,
  invoiceUnitPriceText, setInvoiceUnitPriceText,
  invoiceFootNotes, setInvoiceFootNotes,
  invoicePaymentPlan, setInvoicePaymentPlan,
  invoiceTerms, setInvoiceTerms,
  invoiceShipVia, setInvoiceShipVia,
  invoiceNotes, setInvoiceNotes,
  saveButton,
}: ProductInvoiceTemplateTabProps) => {
  return (
    <div className="space-y-6 mt-4">
      {/* Line Item Defaults */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Line Item Defaults</h3>
        <p className="text-sm text-muted-foreground">
          Default values used when this product is added as a line item on an invoice.
        </p>
        <div className="space-y-2">
          <Label>Default Line Item Description</Label>
          <Textarea
            placeholder='e.g. 17.5" 75,000BTU Up Flow 80% Single Stage'
            value={invoiceLineDescription}
            onChange={(e) => setInvoiceLineDescription(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">Description that auto-populates when this product is added to an invoice line item.</p>
        </div>
        <div className="space-y-2">
          <Label>Default Unit Price Text</Label>
          <Input
            placeholder='e.g. INCLUDED'
            value={invoiceUnitPriceText}
            onChange={(e) => setInvoiceUnitPriceText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Default display text for the unit price column (e.g., "INCLUDED", a dollar amount, etc.).</p>
        </div>
      </div>

      {/* Terms & Payment Defaults */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Terms & Payment Defaults</h3>
        <p className="text-sm text-muted-foreground">
          Default payment and delivery terms pre-filled on invoices for this product.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Payment Plan</Label>
            <Input
              placeholder="e.g. C.O.D"
              value={invoicePaymentPlan}
              onChange={(e) => setInvoicePaymentPlan(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Terms</Label>
            <Input
              placeholder="e.g. 100%"
              value={invoiceTerms}
              onChange={(e) => setInvoiceTerms(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ship Via</Label>
            <Input
              placeholder="e.g. Delivered"
              value={invoiceShipVia}
              onChange={(e) => setInvoiceShipVia(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Invoice Notes</h3>
        <p className="text-sm text-muted-foreground">
          General notes that appear on the invoice body.
        </p>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            placeholder="Any general notes for this product invoice..."
            value={invoiceNotes}
            onChange={(e) => setInvoiceNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Foot Notes & Warranty */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Foot Notes & Warranty Statements</h3>
        <p className="text-sm text-muted-foreground">
          Warranty and footnote statements displayed at the bottom of the invoice (e.g., "10 Year Parts and Labor Warranty").
        </p>
        <div className="space-y-2">
          <Label>Foot Notes</Label>
          <Textarea
            placeholder={'e.g.\n***** 10 Year Parts and Labor Warranty\n****Must Register with Manufacturer within 90 Days of Installation, or will default as a 5 Year Warranty'}
            value={invoiceFootNotes}
            onChange={(e) => setInvoiceFootNotes(e.target.value)}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">Each line will appear as a separate footnote on the generated invoice.</p>
        </div>
      </div>

      {saveButton}
    </div>
  );
};

export default ProductInvoiceTemplateTab;
