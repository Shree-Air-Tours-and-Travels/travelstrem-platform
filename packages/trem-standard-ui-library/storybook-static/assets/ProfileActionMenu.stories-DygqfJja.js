import{R as e}from"./index-Bc2G9s8g.js";import{m as t}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const P={title:"Trem UI/Navigation/ProfileActionMenu",component:t,tags:["autodocs"],argTypes:{isAuthenticated:{control:"boolean"},theme:{control:"select",options:["light","dark"]},align:{control:"select",options:["start","center","end"]}},args:{user:{name:"Akshat Goyal",email:"akshat@travelstrem.com",role:"admin"},isAuthenticated:!0,theme:"light",settingsLabel:"Settings",logoutLabel:"Logout",align:"end"}},n={},a={name:"Logged In",render:()=>e.createElement("div",{style:{display:"flex",justifyContent:"flex-end"}},e.createElement(t,{user:{name:"Akshat Goyal",email:"akshat@travelstrem.com",role:"admin"},isAuthenticated:!0,theme:"light",onToggleTheme:()=>{},onSettings:()=>{},onLogout:()=>{}}))},r={name:"Logged Out / Guest",render:()=>e.createElement("div",{style:{display:"flex",justifyContent:"flex-end"}},e.createElement(t,{user:null,isAuthenticated:!1,theme:"light"}))},o={name:"Dark Theme",render:()=>e.createElement("div",{style:{display:"flex",justifyContent:"flex-end",padding:16,background:"#1a1a2e",borderRadius:8}},e.createElement(t,{user:{name:"Akshat",email:"akshat@travelstrem.com",role:"admin"},isAuthenticated:!0,theme:"dark",onToggleTheme:()=>{},onSettings:()=>{},onLogout:()=>{}}))},s={name:"Without User Details",render:()=>e.createElement("div",{style:{display:"flex",justifyContent:"flex-end"}},e.createElement(t,{user:{name:"Akshat"},isAuthenticated:!0,theme:"light",settingsLabel:"Preferences",logoutLabel:"Sign Out"}))};var i,l,d;n.parameters={...n.parameters,docs:{...(i=n.parameters)==null?void 0:i.docs,source:{originalSource:"{}",...(d=(l=n.parameters)==null?void 0:l.docs)==null?void 0:d.source}}};var m,u,c;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  name: "Logged In",
  render: () => <div style={{
    display: "flex",
    justifyContent: "flex-end"
  }}>
      <ProfileActionMenu user={{
      name: "Akshat Goyal",
      email: "akshat@travelstrem.com",
      role: "admin"
    }} isAuthenticated={true} theme="light" onToggleTheme={() => {}} onSettings={() => {}} onLogout={() => {}} />
    </div>
}`,...(c=(u=a.parameters)==null?void 0:u.docs)==null?void 0:c.source}}};var g,h,p;r.parameters={...r.parameters,docs:{...(g=r.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: "Logged Out / Guest",
  render: () => <div style={{
    display: "flex",
    justifyContent: "flex-end"
  }}>
      <ProfileActionMenu user={null} isAuthenticated={false} theme="light" />
    </div>
}`,...(p=(h=r.parameters)==null?void 0:h.docs)==null?void 0:p.source}}};var f,y,A;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: "Dark Theme",
  render: () => <div style={{
    display: "flex",
    justifyContent: "flex-end",
    padding: 16,
    background: "#1a1a2e",
    borderRadius: 8
  }}>
      <ProfileActionMenu user={{
      name: "Akshat",
      email: "akshat@travelstrem.com",
      role: "admin"
    }} isAuthenticated={true} theme="dark" onToggleTheme={() => {}} onSettings={() => {}} onLogout={() => {}} />
    </div>
}`,...(A=(y=o.parameters)==null?void 0:y.docs)==null?void 0:A.source}}};var k,L,v;s.parameters={...s.parameters,docs:{...(k=s.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: "Without User Details",
  render: () => <div style={{
    display: "flex",
    justifyContent: "flex-end"
  }}>
      <ProfileActionMenu user={{
      name: "Akshat"
    }} isAuthenticated={true} theme="light" settingsLabel="Preferences" logoutLabel="Sign Out" />
    </div>
}`,...(v=(L=s.parameters)==null?void 0:L.docs)==null?void 0:v.source}}};const E=["Playground","LoggedIn","LoggedOut","DarkTheme","WithoutUser"];export{o as DarkTheme,a as LoggedIn,r as LoggedOut,n as Playground,s as WithoutUser,E as __namedExportsOrder,P as default};
