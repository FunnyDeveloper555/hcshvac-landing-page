import { Routes, Route, Navigate } from "react-router-dom";
import ProductsList from "./ProductsList";
import ProductsAdd from "./ProductsAdd";
import ProductsBulkImport from "./products/ProductsBulkImport";
import ProductCategoriesAdmin from "./ProductCategoriesAdmin";

const ProductsAdmin = () => {
  return (
    <div className="space-y-0">
      <Routes>
        <Route path="/" element={<Navigate to="list" replace />} />
        <Route path="/add" element={<ProductsAdd />} />
        <Route path="/bulk" element={<ProductsBulkImport />} />
        <Route path="/list" element={<ProductsList />} />
        <Route path="/categories" element={<ProductCategoriesAdmin />} />
      </Routes>
    </div>
  );
};

export default ProductsAdmin;
