import{R as e}from"./index-Bc2G9s8g.js";import{P as t,q as r,T as a,i as Z}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const re={title:"Trem UI/Foundation/Typography",tags:["autodocs"]},n={name:"Title / Playground",component:a,argTypes:{variant:{control:"select",options:["primary","light","secondary"]},size:{control:"select",options:["small","large"]},align:{control:"select",options:["left","center","right"]},text:{control:"text"}},args:{text:"Travel components for every flow",variant:"primary",size:"large"}},o={name:"Title / Variants",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(a,{text:"Primary Title",variant:"primary",size:"large"}),e.createElement(a,{text:"Light Title",variant:"light",size:"large"}),e.createElement(a,{text:"Secondary Title",variant:"secondary",size:"large"}))},s={name:"Title / Sizes",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(a,{text:"Title , Large",size:"large",variant:"primary"}),e.createElement(a,{text:"Title , Small",size:"small",variant:"primary"}))},i={name:"Title / Alignments",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(a,{text:"Left aligned",align:"left"}),e.createElement(a,{text:"Center aligned",align:"center"}),e.createElement(a,{text:"Right aligned",align:"right"}))},l={name:"SubTitle / Playground",component:r,argTypes:{variant:{control:"select",options:["primary","secondary","tertiary","light"]},size:{control:"select",options:["small","medium","large"]},text:{control:"text"}},args:{text:"Reusable system pieces for portals, tours, booking, and customer journeys.",variant:"tertiary",size:"medium"}},c={name:"SubTitle / Variants",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{text:"Primary SubTitle",variant:"primary"}),e.createElement(r,{text:"Secondary SubTitle",variant:"secondary"}),e.createElement(r,{text:"Tertiary SubTitle",variant:"tertiary"}),e.createElement(r,{text:"Light SubTitle",variant:"light"}))},m={name:"SubTitle / Sizes",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{text:"SubTitle , Large",size:"large",variant:"secondary"}),e.createElement(r,{text:"SubTitle , Medium",size:"medium",variant:"secondary"}),e.createElement(r,{text:"SubTitle , Small",size:"small",variant:"secondary"}))},d={name:"Paragraph / Playground",component:t,argTypes:{text:{control:"text"},variant:{control:"select",options:["body","caption","lead"]},size:{control:"select",options:["small","medium","large"]},color:{control:"color"},align:{control:"select",options:["left","center","right"]}},args:{text:"The mountains are calling, and I must go. A journey through the Himalayas offers breathtaking views, serene landscapes, and unforgettable experiences.",variant:"body",size:"medium"}},g={name:"Paragraph / Variants",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(t,{text:"Body paragraph — the default workhorse for most UI copy. Use it for descriptions, details, and general content.",variant:"body"}),e.createElement(t,{text:"Lead paragraph — a slightly larger style for introductory or highlighted text sections.",variant:"lead"}),e.createElement(t,{text:"Caption paragraph — smaller text for footnotes, labels, and auxiliary information.",variant:"caption"}))},p={name:"Paragraph / Sizes",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(t,{text:"Large paragraph size — suitable for hero sections or prominent copy.",size:"large"}),e.createElement(t,{text:"Medium paragraph size — the default balanced size for body content.",size:"medium"}),e.createElement(t,{text:"Small paragraph size — compact text for dense layouts.",size:"small"}))},u={name:"Paragraph / Colors & Alignment",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(t,{text:"Primary text color (default) — blends with theme."}),e.createElement(t,{text:"Custom color — using the color prop for brand accents.",color:"#e67e22"}),e.createElement(t,{text:"Center aligned text — great for callouts and banners.",align:"center"}),e.createElement(t,{text:"Right aligned text — useful for sidebars and metadata.",align:"right"}))},y={name:"Combined Usage",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(a,{text:"Travel components for every flow",size:"large"}),e.createElement(r,{text:"Reusable system pieces for portals, tours, booking, and customer journeys."}),e.createElement(t,{text:"Compose pages with shared Trem UI pieces and keep visual language consistent across apps."}),e.createElement("p",null,"Highlight terms like ",e.createElement(Z,null,"shared Trem UI")," pieces to draw attention."))};var h,T,x;n.parameters={...n.parameters,docs:{...(h=n.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: "Title / Playground",
  component: Title,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "light", "secondary"]
    },
    size: {
      control: "select",
      options: ["small", "large"]
    },
    align: {
      control: "select",
      options: ["left", "center", "right"]
    },
    text: {
      control: "text"
    }
  },
  args: {
    text: "Travel components for every flow",
    variant: "primary",
    size: "large"
  }
}`,...(x=(T=n.parameters)==null?void 0:T.docs)==null?void 0:x.source}}};var b,v,S;o.parameters={...o.parameters,docs:{...(b=o.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: "Title / Variants",
  render: () => <div className="trem-storybook-column">
      <Title text="Primary Title" variant="primary" size="large" />
      <Title text="Light Title" variant="light" size="large" />
      <Title text="Secondary Title" variant="secondary" size="large" />
    </div>
}`,...(S=(v=o.parameters)==null?void 0:v.docs)==null?void 0:S.source}}};var f,z,P;s.parameters={...s.parameters,docs:{...(f=s.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: "Title / Sizes",
  render: () => <div className="trem-storybook-column">
      <Title text="Title , Large" size="large" variant="primary" />
      <Title text="Title , Small" size="small" variant="primary" />
    </div>
}`,...(P=(z=s.parameters)==null?void 0:z.docs)==null?void 0:P.source}}};var E,k,N;i.parameters={...i.parameters,docs:{...(E=i.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: "Title / Alignments",
  render: () => <div className="trem-storybook-column">
      <Title text="Left aligned" align="left" />
      <Title text="Center aligned" align="center" />
      <Title text="Right aligned" align="right" />
    </div>
}`,...(N=(k=i.parameters)==null?void 0:k.docs)==null?void 0:N.source}}};var C,w,L;l.parameters={...l.parameters,docs:{...(C=l.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: "SubTitle / Playground",
  component: SubTitle,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "light"]
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"]
    },
    text: {
      control: "text"
    }
  },
  args: {
    text: "Reusable system pieces for portals, tours, booking, and customer journeys.",
    variant: "tertiary",
    size: "medium"
  }
}`,...(L=(w=l.parameters)==null?void 0:w.docs)==null?void 0:L.source}}};var V,U,R;c.parameters={...c.parameters,docs:{...(V=c.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: "SubTitle / Variants",
  render: () => <div className="trem-storybook-column">
      <SubTitle text="Primary SubTitle" variant="primary" />
      <SubTitle text="Secondary SubTitle" variant="secondary" />
      <SubTitle text="Tertiary SubTitle" variant="tertiary" />
      <SubTitle text="Light SubTitle" variant="light" />
    </div>
}`,...(R=(U=c.parameters)==null?void 0:U.docs)==null?void 0:R.source}}};var H,I,A;m.parameters={...m.parameters,docs:{...(H=m.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: "SubTitle / Sizes",
  render: () => <div className="trem-storybook-column">
      <SubTitle text="SubTitle , Large" size="large" variant="secondary" />
      <SubTitle text="SubTitle , Medium" size="medium" variant="secondary" />
      <SubTitle text="SubTitle , Small" size="small" variant="secondary" />
    </div>
}`,...(A=(I=m.parameters)==null?void 0:I.docs)==null?void 0:A.source}}};var j,M,_;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: "Paragraph / Playground",
  component: Paragraph,
  argTypes: {
    text: {
      control: "text"
    },
    variant: {
      control: "select",
      options: ["body", "caption", "lead"]
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"]
    },
    color: {
      control: "color"
    },
    align: {
      control: "select",
      options: ["left", "center", "right"]
    }
  },
  args: {
    text: "The mountains are calling, and I must go. A journey through the Himalayas offers breathtaking views, serene landscapes, and unforgettable experiences.",
    variant: "body",
    size: "medium"
  }
}`,...(_=(M=d.parameters)==null?void 0:M.docs)==null?void 0:_.source}}};var B,q,F;g.parameters={...g.parameters,docs:{...(B=g.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: "Paragraph / Variants",
  render: () => <div className="trem-storybook-column">
      <Paragraph text="Body paragraph — the default workhorse for most UI copy. Use it for descriptions, details, and general content." variant="body" />
      <Paragraph text="Lead paragraph — a slightly larger style for introductory or highlighted text sections." variant="lead" />
      <Paragraph text="Caption paragraph — smaller text for footnotes, labels, and auxiliary information." variant="caption" />
    </div>
}`,...(F=(q=g.parameters)==null?void 0:q.docs)==null?void 0:F.source}}};var O,D,G;p.parameters={...p.parameters,docs:{...(O=p.parameters)==null?void 0:O.docs,source:{originalSource:`{
  name: "Paragraph / Sizes",
  render: () => <div className="trem-storybook-column">
      <Paragraph text="Large paragraph size — suitable for hero sections or prominent copy." size="large" />
      <Paragraph text="Medium paragraph size — the default balanced size for body content." size="medium" />
      <Paragraph text="Small paragraph size — compact text for dense layouts." size="small" />
    </div>
}`,...(G=(D=p.parameters)==null?void 0:D.docs)==null?void 0:G.source}}};var J,K,Q;u.parameters={...u.parameters,docs:{...(J=u.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: "Paragraph / Colors & Alignment",
  render: () => <div className="trem-storybook-column">
      <Paragraph text="Primary text color (default) — blends with theme." />
      <Paragraph text="Custom color — using the color prop for brand accents." color="#e67e22" />
      <Paragraph text="Center aligned text — great for callouts and banners." align="center" />
      <Paragraph text="Right aligned text — useful for sidebars and metadata." align="right" />
    </div>
}`,...(Q=(K=u.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};var W,X,Y;y.parameters={...y.parameters,docs:{...(W=y.parameters)==null?void 0:W.docs,source:{originalSource:`{
  name: "Combined Usage",
  render: () => <div className="trem-storybook-column">
      <Title text="Travel components for every flow" size="large" />
      <SubTitle text="Reusable system pieces for portals, tours, booking, and customer journeys." />
      <Paragraph text="Compose pages with shared Trem UI pieces and keep visual language consistent across apps." />
      <p>
        Highlight terms like <HighlightSpan>shared Trem UI</HighlightSpan> pieces to draw attention.
      </p>
    </div>
}`,...(Y=(X=y.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};const ne=["TitlePlayground","TitleVariants","TitleSizes","TitleAlignments","SubTitlePlayground","SubTitleVariants","SubTitleSizes","ParagraphPlayground","ParagraphVariants","ParagraphSizes","ParagraphColors","Headings"];export{y as Headings,u as ParagraphColors,d as ParagraphPlayground,p as ParagraphSizes,g as ParagraphVariants,l as SubTitlePlayground,m as SubTitleSizes,c as SubTitleVariants,i as TitleAlignments,n as TitlePlayground,s as TitleSizes,o as TitleVariants,ne as __namedExportsOrder,re as default};
