import{R as s}from"./index-Bc2G9s8g.js";import{g as e}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const v={title:"Trem UI/Layout/Footer",component:e,tags:["autodocs"],argTypes:{brand:{control:"text"},showPortfolio:{control:"boolean"}},args:{brand:"TravelsTREM",links:[{to:"/",label:"Home"},{to:"/tours",label:"Tours"},{to:"/about",label:"About"},{to:"/contact",label:"Contact"}],showPortfolio:!0},parameters:{layout:"fullscreen"}},r={},o={name:"Default Footer",render:()=>s.createElement(e,null),parameters:{layout:"fullscreen"}},a={name:"With Authenticated User",render:()=>s.createElement(e,{user:{name:"Akshat"},brand:"TravelsTREM",showPortfolio:!0}),parameters:{layout:"fullscreen"}},t={name:"Custom Brand",render:()=>s.createElement(e,{brand:"Wanderlust Adventures",links:[{to:"/",label:"Home"},{to:"/destinations",label:"Destinations"},{to:"/offers",label:"Offers"}],showPortfolio:!1}),parameters:{layout:"fullscreen"}},n={name:"Minimal Links",render:()=>s.createElement(e,{brand:"TravelsTREM",links:[{to:"/",label:"Home"},{to:"/contact",label:"Contact"}],showPortfolio:!1}),parameters:{layout:"fullscreen"}};var l,c,m;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:"{}",...(m=(c=r.parameters)==null?void 0:c.docs)==null?void 0:m.source}}};var u,i,d;o.parameters={...o.parameters,docs:{...(u=o.parameters)==null?void 0:u.docs,source:{originalSource:`{
  name: "Default Footer",
  render: () => <Footer />,
  parameters: {
    layout: "fullscreen"
  }
}`,...(d=(i=o.parameters)==null?void 0:i.docs)==null?void 0:d.source}}};var p,f,b;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  name: "With Authenticated User",
  render: () => <Footer user={{
    name: "Akshat"
  }} brand="TravelsTREM" showPortfolio />,
  parameters: {
    layout: "fullscreen"
  }
}`,...(b=(f=a.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var h,y,T;t.parameters={...t.parameters,docs:{...(h=t.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: "Custom Brand",
  render: () => <Footer brand="Wanderlust Adventures" links={[{
    to: "/",
    label: "Home"
  }, {
    to: "/destinations",
    label: "Destinations"
  }, {
    to: "/offers",
    label: "Offers"
  }]} showPortfolio={false} />,
  parameters: {
    layout: "fullscreen"
  }
}`,...(T=(y=t.parameters)==null?void 0:y.docs)==null?void 0:T.source}}};var g,k,E;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: "Minimal Links",
  render: () => <Footer brand="TravelsTREM" links={[{
    to: "/",
    label: "Home"
  }, {
    to: "/contact",
    label: "Contact"
  }]} showPortfolio={false} />,
  parameters: {
    layout: "fullscreen"
  }
}`,...(E=(k=n.parameters)==null?void 0:k.docs)==null?void 0:E.source}}};const A=["Playground","Default","WithUser","CustomBrand","MinimalLinks"];export{t as CustomBrand,o as Default,n as MinimalLinks,r as Playground,a as WithUser,A as __namedExportsOrder,v as default};
