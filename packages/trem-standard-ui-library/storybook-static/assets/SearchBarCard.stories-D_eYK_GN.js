import{r as u,R as d}from"./index-Bc2G9s8g.js";import{S as o}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const h=[{id:"location",label:"Location",type:"text",placeholder:"Where to?"},{id:"distance",label:"Distance",type:"number",placeholder:"Distance (km)"},{id:"maxPeople",label:"Max People",type:"number",placeholder:"No. of People"}],E={title:"Trem UI/Forms/SearchBarCard",component:o,tags:["autodocs"],argTypes:{fields:{control:"object"}},args:{fields:h,searchIcon:"Search"}},t={render:e=>{const[a,r]=u.useState({});return d.createElement(o,{fields:e.fields,values:a,onChange:(s,n)=>r(D=>({...D,[s]:n})),onSearch:()=>{},searchIcon:e.searchIcon})}},c={name:"Default",render:()=>{const[e,a]=u.useState({});return d.createElement(o,{fields:h,values:e,onChange:(r,s)=>a(n=>({...n,[r]:s})),onSearch:()=>{},searchIcon:"Search"})}},l={name:"With Values",render:()=>d.createElement(o,{fields:h,values:{location:"Manali",distance:"200",maxPeople:"4"},onChange:()=>{},onSearch:()=>{},searchIcon:"Search"})},i={name:"Minimal Fields",render:()=>{const[e,a]=u.useState({});return d.createElement(o,{fields:[{id:"location",label:"Destination",type:"text",placeholder:"Where?"}],values:e,onChange:(r,s)=>a(n=>({...n,[r]:s})),onSearch:()=>{},searchIcon:"Go"})}};var m,p,S;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: args => {
    const [values, setValues] = useState({});
    return <SearchBarCard fields={args.fields} values={values} onChange={(id, value) => setValues(prev => ({
      ...prev,
      [id]: value
    }))} onSearch={() => {}} searchIcon={args.searchIcon} />;
  }
}`,...(S=(p=t.parameters)==null?void 0:p.docs)==null?void 0:S.source}}};var v,f,g;c.parameters={...c.parameters,docs:{...(v=c.parameters)==null?void 0:v.docs,source:{originalSource:`{
  name: "Default",
  render: () => {
    const [values, setValues] = useState({});
    return <SearchBarCard fields={searchFields} values={values} onChange={(id, value) => setValues(prev => ({
      ...prev,
      [id]: value
    }))} onSearch={() => {}} searchIcon="Search" />;
  }
}`,...(g=(f=c.parameters)==null?void 0:f.docs)==null?void 0:g.source}}};var C,V,I;l.parameters={...l.parameters,docs:{...(C=l.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: "With Values",
  render: () => <SearchBarCard fields={searchFields} values={{
    location: "Manali",
    distance: "200",
    maxPeople: "4"
  }} onChange={() => {}} onSearch={() => {}} searchIcon="Search" />
}`,...(I=(V=l.parameters)==null?void 0:V.docs)==null?void 0:I.source}}};var x,b,y;i.parameters={...i.parameters,docs:{...(x=i.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: "Minimal Fields",
  render: () => {
    const [values, setValues] = useState({});
    return <SearchBarCard fields={[{
      id: "location",
      label: "Destination",
      type: "text",
      placeholder: "Where?"
    }]} values={values} onChange={(id, value) => setValues(prev => ({
      ...prev,
      [id]: value
    }))} onSearch={() => {}} searchIcon="Go" />;
  }
}`,...(y=(b=i.parameters)==null?void 0:b.docs)==null?void 0:y.source}}};const F=["Playground","Default","WithValues","Minimal"];export{c as Default,i as Minimal,t as Playground,l as WithValues,F as __namedExportsOrder,E as default};
