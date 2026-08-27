import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Dropdown,
  EmptyState,
  Icon,
  InputField,
  MetricSummary,
  Pagination,
  Spinner,
  StatusBadge,
} from "@packages/trem-ui";
import { showRealtimeToast, useEnquiryRealtime } from "@packages/trem-events";
import api from "../../services/apiClient";

const unwrap = (response) =>
  response?.data?.componentData?.data ?? response?.data?.data ?? response?.data;
const emptyForm = {
  name: "",
  email: "",
  phone: "",
  preferredContact: "any",
  lifecycleStage: "lead",
  status: "active",
  ownerAgent: "",
  followUpAt: "",
  lastContactedAt: "",
  tags: "",
  notes: "",
};
const formatDate = (value, withTime = false) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
};
const initials = (customer) => {
  const words = String(customer?.name || customer?.email || "Customer").trim().split(/\s+/);
  return (words.length > 1 ? `${words[0][0]}${words.at(-1)[0]}` : words[0].slice(0, 2)).toUpperCase();
};
const toForm = (customer = {}) => ({
  ...emptyForm,
  ...customer,
  ownerAgent: customer.owner?.id || customer.ownerAgent || "",
  followUpAt: customer.followUpAt ? new Date(customer.followUpAt).toISOString().slice(0, 16) : "",
  lastContactedAt: customer.lastContactedAt
    ? new Date(customer.lastContactedAt).toISOString().slice(0, 16)
    : "",
  tags: Array.isArray(customer.tags) ? customer.tags.join(", ") : customer.tags || "",
});

function SelectField({ field, value, onChange }) {
  return (
    <Dropdown
      variant="select"
      label={field.label}
      placeholder={`Select ${field.label.toLowerCase()}`}
      value={value}
      items={(field.options || []).map((item) => ({ ...item, id: item.value || "empty" }))}
      onChange={(item) => onChange(item.value)}
      width="100%"
    />
  );
}

function FilterMenu({ options = [], value, onChange, ariaLabel }) {
  if (!options.length) return null;
  const selected = options.find((option) => option.value === value) || options[0];
  return (
    <Dropdown
      align="right"
      hoverable={false}
      trigger={
        <Button
          variant="outline"
          text={selected.label}
          iconRight="chevronDown"
          className="customer-directory__filter"
          aria-label={ariaLabel}
        />
      }
      items={options.map((item) => ({
        id: item.value || "all",
        label: item.label,
        active: item.value === value,
        onClick: () => onChange(item.value),
      }))}
    />
  );
}

function CustomerForm({ view, customer, submitting, onClose, onSubmit }) {
  const [form, setForm] = useState(() => toForm(customer));
  const isEdit = Boolean(customer?.id);
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  return (
    <div className="customer-directory__overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form
        className="customer-directory__dialog customer-directory__dialog--form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <header>
          <div>
            <span>PARTNERTREM CRM</span>
            <h2>{isEdit ? view.form.editTitle : view.form.createTitle}</h2>
            <p>{view.form.description}</p>
          </div>
          <Button type="button" variant="text" isCircular aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </header>
        <div className="customer-directory__form-grid">
          {view.form.fields.filter((field) => !field.modes || field.modes.includes(isEdit ? "edit" : "create")).map((field) => {
            if (field.type === "select")
              return (
                <SelectField
                  key={field.name}
                  field={field}
                  value={form[field.name] || ""}
                  onChange={(value) => update(field.name, value)}
                />
              );
            if (field.type === "textarea")
              return (
                <label className="customer-directory__textarea" key={field.name}>
                  <span>{field.label}</span>
                  <textarea value={form[field.name] || ""} onChange={(event) => update(field.name, event.target.value)} />
                </label>
              );
            return (
              <InputField
                key={field.name}
                label={field.label}
                required={field.required}
                variant={field.type}
                value={form[field.name] || ""}
                onChange={(value) => update(field.name, value)}
              />
            );
          })}
        </div>
        <footer>
          <Button type="button" variant="outline" text={view.form.cancelLabel} onClick={onClose} />
          <Button
            type="submit"
            text={isEdit ? view.form.updateLabel : view.form.createLabel}
            disabled={submitting}
            iconLeft={submitting ? "refreshCw" : isEdit ? "edit" : "plus"}
          />
        </footer>
      </form>
    </div>
  );
}

function CustomerDetail({ detail, loading, onClose, onEdit, onArchive }) {
  const customer = detail?.customer;
  const view = detail?.view;
  return (
    <div className="customer-directory__overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="customer-directory__dialog customer-directory__dialog--detail">
        <header>
          <div>
            <span>PARTNERTREM CRM</span>
            <h2>{view?.detail?.title || "Customer profile"}</h2>
          </div>
          <Button variant="text" isCircular aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </header>
        {loading || !customer ? (
          <div className="customer-directory__detail-state"><Spinner label="Loading customer profile" /></div>
        ) : (
          <div className="customer-directory__detail-body">
            <div className="customer-directory__profile-head">
              <span className="customer-directory__avatar">{initials(customer)}</span>
              <div>
                <h3>{customer.name}</h3>
                <p>{customer.email || customer.phone}</p>
              </div>
              <StatusBadge value={customer.status} size="sm" />
            </div>
            <dl className="customer-directory__profile-facts">
              <div><dt>{view.detail.fields.stage}</dt><dd>{customer.lifecycleStage}</dd></div>
              <div><dt>{view.detail.fields.owner}</dt><dd>{customer.owner?.name || "Unassigned"}</dd></div>
              <div><dt>{view.detail.fields.preferredContact}</dt><dd>{customer.preferredContact}</dd></div>
              <div><dt>{view.detail.fields.followUp}</dt><dd>{formatDate(customer.followUpAt, true)}</dd></div>
              <div><dt>{view.detail.fields.enquiries}</dt><dd>{customer.activity?.enquiries || 0}</dd></div>
              <div><dt>{view.detail.fields.bookings}</dt><dd>{customer.activity?.bookings || 0}</dd></div>
            </dl>
            {customer.notes ? <div className="customer-directory__notes"><strong>{view.detail.fields.notes}</strong><p>{customer.notes}</p></div> : null}
            <section className="customer-directory__timeline">
              <h3>{view?.detail?.activityTitle}</h3>
              {detail.activity?.length ? detail.activity.map((item) => (
                <article key={item.id}>
                  <span><Icon name={item.type === "booking" ? "calendarDays" : "messageCircle"} size={18} /></span>
                  <div><strong>{item.title}</strong><p>{item.reference} · {formatDate(item.createdAt, true)}</p></div>
                  <StatusBadge value={item.status} size="sm" />
                </article>
              )) : <p className="customer-directory__empty-copy">{view?.detail?.emptyActivity}</p>}
            </section>
          </div>
        )}
        {!loading && customer ? (
          <footer>
            {view.capabilities.archive ? <Button variant="text" color="danger" text={view.actions.archive} onClick={onArchive} /> : null}
            {view.capabilities.update ? <Button text={view.actions.editCustomer} iconLeft="edit" onClick={onEdit} /> : null}
          </footer>
        ) : null}
      </section>
    </div>
  );
}

export default function CustomerDirectory({ embedded = false }) {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [filters, setFilters] = useState({ search: "", status: "", lifecycleStage: "", ownerAgent: "", sort: "recent_activity", page: 1 });
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const overlayOpen = editor !== null || Boolean(detail);
  useEffect(() => {
    if (!overlayOpen) return undefined;
    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previousBody = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    const previousHtmlOverflow = documentElement.style.overflow;
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    documentElement.style.overflow = "hidden";
    return () => {
      Object.assign(body.style, previousBody);
      documentElement.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [overlayOpen]);
  useEffect(() => {
    const timer = window.setTimeout(() => setFilters((current) => ({ ...current, search: search.trim(), page: 1 })), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await api.get("/tenancy/customers", {
        params: { ...filters, skip: (filters.page - 1) * 12, limit: 12, page: undefined },
      });
      setState({ loading: false, error: "", data: unwrap(response) });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error?.response?.data?.message || "Customer directory could not be loaded." }));
    }
  }, [filters]);
  useEffect(() => { load(); }, [load]);
  useEnquiryRealtime(load);
  const openDetail = useCallback(async (id) => {
    setDetailLoading(true);
    setDetail({ customer: { id } });
    try {
      const response = await api.get(`/tenancy/customers/${id}`);
      setDetail(unwrap(response));
    } catch (error) {
      showRealtimeToast({ title: error?.response?.data?.message || "Customer profile could not be loaded.", status: "error", dedupeKey: `customer:load:${id}` });
      setDetail(null);
    } finally { setDetailLoading(false); }
  }, []);
  const mutate = async (form) => {
    setSubmitting(true);
    try {
      const response = editor?.id
        ? await api.patch(`/tenancy/customers/${editor.id}`, form)
        : await api.post("/tenancy/customers", form);
      const message = response?.data?.message || "Customer saved.";
      showRealtimeToast({ title: message, status: "success", dedupeKey: `customer:save:${editor?.id || form.email || form.phone}` });
      setEditor(null);
      await load();
      if (detail?.customer?.id) await openDetail(detail.customer.id);
    } catch (error) {
      showRealtimeToast({ title: error?.response?.data?.message || "Customer could not be saved.", status: "error", dedupeKey: "customer:save:error" });
    } finally { setSubmitting(false); }
  };
  const archive = async () => {
    const current = detail?.customer;
    if (!current || !window.confirm(detail.view.messages.archiveConfirm)) return;
    try {
      const response = await api.delete(`/tenancy/customers/${current.id}`);
      showRealtimeToast({ title: response?.data?.message || "Customer archived.", status: "success", dedupeKey: `customer:archive:${current.id}` });
      setDetail(null);
      await load();
    } catch (error) {
      showRealtimeToast({ title: error?.response?.data?.message || "Customer could not be archived.", status: "error", dedupeKey: `customer:archive:error:${current.id}` });
    }
  };
  const data = state.data;
  const view = data?.view;
  const hasFilters = Boolean(filters.search || filters.status || filters.lifecycleStage || filters.ownerAgent);
  const filterSet = useMemo(() => view?.filters || {}, [view]);
  if (state.loading && !data) return <div className="partner-workspace__state partner-workspace__state--panel"><Spinner label="Loading customer relationships" /></div>;
  if (state.error && !data) return <div className="partner-workspace__state partner-workspace__state--panel"><Icon name="alertTriangle" size={36} /><strong>Unable to load customers</strong><span>{state.error}</span><Button text="Try again" onClick={load} /></div>;
  return (
    <div className={`customer-directory${embedded ? " is-embedded" : ""}`}>
      {!embedded ? <header className="partner-workspace__hero"><div><p>{view.hero.eyebrow}</p><h1>{view.hero.title}</h1><span>{view.hero.description}</span></div><div className="partner-workspace__header-actions">{view.capabilities.create ? <Button text={view.actions.create} iconLeft="plus" onClick={() => setEditor({})} /> : null}<Button text={view.actions.refresh} iconLeft="refreshCw" variant="outline" onClick={load} /></div></header> : null}
      <MetricSummary
        variant="cards"
        className="partner-workspace__metric-summary"
        ariaLabel={view.summaryAriaLabel || "Customer relationship summary"}
        items={data.summaryCards}
      />
      <section className="partner-workspace__directory-panel">
        <header className="partner-workspace__directory-heading"><div><h2>{view.directory.title}</h2><p>{view.directory.description}</p></div><span className="partner-workspace__result-count">{state.loading ? <Icon name="refreshCw" size={15} className="is-spinning" /> : null}<strong>{data.pagination.total}</strong> {view.directory.resultLabel}</span></header>
        <div className="partner-workspace__controls customer-directory__controls">
          <div className="partner-workspace__search"><Icon name="search" size={20} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={view.search.placeholder} /></div>
          <div className="partner-workspace__filters">
            <FilterMenu options={filterSet.lifecycleStage} value={filters.lifecycleStage} ariaLabel="Filter by customer stage" onChange={(lifecycleStage) => setFilters((current) => ({ ...current, lifecycleStage, page: 1 }))} />
            <FilterMenu options={filterSet.status} value={filters.status} ariaLabel="Filter by account state" onChange={(status) => setFilters((current) => ({ ...current, status, page: 1 }))} />
            <FilterMenu options={filterSet.ownerAgent} value={filters.ownerAgent} ariaLabel="Filter by assigned agent" onChange={(ownerAgent) => setFilters((current) => ({ ...current, ownerAgent, page: 1 }))} />
            <FilterMenu options={filterSet.sort} value={filters.sort} ariaLabel="Sort customers" onChange={(sort) => setFilters((current) => ({ ...current, sort, page: 1 }))} />
          </div>
        </div>
        {data.items.length ? <div className="customer-directory__grid">{data.items.map((customer) => (
          <article className="customer-card" key={customer.id}>
            <header><span className="customer-directory__avatar">{initials(customer)}</span><div><h3>{customer.name}</h3><p>{customer.email || customer.phone}</p></div><StatusBadge value={customer.status} size="sm" /></header>
            <div className="customer-card__stage"><span>{customer.lifecycleStage}</span>{customer.source === "enquiry" ? <em>Enquiry-created</em> : null}</div>
            <dl><div><dt>Assigned to</dt><dd>{customer.owner?.name || "Unassigned"}</dd></div><div><dt>Enquiries</dt><dd>{customer.activity.enquiries}</dd></div><div><dt>Open</dt><dd>{customer.activity.openEnquiries}</dd></div><div><dt>Follow-up</dt><dd>{formatDate(customer.followUpAt)}</dd></div></dl>
            {customer.activity.latestTour ? <p className="customer-card__latest"><Icon name="map" size={16} />{customer.activity.latestTour}</p> : null}
            <footer><Button variant="outline" text={view.actions.view} onClick={() => openDetail(customer.id)} />{view.capabilities.update ? <Button variant="text" text={view.actions.edit} iconLeft="edit" onClick={() => setEditor(customer)} /> : null}</footer>
          </article>
        ))}</div> : <EmptyState icon="usersRound" title={view.empty.title} description={hasFilters ? view.empty.filteredDescription : view.empty.description} action={hasFilters ? <Button variant="outline" text={view.actions.clearFilters} onClick={() => { setSearch(""); setFilters({ search: "", status: "", lifecycleStage: "", ownerAgent: "", sort: "recent_activity", page: 1 }); }} /> : view.capabilities.create ? <Button text={view.actions.create} onClick={() => setEditor({})} /> : null} />}
        {data.pagination.totalPages > 1 ? <footer className="customer-directory__pagination"><Pagination currentPage={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} previousLabel={view.actions.previous} nextLabel={view.actions.next} ariaLabel={view.directory.paginationAriaLabel} disabled={state.loading} /></footer> : null}
      </section>
      {editor !== null ? <CustomerForm view={view} customer={editor} submitting={submitting} onClose={() => setEditor(null)} onSubmit={mutate} /> : null}
      {detail ? <CustomerDetail detail={detail} loading={detailLoading} onClose={() => setDetail(null)} onEdit={() => setEditor(detail.customer)} onArchive={archive} /> : null}
    </div>
  );
}
