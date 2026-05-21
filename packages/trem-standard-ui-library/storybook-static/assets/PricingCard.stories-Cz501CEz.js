import{R as e}from"./index-Bc2G9s8g.js";import{l as a}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import{s as r}from"./sampleData-SKqcyK29.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const P={title:"Trem UI/Data Display/PricingCard",component:a,tags:["autodocs"],argTypes:{priceText:{control:"text"},cityDisplay:{control:"text"}},args:{tour:r,priceText:"₹24,999 - ₹32,999",cityDisplay:"Delhi → Manali",labels:{pricingTitle:"Trip actions",startingFrom:"Starting from",bookNow:"Book now",contactAgent:"Enquire",save:"Save",saved:"Saved",route:"Route",distance:"Distance",kmUnit:"km",flexible:"Flexible"}}},t={},n={name:"Default",render:()=>e.createElement("div",{style:{maxWidth:340}},e.createElement(a,{tour:r,priceText:"₹24,999 - ₹32,999",cityDisplay:"Delhi → Manali",onBook:()=>{},onContact:()=>{},onShare:()=>{},isFavorited:()=>!1,onFavorite:()=>{}}))},o={name:"Favorited",render:()=>e.createElement("div",{style:{maxWidth:340}},e.createElement(a,{tour:r,priceText:"₹24,999 - ₹32,999",cityDisplay:"Delhi → Manali",onBook:()=>{},onContact:()=>{},onShare:()=>{},isFavorited:()=>!0,onFavorite:()=>{}}))},i={name:"Final Confirmed Price",render:()=>e.createElement("div",{style:{maxWidth:340}},e.createElement(a,{tour:{...r,priceInfo:{min:24999,max:24999,currency:"INR",isFinal:!0},distance:580},priceText:"₹24,999",cityDisplay:"Delhi → Manali",labels:{startingFrom:"Total price",confirmedRate:"Confirmed rate",bookNow:"Book now",contactAgent:"Enquire",route:"Route",distance:"Distance",flexible:"Flexible"},onBook:()=>{},onContact:()=>{},onShare:()=>{},isFavorited:()=>!1,onFavorite:()=>{}}))},s={name:"Within Layout Context",render:()=>e.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 340px",gap:24,maxWidth:900}},e.createElement("div",{className:"trem-storybook-panel",style:{minHeight:400}},e.createElement("p",{style:{color:"var(--text-secondary)"}},"Main content area")),e.createElement(a,{tour:r,priceText:"₹24,999 - ₹32,999",cityDisplay:"Delhi → Manali",onBook:()=>{},onContact:()=>{},onShare:()=>{},isFavorited:()=>!1,onFavorite:()=>{}}))};var c,l,d;t.parameters={...t.parameters,docs:{...(c=t.parameters)==null?void 0:c.docs,source:{originalSource:"{}",...(d=(l=t.parameters)==null?void 0:l.docs)==null?void 0:d.source}}};var m,p,u;n.parameters={...n.parameters,docs:{...(m=n.parameters)==null?void 0:m.docs,source:{originalSource:`{
  name: "Default",
  render: () => <div style={{
    maxWidth: 340
  }}>
      <PricingCard tour={sampleTour} priceText="₹24,999 - ₹32,999" cityDisplay="Delhi → Manali" onBook={() => {}} onContact={() => {}} onShare={() => {}} isFavorited={() => false} onFavorite={() => {}} />
    </div>
}`,...(u=(p=n.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var y,v,x;o.parameters={...o.parameters,docs:{...(y=o.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: "Favorited",
  render: () => <div style={{
    maxWidth: 340
  }}>
      <PricingCard tour={sampleTour} priceText="₹24,999 - ₹32,999" cityDisplay="Delhi → Manali" onBook={() => {}} onContact={() => {}} onShare={() => {}} isFavorited={() => true} onFavorite={() => {}} />
    </div>
}`,...(x=(v=o.parameters)==null?void 0:v.docs)==null?void 0:x.source}}};var g,F,h;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: "Final Confirmed Price",
  render: () => <div style={{
    maxWidth: 340
  }}>
      <PricingCard tour={{
      ...sampleTour,
      priceInfo: {
        min: 24999,
        max: 24999,
        currency: "INR",
        isFinal: true
      },
      distance: 580
    }} priceText="₹24,999" cityDisplay="Delhi → Manali" labels={{
      startingFrom: "Total price",
      confirmedRate: "Confirmed rate",
      bookNow: "Book now",
      contactAgent: "Enquire",
      route: "Route",
      distance: "Distance",
      flexible: "Flexible"
    }} onBook={() => {}} onContact={() => {}} onShare={() => {}} isFavorited={() => false} onFavorite={() => {}} />
    </div>
}`,...(h=(F=i.parameters)==null?void 0:F.docs)==null?void 0:h.source}}};var f,D,C;s.parameters={...s.parameters,docs:{...(f=s.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: "Within Layout Context",
  render: () => <div style={{
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 24,
    maxWidth: 900
  }}>
      <div className="trem-storybook-panel" style={{
      minHeight: 400
    }}>
        <p style={{
        color: "var(--text-secondary)"
      }}>Main content area</p>
      </div>
      <PricingCard tour={sampleTour} priceText="₹24,999 - ₹32,999" cityDisplay="Delhi → Manali" onBook={() => {}} onContact={() => {}} onShare={() => {}} isFavorited={() => false} onFavorite={() => {}} />
    </div>
}`,...(C=(D=s.parameters)==null?void 0:D.docs)==null?void 0:C.source}}};const B=["Playground","Default","Favorited","FinalPrice","Sticky"];export{n as Default,o as Favorited,i as FinalPrice,t as Playground,s as Sticky,B as __namedExportsOrder,P as default};
