import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. window-u sıfırla
    window.scrollTo({ top: 0, behavior: "instant" });

    // 2. Ola biləcək bütün scroll-lanabilən containerları sıfırla
    const selectors = [
      "main",
      ".layout__main",
      ".layout__content",
      ".layout-content",
      ".main-content",
      ".page-content",
      ".content",
      "[data-scroll]",
    ];

    selectors.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollTop = 0;
    });

    // 3. overflow:auto / overflow:scroll olan bütün elementləri tap və sıfırla
    const allScrollable = document.querySelectorAll("*");
    allScrollable.forEach((el) => {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        el.scrollTop > 0
      ) {
        el.scrollTop = 0;
      }
    });
  }, [pathname]);

  return null;
}
