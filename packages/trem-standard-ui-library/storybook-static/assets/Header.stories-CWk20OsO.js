import{R as s}from"./index-Bc2G9s8g.js";import{H as a}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import{h as r}from"./sampleData-SKqcyK29.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const y={title:"Trem UI/Layout/Header",component:a,tags:["autodocs"],parameters:{layout:"fullscreen"},argTypes:{theme:{control:"select",options:["light","dark"]}},args:{headerConfig:{brand:{label:"TravelsTREM",homePath:"/"},leftSection:{welcome:!0,showStatus:!0,showNotifications:!0},menu:r,authActions:{login:{label:"Login",path:"/login"},logout:{label:"Logout"}}},theme:"light",showNotifications:!0}},e={},n={name:"Logged Out",render:()=>s.createElement(a,{headerConfig:{brand:{label:"TravelsTREM",homePath:"/"},leftSection:{welcome:!0,showStatus:!0,showNotifications:!0},menu:r,authActions:{login:{label:"Login",path:"/login"},logout:{label:"Logout"}}},session:null,theme:"light",showNotifications:!1}),parameters:{layout:"fullscreen"}},o={name:"Logged In",render:()=>s.createElement(a,{headerConfig:{brand:{label:"TravelsTREM",homePath:"/"},leftSection:{welcome:!0,showStatus:!0,showNotifications:!0},menu:r,authActions:{login:{label:"Login",path:"/login"},logout:{label:"Logout"}}},session:{isAuthenticated:!0,user:{name:"Akshat Goyal",email:"akshat@travelstrem.com",role:"admin"}},theme:"light"}),parameters:{layout:"fullscreen"}},t={name:"Minimal Navigation",render:()=>s.createElement(a,{headerConfig:{brand:{label:"TravelsTREM",homePath:"/"},leftSection:{welcome:!1,showStatus:!1,showNotifications:!1},menu:[],authActions:{login:{label:"Login",path:"/login"},logout:{label:"Logout"}}},session:null,theme:"light",showNotifications:!1}),parameters:{layout:"fullscreen"}};var l,i,u;e.parameters={...e.parameters,docs:{...(l=e.parameters)==null?void 0:l.docs,source:{originalSource:"{}",...(u=(i=e.parameters)==null?void 0:i.docs)==null?void 0:u.source}}};var m,c,h;n.parameters={...n.parameters,docs:{...(m=n.parameters)==null?void 0:m.docs,source:{originalSource:`{
  name: "Logged Out",
  render: () => <Header headerConfig={{
    brand: {
      label: "TravelsTREM",
      homePath: "/"
    },
    leftSection: {
      welcome: true,
      showStatus: true,
      showNotifications: true
    },
    menu: headerNavItems,
    authActions: {
      login: {
        label: "Login",
        path: "/login"
      },
      logout: {
        label: "Logout"
      }
    }
  }} session={null} theme="light" showNotifications={false} />,
  parameters: {
    layout: "fullscreen"
  }
}`,...(h=(c=n.parameters)==null?void 0:c.docs)==null?void 0:h.source}}};var g,d,f;o.parameters={...o.parameters,docs:{...(g=o.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: "Logged In",
  render: () => <Header headerConfig={{
    brand: {
      label: "TravelsTREM",
      homePath: "/"
    },
    leftSection: {
      welcome: true,
      showStatus: true,
      showNotifications: true
    },
    menu: headerNavItems,
    authActions: {
      login: {
        label: "Login",
        path: "/login"
      },
      logout: {
        label: "Logout"
      }
    }
  }} session={{
    isAuthenticated: true,
    user: {
      name: "Akshat Goyal",
      email: "akshat@travelstrem.com",
      role: "admin"
    }
  }} theme="light" />,
  parameters: {
    layout: "fullscreen"
  }
}`,...(f=(d=o.parameters)==null?void 0:d.docs)==null?void 0:f.source}}};var p,b,w;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  name: "Minimal Navigation",
  render: () => <Header headerConfig={{
    brand: {
      label: "TravelsTREM",
      homePath: "/"
    },
    leftSection: {
      welcome: false,
      showStatus: false,
      showNotifications: false
    },
    menu: [],
    authActions: {
      login: {
        label: "Login",
        path: "/login"
      },
      logout: {
        label: "Logout"
      }
    }
  }} session={null} theme="light" showNotifications={false} />,
  parameters: {
    layout: "fullscreen"
  }
}`,...(w=(b=t.parameters)==null?void 0:b.docs)==null?void 0:w.source}}};const A=["Playground","LoggedOut","LoggedIn","Minimal"];export{o as LoggedIn,n as LoggedOut,t as Minimal,e as Playground,A as __namedExportsOrder,y as default};
