import{R as e}from"./index-Bc2G9s8g.js";import{a as t}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import{s as n}from"./sampleData-SKqcyK29.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const B={title:"Trem UI/Data Display/Booking Summary Card",component:t,tags:["autodocs"],argTypes:{startDate:{control:"date"},endDate:{control:"date"},guests:{control:{type:"number",min:1,max:20}},priceSnapshot:{control:"object"}},args:{tour:n,startDate:"2026-06-12",endDate:"2026-06-16",guests:3,priceSnapshot:{perPerson:24999,total:74997,currency:"INR"}}},r={name:"Booking Summary Card / Playground",render:g=>e.createElement("div",{className:"trem-storybook-column",style:{maxWidth:400}},e.createElement(t,{...g}))},a={name:"Booking Summary Card / Default",render:()=>e.createElement("div",{className:"trem-storybook-column",style:{maxWidth:400}},e.createElement(t,{tour:n,startDate:"2026-06-12",endDate:"2026-06-16",guests:3,priceSnapshot:{perPerson:24999,total:74997,currency:"INR"}}))},o={name:"Booking Summary Card / Solo Traveller",render:()=>e.createElement("div",{className:"trem-storybook-column",style:{maxWidth:400}},e.createElement(t,{tour:n,startDate:"2026-07-01",endDate:"2026-07-05",guests:1,priceSnapshot:{perPerson:32999,total:32999,currency:"INR"}}))};var s,m,c;r.parameters={...r.parameters,docs:{...(s=r.parameters)==null?void 0:s.docs,source:{originalSource:`{
  name: "Booking Summary Card / Playground",
  render: args => <div className="trem-storybook-column" style={{
    maxWidth: 400
  }}>
      <BookingSummaryCard {...args} />
    </div>
}`,...(c=(m=r.parameters)==null?void 0:m.docs)==null?void 0:c.source}}};var l,d,u;a.parameters={...a.parameters,docs:{...(l=a.parameters)==null?void 0:l.docs,source:{originalSource:`{
  name: "Booking Summary Card / Default",
  render: () => <div className="trem-storybook-column" style={{
    maxWidth: 400
  }}>
      <BookingSummaryCard tour={sampleTour} startDate="2026-06-12" endDate="2026-06-16" guests={3} priceSnapshot={{
      perPerson: 24999,
      total: 74997,
      currency: "INR"
    }} />
    </div>
}`,...(u=(d=a.parameters)==null?void 0:d.docs)==null?void 0:u.source}}};var i,p,y;o.parameters={...o.parameters,docs:{...(i=o.parameters)==null?void 0:i.docs,source:{originalSource:`{
  name: "Booking Summary Card / Solo Traveller",
  render: () => <div className="trem-storybook-column" style={{
    maxWidth: 400
  }}>
      <BookingSummaryCard tour={sampleTour} startDate="2026-07-01" endDate="2026-07-05" guests={1} priceSnapshot={{
      perPerson: 32999,
      total: 32999,
      currency: "INR"
    }} />
    </div>
}`,...(y=(p=o.parameters)==null?void 0:p.docs)==null?void 0:y.source}}};const C=["Playground","Default","SoloTraveller"];export{a as Default,r as Playground,o as SoloTraveller,C as __namedExportsOrder,B as default};
