import React, { useEffect, useState } from "react";
import { Button, ConfigurableForm, ErrorState, Preloader, StatusBadge } from "@packages/trem-ui";
import api from "../../services/apiClient";
import { useAdminPortalConfig } from "../../app/providers/AdminPortalProvider";
import "./InternalTeamPage.scss";
import "./CompanySettings.scss";
const unwrap = (response) => response.data.componentData.data;
const form = (fields) => ({
  layout: { columns: 2, columnsMobile: 1, expandable: false },
  sections: [{ id: "settings", fields }],
});
export default function CompanySettings({ platform = false }) {
  const endpoint = platform ? "/clients/platform-brand" : "/tenant-management";
  const { reload } = useAdminPortalConfig();
  const [company, setCompany] = useState(null);
  const [team, setTeam] = useState(null);
  const [branding, setBranding] = useState({});
  const [member, setMember] = useState({
    name: "",
    email: "",
    clientRole: "client_admin",
    productAccess: [],
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorSection, setErrorSection] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const [config, members] = await Promise.all([
      api.get(endpoint),
      platform ? Promise.resolve(null) : api.get("/tenant-management/members"),
    ]);
    const next = unwrap(config);
    setCompany(next);
    setTeam(members ? unwrap(members) : { roles: [], products: [], members: [] });
    setBranding({
      themeMode: next.theme?.mode || "light",
      themeSwitching: next.theme?.allowSwitching === false ? "no" : "yes",
      name: next.name,
      logoSrc: next.logoSrc,
      logoDarkSrc: next.logoDarkSrc || "",
      faviconSrc: next.faviconSrc || "",
      windowTitle: next.windowTitle || "",
      tagline: next.tagline || "",
      contactEmail: next.contactEmail || "",
      contactPhone: next.contactPhone || "",
      website: next.website || "",
      primaryColor: next.theme?.light?.["--color-primary"] || "#3047b0",
      darkPrimaryColor: next.theme?.dark?.["--color-primary"] || "#91a4ff",
    });
  };
  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || "Unable to load company settings."));
  }, []);
  const run = async (action, notice, section = "members") => {
    setBusy(true);
    setError("");
    setFieldErrors({});
    setErrorSection(section);
    setMessage("");
    try {
      const response = unwrap(await action());
      await load();
      setMessage(
        response.accessUpdated
          ? "Company administrator access granted. Their previous sessions have been revoked."
          : response.emailSent === false
            ? "Invitation saved, but email delivery failed. Use Resend activation."
            : notice,
      );
      await reload();
    } catch (e) {
      const details = e.response?.data?.details;
      if (section !== "members" && details && typeof details === "object") setFieldErrors(details);
      else setError(e.response?.data?.message || "Unable to save changes.");
    } finally {
      setBusy(false);
    }
  };
  if (!company) return error ? <ErrorState description={error} /> : <Preloader />;
  const fields = [
    { name: "name", label: "Name", type: "text", required: true, readOnly: !!member._id },
    { name: "email", label: "Email", type: "email", required: true, readOnly: !!member._id },
    { name: "clientRole", label: "Company role", type: "select", options: team.roles },
    {
      name: "productAccess",
      label: "Assigned products",
      type: "multiselect",
      options: team.products.map((key) => ({ value: key, label: key })),
    },
  ];
  return (
    <section className="internal-team company-settings">
      <header className="internal-team__hero">
        <div>
          <h1>{platform ? "Platform branding" : "Company & members"}</h1>
          <p>{platform ? "Manage the platform identity used across your applications." : "Manage your company’s branding, administrators and enrolled product access."}</p>
        </div>
      </header>
      {message && <p role="status">{message}</p>}
      <section className="company-settings__panel">
        <h2>Branding & theme</h2>
        <p>Applies to your site, enrolled products, Dashboard and Admin TREM.</p>
        <ConfigurableForm
          config={form([
            { name: "name", label: "Company display name", type: "text" },
            { name: "logoSrc", label: "Light theme logo URL", type: "url" },
            { name: "logoDarkSrc", label: "Dark theme logo URL", type: "url" },
            { name: "faviconSrc", label: "Favicon URL", type: "url" },
            { name: "windowTitle", label: "Browser title", type: "text" },
            ...(platform ? [
              { name: "tagline", label: "Tagline", type: "text" },
              { name: "contactEmail", label: "Business email", type: "email" },
              { name: "contactPhone", label: "Business phone", type: "text" },
              { name: "website", label: "Website URL", type: "url" },
            ] : [ 
            {
              name: "themeMode",
              label: "Default theme",
              type: "select",
              options: [
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ],
            },
            {
              name: "themeSwitching",
              label: "Allow theme switching",
              type: "select",
              options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ],
            },
            { name: "primaryColor", label: "Light theme primary colour", type: "text" },
            { name: "darkPrimaryColor", label: "Dark theme primary colour", type: "text" },
            ]),
          ])}
          errors={errorSection === "branding" ? fieldErrors : {}}
          values={branding}
          onChange={(name, value) => {
            setBranding((old) => ({ ...old, [name]: value }));
            setFieldErrors((old) => ({ ...old, [name]: "" }));
          }}
        />
        {error && errorSection === "branding" && (
          <p className="company-settings__error" role="alert">
            {error}
          </p>
        )}
        <Button
          text="Save branding"
          disabled={busy}
          onClick={() =>
            run(
              async () => {
                const response = await api.patch(endpoint, {
                  ...branding,
                  theme: {
                    ...company.theme,
                    mode: branding.themeMode,
                    allowSwitching: branding.themeSwitching === "yes",
                  },
                });
                window.dispatchEvent(new Event("TENANT_CONFIG_UPDATED"));
                return response;
              },
              platform ? "Platform branding updated." : "Company branding updated.",
              "branding",
            )
          }
        />
      </section>
      {!platform && <>
      <section className="company-settings__panel">
        <h2>{member._id ? "Update member access" : "Invite company member"}</h2>
        <ConfigurableForm
          config={form(fields)}
          errors={errorSection === "member" ? fieldErrors : {}}
          values={member}
          onChange={(name, value) => {
            setMember((old) => ({ ...old, [name]: value }));
            setFieldErrors((old) => ({ ...old, [name]: "" }));
          }}
        />
        {error && errorSection === "member" && (
          <p className="company-settings__error" role="alert">
            {error}
          </p>
        )}
        <Button
          text={member._id ? "Save access" : "Send activation invitation"}
          disabled={busy}
          onClick={() =>
            run(
              () =>
                member._id
                  ? api.patch(`/tenant-management/members/${member._id}`, member)
                  : api.post("/tenant-management/members", member),
              member._id
                ? "Member access updated. Their previous sessions have been revoked."
                : "Activation invitation sent.",
              "member",
            )
          }
        />
        {member._id && (
          <Button
            text="Cancel editing"
            variant="text"
            onClick={() => {
              setMember({ name: "", email: "", clientRole: "client_admin", productAccess: [] });
              setFieldErrors({});
              setError("");
            }}
          />
        )}
      </section>
      <section className="company-settings__panel">
        <h2>Company members</h2>
        {error && errorSection === "members" && (
          <p className="company-settings__error" role="alert">
            {error}
          </p>
        )}
        <div className="internal-team__grid">
          {team.members.map((item) => (
            <article key={item._id} className="internal-team-card">
              <h3>{item.name}</h3>
              <p>
                {item.email} · {item.clientRole.replaceAll("_", " ")}
              </p>
              <StatusBadge value={item.accountStatus} />
              <p>{item.productAccess.join(", ")}</p>
              <Button
                text="Manage access"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setMember(item);
                  setFieldErrors({});
                  setError("");
                }}
              />
              {item.accountStatus === "invited" && (
                <Button
                  text="Resend activation"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => api.post(`/tenant-management/members/${item._id}/resend`),
                      "Activation invitation sent.",
                    )
                  }
                />
              )}
              {item.accountStatus !== "invited" && (
                <Button
                  text={item.accountStatus === "deactivated" ? "Reactivate" : "Deactivate"}
                  variant="text"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        api.patch(`/tenant-management/members/${item._id}`, {
                          ...item,
                          accountStatus:
                            item.accountStatus === "deactivated" ? "active" : "deactivated",
                        }),
                      "Member status updated.",
                    )
                  }
                />
              )}
            </article>
          ))}
        </div>
        {!team.members.length && <p>No company members yet.</p>}
      </section>
      </>}
    </section>
  );
}
