import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProductQuoteTemplateTabProps {
  installedBannerText: string;
  setInstalledBannerText: (v: string) => void;
  installedDescription: string;
  setInstalledDescription: (v: string) => void;
  discontinuedBannerText: string;
  setDiscontinuedBannerText: (v: string) => void;
  discontinuedDescription: string;
  setDiscontinuedDescription: (v: string) => void;
  alternativeProductStatement: string;
  setAlternativeProductStatement: (v: string) => void;
  alternativeProductUrl: string;
  setAlternativeProductUrl: (v: string) => void;
  saveButton: React.ReactNode;
}

const ProductQuoteTemplateTab = ({
  installedBannerText, setInstalledBannerText,
  installedDescription, setInstalledDescription,
  discontinuedBannerText, setDiscontinuedBannerText,
  discontinuedDescription, setDiscontinuedDescription,
  alternativeProductStatement, setAlternativeProductStatement,
  alternativeProductUrl, setAlternativeProductUrl,
  saveButton,
}: ProductQuoteTemplateTabProps) => {
  return (
    <div className="space-y-6 mt-4">
      {/* Installed Statements */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Installed Product Statements</h3>
        <p className="text-sm text-muted-foreground">
          These statements appear when the product is shown as an installed/available item on the company website.
        </p>
        <div className="space-y-2">
          <Label>Installed Banner Statement</Label>
          <Input
            placeholder='e.g. This listing is a SYSTEM Item provided by "Best Comfort Heating and Cooling" and Installed.'
            value={installedBannerText}
            onChange={(e) => setInstalledBannerText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Short banner text displayed at the top of the product listing.</p>
        </div>
        <div className="space-y-2">
          <Label>Installed Description Statement</Label>
          <Textarea
            placeholder="Full description shown on the product page when this item is available for installation..."
            value={installedDescription}
            onChange={(e) => setInstalledDescription(e.target.value)}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">Detailed description explaining how customers can purchase and have this item installed.</p>
        </div>
      </div>

      {/* Discontinued Statements */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Discontinued Product Statements</h3>
        <p className="text-sm text-muted-foreground">
          These statements appear when the product has been discontinued by the manufacturer.
        </p>
        <div className="space-y-2">
          <Label>Discontinued Banner Statement</Label>
          <Input
            placeholder='e.g. Item has been DISCONTINUED by the Manufacture. Like alternative available.'
            value={discontinuedBannerText}
            onChange={(e) => setDiscontinuedBannerText(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Discontinued Description Statement</Label>
          <Textarea
            placeholder="Description explaining the product has been discontinued, parts availability, and service options..."
            value={discontinuedDescription}
            onChange={(e) => setDiscontinuedDescription(e.target.value)}
            rows={5}
          />
        </div>
      </div>

      {/* Alternative Product */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Alternative Active Product</h3>
        <p className="text-sm text-muted-foreground">
          When a product is discontinued, link to the recommended replacement product.
        </p>
        <div className="space-y-2">
          <Label>Alternative Product Statement</Label>
          <Textarea
            placeholder='e.g. We have found your "Like" alternative product based on as many matching specs to the original sought item.'
            value={alternativeProductStatement}
            onChange={(e) => setAlternativeProductStatement(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Alternative Product URL</Label>
          <Input
            placeholder="https://www.example.com/product-alternative-link"
            value={alternativeProductUrl}
            onChange={(e) => setAlternativeProductUrl(e.target.value)}
          />
        </div>
      </div>

      {saveButton}
    </div>
  );
};

export default ProductQuoteTemplateTab;
