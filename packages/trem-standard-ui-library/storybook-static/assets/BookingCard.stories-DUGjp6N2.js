import{R as i}from"./index-Bc2G9s8g.js";import{B as e}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const n={id:"booking-1",tour:{title:"Himalayan Escape to Manali"},user:{name:"Akshat Goyal"},status:"CONFIRMED",startDate:"2026-06-12",endDate:"2026-06-16",guestsCount:3,travelers:[{_id:"t1",firstName:"Akshat",lastName:"Goyal",email:"akshat@example.com"},{_id:"t2",firstName:"Priya",lastName:"Sharma",email:"priya@example.com"}],priceSnapshot:{perPerson:24999,total:74997,currency:"INR"},paymentSummary:{paid:25e3,remaining:49997,refunded:0}},A={title:"Trem UI/Data Display/BookingCard",component:e,tags:["autodocs"],argTypes:{role:{control:"select",options:["admin","agent","user"]}},args:{booking:n,role:"admin"}},o={},a={name:"Confirmed Booking (Admin)",render:()=>i.createElement(e,{booking:n,role:"admin",onCancel:()=>{},onStatusTransition:()=>{},onRecordPayment:()=>{},onRefund:()=>{},onGenerateQuote:()=>{},onUpdateTravelers:()=>{},onOpen:()=>{}})},r={name:"Paid Booking",render:()=>i.createElement(e,{booking:{...n,status:"PAID"},role:"admin",onCancel:()=>{},onStatusTransition:()=>{},onRecordPayment:()=>{},onRefund:()=>{},onGenerateQuote:()=>{},onUpdateTravelers:()=>{},onOpen:()=>{}})},t={name:"Draft Booking (Quote Pending)",render:()=>i.createElement(e,{booking:{...n,status:"DRAFT",priceSnapshot:{total:0,currency:"INR"},paymentSummary:{paid:0,remaining:0,refunded:0}},role:"admin",onCancel:()=>{},onStatusTransition:()=>{},onRecordPayment:()=>{},onRefund:()=>{},onGenerateQuote:()=>{},onUpdateTravelers:()=>{},onOpen:()=>{}})},s={name:"Cancelled Booking",render:()=>i.createElement(e,{booking:{...n,status:"CANCELLED"},role:"admin",onCancel:()=>{},onStatusTransition:()=>{},onRecordPayment:()=>{},onRefund:()=>{},onGenerateQuote:()=>{},onUpdateTravelers:()=>{},onOpen:()=>{}})};var d,m,c;o.parameters={...o.parameters,docs:{...(d=o.parameters)==null?void 0:d.docs,source:{originalSource:"{}",...(c=(m=o.parameters)==null?void 0:m.docs)==null?void 0:c.source}}};var l,u,p;a.parameters={...a.parameters,docs:{...(l=a.parameters)==null?void 0:l.docs,source:{originalSource:`{
  name: "Confirmed Booking (Admin)",
  render: () => <BookingCard booking={sampleBooking} role="admin" onCancel={() => {}} onStatusTransition={() => {}} onRecordPayment={() => {}} onRefund={() => {}} onGenerateQuote={() => {}} onUpdateTravelers={() => {}} onOpen={() => {}} />
}`,...(p=(u=a.parameters)==null?void 0:u.docs)==null?void 0:p.source}}};var g,k,C;r.parameters={...r.parameters,docs:{...(g=r.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: "Paid Booking",
  render: () => <BookingCard booking={{
    ...sampleBooking,
    status: "PAID"
  }} role="admin" onCancel={() => {}} onStatusTransition={() => {}} onRecordPayment={() => {}} onRefund={() => {}} onGenerateQuote={() => {}} onUpdateTravelers={() => {}} onOpen={() => {}} />
}`,...(C=(k=r.parameters)==null?void 0:k.docs)==null?void 0:C.source}}};var y,f,R;t.parameters={...t.parameters,docs:{...(y=t.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: "Draft Booking (Quote Pending)",
  render: () => <BookingCard booking={{
    ...sampleBooking,
    status: "DRAFT",
    priceSnapshot: {
      total: 0,
      currency: "INR"
    },
    paymentSummary: {
      paid: 0,
      remaining: 0,
      refunded: 0
    }
  }} role="admin" onCancel={() => {}} onStatusTransition={() => {}} onRecordPayment={() => {}} onRefund={() => {}} onGenerateQuote={() => {}} onUpdateTravelers={() => {}} onOpen={() => {}} />
}`,...(R=(f=t.parameters)==null?void 0:f.docs)==null?void 0:R.source}}};var S,B,P;s.parameters={...s.parameters,docs:{...(S=s.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: "Cancelled Booking",
  render: () => <BookingCard booking={{
    ...sampleBooking,
    status: "CANCELLED"
  }} role="admin" onCancel={() => {}} onStatusTransition={() => {}} onRecordPayment={() => {}} onRefund={() => {}} onGenerateQuote={() => {}} onUpdateTravelers={() => {}} onOpen={() => {}} />
}`,...(P=(B=s.parameters)==null?void 0:B.docs)==null?void 0:P.source}}};const G=["Playground","Default","PaidStatus","DraftStatus","Cancelled"];export{s as Cancelled,a as Default,t as DraftStatus,r as PaidStatus,o as Playground,G as __namedExportsOrder,A as default};
