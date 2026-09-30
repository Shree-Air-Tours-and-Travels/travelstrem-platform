import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "../Button/Button.jsx";
import Dropdown from "../Dropdown/Dropdown.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./OccupancyPicker.styles.scss";

const normalize = (value = {}, limits = {}) => {
  const adults = Math.min(limits.maxAdults || 24, Math.max(1, Number(value.adults) || 1));
  const children = Math.min(limits.maxChildren || 10, Math.max(0, Number(value.children) || 0));
  const childAges = Array.from({ length: children }, (_, index) => {
    const age = Number(value.childAges?.[index]);
    return Number.isInteger(age) && age >= 0 && age <= 17 ? age : 0;
  });
  return {
    adults,
    children,
    childAges,
    rooms: Math.min(limits.maxRooms || 8, adults + children, Math.max(1, Number(value.rooms) || 1)),
    pets: Boolean(value.pets),
  };
};

function Counter({ label, value, min, max, onChange }) {
  return (
    <div className="trem-occupancy__counter">
      <span>{label}</span>
      <div>
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label}`}><Icon name="minus" size={18} /></button>
        <strong aria-live="polite">{value}</strong>
        <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label}`}><Icon name="plus" size={18} /></button>
      </div>
    </div>
  );
}

export default function OccupancyPicker({ value, onChange, labels = {}, disabled = false, maxAdults = 24, maxChildren = 10, maxRooms = 8 }) {
  const limits = { maxAdults, maxChildren, maxRooms };
  const occupancy = normalize(value, limits);
  const [open, setOpen] = useState(false);
  const update = (changes) => onChange?.(normalize({ ...occupancy, ...changes }, limits));

  const summary = `${occupancy.adults} ${occupancy.adults === 1 ? labels.adult || "adult" : labels.adults || "adults"}${occupancy.children ? `, ${occupancy.children} ${occupancy.children === 1 ? labels.child || "child" : labels.children || "children"}` : ""} · ${occupancy.rooms} ${occupancy.rooms === 1 ? labels.room || "room" : labels.rooms || "rooms"}`;

  return (
    <div className="trem-occupancy">
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
        hoverable={false}
        closeOnSelect={false}
        portalWidth={400}
        portalClassName="trem-occupancy__portal"
        menuClassName="trem-occupancy__menu"
        menuTitle={labels.title || "Guests and rooms"}
        trigger={<button type="button" className="trem-occupancy__trigger" disabled={disabled}>
          <Icon name="usersRound" size={19} />
          <span>{summary}</span>
          <Icon name="chevronDown" size={18} />
        </button>}
        items={[{ id: "occupancy", label: labels.title || "Guests and rooms" }]}
        renderItem={() => <div className="trem-occupancy__controls">
          <Counter label={labels.adults || "Adults"} value={occupancy.adults} min={1} max={maxAdults} onChange={(adults) => update({ adults })} />
          <Counter label={labels.children || "Children"} value={occupancy.children} min={0} max={maxChildren} onChange={(children) => update({ children })} />
          {occupancy.childAges.map((age, index) => (
            <label className="trem-occupancy__age" key={index}>
              <span>{(labels.childAge || "Child {count} age").replace("{count}", index + 1)}</span>
              <select value={age} onChange={(event) => update({ childAges: occupancy.childAges.map((current, ageIndex) => ageIndex === index ? Number(event.target.value) : current) })}>
                {Array.from({ length: 18 }, (_, optionAge) => <option value={optionAge} key={optionAge}>{optionAge} {optionAge === 1 ? labels.year || "year" : labels.years || "years"}</option>)}
              </select>
            </label>
          ))}
          {occupancy.children ? <p>{labels.childAgeHelp || "Child ages at check-out are needed for accurate room availability and prices."}</p> : null}
          <Counter label={labels.rooms || "Rooms"} value={occupancy.rooms} min={1} max={Math.min(maxRooms, occupancy.adults + occupancy.children)} onChange={(rooms) => update({ rooms })} />
          <label className="trem-occupancy__pets"><span>{labels.pets || "Travelling with pets?"}</span><input type="checkbox" checked={occupancy.pets} onChange={(event) => update({ pets: event.target.checked })} /></label>
        </div>}
        menuFooter={<div className="trem-occupancy__footer"><Button text={labels.done || "Done"} variant="outline" fullWidth onClick={() => setOpen(false)} /></div>}
      />
    </div>
  );
}

Counter.propTypes = { label: PropTypes.string, value: PropTypes.number, min: PropTypes.number, max: PropTypes.number, onChange: PropTypes.func };
OccupancyPicker.propTypes = { value: PropTypes.object, onChange: PropTypes.func, labels: PropTypes.object, disabled: PropTypes.bool, maxAdults: PropTypes.number, maxChildren: PropTypes.number, maxRooms: PropTypes.number };
