import{R as e}from"./index-Bc2G9s8g.js";import{n as r}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const a=[{id:"flights-hotels",label:"Flights & Hotels",description:"Book flights and hotels together for the best deals on your next trip.",shortDescription:"Save big on combined flight and hotel bookings.",highlights:["Best rates","24/7 support","Instant confirmation"]},{id:"travel-packages",label:"Travel Packages",description:"Curated travel packages with everything included for a hassle-free vacation.",shortDescription:"All-in-one travel packages curated by experts.",highlights:["Customizable","Guided tours","Meals included"]},{id:"visa-passport",label:"Visa & Passport",description:"Hassle-free visa and passport assistance for international travel.",shortDescription:"Fast and reliable visa processing services.",highlights:["Express service","Document check","Worldwide"]}],W={title:"Trem UI/Data Display/ServiceCard",component:r,tags:["autodocs"],argTypes:{service:{control:"object"}},args:{service:a[0]}},s={},t={name:"Flights & Hotels",render:()=>e.createElement("div",{style:{maxWidth:380}},e.createElement(r,{service:a[0],onClick:()=>{}}))},i={name:"Travel Packages",render:()=>e.createElement("div",{style:{maxWidth:380}},e.createElement(r,{service:a[1],onClick:()=>{}}))},n={name:"Visa & Passport",render:()=>e.createElement("div",{style:{maxWidth:380}},e.createElement(r,{service:a[2],onClick:()=>{}}))},o={name:"Service Gallery",render:()=>e.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))",gap:24,width:"100%"}},a.map(c=>e.createElement(r,{key:c.id,service:c,onClick:()=>{}})))};var l,d,m;s.parameters={...s.parameters,docs:{...(l=s.parameters)==null?void 0:l.docs,source:{originalSource:"{}",...(m=(d=s.parameters)==null?void 0:d.docs)==null?void 0:m.source}}};var p,v,g;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  name: "Flights & Hotels",
  render: () => <div style={{
    maxWidth: 380
  }}>
      <ServiceCard service={sampleServices[0]} onClick={() => {}} />
    </div>
}`,...(g=(v=t.parameters)==null?void 0:v.docs)==null?void 0:g.source}}};var h,u,y;i.parameters={...i.parameters,docs:{...(h=i.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: "Travel Packages",
  render: () => <div style={{
    maxWidth: 380
  }}>
      <ServiceCard service={sampleServices[1]} onClick={() => {}} />
    </div>
}`,...(y=(u=i.parameters)==null?void 0:u.docs)==null?void 0:y.source}}};var k,S,C;n.parameters={...n.parameters,docs:{...(k=n.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: "Visa & Passport",
  render: () => <div style={{
    maxWidth: 380
  }}>
      <ServiceCard service={sampleServices[2]} onClick={() => {}} />
    </div>
}`,...(C=(S=n.parameters)==null?void 0:S.docs)==null?void 0:C.source}}};var f,x,P;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: "Service Gallery",
  render: () => <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 24,
    width: "100%"
  }}>
      {sampleServices.map(s => <ServiceCard key={s.id} service={s} onClick={() => {}} />)}
    </div>
}`,...(P=(x=o.parameters)==null?void 0:x.docs)==null?void 0:P.source}}};const G=["Playground","Default","TravelPackages","VisaPassport","Gallery"];export{t as Default,o as Gallery,s as Playground,i as TravelPackages,n as VisaPassport,G as __namedExportsOrder,W as default};
