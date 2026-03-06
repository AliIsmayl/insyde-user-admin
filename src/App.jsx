import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Components/Layout/Layout";
import HomePage from "./Pages/HomePage";
import './app.css'
import ApplicationsPage from "./Pages/ApplicationsPage";
import SettingPage from "./Pages/SettingPage";
import PackagePage from "./Pages/PackagePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Əsas Layout şablonumuz */}
        <Route path="/" element={<Layout />}>
          {/* İSTİFADƏÇİ SİSTEMƏ GİRƏNDƏ AÇILACAQ İLK SƏHİFƏ (HomePage) */}
          <Route index element={<HomePage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="settings" element={<SettingPage />} />
          <Route path="packages" element={<PackagePage />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
