import React from "react";
import "./SearchBarCard.styles.scss";
import Button from "../Button/Button.jsx";

const SearchBarCard = ({ fields, values, onChange, onSearch, searchIcon }) => {
  return (
    <div className="ui-search-bar-card">
      {fields.map((field) => (
        <div key={field.id} className="ui-search-bar-card__field">
          <label htmlFor={field.id} className="ui-search-bar-card__label">
            {field.label}
          </label>
          <input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            className="ui-search-bar-card__input"
            value={values[field.id] || ""}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        </div>
      ))}
      <Button
        className="ui-search-bar-card__button"
        onClick={onSearch}
        text={searchIcon}
        variant="outline"
        size="extra-small"
      />
    </div>
  );
};

export default SearchBarCard;
