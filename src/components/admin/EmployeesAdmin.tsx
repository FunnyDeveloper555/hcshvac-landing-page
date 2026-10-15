import { Routes, Route, Navigate } from "react-router-dom";
import { EmployeesAdd } from "./EmployeesAdd";
import { EmployeesList } from "./EmployeesList";
import { EmployeeBioForm } from "./EmployeeBioForm";

export function EmployeesAdmin() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/employees/list" replace />} />
      <Route path="/add" element={<EmployeeBioForm />} />
      <Route path="/application" element={<EmployeesAdd />} />
      <Route path="/list" element={<EmployeesList />} />
    </Routes>
  );
}
