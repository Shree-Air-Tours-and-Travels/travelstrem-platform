import{R as e,r as W}from"./index-Bc2G9s8g.js";import{B as d,k as c}from"./FavoritesContext-ClvQQ5W1.js";import"./index-BO6cjGmN.js";import{s as r}from"./sampleData-SKqcyK29.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const j={title:"Trem UI/Data Display/Cards",tags:["autodocs"]},a={name:"Tour Card / Playground",component:c,argTypes:{favorited:{control:"boolean"}},args:{tour:r,favorited:!1},render:o=>{const[i,l]=W.useState(o.favorited),R=()=>{};return e.createElement("div",{className:"trem-storybook-column",style:{maxWidth:400}},e.createElement(c,{tour:r,favorited:i,onFavorite:()=>l(I=>!I),onView:R}))}},t={name:"Tour Card / Default",render:()=>{const[o,i]=W.useState(!1);return e.createElement("div",{className:"trem-storybook-column",style:{maxWidth:400}},e.createElement(c,{tour:r,favorited:o,onFavorite:()=>i(l=>!l),onView:()=>{}}))}},n={name:"Tour Card / Favorited",render:()=>e.createElement("div",{className:"trem-storybook-column",style:{maxWidth:400}},e.createElement(c,{tour:r,favorited:!0,onFavorite:()=>{},onView:()=>{}}))},s={name:"Booking Summary / Playground",component:d,argTypes:{startDate:{control:"date"},endDate:{control:"date"},guests:{control:{type:"number",min:1,max:20}}},args:{tour:r,startDate:"2026-06-12",endDate:"2026-06-16",guests:3,priceSnapshot:{perPerson:24999,total:74997,currency:"INR"}},render:o=>e.createElement("div",{className:"trem-storybook-column",style:{maxWidth:400}},e.createElement(d,{tour:r,startDate:o.startDate,endDate:o.endDate,guests:o.guests,priceSnapshot:{perPerson:24999,total:74997,currency:"INR"}}))},m={name:"Booking Summary / Default",render:()=>e.createElement("div",{className:"trem-storybook-column",style:{maxWidth:400}},e.createElement(d,{tour:r,startDate:"2026-06-12",endDate:"2026-06-16",guests:3,priceSnapshot:{perPerson:24999,total:74997,currency:"INR"}}))},u={name:"Booking Summary / Solo Traveller",render:()=>e.createElement("div",{className:"trem-storybook-column",style:{maxWidth:400}},e.createElement(d,{tour:r,startDate:"2026-07-01",endDate:"2026-07-05",guests:1,priceSnapshot:{perPerson:32999,total:32999,currency:"INR"}}))};var p,y,g;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  name: "Tour Card / Playground",
  component: TourCard,
  argTypes: {
    favorited: {
      control: "boolean"
    }
  },
  args: {
    tour: sampleTour,
    favorited: false
  },
  render: args => {
    const [favorited, setFavorited] = useState(args.favorited);
    const onView = () => {};
    return <div className="trem-storybook-column" style={{
      maxWidth: 400
    }}>
        <TourCard tour={sampleTour} favorited={favorited} onFavorite={() => setFavorited(v => !v)} onView={onView} />
      </div>;
  }
}`,...(g=(y=a.parameters)==null?void 0:y.docs)==null?void 0:g.source}}};var v,S,T;t.parameters={...t.parameters,docs:{...(v=t.parameters)==null?void 0:v.docs,source:{originalSource:`{
  name: "Tour Card / Default",
  render: () => {
    const [favorited, setFavorited] = useState(false);
    return <div className="trem-storybook-column" style={{
      maxWidth: 400
    }}>
        <TourCard tour={sampleTour} favorited={favorited} onFavorite={() => setFavorited(value => !value)} onView={() => {}} />
      </div>;
  }
}`,...(T=(S=t.parameters)==null?void 0:S.docs)==null?void 0:T.source}}};var k,D,f;n.parameters={...n.parameters,docs:{...(k=n.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: "Tour Card / Favorited",
  render: () => <div className="trem-storybook-column" style={{
    maxWidth: 400
  }}>
      <TourCard tour={sampleTour} favorited={true} onFavorite={() => {}} onView={() => {}} />
    </div>
}`,...(f=(D=n.parameters)==null?void 0:D.docs)==null?void 0:f.source}}};var h,N,B;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: "Booking Summary / Playground",
  component: BookingSummaryCard,
  argTypes: {
    startDate: {
      control: "date"
    },
    endDate: {
      control: "date"
    },
    guests: {
      control: {
        type: "number",
        min: 1,
        max: 20
      }
    }
  },
  args: {
    tour: sampleTour,
    startDate: "2026-06-12",
    endDate: "2026-06-16",
    guests: 3,
    priceSnapshot: {
      perPerson: 24999,
      total: 74997,
      currency: "INR"
    }
  },
  render: args => <div className="trem-storybook-column" style={{
    maxWidth: 400
  }}>
      <BookingSummaryCard tour={sampleTour} startDate={args.startDate} endDate={args.endDate} guests={args.guests} priceSnapshot={{
      perPerson: 24999,
      total: 74997,
      currency: "INR"
    }} />
    </div>
}`,...(B=(N=s.parameters)==null?void 0:N.docs)==null?void 0:B.source}}};var C,x,b;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: "Booking Summary / Default",
  render: () => <div className="trem-storybook-column" style={{
    maxWidth: 400
  }}>
      <BookingSummaryCard tour={sampleTour} startDate="2026-06-12" endDate="2026-06-16" guests={3} priceSnapshot={{
      perPerson: 24999,
      total: 74997,
      currency: "INR"
    }} />
    </div>
}`,...(b=(x=m.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var F,P,E;u.parameters={...u.parameters,docs:{...(F=u.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: "Booking Summary / Solo Traveller",
  render: () => <div className="trem-storybook-column" style={{
    maxWidth: 400
  }}>
      <BookingSummaryCard tour={sampleTour} startDate="2026-07-01" endDate="2026-07-05" guests={1} priceSnapshot={{
      perPerson: 32999,
      total: 32999,
      currency: "INR"
    }} />
    </div>
}`,...(E=(P=u.parameters)==null?void 0:P.docs)==null?void 0:E.source}}};const q=["TourPlayground","Tour","TourFavorited","BookingSummaryPlayground","BookingSummary","BookingSummarySingle"];export{m as BookingSummary,s as BookingSummaryPlayground,u as BookingSummarySingle,t as Tour,n as TourFavorited,a as TourPlayground,q as __namedExportsOrder,j as default};
