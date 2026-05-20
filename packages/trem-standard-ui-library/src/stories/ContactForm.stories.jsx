import React, { useState, useCallback } from "react";
import { ContactForm } from "@packages/trem-ui";
import { contactFields } from "./sampleData";

export default {
  title: "Trem UI/Forms/ContactForm",
  component: ContactForm,
  tags: ["autodocs"],
  argTypes: {
    submitText: { control: "text" },
    submitting: { control: "boolean" },
  },
  args: {
    fieldsMeta: contactFields,
    submitText: "Send Request",
    submitting: false,
  },
};

export const Playground = {
  render: (args) => {
    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});
    const onChange = useCallback((name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }, []);
    const onSubmit = useCallback(() => {}, []);
    const onCancel = useCallback(() => {
      setValues({});
      setErrors({});
    }, []);
    return (
      <div className="trem-storybook-panel" style={{ maxWidth: 480 }}>
        <ContactForm
          fieldsMeta={args.fieldsMeta}
          formValues={values}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
          submitting={args.submitting}
          submitText={args.submitText}
          errors={errors}
        />
      </div>
    );
  },
};

export const Default = {
  name: "Default Form",
  render: () => {
    const [values, setValues] = useState({});
    const onChange = useCallback((name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
    }, []);
    return (
      <div className="trem-storybook-panel" style={{ maxWidth: 480 }}>
        <ContactForm
          fieldsMeta={contactFields}
          formValues={values}
          onChange={onChange}
          onSubmit={() => {}}
          onCancel={() => setValues({})}
          submitText="Send Request"
        />
      </div>
    );
  },
};

export const WithErrors = {
  name: "With Validation Errors",
  render: () => {
    const [values, setValues] = useState({ name: "", email: "invalid", phone: "", message: "" });
    const errors = {
      name: "Full name is required",
      email: "Please enter a valid email address",
      message: "Message cannot be empty",
    };
    return (
      <div className="trem-storybook-panel" style={{ maxWidth: 480 }}>
        <ContactForm
          fieldsMeta={contactFields}
          formValues={values}
          onChange={() => {}}
          onSubmit={() => {}}
          onCancel={() => {}}
          errors={errors}
          submitText="Send Request"
        />
      </div>
    );
  },
};

export const Submitting = {
  name: "Submitting State",
  render: () => {
    const [values, setValues] = useState({
      name: "Akshat",
      email: "akshat@example.com",
      phone: "+91 9876543210",
      message: "I am interested in the Himalayan Escape tour.",
    });
    return (
      <div className="trem-storybook-panel" style={{ maxWidth: 480 }}>
        <ContactForm
          fieldsMeta={contactFields}
          formValues={values}
          onChange={() => {}}
          onSubmit={() => {}}
          onCancel={() => {}}
          submitting
          submitText="Send Request"
        />
      </div>
    );
  },
};

export const Minimal = {
  name: "Minimal Fields",
  render: () => {
    const [values, setValues] = useState({});
    const minimalFields = [
      { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
      { name: "message", label: "Message", type: "textarea", placeholder: "Your message..." },
    ];
    return (
      <div className="trem-storybook-panel" style={{ maxWidth: 480 }}>
        <ContactForm
          fieldsMeta={minimalFields}
          formValues={values}
          onChange={(name, value) => setValues((prev) => ({ ...prev, [name]: value }))}
          onSubmit={() => {}}
          onCancel={() => setValues({})}
        />
      </div>
    );
  },
};
