import{R as e}from"./index-Bc2G9s8g.js";import{p as t}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const s={"Booking Statuses":["DRAFT","QUOTE_REQUESTED","UNDER_REVIEW","QUOTE_READY","QUOTE_SENT","CUSTOMER_ACCEPTED","CUSTOMER_REJECTED","PAYMENT_PENDING","PARTIALLY_PAID","PAID","CONFIRMED","TICKETING","TICKETED","TRAVEL_READY","COMPLETED","CANCELLED","REFUND_PENDING","REFUNDED"],"Payment Statuses":["UNPAID","PARTIAL","PAID","REFUND_PENDING","REFUNDED","FAILED"],"Quote Statuses":["DRAFT","READY","SENT","ACCEPTED","REJECTED","EXPIRED"],"Document Statuses":["PENDING","UPLOADED","APPROVED","REJECTED"],"Document Checklist":["PENDING","PARTIAL","COMPLETE"],"Tour Statuses":["draft","published","cancelled"]},_={title:"Trem UI/Data Display/StatusBadge",component:t,tags:["autodocs"],argTypes:{value:{control:"select",options:Object.values(s).flat()},tone:{control:"select",options:["neutral","info","success","warning","danger","secondary",void 0]},size:{control:"select",options:["sm","md","lg"]}},args:{value:"CONFIRMED",size:"md"}},r={},n={render:()=>e.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},e.createElement(t,{value:"CONFIRMED",size:"sm"}),e.createElement(t,{value:"CONFIRMED",size:"md"}),e.createElement(t,{value:"CONFIRMED",size:"lg"}))},o={render:()=>e.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:8}},s["Booking Statuses"].map(a=>e.createElement(t,{key:a,value:a})))},l={render:()=>e.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:8}},s["Payment Statuses"].map(a=>e.createElement(t,{key:a,value:a})))},p={render:()=>e.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:8}},s["Quote Statuses"].map(a=>e.createElement(t,{key:a,value:a})))},u={name:"StatusBadgeLibrary",render:()=>e.createElement("div",{style:{fontFamily:"sans-serif",maxWidth:800}},Object.entries(s).map(([a,O])=>e.createElement("div",{key:a,style:{marginBottom:24}},e.createElement("h3",{style:{margin:"0 0 8px",fontSize:14,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.05em"}},a),e.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:8}},O.map(i=>e.createElement(t,{key:i,value:i}))))))};var m,d,c;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:"{}",...(c=(d=r.parameters)==null?void 0:d.docs)==null?void 0:c.source}}};var E,g,y;n.parameters={...n.parameters,docs:{...(E=n.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    alignItems: "center",
    gap: 12
  }}>
      <StatusBadge value="CONFIRMED" size="sm" />
      <StatusBadge value="CONFIRMED" size="md" />
      <StatusBadge value="CONFIRMED" size="lg" />
    </div>
}`,...(y=(g=n.parameters)==null?void 0:g.docs)==null?void 0:y.source}}};var S,D,v;o.parameters={...o.parameters,docs:{...(S=o.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  }}>
      {statusGroups["Booking Statuses"].map(s => <StatusBadge key={s} value={s} />)}
    </div>
}`,...(v=(D=o.parameters)==null?void 0:D.docs)==null?void 0:v.source}}};var f,R,T;l.parameters={...l.parameters,docs:{...(f=l.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  }}>
      {statusGroups["Payment Statuses"].map(s => <StatusBadge key={s} value={s} />)}
    </div>
}`,...(T=(R=l.parameters)==null?void 0:R.docs)==null?void 0:T.source}}};var I,N,P;p.parameters={...p.parameters,docs:{...(I=p.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  }}>
      {statusGroups["Quote Statuses"].map(s => <StatusBadge key={s} value={s} />)}
    </div>
}`,...(P=(N=p.parameters)==null?void 0:N.docs)==null?void 0:P.source}}};var x,A,C;u.parameters={...u.parameters,docs:{...(x=u.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: "StatusBadgeLibrary",
  render: () => <div style={{
    fontFamily: "sans-serif",
    maxWidth: 800
  }}>
      {Object.entries(statusGroups).map(([group, statuses]) => <div key={group} style={{
      marginBottom: 24
    }}>
          <h3 style={{
        margin: "0 0 8px",
        fontSize: 14,
        fontWeight: 700,
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
            {group}
          </h3>
          <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8
      }}>
            {statuses.map(s => <StatusBadge key={s} value={s} />)}
          </div>
        </div>)}
    </div>
}`,...(C=(A=u.parameters)==null?void 0:A.docs)==null?void 0:C.source}}};const L=["Playground","Sizes","BookingStatuses","PaymentStatuses","QuoteStatuses","AllStatuses"];export{u as AllStatuses,o as BookingStatuses,l as PaymentStatuses,r as Playground,p as QuoteStatuses,n as Sizes,L as __namedExportsOrder,_ as default};
