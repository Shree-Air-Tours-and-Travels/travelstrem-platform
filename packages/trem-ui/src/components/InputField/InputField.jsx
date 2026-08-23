import React, { useState, useCallback } from "react";
import Dropdown from "../Dropdown/Dropdown.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import Button from "../Button/Button.jsx";
import "./InputField.styles.scss";

const DEFAULT_COUNTRY_CODES = [
  { code: "+93", label: "AF" },
  { code: "+355", label: "AL" },
  { code: "+213", label: "DZ" },
  { code: "+376", label: "AD" },
  { code: "+244", label: "AO" },
  { code: "+54", label: "AR" },
  { code: "+374", label: "AM" },
  { code: "+61", label: "AU" },
  { code: "+43", label: "AT" },
  { code: "+994", label: "AZ" },
  { code: "+973", label: "BH" },
  { code: "+880", label: "BD" },
  { code: "+375", label: "BY" },
  { code: "+32", label: "BE" },
  { code: "+501", label: "BZ" },
  { code: "+229", label: "BJ" },
  { code: "+975", label: "BT" },
  { code: "+591", label: "BO" },
  { code: "+387", label: "BA" },
  { code: "+267", label: "BW" },
  { code: "+55", label: "BR" },
  { code: "+673", label: "BN" },
  { code: "+359", label: "BG" },
  { code: "+226", label: "BF" },
  { code: "+257", label: "BI" },
  { code: "+855", label: "KH" },
  { code: "+237", label: "CM" },
  { code: "+1", label: "CA" },
  { code: "+238", label: "CV" },
  { code: "+236", label: "CF" },
  { code: "+235", label: "TD" },
  { code: "+56", label: "CL" },
  { code: "+86", label: "CN" },
  { code: "+57", label: "CO" },
  { code: "+269", label: "KM" },
  { code: "+242", label: "CG" },
  { code: "+506", label: "CR" },
  { code: "+385", label: "HR" },
  { code: "+53", label: "CU" },
  { code: "+357", label: "CY" },
  { code: "+420", label: "CZ" },
  { code: "+45", label: "DK" },
  { code: "+253", label: "DJ" },
  { code: "+593", label: "EC" },
  { code: "+20", label: "EG" },
  { code: "+503", label: "SV" },
  { code: "+240", label: "GQ" },
  { code: "+372", label: "EE" },
  { code: "+251", label: "ET" },
  { code: "+679", label: "FJ" },
  { code: "+358", label: "FI" },
  { code: "+33", label: "FR" },
  { code: "+241", label: "GA" },
  { code: "+220", label: "GM" },
  { code: "+995", label: "GE" },
  { code: "+49", label: "DE" },
  { code: "+233", label: "GH" },
  { code: "+30", label: "GR" },
  { code: "+502", label: "GT" },
  { code: "+224", label: "GN" },
  { code: "+245", label: "GW" },
  { code: "+592", label: "GY" },
  { code: "+509", label: "HT" },
  { code: "+504", label: "HN" },
  { code: "+852", label: "HK" },
  { code: "+36", label: "HU" },
  { code: "+354", label: "IS" },
  { code: "+91", label: "IN" },
  { code: "+62", label: "ID" },
  { code: "+98", label: "IR" },
  { code: "+964", label: "IQ" },
  { code: "+353", label: "IE" },
  { code: "+972", label: "IL" },
  { code: "+39", label: "IT" },
  { code: "+225", label: "CI" },
  { code: "+81", label: "JP" },
  { code: "+962", label: "JO" },
  { code: "+7", label: "KZ" },
  { code: "+254", label: "KE" },
  { code: "+965", label: "KW" },
  { code: "+996", label: "KG" },
  { code: "+856", label: "LA" },
  { code: "+371", label: "LV" },
  { code: "+961", label: "LB" },
  { code: "+266", label: "LS" },
  { code: "+231", label: "LR" },
  { code: "+218", label: "LY" },
  { code: "+423", label: "LI" },
  { code: "+370", label: "LT" },
  { code: "+352", label: "LU" },
  { code: "+853", label: "MO" },
  { code: "+389", label: "MK" },
  { code: "+261", label: "MG" },
  { code: "+265", label: "MW" },
  { code: "+60", label: "MY" },
  { code: "+960", label: "MV" },
  { code: "+223", label: "ML" },
  { code: "+356", label: "MT" },
  { code: "+222", label: "MR" },
  { code: "+230", label: "MU" },
  { code: "+52", label: "MX" },
  { code: "+691", label: "FM" },
  { code: "+373", label: "MD" },
  { code: "+377", label: "MC" },
  { code: "+976", label: "MN" },
  { code: "+382", label: "ME" },
  { code: "+212", label: "MA" },
  { code: "+258", label: "MZ" },
  { code: "+95", label: "MM" },
  { code: "+264", label: "NA" },
  { code: "+977", label: "NP" },
  { code: "+31", label: "NL" },
  { code: "+64", label: "NZ" },
  { code: "+505", label: "NI" },
  { code: "+227", label: "NE" },
  { code: "+234", label: "NG" },
  { code: "+850", label: "KP" },
  { code: "+47", label: "NO" },
  { code: "+968", label: "OM" },
  { code: "+92", label: "PK" },
  { code: "+680", label: "PW" },
  { code: "+970", label: "PS" },
  { code: "+507", label: "PA" },
  { code: "+675", label: "PG" },
  { code: "+595", label: "PY" },
  { code: "+51", label: "PE" },
  { code: "+63", label: "PH" },
  { code: "+48", label: "PL" },
  { code: "+351", label: "PT" },
  { code: "+974", label: "QA" },
  { code: "+40", label: "RO" },
  { code: "+7", label: "RU" },
  { code: "+250", label: "RW" },
  { code: "+685", label: "WS" },
  { code: "+378", label: "SM" },
  { code: "+966", label: "SA" },
  { code: "+221", label: "SN" },
  { code: "+381", label: "RS" },
  { code: "+248", label: "SC" },
  { code: "+232", label: "SL" },
  { code: "+65", label: "SG" },
  { code: "+421", label: "SK" },
  { code: "+386", label: "SI" },
  { code: "+677", label: "SB" },
  { code: "+252", label: "SO" },
  { code: "+27", label: "ZA" },
  { code: "+82", label: "KR" },
  { code: "+211", label: "SS" },
  { code: "+34", label: "ES" },
  { code: "+94", label: "LK" },
  { code: "+249", label: "SD" },
  { code: "+597", label: "SR" },
  { code: "+268", label: "SZ" },
  { code: "+46", label: "SE" },
  { code: "+41", label: "CH" },
  { code: "+963", label: "SY" },
  { code: "+886", label: "TW" },
  { code: "+992", label: "TJ" },
  { code: "+255", label: "TZ" },
  { code: "+66", label: "TH" },
  { code: "+670", label: "TL" },
  { code: "+228", label: "TG" },
  { code: "+676", label: "TO" },
  { code: "+216", label: "TN" },
  { code: "+90", label: "TR" },
  { code: "+993", label: "TM" },
  { code: "+688", label: "TV" },
  { code: "+256", label: "UG" },
  { code: "+380", label: "UA" },
  { code: "+971", label: "AE" },
  { code: "+44", label: "GB" },
  { code: "+1", label: "US" },
  { code: "+598", label: "UY" },
  { code: "+998", label: "UZ" },
  { code: "+678", label: "VU" },
  { code: "+379", label: "VA" },
  { code: "+58", label: "VE" },
  { code: "+84", label: "VN" },
  { code: "+967", label: "YE" },
  { code: "+260", label: "ZM" },
  { code: "+263", label: "ZW" },
];

export default function InputField({
  variant = "text",
  value = "",
  onChange,
  placeholder,
  label,
  required,
  error,
  disabled,
  className = "",
  maxLength,
  min,
  max,
  step,
  inputMode,
  ariaLabel,
  countryCode: initialCountryCode = "+91",
  onCountryCodeChange,
  ...rest
}) {
  const isTel = variant === "tel";
  const isMonthYear = variant === "monthYear";
  const [cc, setCc] = useState(initialCountryCode);

  const handleChange = useCallback(
    (e) => {
      let val = e.target.value;
      if (isTel) {
        val = val.replace(/\D/g, "").slice(0, maxLength || 10);
      }
      if (isMonthYear) {
        val = val.replace(/\D/g, "").slice(0, 4);
        if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
      }
      onChange?.(val);
    },
    [isTel, isMonthYear, maxLength, onChange],
  );

  const handleCountryCode = useCallback(
    (code) => {
      setCc(code);
      onCountryCodeChange?.(code);
    },
    [onCountryCodeChange],
  );

  const ccItems = DEFAULT_COUNTRY_CODES.map((c) => ({
    id: c.code,
    label: `${c.code} ${c.label}`,
    active: c.code === cc,
    onClick: () => handleCountryCode(c.code),
  }));

  return (
    <div
      className={`trem-input trem-input--${variant} ${label ? "trem-input--labelled" : ""} ${error ? "trem-input--error" : ""} ${className}`.trim()}
    >
      {label && (
        <span className="trem-input__label">
          {label}
          {required && <span className="trem-input__required"> *</span>}
        </span>
      )}
      <div className="trem-input__row">
        {isTel && (
          <Dropdown
            items={ccItems}
            variant="searchable"
            closeOnSelect
            align="left"
            portalWidth={280}
            menuClassName="trem-input__country-menu"
            searchPlaceholder="Search country code..."
            trigger={({ open }) => (
              <Button
                variant="text"
                primaryClassName="trem-input__cc-trigger"
                iconRight="chevronDown"
                text={cc}
                tabIndex={-1}
              />
            )}
          />
        )}
        <input
          className="trem-input__field"
          type={isTel ? "tel" : isMonthYear ? "text" : variant}
          inputMode={
            inputMode || (variant === "number" || isTel || isMonthYear ? "numeric" : undefined)
          }
          value={value}
          onChange={handleChange}
          placeholder={placeholder || (isMonthYear ? "MM/YY" : undefined)}
          disabled={disabled}
          maxLength={isTel ? maxLength || 10 : isMonthYear ? 5 : maxLength}
          autoComplete={isTel ? "tel" : variant === "email" ? "email" : "off"}
          min={min}
          max={max}
          step={step}
          aria-label={ariaLabel || label || placeholder}
          aria-invalid={Boolean(error)}
          {...rest}
        />
      </div>
    </div>
  );
}
