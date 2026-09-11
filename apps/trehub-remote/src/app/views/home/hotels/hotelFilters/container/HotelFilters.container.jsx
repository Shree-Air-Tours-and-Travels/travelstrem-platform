import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createComponentData,
  readComponentData,
} from "../../../../../../services/configService.js";
import { interpolate } from "../../hotel.utils.js";
import HotelFiltersView from "../view/HotelFilters.view.jsx";

export default function HotelFiltersContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [filters, setFilters] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [mobilePanel, setMobilePanel] = useState(null);
  const request = useRef(0);

  useEffect(() => {
    const token = ++request.current;
    const query = Object.fromEntries(new URLSearchParams(location.search));
    setValues(query);
    setData(null);
    setError(null);
    setLoading(true);
    (async () => {
      const page = await readComponentData("/hotels/page.json");
      const next = page.componentData || page.component;
      if (token !== request.current) return;
      setContract(next);
      setFilters(
        Object.fromEntries(
          next.dataScope.options.filterForm.sections
            .flatMap((section) => section.fields)
            .map((field) => [field.name, query[field.name] || ""]),
        ),
      );
      const response = query.destination
        ? await createComponentData(next.elements.urls.search, query)
        : null;
      if (token === request.current) setData(response?.data || null);
    })()
      .catch((failure) => token === request.current && setError(failure))
      .finally(() => token === request.current && setLoading(false));
    return () => {
      request.current += 1;
    };
  }, [location.search, reload]);

  const search = ({ values: searchValues, choice, resultsPath }) => {
    setMobilePanel(null);
    const query = new URLSearchParams();
    Object.entries({ ...searchValues, choice }).forEach(([key, value]) => {
      if (value !== "" && value != null) query.set(key, String(value));
    });
    const path = `${resultsPath}?${query}`;
    if (`${location.pathname}${location.search}` === path) setReload((current) => current + 1);
    else navigate(path);
  };

  const applyFilters = async (nextFilters) => {
    const token = ++request.current;
    setFilters(nextFilters);
    setLoading(true);
    setError(null);
    try {
      const response = await readComponentData(
        interpolate(contract.elements.urls.results, { searchId: data.searchId }),
        nextFilters,
      );
      if (token === request.current) setData(response.data);
    } catch (failure) {
      if (token === request.current) setError(failure);
    } finally {
      if (token === request.current) setLoading(false);
    }
  };

  return (
    <HotelFiltersView
      contract={contract}
      data={data}
      values={values}
      filters={filters}
      error={error}
      loading={loading}
      mobilePanel={mobilePanel}
      onSearch={search}
      onFilterChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
      onApplyFilters={(nextFilters) => applyFilters({ ...nextFilters, page: 1 })}
      onResetFilters={() => applyFilters({ page: 1 })}
      onPageChange={(page) => applyFilters({ ...filters, page })}
      onOpenMobilePanel={setMobilePanel}
      onRetry={() => setReload((current) => current + 1)}
      onViewHotel={(hotel) =>
        navigate(hotel.href, {
          state: {
            returnTo: `${location.pathname}?${new URLSearchParams({ ...values, ...filters })}`,
          },
        })
      }
    />
  );
}
