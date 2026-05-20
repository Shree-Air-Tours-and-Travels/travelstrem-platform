import{r as a,R as n}from"./index-Bc2G9s8g.js";import{C as o}from"./FavoritesContext-ClvQQ5W1.js";import"./index-BO6cjGmN.js";import{c as b}from"./sampleData-SKqcyK29.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const O={title:"Trem UI/Forms/ContactForm",component:o,tags:["autodocs"],argTypes:{submitText:{control:"text"},submitting:{control:"boolean"}},args:{fieldsMeta:b,submitText:"Send Request",submitting:!1}},i={render:e=>{const[t,s]=a.useState({}),[l,r]=a.useState({}),m=a.useCallback((v,P)=>{s(g=>({...g,[v]:P})),r(g=>({...g,[v]:void 0}))},[]),R=a.useCallback(()=>{},[]),D=a.useCallback(()=>{s({}),r({})},[]);return n.createElement("div",{className:"trem-storybook-panel",style:{maxWidth:480}},n.createElement(o,{fieldsMeta:e.fieldsMeta,formValues:t,onChange:m,onSubmit:R,onCancel:D,submitting:e.submitting,submitText:e.submitText,errors:l}))}},u={name:"Default Form",render:()=>{const[e,t]=a.useState({}),s=a.useCallback((l,r)=>{t(m=>({...m,[l]:r}))},[]);return n.createElement("div",{className:"trem-storybook-panel",style:{maxWidth:480}},n.createElement(o,{fieldsMeta:b,formValues:e,onChange:s,onSubmit:()=>{},onCancel:()=>t({}),submitText:"Send Request"}))}},c={name:"With Validation Errors",render:()=>{const[e,t]=a.useState({name:"",email:"invalid",phone:"",message:""}),s={name:"Full name is required",email:"Please enter a valid email address",message:"Message cannot be empty"};return n.createElement("div",{className:"trem-storybook-panel",style:{maxWidth:480}},n.createElement(o,{fieldsMeta:b,formValues:e,onChange:()=>{},onSubmit:()=>{},onCancel:()=>{},errors:s,submitText:"Send Request"}))}},d={name:"Submitting State",render:()=>{const[e,t]=a.useState({name:"Akshat",email:"akshat@example.com",phone:"+91 9876543210",message:"I am interested in the Himalayan Escape tour."});return n.createElement("div",{className:"trem-storybook-panel",style:{maxWidth:480}},n.createElement(o,{fieldsMeta:b,formValues:e,onChange:()=>{},onSubmit:()=>{},onCancel:()=>{},submitting:!0,submitText:"Send Request"}))}},p={name:"Minimal Fields",render:()=>{const[e,t]=a.useState({}),s=[{name:"email",label:"Email",type:"email",placeholder:"you@example.com"},{name:"message",label:"Message",type:"textarea",placeholder:"Your message..."}];return n.createElement("div",{className:"trem-storybook-panel",style:{maxWidth:480}},n.createElement(o,{fieldsMeta:s,formValues:e,onChange:(l,r)=>t(m=>({...m,[l]:r})),onSubmit:()=>{},onCancel:()=>t({})}))}};var C,h,S;i.parameters={...i.parameters,docs:{...(C=i.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: args => {
    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});
    const onChange = useCallback((name, value) => {
      setValues(prev => ({
        ...prev,
        [name]: value
      }));
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }, []);
    const onSubmit = useCallback(() => {}, []);
    const onCancel = useCallback(() => {
      setValues({});
      setErrors({});
    }, []);
    return <div className="trem-storybook-panel" style={{
      maxWidth: 480
    }}>
        <ContactForm fieldsMeta={args.fieldsMeta} formValues={values} onChange={onChange} onSubmit={onSubmit} onCancel={onCancel} submitting={args.submitting} submitText={args.submitText} errors={errors} />
      </div>;
  }
}`,...(S=(h=i.parameters)==null?void 0:h.docs)==null?void 0:S.source}}};var f,y,x;u.parameters={...u.parameters,docs:{...(f=u.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: "Default Form",
  render: () => {
    const [values, setValues] = useState({});
    const onChange = useCallback((name, value) => {
      setValues(prev => ({
        ...prev,
        [name]: value
      }));
    }, []);
    return <div className="trem-storybook-panel" style={{
      maxWidth: 480
    }}>
        <ContactForm fieldsMeta={contactFields} formValues={values} onChange={onChange} onSubmit={() => {}} onCancel={() => setValues({})} submitText="Send Request" />
      </div>;
  }
}`,...(x=(y=u.parameters)==null?void 0:y.docs)==null?void 0:x.source}}};var V,E,k;c.parameters={...c.parameters,docs:{...(V=c.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: "With Validation Errors",
  render: () => {
    const [values, setValues] = useState({
      name: "",
      email: "invalid",
      phone: "",
      message: ""
    });
    const errors = {
      name: "Full name is required",
      email: "Please enter a valid email address",
      message: "Message cannot be empty"
    };
    return <div className="trem-storybook-panel" style={{
      maxWidth: 480
    }}>
        <ContactForm fieldsMeta={contactFields} formValues={values} onChange={() => {}} onSubmit={() => {}} onCancel={() => {}} errors={errors} submitText="Send Request" />
      </div>;
  }
}`,...(k=(E=c.parameters)==null?void 0:E.docs)==null?void 0:k.source}}};var F,M,T;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: "Submitting State",
  render: () => {
    const [values, setValues] = useState({
      name: "Akshat",
      email: "akshat@example.com",
      phone: "+91 9876543210",
      message: "I am interested in the Himalayan Escape tour."
    });
    return <div className="trem-storybook-panel" style={{
      maxWidth: 480
    }}>
        <ContactForm fieldsMeta={contactFields} formValues={values} onChange={() => {}} onSubmit={() => {}} onCancel={() => {}} submitting submitText="Send Request" />
      </div>;
  }
}`,...(T=(M=d.parameters)==null?void 0:M.docs)==null?void 0:T.source}}};var W,N,q;p.parameters={...p.parameters,docs:{...(W=p.parameters)==null?void 0:W.docs,source:{originalSource:`{
  name: "Minimal Fields",
  render: () => {
    const [values, setValues] = useState({});
    const minimalFields = [{
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "you@example.com"
    }, {
      name: "message",
      label: "Message",
      type: "textarea",
      placeholder: "Your message..."
    }];
    return <div className="trem-storybook-panel" style={{
      maxWidth: 480
    }}>
        <ContactForm fieldsMeta={minimalFields} formValues={values} onChange={(name, value) => setValues(prev => ({
        ...prev,
        [name]: value
      }))} onSubmit={() => {}} onCancel={() => setValues({})} />
      </div>;
  }
}`,...(q=(N=p.parameters)==null?void 0:N.docs)==null?void 0:q.source}}};const U=["Playground","Default","WithErrors","Submitting","Minimal"];export{u as Default,p as Minimal,i as Playground,d as Submitting,c as WithErrors,U as __namedExportsOrder,O as default};
