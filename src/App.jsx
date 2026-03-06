import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Components/Layout/Layout";
import HomePage from "./Pages/HomePage";
import "./app.css";
import ApplicationsPage from "./Pages/ApplicationsPage";
import SettingPage from "./Pages/SettingPage";
import PackagePage from "./Pages/PackagePage";
import AnalysPage from "./Pages/AnalysPage";
import LoginPage from "./Pages/LoginPage"; // İçində LoginMain olan fayl

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LAYOUT-SUZ SƏHİFƏLƏR (Məsələn, Login tam ekran görünməlidir) */}
        <Route path="/login" element={<LoginPage />} />

        {/* LAYOUT-LU SƏHİFƏLƏR (Dashboard, Sidebar və Navbar olacaq) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="settings" element={<SettingPage />} />
          <Route path="packages" element={<PackagePage />} />
          <Route path="analys" element={<AnalysPage />} />
        </Route>

        {/* Yanlış link yazıldıqda avtomatik Login səhifəsinə və ya istədiyiniz yerə atsın */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
