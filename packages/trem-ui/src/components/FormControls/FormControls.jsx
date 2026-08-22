import React, { Children, forwardRef } from "react";
import InputField from "../InputField/InputField.jsx";
import SingleSelect from "../SingleSelect/SingleSelect.jsx";
import TextArea from "../TextArea/TextArea.jsx";

const asInputEvent = (value, checked = false) => ({
  target: { value, checked },
  currentTarget: { value, checked },
});

/**
 * DOM-compatible adapters for incremental adoption of trem-ui form controls.
 * They intentionally preserve native onChange(event) semantics so existing
 * business forms can move to trem-ui without duplicating field components.
 */
export const FormInput = forwardRef(function FormInput(
  { type = "text", onChange, className = "", ...props },
  ref,
) {
  if (["checkbox", "radio", "file", "hidden"].includes(type)) {
    return <input ref={ref} type={type} onChange={onChange} className={className} {...props} />;
  }
  return (
    <InputField
      variant={type}
      onChange={(value) => onChange?.(asInputEvent(value))}
      className={className}
      {...props}
    />
  );
});

const childOptions = (children) => Children.toArray(children)
  .filter((child) => React.isValidElement(child))
  .map((child) => ({
    value: child.props.value ?? "",
    label: child.props.children,
    disabled: child.props.disabled,
  }));

export function FormSelect({ children, options, onChange, ...props }) {
  const resolvedOptions = options || childOptions(children);
  return (
    <SingleSelect
      options={resolvedOptions}
      onChange={(value) => onChange?.(asInputEvent(value))}
      {...props}
    />
  );
}

export function FormTextArea({ onChange, ...props }) {
  return <TextArea onChange={(value) => onChange?.(asInputEvent(value))} {...props} />;
}

