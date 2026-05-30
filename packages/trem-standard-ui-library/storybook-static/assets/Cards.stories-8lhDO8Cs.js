import{R as e,r as z}from"./index-Bc2G9s8g.js";import{r}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import{s as o}from"./sampleData-SKqcyK29.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const $={title:"Trem UI/Data Display/TourCard",tags:["autodocs"]},t={name:"Tour Card / Playground",component:r,argTypes:{favorited:{control:"boolean"},isAdmin:{control:"boolean"},featured:{control:"boolean"},variant:{control:"select",options:["list","grid"]}},args:{tour:{...o,featured:!0},favorited:!1,isAdmin:!1,variant:"list"},render:a=>{const[v,T]=z.useState(a.favorited);return e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{tour:{...o,featured:a.featured},favorited:v,onFavorite:()=>T(J=>!J),onView:()=>{},isAdmin:a.isAdmin,variant:a.variant}))}},n={name:"Tour Card / Default",render:()=>{const[a,v]=z.useState(!1);return e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{tour:o,favorited:a,onFavorite:()=>v(T=>!T),onView:()=>{}}))}},s={name:"Tour Card / Favorited",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{tour:o,favorited:!0,onFavorite:()=>{},onView:()=>{}}))},i={name:"Tour Card / Featured",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{tour:{...o,featured:!0},onView:()=>{}}))},d={name:"Tour Card / Admin View",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{tour:o,isAdmin:!0,onView:()=>{},onEdit:()=>{},onDelete:()=>{}}))},u={name:"Tour Card / Grid Variant",render:()=>e.createElement("div",{className:"trem-storybook-column",style:{maxWidth:400}},e.createElement(r,{tour:o,variant:"grid",onView:()=>{}}))},m={name:"Tour Card / Without Image",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{tour:{...o,photo:null,photos:[]},onView:()=>{}}))},c={name:"Tour Card / With Link Path",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{tour:o,path:"/tours/himalayan-escape",onView:()=>{}}))},l={name:"Tour Card / With Tags",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{tour:{...o,tags:["adventure","himalayas","trekking","nature","photography"]},onView:()=>{}}))},p={name:"Tour Card / Responsive Gallery",render:()=>e.createElement("div",{style:{display:"grid",gap:20,width:"100%"}},e.createElement(r,{tour:o,onView:()=>{}}),e.createElement(r,{tour:{...o,featured:!0,tags:["luxury","honeymoon"]},favorited:!0,onFavorite:()=>{},onView:()=>{}}),e.createElement(r,{tour:{...o,_id:"t2",title:"Kerala Backwaters Houseboat Experience",tags:["houseboat","backwaters"]},isAdmin:!0,onView:()=>{},onEdit:()=>{},onDelete:()=>{}}))};var g,y,f;t.parameters={...t.parameters,docs:{...(g=t.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: "Tour Card / Playground",
  component: TourCard,
  argTypes: {
    favorited: {
      control: "boolean"
    },
    isAdmin: {
      control: "boolean"
    },
    featured: {
      control: "boolean"
    },
    variant: {
      control: "select",
      options: ["list", "grid"]
    }
  },
  args: {
    tour: {
      ...sampleTour,
      featured: true
    },
    favorited: false,
    isAdmin: false,
    variant: "list"
  },
  render: args => {
    const [favorited, setFavorited] = useState(args.favorited);
    return <div className="trem-storybook-column">
        <TourCard tour={{
        ...sampleTour,
        featured: args.featured
      }} favorited={favorited} onFavorite={() => setFavorited(v => !v)} onView={() => {}} isAdmin={args.isAdmin} variant={args.variant} />
      </div>;
  }
}`,...(f=(y=t.parameters)==null?void 0:y.docs)==null?void 0:f.source}}};var w,C,h;n.parameters={...n.parameters,docs:{...(w=n.parameters)==null?void 0:w.docs,source:{originalSource:`{
  name: "Tour Card / Default",
  render: () => {
    const [favorited, setFavorited] = useState(false);
    return <div className="trem-storybook-column">
        <TourCard tour={sampleTour} favorited={favorited} onFavorite={() => setFavorited(v => !v)} onView={() => {}} />
      </div>;
  }
}`,...(h=(C=n.parameters)==null?void 0:C.docs)==null?void 0:h.source}}};var V,b,k;s.parameters={...s.parameters,docs:{...(V=s.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: "Tour Card / Favorited",
  render: () => <div className="trem-storybook-column">
      <TourCard tour={sampleTour} favorited={true} onFavorite={() => {}} onView={() => {}} />
    </div>
}`,...(k=(b=s.parameters)==null?void 0:b.docs)==null?void 0:k.source}}};var E,F,N;i.parameters={...i.parameters,docs:{...(E=i.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: "Tour Card / Featured",
  render: () => <div className="trem-storybook-column">
      <TourCard tour={{
      ...sampleTour,
      featured: true
    }} onView={() => {}} />
    </div>
}`,...(N=(F=i.parameters)==null?void 0:F.docs)==null?void 0:N.source}}};var A,S,W;d.parameters={...d.parameters,docs:{...(A=d.parameters)==null?void 0:A.docs,source:{originalSource:`{
  name: "Tour Card / Admin View",
  render: () => <div className="trem-storybook-column">
      <TourCard tour={sampleTour} isAdmin onView={() => {}} onEdit={() => {}} onDelete={() => {}} />
    </div>
}`,...(W=(S=d.parameters)==null?void 0:S.docs)==null?void 0:W.source}}};var D,x,G;u.parameters={...u.parameters,docs:{...(D=u.parameters)==null?void 0:D.docs,source:{originalSource:`{
  name: "Tour Card / Grid Variant",
  render: () => <div className="trem-storybook-column" style={{
    maxWidth: 400
  }}>
      <TourCard tour={sampleTour} variant="grid" onView={() => {}} />
    </div>
}`,...(G=(x=u.parameters)==null?void 0:x.docs)==null?void 0:G.source}}};var P,R,I;m.parameters={...m.parameters,docs:{...(P=m.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: "Tour Card / Without Image",
  render: () => <div className="trem-storybook-column">
      <TourCard tour={{
      ...sampleTour,
      photo: null,
      photos: []
    }} onView={() => {}} />
    </div>
}`,...(I=(R=m.parameters)==null?void 0:R.docs)==null?void 0:I.source}}};var _,L,B;c.parameters={...c.parameters,docs:{...(_=c.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: "Tour Card / With Link Path",
  render: () => <div className="trem-storybook-column">
      <TourCard tour={sampleTour} path="/tours/himalayan-escape" onView={() => {}} />
    </div>
}`,...(B=(L=c.parameters)==null?void 0:L.docs)==null?void 0:B.source}}};var H,K,O;l.parameters={...l.parameters,docs:{...(H=l.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: "Tour Card / With Tags",
  render: () => <div className="trem-storybook-column">
      <TourCard tour={{
      ...sampleTour,
      tags: ["adventure", "himalayas", "trekking", "nature", "photography"]
    }} onView={() => {}} />
    </div>
}`,...(O=(K=l.parameters)==null?void 0:K.docs)==null?void 0:O.source}}};var U,j,q;p.parameters={...p.parameters,docs:{...(U=p.parameters)==null?void 0:U.docs,source:{originalSource:`{
  name: "Tour Card / Responsive Gallery",
  render: () => <div style={{
    display: "grid",
    gap: 20,
    width: "100%"
  }}>
      <TourCard tour={sampleTour} onView={() => {}} />
      <TourCard tour={{
      ...sampleTour,
      featured: true,
      tags: ["luxury", "honeymoon"]
    }} favorited onFavorite={() => {}} onView={() => {}} />
      <TourCard tour={{
      ...sampleTour,
      _id: "t2",
      title: "Kerala Backwaters Houseboat Experience",
      tags: ["houseboat", "backwaters"]
    }} isAdmin onView={() => {}} onEdit={() => {}} onDelete={() => {}} />
    </div>
}`,...(q=(j=p.parameters)==null?void 0:j.docs)==null?void 0:q.source}}};const ee=["TourPlayground","TourDefault","TourFavorited","TourFeatured","TourAdminView","TourGridView","TourNoImage","TourWithLink","TourWithTags","TourResponsiveGallery"];export{d as TourAdminView,n as TourDefault,s as TourFavorited,i as TourFeatured,u as TourGridView,m as TourNoImage,t as TourPlayground,p as TourResponsiveGallery,c as TourWithLink,l as TourWithTags,ee as __namedExportsOrder,$ as default};
