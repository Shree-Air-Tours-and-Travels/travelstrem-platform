export const interpolate = (path, values) =>
  Object.entries(values).reduce(
    (url, [key, value]) => url.replace(`{${key}}`, encodeURIComponent(value)),
    path,
  );

export const resolveForm = (form, labels) =>
  form && {
    ...form,
    sections: form.sections.map((section) => ({
      ...section,
      title: labels[section.titleRef],
      fields: section.fields.map((field) => ({
        ...field,
        label: labels[field.labelRef],
        placeholder: labels[field.placeholderRef],
        options: field.options?.map((option) => ({
          ...option,
          label: labels[option.labelRef],
        })),
      })),
    })),
  };
