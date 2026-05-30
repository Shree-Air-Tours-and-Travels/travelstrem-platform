import{R as e,r as d}from"./index-Bc2G9s8g.js";import{f as m,j as r,e as u}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import{d as v}from"./sampleData-SKqcyK29.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const A={title:"Trem UI/Forms",tags:["autodocs"]},a={name:"Input Field / Playground",component:r,argTypes:{variant:{control:"select",options:["text","tel","email","monthYear"]},placeholder:{control:"text"},error:{control:"text"}},args:{value:"",variant:"text",placeholder:"Enter value..."},render:n=>{const[t,p]=d.useState(n.value);return e.createElement(r,{value:t,onChange:p,variant:n.variant,placeholder:n.placeholder,error:n.error})}},o={name:"Input Field / Variants",render:()=>{const[n,t]=d.useState("Akshat"),[p,T]=d.useState("9876543210"),[V,B]=d.useState("04/29");return e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{value:n,onChange:t,placeholder:"Customer name"}),e.createElement(r,{variant:"tel",value:p,onChange:T}),e.createElement(r,{variant:"monthYear",value:V,onChange:B}),e.createElement(r,{value:"",placeholder:"Invalid field",error:"Required"}))}},l={name:"Input Field / States",render:()=>e.createElement("div",{className:"trem-storybook-column"},e.createElement(r,{value:"Filled input",onChange:()=>{}}),e.createElement(r,{value:"",placeholder:"Placeholder only",onChange:()=>{}}),e.createElement(r,{value:"",placeholder:"Disabled input",disabled:!0,onChange:()=>{}}),e.createElement(r,{value:"With error",error:"This field has a validation error",onChange:()=>{}}))},s={name:"Dropdown / Playground",component:m,argTypes:{align:{control:"select",options:["start","center","end"]},hoverable:{control:"boolean"},closeOnSelect:{control:"boolean"}},args:{items:v,align:"start",hoverable:!1,closeOnSelect:!0},render:n=>e.createElement("div",{className:"trem-storybook-panel",style:{minHeight:200}},e.createElement(m,{items:n.items,align:n.align,hoverable:n.hoverable,closeOnSelect:n.closeOnSelect,trigger:({open:t})=>e.createElement(u,{variant:"solid",color:"primary",text:"Open Menu"})}))},i={name:"Dropdown / Default",render:()=>e.createElement("div",{className:"trem-storybook-panel",style:{minHeight:200}},e.createElement(m,{items:v,trigger:({open:n})=>e.createElement(u,{variant:"solid",color:"primary",text:"Submit"})}))},c={name:"Dropdown / Hoverable",render:()=>e.createElement("div",{className:"trem-storybook-panel",style:{minHeight:200}},e.createElement(m,{items:v,hoverable:!0,trigger:({open:n})=>e.createElement(u,{variant:"outline",color:"secondary",text:"Hover me"})}))};var g,h,y;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: "Input Field / Playground",
  component: InputField,
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "tel", "email", "monthYear"]
    },
    placeholder: {
      control: "text"
    },
    error: {
      control: "text"
    }
  },
  args: {
    value: "",
    variant: "text",
    placeholder: "Enter value..."
  },
  render: args => {
    const [value, setValue] = useState(args.value);
    return <InputField value={value} onChange={setValue} variant={args.variant} placeholder={args.placeholder} error={args.error} />;
  }
}`,...(y=(h=a.parameters)==null?void 0:h.docs)==null?void 0:y.source}}};var b,I,S;o.parameters={...o.parameters,docs:{...(b=o.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: "Input Field / Variants",
  render: () => {
    const [name, setName] = useState("Akshat");
    const [phone, setPhone] = useState("9876543210");
    const [expiry, setExpiry] = useState("04/29");
    return <div className="trem-storybook-column">
        <InputField value={name} onChange={setName} placeholder="Customer name" />
        <InputField variant="tel" value={phone} onChange={setPhone} />
        <InputField variant="monthYear" value={expiry} onChange={setExpiry} />
        <InputField value="" placeholder="Invalid field" error="Required" />
      </div>;
  }
}`,...(S=(I=o.parameters)==null?void 0:I.docs)==null?void 0:S.source}}};var E,x,w;l.parameters={...l.parameters,docs:{...(E=l.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: "Input Field / States",
  render: () => <div className="trem-storybook-column">
      <InputField value="Filled input" onChange={() => {}} />
      <InputField value="" placeholder="Placeholder only" onChange={() => {}} />
      <InputField value="" placeholder="Disabled input" disabled onChange={() => {}} />
      <InputField value="With error" error="This field has a validation error" onChange={() => {}} />
    </div>
}`,...(w=(x=l.parameters)==null?void 0:x.docs)==null?void 0:w.source}}};var D,F,C;s.parameters={...s.parameters,docs:{...(D=s.parameters)==null?void 0:D.docs,source:{originalSource:`{
  name: "Dropdown / Playground",
  component: Dropdown,
  argTypes: {
    align: {
      control: "select",
      options: ["start", "center", "end"]
    },
    hoverable: {
      control: "boolean"
    },
    closeOnSelect: {
      control: "boolean"
    }
  },
  args: {
    items: dropdownItems,
    align: "start",
    hoverable: false,
    closeOnSelect: true
  },
  render: args => <div className="trem-storybook-panel" style={{
    minHeight: 200
  }}>
      <Dropdown items={args.items} align={args.align} hoverable={args.hoverable} closeOnSelect={args.closeOnSelect} trigger={({
      open
    }) => <Button variant="solid" color="primary" text="Open Menu" />} />
    </div>
}`,...(C=(F=s.parameters)==null?void 0:F.docs)==null?void 0:C.source}}};var f,N,P;i.parameters={...i.parameters,docs:{...(f=i.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: "Dropdown / Default",
  render: () => <div className="trem-storybook-panel" style={{
    minHeight: 200
  }}>
      <Dropdown items={dropdownItems} trigger={({
      open
    }) => <Button variant="solid" color="primary" text="Submit" />} />
    </div>
}`,...(P=(N=i.parameters)==null?void 0:N.docs)==null?void 0:P.source}}};var k,H,O;c.parameters={...c.parameters,docs:{...(k=c.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: "Dropdown / Hoverable",
  render: () => <div className="trem-storybook-panel" style={{
    minHeight: 200
  }}>
      <Dropdown items={dropdownItems} hoverable trigger={({
      open
    }) => <Button variant="outline" color="secondary" text="Hover me" />} />
    </div>
}`,...(O=(H=c.parameters)==null?void 0:H.docs)==null?void 0:O.source}}};const W=["InputPlayground","Inputs","InputStates","DropdownPlayground","DropdownMenu","DropdownHoverable"];export{c as DropdownHoverable,i as DropdownMenu,s as DropdownPlayground,a as InputPlayground,l as InputStates,o as Inputs,W as __namedExportsOrder,A as default};
