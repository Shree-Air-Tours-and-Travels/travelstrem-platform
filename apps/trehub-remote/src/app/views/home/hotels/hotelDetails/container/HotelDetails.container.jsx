import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createComponentData,
  readComponentData,
} from "../../../../../../services/configService.js";
import { interpolate } from "../../hotel.utils.js";
import HotelDetailsView from "../view/HotelDetails.view.jsx";

export default function HotelDetailsContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const hotelId = decodeURIComponent(location.pathname.split("/").filter(Boolean)[2] || "");
  const searchId = new URLSearchParams(location.search).get("searchId") || "";
  const [contract, setContract] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roomIds, setRoomIds] = useState([]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [expandedRoomId, setExpandedRoomId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const request = useRef(0);
  const quoteRequest = useRef(0);

  useEffect(() => {
    const token = ++request.current;
    setData(null);
    setRoomIds([]);
    setActiveSlot(0);
    setQuote(null);
    setExpandedRoomId(null);
    setError(null);
    setLoading(true);
    setRoomsLoading(true);
    (async () => {
      const page = await readComponentData("/hotels/page.json");
      const next = page.componentData || page.component;
      if (token !== request.current) return;
      setContract(next);
      const widgetUrl = next.elements.urls.detailsWidget;
      let roomPayload = null;
      readComponentData(interpolate(widgetUrl, { searchId, hotelId, widget: "rooms" }))
        .then((response) => {
          if (token !== request.current) return;
          roomPayload = response.data;
          setData((current) => current ? { ...current, ...roomPayload } : current);
        })
        .catch((failure) => token === request.current && setError(failure))
        .finally(() => token === request.current && setRoomsLoading(false));
      const response = await readComponentData(interpolate(widgetUrl, { searchId, hotelId, widget: "overview" }));
      if (token === request.current) setData({ ...response.data, rooms: [], roomGroups: [], ...roomPayload });
    })()
      .catch((failure) => token === request.current && setError(failure))
      .finally(() => token === request.current && setLoading(false));
    return () => {
      request.current += 1;
    };
  }, [hotelId, reload, searchId]);

  useEffect(() => {
    const token = ++quoteRequest.current;
    setQuote(null);
    setQuoteError(null);
    if (!data || !contract || roomIds.filter(Boolean).length !== data.input.rooms) {
      setQuoteLoading(false);
      return;
    }
    setQuoteLoading(true);
    createComponentData(
      interpolate(contract.elements.urls.quote, { searchId, hotelId }),
      { roomIds },
    )
      .then((response) => token === quoteRequest.current && setQuote(response.data))
      .catch((failure) => token === quoteRequest.current && setQuoteError(failure))
      .finally(() => token === quoteRequest.current && setQuoteLoading(false));
    return () => { quoteRequest.current += 1; };
  }, [contract, data, hotelId, roomIds, searchId]);

  const selectRoom = (room) => {
    if (!data) return;
    setQuote(null);
    const next = Array.from({ length: data.input.rooms }, (_, index) => roomIds[index] || null);
    next[activeSlot] = room.id;
    setRoomIds(next);
    const nextEmptySlot = next.findIndex((id) => !id);
    if (nextEmptySlot !== -1) setActiveSlot(nextEmptySlot);
  };

  const createEnquiry = async () => {
    if (saving || !quote) return;
    setSaving(true);
    setError(null);
    try {
      const response = await createComponentData(contract.elements.urls.enquiries, {
        searchId: data.searchId,
        hotelId,
        roomIds,
        expectedTotal: quote.price.total,
      });
      setConfirmOpen(false);
      navigate(response.data.targetPath);
    } catch (failure) {
      setConfirmOpen(false);
      setError(failure);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HotelDetailsView
      contract={contract}
      data={data}
      propertyWidgetUrl={contract?.elements?.urls?.detailsWidget
        ? interpolate(contract.elements.urls.detailsWidget, { searchId, hotelId, widget: "property-information" })
        : ""}
      roomsLoading={roomsLoading}
      error={error}
      loading={loading}
      saving={saving}
      selectedRooms={Array.from({ length: data?.input?.rooms || 0 }, (_, index) =>
        data?.rooms?.find((room) => room.id === roomIds[index]) || null
      )}
      activeSlot={activeSlot}
      quote={quote}
      quoteLoading={quoteLoading}
      quoteError={quoteError}
      expandedRoomId={expandedRoomId}
      confirmOpen={confirmOpen}
      onSelectRoom={selectRoom}
      onChooseSlot={setActiveSlot}
      onToggleRoom={(roomId) =>
        setExpandedRoomId((current) => (current === roomId ? null : roomId))
      }
      onBack={() => navigate(location.state?.returnTo || data?.returnTo || "/trehub/hotels", {
        state: location.state?.returnCacheKey
          ? { returnCacheKey: location.state.returnCacheKey }
          : undefined,
      })}
      onContinue={() => quote && setConfirmOpen(true)}
      onCloseConfirm={() => !saving && setConfirmOpen(false)}
      onConfirm={createEnquiry}
      onRetry={() => setReload((current) => current + 1)}
    />
  );
}
