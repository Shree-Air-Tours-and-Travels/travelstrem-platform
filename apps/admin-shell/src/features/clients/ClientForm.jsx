import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, ConfigurableForm, ErrorState, FloatingActionBar, Preloader, WizardFormShell } from '@packages/trem-ui';
import api from '../../services/apiClient';
import './ManageClients.scss';

const unpack = (response) => response.data.componentData.data;
const message = (error) => error.response?.data?.message || 'Registration could not be saved.';
const reviewValue = (value) => Array.isArray(value)
  ? value.map((item) => typeof item === 'object' ? `${item.label}: ${item.href || item.value || ''}` : item).join(', ')
  : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value ?? '—');

export default function ClientForm({ clientId, onComplete, onCancel }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const registrationId = params.get('registrationId');
  const [clientName, setClientName] = useState('');
  const [drafts, setDrafts] = useState(null);
  const [record, setRecord] = useState(null);
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (clientId) {
      api.get(`/clients/${clientId}`).then((response) => setClientName(unpack(response).client.name)).catch((e) => setError(message(e)));
    } else {
      api.get('/clients/registrations').then((response) => setDrafts(unpack(response))).catch((e) => setError(message(e)));
    }
  }, [clientId]);

  useEffect(() => {
    if (!registrationId) return;
    api.get(`/clients/registrations/${registrationId}`).then((response) => {
      const next = unpack(response);
      setRecord(next);
      setValues(next.values);
    }).catch((e) => setError(message(e)));
  }, [registrationId]);

  const run = async (operation) => {
    setBusy(true); setError(''); setErrors({});
    try {
      const next = unpack(await operation());
      setRecord(next); setValues(next.values);
      if (next.id !== registrationId) {
        const query = new URLSearchParams(clientId ? { clientId } : {});
        query.set('registrationId', next.id);
        navigate(`/manage/clients/build?${query}`, { replace: true });
      }
    } catch (e) {
      setError(message(e));
      setErrors(e.response?.data?.componentData?.data?.errors || {});
      if (record?.id && !e.response?.data?.componentData?.data?.errors) {
        try { setRecord(unpack(await api.get(`/clients/registrations/${record.id}`))); } catch { /* Keep the original error. */ }
      }
    } finally { setBusy(false); }
  };

  const removeDraft = async (draft) => {
    if (!window.confirm(`Delete the saved draft for ${draft.data?.name || 'this client'}?`)) return;
    setBusy(true); setError('');
    try {
      await api.delete(`/clients/registrations/${draft._id || draft.id}`);
      setDrafts((current) => current?.filter((item) => item._id !== (draft._id || draft.id)));
      if (record?.id === (draft._id || draft.id)) {
        setRecord(null);
        navigate('/manage/clients/build', { replace: true });
      }
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  };

  const advance = (action, targetNodeId) => run(() => api.patch(`/clients/registrations/${record.id}`, { revision: record.revision, values, action, targetNodeId }));

  if (!record) return <section className="mc-build-start">
    <div className="mc-build-start__header"><div><h1>{clientId ? `Configure ${clientName || 'client'}` : 'Add client'}</h1><p>Set up the company, products, branding, and administrator.</p></div><Button text="Back to clients" variant="text" onClick={onCancel} /></div>
    {error && <ErrorState description={error} />}
    {!drafts && !clientId && !error ? <Preloader /> : null}
    <Button disabled={busy || (clientId && !clientName)} text={clientId ? 'Start configuration update' : 'New registration'} onClick={() => run(() => api.post('/clients/registrations', { clientId }))} />
    {!clientId && drafts?.length > 0 && <div className="mc-drafts"><h2>Saved drafts</h2><div className="mc-drafts__list">
      {drafts.map((draft) => <div className="mc-drafts__item" key={draft._id}>
        <div><strong>{draft.data?.name || 'Untitled registration'}</strong><span>{draft.status} · Updated {new Date(draft.updatedAt).toLocaleDateString()}</span></div>
        <div className="mc-drafts__actions"><Button disabled={busy} variant="outline" text="Resume" onClick={() => run(() => api.get(`/clients/registrations/${draft._id}`))} />{['draft', 'failed'].includes(draft.status) && (!draft.clientId || draft.isUpdate) && <Button disabled={busy} variant="text" color="danger" text="Delete" onClick={() => removeDraft(draft)} />}</div>
      </div>)}
    </div></div>}
  </section>;

  if (record.status === 'completed') return <section className="mc-build-start"><h1>Client configured</h1><p>{record.isUpdate ? 'Client configuration saved.' : record.emailSent ? 'The administrator activation invitation has been sent.' : 'Configuration saved. Send the invitation from client management if needed.'}</p><Button text="Back to clients" onClick={onComplete} /></section>;
  if (record.status === 'provisioning') return <section className="mc-build-start"><h1>Provisioning tenant</h1><p>This registration is being provisioned. Reopen it to check progress.</p><Button text="Back to clients" onClick={onCancel} /></section>;

  const step = record.definition.steps.find((item) => item.id === record.process.currentNodeId);
  const actions = [
    { label: 'Back', variant: 'ghost', disabled: busy || !record.process.navigation.previousNodeId, onClick: () => advance('BACK') },
    { label: 'Save progress', variant: 'outline', disabled: busy, onClick: () => advance('SAVE'), align: 'right' },
    { label: step.id === 'review' ? 'Confirm review' : 'Save & continue', variant: 'primary', disabled: busy, onClick: () => advance('SUBMIT_AND_NEXT'), align: 'right' },
    ...(step.id === 'review' && record.process.status === 'COMPLETED' ? [{ label: record.isUpdate ? 'Save client changes' : 'Provision tenant & invite admin', variant: 'primary', disabled: busy, onClick: () => run(() => api.post(`/clients/registrations/${record.id}/provision`, { revision: record.revision })), align: 'right' }] : []),
  ];

  return <WizardFormShell title={record.definition.title} railTitle={record.isUpdate ? 'Client settings' : 'Tenant setup'} steps={record.definition.steps}
    activeStepId={step.id} completedStepIds={record.process.completedStageIds} progress={record.process.progress.percentage}
    canNavigate={!busy} onStepChange={(id) => advance('GO_TO', id)} headerActions={<Button text="Close" variant="text" onClick={onCancel} />}
    actionBar={<FloatingActionBar className="tb-action-bar" align="left-right" actions={actions} />}>
    {error && <ErrorState description={error} />}
    {step.id === 'review' && <dl>{record.definition.steps.filter((s) => s.id !== 'review').flatMap((s) => s.fields).map((f) => <React.Fragment key={f.name}><dt>{f.label}</dt><dd>{reviewValue(values[f.name])}</dd></React.Fragment>)}</dl>}
    <ConfigurableForm config={{ layout: { columns: 2, columnsMobile: 1, expandable: false }, sections: [{ id: step.id, title: step.title, fields: step.fields.filter((field) => field.type !== 'entityList') }] }} values={values} errors={errors} onChange={(name, value) => setValues((old) => ({ ...old, [name]: value }))} />
    {step.fields.filter((field) => field.type === 'entityList').map((field) => <section key={field.name} className="mc-content-list">
      <h3>{field.label}</h3>
      {errors[field.name] && <ErrorState description={errors[field.name]} />}
      {(values[field.name] || []).map((item, index) => <div key={index} className="mc-content-list__item">
        <ConfigurableForm config={{ layout: { columns: 2, columnsMobile: 1, expandable: false }, sections: [{ id: `${field.name}-${index}`, title: `${field.label} ${index + 1}`, fields: field.itemFields }] }} values={item}
          errors={Object.fromEntries(field.itemFields.map((child) => [child.name, errors[`${field.name}.${index}.${child.name}`]]))}
          onChange={(name, value) => setValues((old) => ({ ...old, [field.name]: old[field.name].map((row, rowIndex) => rowIndex === index ? { ...row, [name]: value } : row) }))} />
        <Button text="Remove" variant="text" disabled={busy} aria-label={`Remove ${field.label} ${index + 1}`} onClick={() => setValues((old) => ({ ...old, [field.name]: old[field.name].filter((_, rowIndex) => rowIndex !== index) }))} />
      </div>)}
      <Button text={`Add ${field.label.toLowerCase()}`} variant="outline" disabled={busy} onClick={() => setValues((old) => ({ ...old, [field.name]: [...(old[field.name] || []), {}] }))} />
    </section>)}
  </WizardFormShell>;
}
