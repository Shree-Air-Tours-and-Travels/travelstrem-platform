import{R as e}from"./index-Bc2G9s8g.js";import{G as a}from"./FavoritesContext-ClvQQ5W1.js";import"./index-BO6cjGmN.js";import{g as t}from"./sampleData-SKqcyK29.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const f={title:"Trem UI/Data Display/Gallery",component:a,tags:["autodocs"],argTypes:{showThumbnails:{control:"boolean"},autoPlay:{control:"boolean"},autoPlayInterval:{control:{type:"number",min:1e3,max:1e4,step:500}},aspectRatio:{control:"text"},title:{control:"text"},subtitle:{control:"text"}},args:{images:t,title:"Gallery",subtitle:"Manali, India",showThumbnails:!0,autoPlay:!1,autoPlayInterval:3500,aspectRatio:"4 / 3"}},r={},o={name:"With Multiple Images",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(a,{images:t,title:"Himalayan Views",subtitle:"Manali, India"}))},s={name:"Single Image",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(a,{images:[t[0]],title:"Featured Photo",subtitle:"Mountain landscape"}))},l={name:"Without Thumbnails",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(a,{images:t,title:"Gallery",showThumbnails:!1}))},n={name:"With AutoPlay",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(a,{images:t,title:"Slideshow",autoPlay:!0,autoPlayInterval:3e3}))},m={name:"Wide Aspect Ratio",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(a,{images:t,title:"Panoramic",aspectRatio:"16 / 9"}))};var i,c,u;r.parameters={...r.parameters,docs:{...(i=r.parameters)==null?void 0:i.docs,source:{originalSource:"{}",...(u=(c=r.parameters)==null?void 0:c.docs)==null?void 0:u.source}}};var d,p,g;o.parameters={...o.parameters,docs:{...(d=o.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: "With Multiple Images",
  render: () => <div className="trem-storybook-column">
      <Gallery images={galleryImages} title="Himalayan Views" subtitle="Manali, India" />
    </div>
}`,...(g=(p=o.parameters)==null?void 0:p.docs)==null?void 0:g.source}}};var y,b,h;s.parameters={...s.parameters,docs:{...(y=s.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: "Single Image",
  render: () => <div className="trem-storybook-column">
      <Gallery images={[galleryImages[0]]} title="Featured Photo" subtitle="Mountain landscape" />
    </div>
}`,...(h=(b=s.parameters)==null?void 0:b.docs)==null?void 0:h.source}}};var I,v,P;l.parameters={...l.parameters,docs:{...(I=l.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: "Without Thumbnails",
  render: () => <div className="trem-storybook-column">
      <Gallery images={galleryImages} title="Gallery" showThumbnails={false} />
    </div>
}`,...(P=(v=l.parameters)==null?void 0:v.docs)==null?void 0:P.source}}};var G,S,W;n.parameters={...n.parameters,docs:{...(G=n.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: "With AutoPlay",
  render: () => <div className="trem-storybook-column">
      <Gallery images={galleryImages} title="Slideshow" autoPlay autoPlayInterval={3000} />
    </div>
}`,...(W=(S=n.parameters)==null?void 0:S.docs)==null?void 0:W.source}}};var E,M,k;m.parameters={...m.parameters,docs:{...(E=m.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: "Wide Aspect Ratio",
  render: () => <div className="trem-storybook-column">
      <Gallery images={galleryImages} title="Panoramic" aspectRatio="16 / 9" />
    </div>
}`,...(k=(M=m.parameters)==null?void 0:M.docs)==null?void 0:k.source}}};const x=["Playground","MultipleImages","SingleImage","WithoutThumbnails","AutoPlayMode","WideAspectRatio"];export{n as AutoPlayMode,o as MultipleImages,r as Playground,s as SingleImage,m as WideAspectRatio,l as WithoutThumbnails,x as __namedExportsOrder,f as default};
