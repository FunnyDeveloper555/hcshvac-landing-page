import { Routes, Route, Navigate } from "react-router-dom";
import { EmployeesAdd } from "./EmployeesAdd";
import { EmployeesList } from "./EmployeesList";

export function EmployeesAdmin() {
  return (
    <Routes>
      <Route path="add" element={<EmployeesAdd />} />
      <Route path="list" element={<EmployeesList />} />
      <Route path="/" element={<Navigate to="list" replace />} />
    </Routes>
  );
}
