import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    let firstLoad = sessionStorage.getItem("scroll_init");
    if (firstLoad) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      sessionStorage.setItem("scroll_init", "true");
    }
  }, [pathname]);

  return null;
}
