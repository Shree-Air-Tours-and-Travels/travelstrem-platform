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
  const hotelId = location.pathname.split("/").filter(Boolean)[2];
  const searchId = new URLSearchParams(location.search).get("searchId") || "";
  const [contract, setContract] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [expandedRoomId, setExpandedRoomId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const request = useRef(0);

  useEffect(() => {
    const token = ++request.current;
    setData(null);
    setSelectedRoom(null);
    setExpandedRoomId(null);
    setError(null);
    setLoading(true);
    (async () => {
      const page = await readComponentData("/hotels/page.json");
      const next = page.componentData || page.component;
      if (token !== request.current) return;
      setContract(next);
      const response = await readComponentData(
        interpolate(next.elements.urls.details, { searchId, hotelId }),
      );
      if (token === request.current) setData(response.data);
    })()
      .catch((failure) => token === request.current && setError(failure))
      .finally(() => token === request.current && setLoading(false));
    return () => {
      request.current += 1;
    };
  }, [hotelId, reload, searchId]);

  const createEnquiry = async () => {
    if (saving || !selectedRoom) return;
    setSaving(true);
    setError(null);
    try {
      const response = await createComponentData(contract.elements.urls.enquiries, {
        searchId: data.searchId,
        hotelId,
        roomId: selectedRoom.id,
        expectedTotal: selectedRoom.totalMinor,
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
      error={error}
      loading={loading}
      saving={saving}
      selectedRoom={selectedRoom}
      expandedRoomId={expandedRoomId}
      confirmOpen={confirmOpen}
      onSelectRoom={setSelectedRoom}
      onToggleRoom={(roomId) =>
        setExpandedRoomId((current) => (current === roomId ? null : roomId))
      }
      onBack={() => navigate(location.state?.returnTo || data?.returnTo || "/trehub/hotels")}
      onContinue={() => setConfirmOpen(true)}
      onCloseConfirm={() => !saving && setConfirmOpen(false)}
      onConfirm={createEnquiry}
      onRetry={() => setReload((current) => current + 1)}
    />
  );
}
