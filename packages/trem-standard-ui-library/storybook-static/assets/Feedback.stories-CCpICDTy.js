import{R as e}from"./index-Bc2G9s8g.js";import{E as r,e as g,h as u,c as P}from"./FavoritesContext-ClvQQ5W1.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const ee={title:"Trem UI/Feedback",tags:["autodocs"]},t={name:"Empty State / Playground",component:r,argTypes:{icon:{control:"select",options:["tours","search","heart","bell","bookmark","mapPin"]},title:{control:"text"},description:{control:"text"}},args:{icon:"tours",title:"No tours found",description:"Try a different filter or create a fresh itinerary."},render:y=>e.createElement(r,{icon:y.icon,title:y.title,description:y.description,action:e.createElement(P,{text:"Create tour",variant:"solid",color:"primary"})})},o={name:"Empty State / Default",render:()=>e.createElement(r,{icon:"tours",title:"No tours found",description:"Try a different filter or create a fresh itinerary.",action:e.createElement(P,{text:"Create tour",variant:"solid",color:"primary"})})},a={name:"Empty State / Without Action",render:()=>e.createElement(r,{icon:"search",title:"No results",description:"Your search did not match any tours. Try adjusting your filters."})},n={name:"Empty State / Without Icon",render:()=>e.createElement(r,{title:"Nothing here yet",description:"This section is empty.",action:e.createElement(P,{text:"Get started",variant:"solid",color:"primary"})})},s={name:"Preloader / Playground",component:u,argTypes:{type:{control:"select",options:["cards","app"]},count:{control:{type:"number",min:1,max:8}},text:{control:"text"}},args:{type:"cards",count:4,text:"Loading tours..."}},c={name:"Preloader / Cards",render:()=>e.createElement("div",{className:"trem-storybook-panel"},e.createElement(u,{type:"cards",count:4,text:"Loading tours..."}))},i={name:"Preloader / App",render:()=>e.createElement("div",{className:"trem-storybook-panel"},e.createElement(u,{type:"app",text:"Preparing application..."}))},l={name:"Preloader / Single Card",render:()=>e.createElement("div",{className:"trem-storybook-panel"},e.createElement(u,{type:"cards",count:1}))},p={name:"Loader / Playground",component:g,argTypes:{visible:{control:"boolean"},size:{control:{type:"number",min:40,max:200,step:8}},text:{control:"text"}},args:{visible:!0,size:96,text:"Preparing your TravelsTREM experience..."}},d={name:"Loader / Fullscreen",render:()=>e.createElement(g,{visible:!0,size:96,text:"Preparing Storybook preview..."}),parameters:{layout:"fullscreen"}},m={name:"Loader / Compact",render:()=>e.createElement(g,{visible:!0,size:56,text:"Loading..."}),parameters:{layout:"fullscreen"}};var E,x,b;t.parameters={...t.parameters,docs:{...(E=t.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: "Empty State / Playground",
  component: EmptyState,
  argTypes: {
    icon: {
      control: "select",
      options: ["tours", "search", "heart", "bell", "bookmark", "mapPin"]
    },
    title: {
      control: "text"
    },
    description: {
      control: "text"
    }
  },
  args: {
    icon: "tours",
    title: "No tours found",
    description: "Try a different filter or create a fresh itinerary."
  },
  render: args => <EmptyState icon={args.icon} title={args.title} description={args.description} action={<Button text="Create tour" variant="solid" color="primary" />} />
}`,...(b=(x=t.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var f,S,v;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: "Empty State / Default",
  render: () => <EmptyState icon="tours" title="No tours found" description="Try a different filter or create a fresh itinerary." action={<Button text="Create tour" variant="solid" color="primary" />} />
}`,...(v=(S=o.parameters)==null?void 0:S.docs)==null?void 0:v.source}}};var h,L,T;a.parameters={...a.parameters,docs:{...(h=a.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: "Empty State / Without Action",
  render: () => <EmptyState icon="search" title="No results" description="Your search did not match any tours. Try adjusting your filters." />
}`,...(T=(L=a.parameters)==null?void 0:L.docs)==null?void 0:T.source}}};var N,k,C;n.parameters={...n.parameters,docs:{...(N=n.parameters)==null?void 0:N.docs,source:{originalSource:`{
  name: "Empty State / Without Icon",
  render: () => <EmptyState title="Nothing here yet" description="This section is empty." action={<Button text="Get started" variant="solid" color="primary" />} />
}`,...(C=(k=n.parameters)==null?void 0:k.docs)==null?void 0:C.source}}};var z,A,G;s.parameters={...s.parameters,docs:{...(z=s.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: "Preloader / Playground",
  component: PortalPreloader,
  argTypes: {
    type: {
      control: "select",
      options: ["cards", "app"]
    },
    count: {
      control: {
        type: "number",
        min: 1,
        max: 8
      }
    },
    text: {
      control: "text"
    }
  },
  args: {
    type: "cards",
    count: 4,
    text: "Loading tours..."
  }
}`,...(G=(A=s.parameters)==null?void 0:A.docs)==null?void 0:G.source}}};var I,B,F;c.parameters={...c.parameters,docs:{...(I=c.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: "Preloader / Cards",
  render: () => <div className="trem-storybook-panel">
      <PortalPreloader type="cards" count={4} text="Loading tours..." />
    </div>
}`,...(F=(B=c.parameters)==null?void 0:B.docs)==null?void 0:F.source}}};var R,W,_;i.parameters={...i.parameters,docs:{...(R=i.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: "Preloader / App",
  render: () => <div className="trem-storybook-panel">
      <PortalPreloader type="app" text="Preparing application..." />
    </div>
}`,...(_=(W=i.parameters)==null?void 0:W.docs)==null?void 0:_.source}}};var j,w,D;l.parameters={...l.parameters,docs:{...(j=l.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: "Preloader / Single Card",
  render: () => <div className="trem-storybook-panel">
      <PortalPreloader type="cards" count={1} />
    </div>
}`,...(D=(w=l.parameters)==null?void 0:w.docs)==null?void 0:D.source}}};var M,Y,O;p.parameters={...p.parameters,docs:{...(M=p.parameters)==null?void 0:M.docs,source:{originalSource:`{
  name: "Loader / Playground",
  component: GlobalLoader,
  argTypes: {
    visible: {
      control: "boolean"
    },
    size: {
      control: {
        type: "number",
        min: 40,
        max: 200,
        step: 8
      }
    },
    text: {
      control: "text"
    }
  },
  args: {
    visible: true,
    size: 96,
    text: "Preparing your TravelsTREM experience..."
  }
}`,...(O=(Y=p.parameters)==null?void 0:Y.docs)==null?void 0:O.source}}};var U,q,H;d.parameters={...d.parameters,docs:{...(U=d.parameters)==null?void 0:U.docs,source:{originalSource:`{
  name: "Loader / Fullscreen",
  render: () => <GlobalLoader visible size={96} text="Preparing Storybook preview..." />,
  parameters: {
    layout: "fullscreen"
  }
}`,...(H=(q=d.parameters)==null?void 0:q.docs)==null?void 0:H.source}}};var J,K,Q;m.parameters={...m.parameters,docs:{...(J=m.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: "Loader / Compact",
  render: () => <GlobalLoader visible size={56} text="Loading..." />,
  parameters: {
    layout: "fullscreen"
  }
}`,...(Q=(K=m.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};const re=["EmptyPlayground","Empty","EmptyNoAction","EmptyNoIcon","PreloaderPlayground","Preloader","PreloaderApp","PreloaderSingle","LoaderPlayground","Loader","LoaderCompact"];export{o as Empty,a as EmptyNoAction,n as EmptyNoIcon,t as EmptyPlayground,d as Loader,m as LoaderCompact,p as LoaderPlayground,c as Preloader,i as PreloaderApp,s as PreloaderPlayground,l as PreloaderSingle,re as __namedExportsOrder,ee as default};
