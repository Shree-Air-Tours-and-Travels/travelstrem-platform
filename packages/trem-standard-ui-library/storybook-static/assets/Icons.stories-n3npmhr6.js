import{R as e}from"./index-Bc2G9s8g.js";import{I as n}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const g=["alertTriangle","badgeCheck","bell","bookmark","calendar","check","chevronDown","city","compass","destination","download","eye","filter","flight","heart","hotel","mapPin","menuOpen","moreVertical","payment","search","settings","star","tours","user","wallet"],S={title:"Trem UI/Foundation/Icons",component:n,tags:["autodocs"]},a={name:"Icon / Playground",argTypes:{name:{control:"select",options:g},size:{control:{type:"number",min:12,max:64,step:2}}},args:{name:"heart",size:24}},s={name:"Icon / Gallery",render:()=>e.createElement("div",{className:"trem-storybook-icon-grid"},g.map(m=>e.createElement("div",{className:"trem-storybook-icon",key:m},e.createElement(n,{name:m,size:22}),e.createElement("span",null,m))))},o={name:"Icon / Sizes",render:()=>e.createElement("div",{className:"trem-storybook-stack"},e.createElement(n,{name:"compass",size:16}),e.createElement(n,{name:"compass",size:24}),e.createElement(n,{name:"compass",size:32}),e.createElement(n,{name:"compass",size:48}),e.createElement(n,{name:"compass",size:64}))},r={name:"Icon / Themed Examples",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement("div",{className:"trem-storybook-stack"},e.createElement(n,{name:"heart",size:24}),e.createElement(n,{name:"star",size:24}),e.createElement(n,{name:"badgeCheck",size:24}),e.createElement(n,{name:"compass",size:24}),e.createElement(n,{name:"mapPin",size:24})),e.createElement("div",{className:"trem-storybook-stack"},e.createElement(n,{name:"flight",size:24}),e.createElement(n,{name:"hotel",size:24}),e.createElement(n,{name:"payment",size:24}),e.createElement(n,{name:"wallet",size:24}),e.createElement(n,{name:"tours",size:24})))};var t,c,i;a.parameters={...a.parameters,docs:{...(t=a.parameters)==null?void 0:t.docs,source:{originalSource:`{
  name: "Icon / Playground",
  argTypes: {
    name: {
      control: "select",
      options: iconNames
    },
    size: {
      control: {
        type: "number",
        min: 12,
        max: 64,
        step: 2
      }
    }
  },
  args: {
    name: "heart",
    size: 24
  }
}`,...(i=(c=a.parameters)==null?void 0:c.docs)==null?void 0:i.source}}};var l,d,p;s.parameters={...s.parameters,docs:{...(l=s.parameters)==null?void 0:l.docs,source:{originalSource:`{
  name: "Icon / Gallery",
  render: () => <div className="trem-storybook-icon-grid">
      {iconNames.map(name => <div className="trem-storybook-icon" key={name}>
          <Icon name={name} size={22} />
          <span>{name}</span>
        </div>)}
    </div>
}`,...(p=(d=s.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var z,y,u;o.parameters={...o.parameters,docs:{...(z=o.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: "Icon / Sizes",
  render: () => <div className="trem-storybook-stack">
      <Icon name="compass" size={16} />
      <Icon name="compass" size={24} />
      <Icon name="compass" size={32} />
      <Icon name="compass" size={48} />
      <Icon name="compass" size={64} />
    </div>
}`,...(u=(y=o.parameters)==null?void 0:y.docs)==null?void 0:u.source}}};var I,k,E;r.parameters={...r.parameters,docs:{...(I=r.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: "Icon / Themed Examples",
  render: () => <div className="trem-storybook-column">
      <div className="trem-storybook-stack">
        <Icon name="heart" size={24} />
        <Icon name="star" size={24} />
        <Icon name="badgeCheck" size={24} />
        <Icon name="compass" size={24} />
        <Icon name="mapPin" size={24} />
      </div>
      <div className="trem-storybook-stack">
        <Icon name="flight" size={24} />
        <Icon name="hotel" size={24} />
        <Icon name="payment" size={24} />
        <Icon name="wallet" size={24} />
        <Icon name="tours" size={24} />
      </div>
    </div>
}`,...(E=(k=r.parameters)==null?void 0:k.docs)==null?void 0:E.source}}};const T=["Playground","Gallery","Sizes","Themed"];export{s as Gallery,a as Playground,o as Sizes,r as Themed,T as __namedExportsOrder,S as default};
