import React, { useState } from "react";
import "../../styles/components/searchBar.scss";
import SearchBarCard from "../cards/searchBarCard";

const searchData = {
  fields: [
    { id: "location", label: "Location", type: "text", placeholder: "Where to?" },
    { id: "distance", label: "Distance", type: "number", placeholder: "Distance (km)" },
    { id: "maxPeople", label: "Max People", type: "number", placeholder: "No. of People" },
  ],
  searchIcon: <div>🔍</div>, // You can replace this with an actual icon
};

const SearchBar = () => {
  const [searchValues, setSearchValues] = useState({ location: "", distance: "", maxPeople: "" });

  const handleChange = (fieldId, value) => {
    setSearchValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSearch = () => {
    if (!searchValues.location || !searchValues.distance || !searchValues.maxPeople) {
      alert("Please enter at least one search field!");
      return;
    }

    console.log("Searching for:", searchValues);

    // Reset fields after search
    setSearchValues({ location: "", distance: "", maxPeople: "" });
  };

  return (
    <div className="ui-search-bar">
      <SearchBarCard
        fields={searchData.fields}
        values={searchValues}
        onChange={handleChange}
        onSearch={handleSearch}
        searchIcon={searchData.searchIcon}
      />
    </div>
  );
};

export default SearchBar;
