import{R as e}from"./index-Bc2G9s8g.js";import{o as n,P as a}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const k={title:"Trem UI/Utilities/SmoothScroll",component:n,tags:["autodocs"],argTypes:{variant:{control:"select",options:["fadeIn","slideUp","slideDown","slideLeft","slideRight","scaleIn","zoomIn"]},delay:{control:{type:"number",min:0,max:2,step:.1}},duration:{control:{type:"number",min:.2,max:2,step:.1}},threshold:{control:{type:"number",min:0,max:1,step:.05}},once:{control:"boolean"}},args:{variant:"slideUp",delay:0,duration:.6,threshold:.15,once:!0}},r={render:t=>e.createElement("div",{style:{minHeight:"120vh",display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",padding:24}},e.createElement(a,{text:"Scroll down to see the animated element...",align:"center",variant:"caption"}),e.createElement("div",{style:{height:"60vh"}}),e.createElement(n,{variant:t.variant,delay:t.delay,duration:t.duration,threshold:t.threshold,once:t.once},e.createElement("div",{className:"trem-storybook-panel",style:{textAlign:"center",padding:"32px 48px"}},e.createElement(a,{text:`Animation: ${t.variant}`,size:"large"}),e.createElement(a,{text:`Duration: ${t.duration}s · Delay: ${t.delay}s`,variant:"caption"}))),e.createElement("div",{style:{height:"40vh"}})),parameters:{layout:"fullscreen"}},l={name:"All Variants",render:()=>e.createElement("div",{style:{minHeight:"200vh",display:"flex",flexDirection:"column",gap:80,padding:24,maxWidth:600,margin:"0 auto"}},["fadeIn","slideUp","slideDown","slideLeft","slideRight","scaleIn","zoomIn"].map((t,S)=>e.createElement(n,{key:t,variant:t,delay:S*.15,duration:.6},e.createElement("div",{className:"trem-storybook-panel",style:{textAlign:"center",padding:24}},e.createElement(a,{text:t,size:"large"}))))),parameters:{layout:"fullscreen"}},i={name:"Staggered Items",render:()=>e.createElement("div",{style:{minHeight:"150vh",display:"flex",flexDirection:"column",gap:40,padding:24,maxWidth:400,margin:"0 auto"}},e.createElement(a,{text:"Items below animate one by one as you scroll...",align:"center",variant:"caption"}),e.createElement("div",{style:{height:"40vh"}}),[1,2,3,4].map(t=>e.createElement(n,{key:t,variant:"slideUp",delay:(t-1)*.2},e.createElement("div",{className:"trem-storybook-panel",style:{padding:24}},e.createElement(a,{text:`Item ${t}`,size:"large"}),e.createElement(a,{text:"This content fades in with a staggered delay.",variant:"caption"}))))),parameters:{layout:"fullscreen"}},o={name:"Animate Once (Default)",render:()=>e.createElement("div",{style:{minHeight:"150vh",display:"flex",flexDirection:"column",gap:40,padding:24,maxWidth:400,margin:"0 auto"}},e.createElement(a,{text:"Animate once — scroll past, then back up; won't re-animate.",align:"center",variant:"caption"}),e.createElement("div",{style:{height:"60vh"}}),e.createElement(n,{variant:"slideUp",once:!0},e.createElement("div",{className:"trem-storybook-panel",style:{padding:24}},e.createElement(a,{text:"Animated once",size:"large"}))),e.createElement(n,{variant:"fadeIn",once:!0},e.createElement("div",{className:"trem-storybook-panel",style:{padding:24}},e.createElement(a,{text:"Also animated once",size:"large"}))),e.createElement("div",{style:{height:"40vh"}})),parameters:{layout:"fullscreen"}};var s,d,m;r.parameters={...r.parameters,docs:{...(s=r.parameters)==null?void 0:s.docs,source:{originalSource:`{
  render: args => <div style={{
    minHeight: "120vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 24
  }}>
      <Paragraph text="Scroll down to see the animated element..." align="center" variant="caption" />
      <div style={{
      height: "60vh"
    }} />
      <SmoothScroll variant={args.variant} delay={args.delay} duration={args.duration} threshold={args.threshold} once={args.once}>
        <div className="trem-storybook-panel" style={{
        textAlign: "center",
        padding: "32px 48px"
      }}>
          <Paragraph text={\`Animation: \${args.variant}\`} size="large" />
          <Paragraph text={\`Duration: \${args.duration}s · Delay: \${args.delay}s\`} variant="caption" />
        </div>
      </SmoothScroll>
      <div style={{
      height: "40vh"
    }} />
    </div>,
  parameters: {
    layout: "fullscreen"
  }
}`,...(m=(d=r.parameters)==null?void 0:d.docs)==null?void 0:m.source}}};var c,p,g;l.parameters={...l.parameters,docs:{...(c=l.parameters)==null?void 0:c.docs,source:{originalSource:`{
  name: "All Variants",
  render: () => <div style={{
    minHeight: "200vh",
    display: "flex",
    flexDirection: "column",
    gap: 80,
    padding: 24,
    maxWidth: 600,
    margin: "0 auto"
  }}>
      {["fadeIn", "slideUp", "slideDown", "slideLeft", "slideRight", "scaleIn", "zoomIn"].map((v, i) => <SmoothScroll key={v} variant={v} delay={i * 0.15} duration={0.6}>
          <div className="trem-storybook-panel" style={{
        textAlign: "center",
        padding: 24
      }}>
            <Paragraph text={v} size="large" />
          </div>
        </SmoothScroll>)}
    </div>,
  parameters: {
    layout: "fullscreen"
  }
}`,...(g=(p=l.parameters)==null?void 0:p.docs)==null?void 0:g.source}}};var h,y,v;i.parameters={...i.parameters,docs:{...(h=i.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: "Staggered Items",
  render: () => <div style={{
    minHeight: "150vh",
    display: "flex",
    flexDirection: "column",
    gap: 40,
    padding: 24,
    maxWidth: 400,
    margin: "0 auto"
  }}>
      <Paragraph text="Items below animate one by one as you scroll..." align="center" variant="caption" />
      <div style={{
      height: "40vh"
    }} />
      {[1, 2, 3, 4].map(i => <SmoothScroll key={i} variant="slideUp" delay={(i - 1) * 0.2}>
          <div className="trem-storybook-panel" style={{
        padding: 24
      }}>
            <Paragraph text={\`Item \${i}\`} size="large" />
            <Paragraph text="This content fades in with a staggered delay." variant="caption" />
          </div>
        </SmoothScroll>)}
    </div>,
  parameters: {
    layout: "fullscreen"
  }
}`,...(v=(y=i.parameters)==null?void 0:y.docs)==null?void 0:v.source}}};var u,x,f;o.parameters={...o.parameters,docs:{...(u=o.parameters)==null?void 0:u.docs,source:{originalSource:`{
  name: "Animate Once (Default)",
  render: () => <div style={{
    minHeight: "150vh",
    display: "flex",
    flexDirection: "column",
    gap: 40,
    padding: 24,
    maxWidth: 400,
    margin: "0 auto"
  }}>
      <Paragraph text="Animate once — scroll past, then back up; won't re-animate." align="center" variant="caption" />
      <div style={{
      height: "60vh"
    }} />
      <SmoothScroll variant="slideUp" once>
        <div className="trem-storybook-panel" style={{
        padding: 24
      }}>
          <Paragraph text="Animated once" size="large" />
        </div>
      </SmoothScroll>
      <SmoothScroll variant="fadeIn" once>
        <div className="trem-storybook-panel" style={{
        padding: 24
      }}>
          <Paragraph text="Also animated once" size="large" />
        </div>
      </SmoothScroll>
      <div style={{
      height: "40vh"
    }} />
    </div>,
  parameters: {
    layout: "fullscreen"
  }
}`,...(f=(x=o.parameters)==null?void 0:x.docs)==null?void 0:f.source}}};const A=["Playground","Variants","Staggered","OneTime"];export{o as OneTime,r as Playground,i as Staggered,l as Variants,A as __namedExportsOrder,k as default};
