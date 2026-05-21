import{R as e,r as Y}from"./index-Bc2G9s8g.js";import{d as g,Q as u,F as v}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import{q as p}from"./sampleData-SKqcyK29.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const te={title:"Trem UI/Navigation",tags:["autodocs"]},a={name:"Breadcrumbs / Playground",component:g,argTypes:{items:{control:"object"}},args:{items:[{label:"Home",path:"/"},{label:"Tours",path:"/tours"},{label:"Himalayan Escape"}]}},n={name:"Breadcrumbs / Default",render:()=>e.createElement(g,{items:[{label:"Tours",path:"/tours"},{label:"Himalayan Escape",path:"/tours/himalayan-escape"},{label:"Booking"}]})},r={name:"Breadcrumbs / Root Only",render:()=>e.createElement(g,{items:[{label:"Home",path:"/"}]})},t={name:"Breadcrumbs / Deep Nesting",render:()=>e.createElement(g,{items:[{label:"Home",path:"/"},{label:"Tours",path:"/tours"},{label:"Asia",path:"/tours/asia"},{label:"India",path:"/tours/asia/india"},{label:"Manali Adventure"}]})},i={name:"Chips / Playground",component:u,argTypes:{activeId:{control:"select",options:["all","adventure","family","luxury"]}},args:{filters:p,activeId:"all"},render:b=>{const[h,Z]=Y.useState(b.activeId);return e.createElement(u,{filters:p,activeId:h,onClick:Z})}},o={name:"Chips / Default",render:()=>{const[b,h]=Y.useState("all");return e.createElement(u,{filters:p,activeId:b,onClick:h})}},l={name:"Chips / With Active Selection",render:()=>e.createElement(u,{filters:p,activeId:"adventure",onClick:()=>{}})},s={name:"Floating Actions / Playground",component:v,argTypes:{variant:{control:"select",options:["inline","floating"]},align:{control:"select",options:["left","center","right"]}},args:{variant:"inline",align:"left",actions:[{label:"Save",variant:"primary",iconLeft:"check"},{label:"Preview",variant:"outline",iconLeft:"eye"},{label:"Share",iconLeft:"share",overflowMobile:!0}]}},c={name:"Floating Actions / Inline",render:()=>e.createElement(v,{variant:"inline",align:"left",actions:[{label:"Save",variant:"primary",iconLeft:"check"},{label:"Preview",variant:"outline",iconLeft:"eye"},{label:"Share",iconLeft:"share",overflowMobile:!0},{label:"Delete",variant:"danger",iconLeft:"x",overflowMobile:!0}]})},m={name:"Floating Actions / Floating",render:()=>e.createElement("div",{style:{minHeight:200,position:"relative"}},e.createElement(v,{variant:"floating",align:"center",actions:[{label:"Save",variant:"primary",iconLeft:"check"},{label:"Cancel",variant:"outline",iconLeft:"x"}]}))},d={name:"Floating Actions / Right Aligned",render:()=>e.createElement(v,{variant:"inline",align:"right",actions:[{label:"Edit",variant:"outline",iconLeft:"eye"},{label:"Delete",variant:"danger",iconLeft:"x"}]})};var f,y,A;a.parameters={...a.parameters,docs:{...(f=a.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: "Breadcrumbs / Playground",
  component: Breadcrumbs,
  argTypes: {
    items: {
      control: "object"
    }
  },
  args: {
    items: [{
      label: "Home",
      path: "/"
    }, {
      label: "Tours",
      path: "/tours"
    }, {
      label: "Himalayan Escape"
    }]
  }
}`,...(A=(y=a.parameters)==null?void 0:y.docs)==null?void 0:A.source}}};var F,S,B;n.parameters={...n.parameters,docs:{...(F=n.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: "Breadcrumbs / Default",
  render: () => <Breadcrumbs items={[{
    label: "Tours",
    path: "/tours"
  }, {
    label: "Himalayan Escape",
    path: "/tours/himalayan-escape"
  }, {
    label: "Booking"
  }]} />
}`,...(B=(S=n.parameters)==null?void 0:S.docs)==null?void 0:B.source}}};var I,C,k;r.parameters={...r.parameters,docs:{...(I=r.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: "Breadcrumbs / Root Only",
  render: () => <Breadcrumbs items={[{
    label: "Home",
    path: "/"
  }]} />
}`,...(k=(C=r.parameters)==null?void 0:C.docs)==null?void 0:k.source}}};var L,E,P;t.parameters={...t.parameters,docs:{...(L=t.parameters)==null?void 0:L.docs,source:{originalSource:`{
  name: "Breadcrumbs / Deep Nesting",
  render: () => <Breadcrumbs items={[{
    label: "Home",
    path: "/"
  }, {
    label: "Tours",
    path: "/tours"
  }, {
    label: "Asia",
    path: "/tours/asia"
  }, {
    label: "India",
    path: "/tours/asia/india"
  }, {
    label: "Manali Adventure"
  }]} />
}`,...(P=(E=t.parameters)==null?void 0:E.docs)==null?void 0:P.source}}};var T,D,H;i.parameters={...i.parameters,docs:{...(T=i.parameters)==null?void 0:T.docs,source:{originalSource:`{
  name: "Chips / Playground",
  component: QuickChips,
  argTypes: {
    activeId: {
      control: "select",
      options: ["all", "adventure", "family", "luxury"]
    }
  },
  args: {
    filters: quickFilters,
    activeId: "all"
  },
  render: args => {
    const [activeId, setActiveId] = useState(args.activeId);
    return <QuickChips filters={quickFilters} activeId={activeId} onClick={setActiveId} />;
  }
}`,...(H=(D=i.parameters)==null?void 0:D.docs)==null?void 0:H.source}}};var x,w,R;o.parameters={...o.parameters,docs:{...(x=o.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: "Chips / Default",
  render: () => {
    const [activeId, setActiveId] = useState("all");
    return <QuickChips filters={quickFilters} activeId={activeId} onClick={setActiveId} />;
  }
}`,...(R=(w=o.parameters)==null?void 0:w.docs)==null?void 0:R.source}}};var M,q,Q;l.parameters={...l.parameters,docs:{...(M=l.parameters)==null?void 0:M.docs,source:{originalSource:`{
  name: "Chips / With Active Selection",
  render: () => <QuickChips filters={quickFilters} activeId="adventure" onClick={() => {}} />
}`,...(Q=(q=l.parameters)==null?void 0:q.docs)==null?void 0:Q.source}}};var N,W,O;s.parameters={...s.parameters,docs:{...(N=s.parameters)==null?void 0:N.docs,source:{originalSource:`{
  name: "Floating Actions / Playground",
  component: FloatingActionBar,
  argTypes: {
    variant: {
      control: "select",
      options: ["inline", "floating"]
    },
    align: {
      control: "select",
      options: ["left", "center", "right"]
    }
  },
  args: {
    variant: "inline",
    align: "left",
    actions: [{
      label: "Save",
      variant: "primary",
      iconLeft: "check"
    }, {
      label: "Preview",
      variant: "outline",
      iconLeft: "eye"
    }, {
      label: "Share",
      iconLeft: "share",
      overflowMobile: true
    }]
  }
}`,...(O=(W=s.parameters)==null?void 0:W.docs)==null?void 0:O.source}}};var _,j,U;c.parameters={...c.parameters,docs:{...(_=c.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: "Floating Actions / Inline",
  render: () => <FloatingActionBar variant="inline" align="left" actions={[{
    label: "Save",
    variant: "primary",
    iconLeft: "check"
  }, {
    label: "Preview",
    variant: "outline",
    iconLeft: "eye"
  }, {
    label: "Share",
    iconLeft: "share",
    overflowMobile: true
  }, {
    label: "Delete",
    variant: "danger",
    iconLeft: "x",
    overflowMobile: true
  }]} />
}`,...(U=(j=c.parameters)==null?void 0:j.docs)==null?void 0:U.source}}};var z,G,J;m.parameters={...m.parameters,docs:{...(z=m.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: "Floating Actions / Floating",
  render: () => <div style={{
    minHeight: 200,
    position: "relative"
  }}>
      <FloatingActionBar variant="floating" align="center" actions={[{
      label: "Save",
      variant: "primary",
      iconLeft: "check"
    }, {
      label: "Cancel",
      variant: "outline",
      iconLeft: "x"
    }]} />
    </div>
}`,...(J=(G=m.parameters)==null?void 0:G.docs)==null?void 0:J.source}}};var K,V,X;d.parameters={...d.parameters,docs:{...(K=d.parameters)==null?void 0:K.docs,source:{originalSource:`{
  name: "Floating Actions / Right Aligned",
  render: () => <FloatingActionBar variant="inline" align="right" actions={[{
    label: "Edit",
    variant: "outline",
    iconLeft: "eye"
  }, {
    label: "Delete",
    variant: "danger",
    iconLeft: "x"
  }]} />
}`,...(X=(V=d.parameters)==null?void 0:V.docs)==null?void 0:X.source}}};const ie=["BreadcrumbPlayground","BreadcrumbTrail","BreadcrumbRoot","BreadcrumbDeep","ChipsPlayground","Chips","ChipsWithSelection","FloatingActionsPlayground","FloatingActions","FloatingActionsFloating","FloatingActionsRight"];export{t as BreadcrumbDeep,a as BreadcrumbPlayground,r as BreadcrumbRoot,n as BreadcrumbTrail,o as Chips,i as ChipsPlayground,l as ChipsWithSelection,c as FloatingActions,m as FloatingActionsFloating,s as FloatingActionsPlayground,d as FloatingActionsRight,ie as __namedExportsOrder,te as default};
