import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createComponentData,
  readComponentData,
} from "../../../../../../services/configService.js";
import FlightDetailsView from "../view/FlightDetails.view.jsx";

const normalizeContract = (response) => {
  const component = response?.componentData || response?.component;
  return {
    labels: component?.elements?.labels || {},
    urls: component?.elements?.urls || {},
    options: component?.dataScope?.options || {},
    widgets: component?.structure?.widgets || [],
  };
};

const passengerRows = (offer) =>
  Object.entries(offer?.requirements?.passengerCounts || {}).flatMap(([type, count]) =>
    Array.from({ length: count }, () => ({
      type,
      title: "",
      firstName: "",
      lastName: "",
      gender: "",
      dateOfBirth: "",
      nationality: "IN",
      passport: { number: "", expiryDate: "", issuingCountry: "", nationality: "" },
    })),
  );

export default function FlightDetailsContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const offerId = decodeURIComponent(location.pathname.split("/").filter(Boolean).at(-1) || "");
  const bookingDetail = location.pathname.includes("/flights/bookings/");
  const searchId = new URLSearchParams(location.search).get("searchId") || "";
  const listedFareId = new URLSearchParams(location.search).get("fareId") || "";
  const [state, setState] = useState({
    loading: true,
    error: "",
    contract: null,
    offer: null,
    seatMap: null,
    booking: null,
  });
  const [step, setStep] = useState(0);
  const [fareId, setFareId] = useState("");
  const [passengers, setPassengers] = useState([]);
  const [seats, setSeats] = useState([]);
  const [revalidation, setRevalidation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    let loadedContract = null;
    setState((current) => ({ ...current, loading: true, error: "" }));
    const run = async () => {
      const contract = normalizeContract(await readComponentData("/trehub/flight-journey.json"));
      loadedContract = contract;
      if (!active) return;
      setState((current) => ({ ...current, contract }));
      if (bookingDetail) {
        const bookingPath = (contract.urls.booking || "/flights/bookings/{bookingId}").replace(
          "{bookingId}",
          encodeURIComponent(offerId),
        );
        const bookingResponse = await readComponentData(bookingPath);
        if (!active) return;
        setStep(4);
        setState({
          loading: false,
          error: "",
          contract,
          offer: null,
          seatMap: null,
          booking: bookingResponse.data,
        });
        return;
      }
      const offerPath = (contract.urls.offer || "/flights/search/{searchId}/offers/{offerId}")
        .replace("{searchId}", encodeURIComponent(searchId))
        .replace("{offerId}", encodeURIComponent(offerId));
      const response = await readComponentData(offerPath);
      if (!active) return;
      setFareId(response.data.fares?.find((fare) => fare.fareId === listedFareId && fare.selectable)?.fareId
        || response.data.fares?.find((fare) => fare.selectable)?.fareId || "");
      setPassengers(passengerRows(response.data));
      setState({
        loading: false,
        error: "",
        contract,
        offer: response.data,
        seatMap: null,
        booking: null,
      });
    };
    run().catch(
      (error) =>
        active &&
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message,
          contract: loadedContract || current.contract,
        })),
    );
    return () => {
      active = false;
    };
  }, [bookingDetail, listedFareId, offerId, reloadKey, searchId]);

  const loadSeatsAndContinue = async () => {
    setSaving(true);
    setState((current) => ({ ...current, error: "" }));
    try {
      const path = (state.contract.urls.seatMap || "/flights/offers/{offerId}/seat-map").replace(
        "{offerId}",
        encodeURIComponent(offerId),
      );
      const response = await readComponentData(path);
      setState((current) => ({ ...current, seatMap: response.data }));
      setStep(2);
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setSaving(false);
    }
  };

  const revalidate = async () => {
    setSaving(true);
    setState((current) => ({ ...current, error: "" }));
    try {
      const response = await createComponentData(
        state.contract.urls.revalidate || "/flights/revalidate",
        { searchId, offerId, fareId, seats },
      );
      setRevalidation(response.data);
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setSaving(false);
    }
  };

  const createBooking = async () => {
    setSaving(true);
    setState((current) => ({ ...current, error: "" }));
    try {
      const response = await createComponentData(
        state.contract.urls.bookings || "/flights/bookings",
        {
          searchId,
          offerId,
          fareId,
          passengers,
          seats,
          extras: [],
          acceptPriceChange: revalidation?.status === "PRICE_CHANGED",
        },
      );
      setState((current) => ({ ...current, booking: response.data }));
      setStep(4);
    } catch (error) {
      if (error.code === "PRICE_CHANGED")
        setRevalidation({ status: "PRICE_CHANGED", ...error.details });
      else setState((current) => ({ ...current, error: error.message }));
    } finally {
      setSaving(false);
    }
  };

  const createEnquiry = async () => {
    setSaving(true);
    setState((current) => ({ ...current, error: "" }));
    try {
      const response = await createComponentData(
        state.contract.urls.enquiries || "/flights/enquiries",
        {
          searchId,
          offerId,
          fareId,
          expectedTotal: state.offer.fares.find((fare) => fare.fareId === fareId)?.pricing?.total,
        },
      );
      setEnquiryModalOpen(false);
      navigate(response.data.targetPath);
    } catch (error) {
      if (error.code === "PRICE_CHANGED" && error.details?.currentPrice) {
        setEnquiryModalOpen(false);
        setState((current) => {
          const updateFare = (fare) =>
            fare.fareId === fareId ? { ...fare, pricing: error.details.currentPrice } : fare;
          return {
            ...current,
            offer: {
              ...current.offer,
              fares: current.offer.fares.map(updateFare),
              details: {
                ...current.offer.details,
                fares: current.offer.details.fares.map(updateFare),
              },
            },
          };
        });
      }
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setSaving(false);
    }
  };

  const toggleSeat = (seat) =>
    setSeats((current) => {
      const selected = current.some(
        (item) => item.segmentId === seat.segmentId && item.seatNumber === seat.seatNumber,
      );
      if (selected)
        return current.filter(
          (item) => item.segmentId !== seat.segmentId || item.seatNumber !== seat.seatNumber,
        );
      const passengerCount = passengers.length;
      if (current.filter((item) => item.segmentId === seat.segmentId).length >= passengerCount)
        return current;
      return [...current, seat];
    });

  return (
    <FlightDetailsView
      {...state}
      step={step}
      fareId={fareId}
      passengers={passengers}
      seats={seats}
      revalidation={revalidation}
      saving={saving}
      enquiryModalOpen={enquiryModalOpen}
      onFareChange={(value) => {
        setFareId(value);
        setRevalidation(null);
      }}
      onPassengerChange={(index, field, value) =>
        setPassengers((current) =>
          current.map((passenger, row) =>
            row === index
              ? field.startsWith("passport.")
                ? {
                    ...passenger,
                    passport: { ...passenger.passport, [field.split(".")[1]]: value },
                  }
                : { ...passenger, [field]: value }
              : passenger,
          ),
        )
      }
      onSeatToggle={toggleSeat}
      onBack={() => setStep((current) => Math.max(0, current - 1))}
      onContinue={() =>
        step === 0
          ? setEnquiryModalOpen(true)
          : step === 1
            ? loadSeatsAndContinue()
            : step === 2
              ? setStep(3)
              : undefined
      }
      onCloseEnquiryModal={() => !saving && setEnquiryModalOpen(false)}
      onCreateEnquiry={createEnquiry}
      onRevalidate={revalidate}
      onBook={createBooking}
      onRetryLoad={() => setReloadKey((current) => current + 1)}
      onBackToSearch={() => navigate(location.state?.returnTo || "/trehub/flights")}
    />
  );
}
