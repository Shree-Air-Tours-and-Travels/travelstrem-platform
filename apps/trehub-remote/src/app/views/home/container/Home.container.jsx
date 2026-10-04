import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readComponentData } from "../../../../services/configService.js";
import HomeView from "../view/Home.view.jsx";

const normalizePageModel = (response) => {
  const component = response?.componentData || response?.component;
  if (!component) return null;
  return {
    data: component.data || {},
    options: component.dataScope?.options || {},
    labels: component.elements?.labels || {},
    urls: component.elements?.urls || {},
    widgets: component.structure?.widgets || [],
  };
};

export default function HomeContainer() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, pageModel: null });

  useEffect(() => {
    let active = true;
    readComponentData("/trehub/home.json")
      .then((response) => {
        if (!active) return;
        setState({ loading: false, error: null, pageModel: normalizePageModel(response) });
      })
      .catch((error) => {
        if (!active) return;
        setState({ loading: false, error: error?.message || "trehub-home-failed", pageModel: null });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = ({ resultsPath, choice, values = {} }) => {
    if (!resultsPath) return;
    const params = new URLSearchParams();
    if (choice) params.set("choice", choice);
    Object.entries(values).forEach(([key, value]) => {
      if (value === "" || value == null) return;
      params.set(key, Array.isArray(value) ? value.join(",") : String(value));
    });
    navigate(`${resultsPath}${params.size ? `?${params.toString()}` : ""}`);
  };

  return <HomeView {...state} onSearch={handleSearch} />;
}
