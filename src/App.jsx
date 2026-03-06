import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Components/Layout/Layout";
import HomePage from "./Pages/HomePage";
import './app.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Əsas Layout şablonumuz */}
        <Route path="/" element={<Layout />}>
          {/* İSTİFADƏÇİ SİSTEMƏ GİRƏNDƏ AÇILACAQ İLK SƏHİFƏ (HomePage) */}
          <Route index element={<HomePage />} />

          {/* Gələcəkdə əlavə edəcəyiniz digər səhifələr */}
          {/* <Route path="store" element={<StorePage />} /> */}
          {/* <Route path="calendar" element={<CalendarPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
