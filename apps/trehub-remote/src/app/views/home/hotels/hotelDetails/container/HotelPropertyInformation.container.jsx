import React, { useEffect, useRef, useState } from "react";
import { readComponentData } from "../../../../../../services/configService.js";
import HotelPropertyInformationView from "../view/HotelPropertyInformation.view.jsx";

export default function HotelPropertyInformationContainer({ url, labels, widgetProps }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const request = useRef(0);

  useEffect(() => {
    if (!url) return undefined;
    const token = ++request.current;
    setData(null);
    setError(null);
    readComponentData(url)
      .then((response) => token === request.current && setData(response.data))
      .catch((failure) => token === request.current && setError(failure));
    return () => { request.current += 1; };
  }, [url, reload]);

  return (
    <HotelPropertyInformationView
      data={data}
      error={error}
      labels={labels}
      widgetProps={widgetProps}
      onRetry={() => setReload((current) => current + 1)}
    />
  );
}
