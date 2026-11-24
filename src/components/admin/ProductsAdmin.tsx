import BundleMaker from "./products/BundleMaker";
import EstimatesList from "./products/EstimatesList";
import BundlesList from "./products/BundlesList";
import EstimateBuilder from "./products/EstimateBuilder";
import FinanceCalculatorPage from "./products/bundle/FinanceCalculator";
import { Routes, Route, Navigate } from "react-router-dom";
import ProductsList from "./ProductsList";
import ProductsAdd from "./ProductsAdd";
import ProductsBulkImport from "./products/ProductsBulkImport";
import ProductCategoriesAdmin from "./ProductCategoriesAdmin";
import PricingRulesAdmin from "./products/PricingRulesAdmin";
import ProductFormMaker from "./products/forms/ProductFormMaker";
import ProductTypePage, { FormAwareProductEntry } from "./products/forms/ProductTypePage";

const ProductsAdmin = () => {
  return (
    <div className="space-y-0">
      <Routes>
        <Route path="/" element={<Navigate to="list" replace />} />
        <Route path="/add" element={<FormAwareProductEntry />} />
        <Route path="/form-maker" element={<ProductFormMaker />} />
        <Route path="/type/:typeName" element={<ProductTypePage />} />
        <Route path="/bulk" element={<ProductsBulkImport />} />
        <Route path="/list" element={<ProductsList />} />
        <Route path="/bundle-maker" element={<BundleMaker />} />
        <Route path="/estimates" element={<EstimatesList />} />
        <Route path="/bundles" element={<BundlesList />} />
        <Route path="/estimate" element={<EstimateBuilder />} />
        <Route path="/finance-calculator" element={<FinanceCalculatorPage />} />
        <Route path="/pricing-rules" element={<PricingRulesAdmin />} />
        <Route path="/categories" element={<ProductCategoriesAdmin />} />
      </Routes>
    </div>
  );
};

export default ProductsAdmin;
