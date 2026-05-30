import{r as p,R as e}from"./index-Bc2G9s8g.js";import{c as r,e as o}from"./FavoritesContext-Dx-GqcvK.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";import"./index-BO6cjGmN.js";const W={title:"Trem UI/Overlay/BottomSheet",component:r,tags:["autodocs"],argTypes:{open:{control:"boolean"},title:{control:"text"}},args:{open:!0,title:"Trip Details"}},i={render:n=>{const[t,a]=p.useState(n.open);return e.createElement("div",null,e.createElement(o,{variant:"solid",color:"primary",text:"Open Bottom Sheet",onClick:()=>a(!0)}),e.createElement(r,{open:t,onClose:()=>a(!1),title:n.title},e.createElement("div",{style:{padding:"0 16px 24px"}},e.createElement("p",{style:{margin:"0 0 12px",color:"var(--text-secondary)",lineHeight:1.6}},"This is the bottom sheet body. You can place any content here — forms, details, lists, or actions."),e.createElement(o,{variant:"solid",color:"primary",text:"Confirm",onClick:()=>a(!1)}))))}},s={name:"With Content",render:()=>{const[n,t]=p.useState(!1);return e.createElement("div",null,e.createElement(o,{variant:"solid",color:"primary",text:"View Trip Details",onClick:()=>t(!0)}),e.createElement(r,{open:n,onClose:()=>t(!1),title:"Himalayan Escape"},e.createElement("div",{style:{padding:"0 16px 24px"}},e.createElement("p",{style:{margin:"0 0 8px",color:"var(--text-secondary)"}},e.createElement("strong",null,"Duration:")," 5 Days / 4 Nights"),e.createElement("p",{style:{margin:"0 0 8px",color:"var(--text-secondary)"}},e.createElement("strong",null,"Location:")," Manali, India"),e.createElement("p",{style:{margin:"0 0 8px",color:"var(--text-secondary)"}},e.createElement("strong",null,"Price:")," ₹24,999 per person"),e.createElement("p",{style:{margin:"0 0 16px",color:"var(--text-secondary)",lineHeight:1.6}},"A calm mountain itinerary with scenic drives, local food, pine trails, and flexible leisure time."),e.createElement(o,{variant:"solid",color:"primary",text:"Book Now",onClick:()=>t(!1)}))))}},l={name:"Without Title",render:()=>{const[n,t]=p.useState(!1);return e.createElement("div",null,e.createElement(o,{variant:"solid",color:"primary",text:"Open",onClick:()=>t(!0)}),e.createElement(r,{open:n,onClose:()=>t(!1)},e.createElement("div",{style:{padding:"0 16px 24px"}},e.createElement("p",{style:{margin:0,color:"var(--text-secondary)"}},"A bottom sheet without a title prop."))))}},c={name:"With Scrollable Content",render:()=>{const[n,t]=p.useState(!1);return e.createElement("div",null,e.createElement(o,{variant:"solid",color:"primary",text:"Terms & Conditions",onClick:()=>t(!0)}),e.createElement(r,{open:n,onClose:()=>t(!1),title:"Terms & Conditions"},e.createElement("div",{style:{padding:"0 16px 24px",color:"var(--text-secondary)",lineHeight:1.7}},Array.from({length:8}).map((a,m)=>e.createElement("p",{key:m,style:{marginBottom:12}},m+1,". Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.")))))}};var d,u,y;i.parameters={...i.parameters,docs:{...(d=i.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: args => {
    const [open, setOpen] = useState(args.open);
    return <div>
        <Button variant="solid" color="primary" text="Open Bottom Sheet" onClick={() => setOpen(true)} />
        <BottomSheet open={open} onClose={() => setOpen(false)} title={args.title}>
          <div style={{
          padding: "0 16px 24px"
        }}>
            <p style={{
            margin: "0 0 12px",
            color: "var(--text-secondary)",
            lineHeight: 1.6
          }}>
              This is the bottom sheet body. You can place any content here — forms, details, lists, or actions.
            </p>
            <Button variant="solid" color="primary" text="Confirm" onClick={() => setOpen(false)} />
          </div>
        </BottomSheet>
      </div>;
  }
}`,...(y=(u=i.parameters)==null?void 0:u.docs)==null?void 0:y.source}}};var x,g,v;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: "With Content",
  render: () => {
    const [open, setOpen] = useState(false);
    return <div>
        <Button variant="solid" color="primary" text="View Trip Details" onClick={() => setOpen(true)} />
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Himalayan Escape">
          <div style={{
          padding: "0 16px 24px"
        }}>
            <p style={{
            margin: "0 0 8px",
            color: "var(--text-secondary)"
          }}>
              <strong>Duration:</strong> 5 Days / 4 Nights
            </p>
            <p style={{
            margin: "0 0 8px",
            color: "var(--text-secondary)"
          }}>
              <strong>Location:</strong> Manali, India
            </p>
            <p style={{
            margin: "0 0 8px",
            color: "var(--text-secondary)"
          }}>
              <strong>Price:</strong> ₹24,999 per person
            </p>
            <p style={{
            margin: "0 0 16px",
            color: "var(--text-secondary)",
            lineHeight: 1.6
          }}>
              A calm mountain itinerary with scenic drives, local food, pine trails, and flexible leisure time.
            </p>
            <Button variant="solid" color="primary" text="Book Now" onClick={() => setOpen(false)} />
          </div>
        </BottomSheet>
      </div>;
  }
}`,...(v=(g=s.parameters)==null?void 0:g.docs)==null?void 0:v.source}}};var h,C,E;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: "Without Title",
  render: () => {
    const [open, setOpen] = useState(false);
    return <div>
        <Button variant="solid" color="primary" text="Open" onClick={() => setOpen(true)} />
        <BottomSheet open={open} onClose={() => setOpen(false)}>
          <div style={{
          padding: "0 16px 24px"
        }}>
            <p style={{
            margin: 0,
            color: "var(--text-secondary)"
          }}>
              A bottom sheet without a title prop.
            </p>
          </div>
        </BottomSheet>
      </div>;
  }
}`,...(E=(C=l.parameters)==null?void 0:C.docs)==null?void 0:E.source}}};var f,S,B;c.parameters={...c.parameters,docs:{...(f=c.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: "With Scrollable Content",
  render: () => {
    const [open, setOpen] = useState(false);
    return <div>
        <Button variant="solid" color="primary" text="Terms & Conditions" onClick={() => setOpen(true)} />
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Terms & Conditions">
          <div style={{
          padding: "0 16px 24px",
          color: "var(--text-secondary)",
          lineHeight: 1.7
        }}>
            {Array.from({
            length: 8
          }).map((_, i) => <p key={i} style={{
            marginBottom: 12
          }}>
                {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>)}
          </div>
        </BottomSheet>
      </div>;
  }
}`,...(B=(S=c.parameters)==null?void 0:S.docs)==null?void 0:B.source}}};const q=["Playground","WithContent","WithoutTitle","WithLongContent"];export{i as Playground,s as WithContent,c as WithLongContent,l as WithoutTitle,q as __namedExportsOrder,W as default};
