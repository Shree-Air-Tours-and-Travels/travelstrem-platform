// // src/components/forms/FormRenderer.jsx
// import React, { useState } from "react";
// import get from "lodash/get";
// import set from "lodash/set";
// import cloneDeep from "lodash/cloneDeep";

// import { fetchData } from "@packages/trem-utils";
// import { Button } from "@packages/trem-ui";

// const FormRenderer = ({ structure = {}, state = {}, actions = {}, onActionResult }) => {
//   // state.data can be a single object or object with `tours` array
//   const initial = cloneDeep(get(state, "data", state) || {});
//   const [formState, setFormState] = useState(initial);
//   const [loading, setLoading] = useState(false);
//   const fields = get(structure, "fields", []);

//   const onChange = (path, value) => {
//     const next = cloneDeep(formState);
//     set(next, path, value);
//     setFormState(next);
//   };

//   const handleSubmit = async (actionName = "save") => {
//     const act = get(actions, actionName, {});
//     // action config should include method/url or type
//     const url = get(act, "url", "/api/tours"); // default
//     const method = (get(act, "method") || (actionName === "delete" ? "DELETE" : "POST")).toUpperCase();
//     try {
//       setLoading(true);
//       const payload = formState;
//       // adapt to your backend shape — here I use fetch
//       const response = await fetchData(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(payload),
//       });
//       onActionResult && onActionResult({ actionName, response });
//     } catch (err) {
//       console.error("Form action failed", err);
//       onActionResult && onActionResult({ actionName, error: err });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderField = (field, parentPath = "") => {
//     const name = field.name;
//     const path = parentPath ? `${parentPath}.${name}` : name;
//     const value = get(formState, path);
//     const readOnly = !!field.readonly;

//     if (field.type === "text") {
//       return (
//         <div className="form-row" key={path}>
//           <label>{field.label}</label>
//           <input type="text" value={value || ""} readOnly={readOnly} onChange={e => onChange(path, e.target.value)} />
//         </div>
//       );
//     }

//     if (field.type === "textarea") {
//       return (
//         <div className="form-row" key={path}>
//           <label>{field.label}</label>
//           <textarea value={value || ""} readOnly={readOnly} onChange={e => onChange(path, e.target.value)} />
//         </div>
//       );
//     }

//     if (field.type === "number") {
//       return (
//         <div className="form-row" key={path}>
//           <label>{field.label}</label>
//           <input type="number" value={value == null ? "" : value} readOnly={readOnly} min={field.min} max={field.max} onChange={e => onChange(path, e.target.value === "" ? null : Number(e.target.value))} />
//         </div>
//       );
//     }

//     if (field.type === "checkbox") {
//       return (
//         <div className="form-row" key={path}>
//           <label>
//             <input type="checkbox" checked={!!value} disabled={readOnly} onChange={e => onChange(path, e.target.checked)} /> {field.label}
//           </label>
//         </div>
//       );
//     }

//     if (field.type === "datetime") {
//       return (
//         <div className="form-row" key={path}>
//           <label>{field.label}</label>
//           <input type="datetime-local" value={value ? new Date(value).toISOString().slice(0,16) : ""} readOnly={readOnly} onChange={e => onChange(path, e.target.value)} />
//         </div>
//       );
//     }

//     if (field.type === "array" && field.itemType) {
//       const arr = Array.isArray(value) ? value : [];
//       return (
//         <div className="form-row" key={path}>
//           <label>{field.label}</label>
//           {arr.map((item, i) => (
//             <div key={`${path}.${i}`} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
//               <input type={field.itemType} value={item} onChange={(e) => {
//                 const next = cloneDeep(formState);
//                 set(next, `${path}[${i}]`, e.target.value);
//                 setFormState(next);
//               }} />
//               <Button text="Delete" variant="ghost" onClick={() => {
//                 const next = cloneDeep(formState);
//                 const target = get(next, path) || [];
//                 target.splice(i, 1);
//                 set(next, path, target);
//                 setFormState(next);
//               }} />
//             </div>
//           ))}
//           <Button text={`Add ${field.itemType}`} onClick={() => {
//             const next = cloneDeep(formState);
//             const arr = get(next, path) || [];
//             arr.push("");
//             set(next, path, arr);
//             setFormState(next);
//           }} />
//         </div>
//       );
//     }

//     // nested "form" type for arrays of objects (like tours)
//     if (field.type === "form" && field.itemStructure) {
//       const arr = get(formState, field.name) || [];
//       const itemFields = get(field, "itemStructure.fields", []);
//       return (
//         <div className="form-nested" key={path}>
//           <h4>{field.label}</h4>
//           {arr.map((entry, idx) => (
//             <div key={`${field.name}.${idx}`} style={{ border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
//               {itemFields.map(f => renderField(f, `${field.name}[${idx}]`))}
//               <Button text="Remove" variant="ghost" onClick={() => {
//                 const next = cloneDeep(formState);
//                 const a = get(next, field.name) || [];
//                 a.splice(idx, 1);
//                 set(next, field.name, a);
//                 setFormState(next);
//               }} />
//             </div>
//           ))}
//           <Button text={`Add ${field.label}`} onClick={() => {
//             const next = cloneDeep(formState);
//             const a = get(next, field.name) || [];
//             a.push({}); // empty object — optional initialization based on itemStructure
//             set(next, field.name, a);
//             setFormState(next);
//           }} />
//         </div>
//       );
//     }

//     // fallback: render read-only JSON
//     return (
//       <div className="form-row" key={path}>
//         <label>{field.label || name}</label>
//         <pre>{JSON.stringify(value, null, 2)}</pre>
//       </div>
//     );
//   };

//   return (
//     <div className="dynamic-form">
//       <form onSubmit={(e) => { e.preventDefault(); handleSubmit("save"); }}>
//         {fields.map(field => renderField(field))}
//         <div className="form-actions" style={{ marginTop: 12 }}>
//           <Button text={get(actions, "save.label", "Save")} variant="solid" onClick={() => handleSubmit("save")} />
//           {get(actions, "delete") && <Button text={get(actions, "delete.label", "Delete")} variant="outline" onClick={() => handleSubmit("delete")} />}
//           {get(actions, "back") && <Button text={get(actions, "back.label", "Back")} variant="ghost" onClick={() => handleSubmit("back")} />}
//         </div>
//       </form>
//       {loading && <div className="loader">Processing...</div>}
//     </div>
//   );
// };

// export default FormRenderer;
