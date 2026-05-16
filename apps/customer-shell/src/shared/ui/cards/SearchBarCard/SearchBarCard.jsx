import React from "react";
import PropTypes from "prop-types";
import "./searchBarCard.scss";
import { Button } from "@packages/trem-ui";

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
       text= {searchIcon}
       variant="outline"
         size="extra-small"
      />
    </div>
  );
};

SearchBarCard.propTypes = {
  fields: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  searchIcon: PropTypes.element.isRequired,
};

export default SearchBarCard;
