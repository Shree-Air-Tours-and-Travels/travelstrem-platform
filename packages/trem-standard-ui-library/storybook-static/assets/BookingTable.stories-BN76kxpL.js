import{R as a}from"./index-Bc2G9s8g.js";import{b as i}from"./FavoritesContext-Dx-GqcvK.js";import"./index-BO6cjGmN.js";import"./chunk-5KNZJZUH-BSpkXNOh.js";const o=["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=160&q=80","https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=160&q=80","https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=160&q=80","https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=160&q=80","https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=160&q=80","https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=160&q=80","https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=160&q=80","https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=160&q=80","https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=160&q=80","https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=160&q=80"],r=[{id:"#TR-1245",service:{name:"Joy Jubilee Jamboree",type:"Adventure tourism",image:o[0]},travellers:"2 Adults, 1 Child",days:4,price:"$11,569",priceValue:11569,date:"15 May 2025",status:"Upcoming"},{id:"#TR-3215",service:{name:"LaughFest Carnival",type:"Escorted tour",image:o[1]},travellers:"2 Adults, 2 Child",days:3,price:"$10,745",priceValue:10745,date:"20 May 2025",status:"Upcoming"},{id:"#TR-4581",service:{name:"PlayPalooza Part",type:"Ground tour",image:o[2]},travellers:"2 Adults, 1 Child",days:2,price:"$8,160",priceValue:8160,date:"04 Jun 2025",status:"Upcoming"},{id:"#TR-6545",service:{name:"Romantic Places",type:"Sightseeing tours",image:o[3]},travellers:"1 Adult, 1 Child",days:5,price:"$14,840",priceValue:14840,date:"17 Jun 2025",status:"Pending"},{id:"#TR-3256",service:{name:"Whimsy Wonderland",type:"Sightseeing tours",image:o[4]},travellers:"2 Adults, 1 Child",days:4,price:"$10,450",priceValue:10450,date:"25 Jun 2025",status:"Upcoming"},{id:"#TR-3654",service:{name:"Giggles & Games Gala",type:"Culinary tourism",image:o[5]},travellers:"3 Adults, 2 Child",days:3,price:"$12,600",priceValue:12600,date:"02 Jul 2025",status:"Cancelled"},{id:"#TR-1458",service:{name:"Fitness Frenzy",type:"Domestic tour operators",image:o[6]},travellers:"2 Adults, 2 Child",days:2,price:"$9,380",priceValue:9380,date:"12 Jul 2025",status:"Completed"},{id:"#TR-6589",service:{name:"Foodie Fiesta",type:"Newyork",image:o[7]},travellers:"2 Adults, 1 Child",days:5,price:"$10,400",priceValue:10400,date:"26 Jul 2025",status:"Completed"},{id:"#TR-2315",service:{name:"Dare DevCon",type:"Agritourism",image:o[8]},travellers:"2 Adults, 2 Child",days:4,price:"$12,810",priceValue:12810,date:"10 Aug 2025",status:"Completed"},{id:"#TR-5414",service:{name:"Innovation Ignited",type:"Romantic",image:o[9]},travellers:"3 Adults, 1 Child",days:3,price:"$15,450",priceValue:15450,date:"22 Aug 2025",status:"Completed"},{id:"#TR-7261",service:{name:"City Lights Stay",type:"Hotel booking",image:o[1]},travellers:"2 Adults",days:2,price:"$7,250",priceValue:7250,date:"30 Aug 2025",status:"Pending"},{id:"#TR-8420",service:{name:"Airport Glide",type:"Transfer",image:o[2]},travellers:"1 Adult",days:1,price:"$680",priceValue:680,date:"03 Sep 2025",status:"Upcoming"}],e={heroBanner:{title:"Tour",subtitle:"No of Booking : 12",actions:[{id:"dateRange",icon:"calendar",iconOnly:!0,label:"Booking date range"},{id:"export",icon:"share",label:"Export",options:[{id:"csv",label:"Export CSV"},{id:"pdf",label:"Export PDF"}]}]},table:{title:"Booking List",ariaLabel:"Travel service booking list",minWidth:1120},actions:{search:{placeholder:"Search",keys:["id","service.name","service.type","travellers","status"]},filters:[{id:"serviceType",label:"Tour Type",accessor:"service.type",options:[{label:"Tour Type",value:"all"},{label:"Adventure tourism",value:"Adventure tourism"},{label:"Escorted tour",value:"Escorted tour"},{label:"Sightseeing tours",value:"Sightseeing tours"},{label:"Hotel booking",value:"Hotel booking"},{label:"Transfer",value:"Transfer"}]},{id:"status",label:"Status",accessor:"status",options:[{label:"Status",value:"all"},{label:"Upcoming",value:"Upcoming"},{label:"Pending",value:"Pending"},{label:"Cancelled",value:"Cancelled"},{label:"Completed",value:"Completed"}]}]},sortingHeader:{label:"Sort By :",defaultValue:"recommended",options:[{label:"Recommended",value:"recommended"},{label:"Price: Low to High",value:"priceAsc",sort:{columnId:"price",direction:"asc"}},{label:"Price: High to Low",value:"priceDesc",sort:{columnId:"price",direction:"desc"}},{label:"Soonest Date",value:"dateAsc",sort:{columnId:"date",direction:"asc"}}]},pagination:{enabled:!0,pageSize:10,pageSizeOptions:[10,25,50],pageSizeLabel:"Show",entriesLabel:"entries"}},n=[{id:"id",label:"ID",minWidth:140,sortable:!0,emphasis:"danger"},{id:"tour",label:"Tour & Type",type:"mediaText",minWidth:310,titleAccessor:"service.name",subtitleAccessor:"service.type",mediaAccessor:"service.image",sortAccessor:"service.name",sortable:!0},{id:"travellers",label:"Travellers",minWidth:190},{id:"days",label:"Days",minWidth:110,suffix:" Days",sortable:!0},{id:"price",label:"Price",minWidth:125,sortAccessor:"priceValue",sortable:!0},{id:"date",label:"Date",minWidth:155,sortable:!0},{id:"status",label:"Status",type:"status",minWidth:150},{id:"actions",label:"",type:"actions",minWidth:70,align:"right",actions:[{id:"view",label:"View booking",icon:"eye"}]}],H=r.map((s,t)=>({...s,supplier:["Trem Tours","Blue Trail","Urban Miles"][t%3],payment:t%3===0?"Deposit paid":t%3===1?"Pending invoice":"Paid in full",confirmation:t%2===0?"Confirmed":"Awaiting supplier"})),P=[...n.slice(0,2),{id:"supplier",label:"Supplier",minWidth:160,sortable:!0},{id:"confirmation",label:"Confirmation",minWidth:180},{id:"payment",label:"Payment",minWidth:170},...n.slice(2)],x={title:"Trem UI/Data Display/Booking Table",component:i,tags:["autodocs"],args:{...e,columns:n,rows:r},argTypes:{table:{control:"object"},heroBanner:{control:"object"},actions:{control:"object"},sortingHeader:{control:"object"},pagination:{control:"object"},columns:{control:"object"},rows:{control:"object"}}},l={name:"Booking Table / Playground",render:s=>a.createElement(i,{...s})},c={name:"Booking Table / Booking List",render:()=>a.createElement(i,{...e,columns:n,rows:r})},d={name:"Booking Table / Hero Banner Table",render:()=>a.createElement(i,{...e,heroBanner:{...e.heroBanner,subtitle:"No of Booking : 2",actions:[{id:"dateRange",icon:"calendar",iconOnly:!0,label:"Booking date range"},{id:"export",icon:"share",label:"Export",iconRight:"chevronDown"}]},table:{...e.table,maxHeight:620},columns:n,rows:r.slice(0,2)})},m={name:"Booking Table / Any Service Columns",render:()=>a.createElement(i,{table:{...e.table,title:"All Service Bookings",minWidth:1480},actions:e.actions,sortingHeader:e.sortingHeader,pagination:{...e.pagination,pageSize:10},columns:P,rows:H})},u={name:"Booking Table / Contract Shape",render:()=>a.createElement("div",{className:"trem-storybook-column"},a.createElement(i,{...e,columns:n,rows:r.slice(0,5),pagination:{enabled:!1}}),a.createElement("pre",{style:{maxWidth:"100%",overflow:"auto",padding:16,borderRadius:8,background:"#101828",color:"#f8fafc",fontSize:13}},JSON.stringify({table:e.table,heroBanner:e.heroBanner,actions:e.actions,sortingHeader:e.sortingHeader,pagination:e.pagination,columns:n.map(({render:s,...t})=>t),rows:"dynamic data rows from widget controller"},null,2)))};var g,p,b;l.parameters={...l.parameters,docs:{...(g=l.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: "Booking Table / Playground",
  render: args => <BookingTable {...args} />
}`,...(b=(p=l.parameters)==null?void 0:p.docs)==null?void 0:b.source}}};var h,f,v;c.parameters={...c.parameters,docs:{...(h=c.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: "Booking Table / Booking List",
  render: () => <BookingTable {...bookingTableConfig} columns={bookingColumns} rows={bookingRows} />
}`,...(v=(f=c.parameters)==null?void 0:f.docs)==null?void 0:v.source}}};var y,T,k;d.parameters={...d.parameters,docs:{...(y=d.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: "Booking Table / Hero Banner Table",
  render: () => <BookingTable {...bookingTableConfig} heroBanner={{
    ...bookingTableConfig.heroBanner,
    subtitle: "No of Booking : 2",
    actions: [{
      id: "dateRange",
      icon: "calendar",
      iconOnly: true,
      label: "Booking date range"
    }, {
      id: "export",
      icon: "share",
      label: "Export",
      iconRight: "chevronDown"
    }]
  }} table={{
    ...bookingTableConfig.table,
    maxHeight: 620
  }} columns={bookingColumns} rows={bookingRows.slice(0, 2)} />
}`,...(k=(T=d.parameters)==null?void 0:T.docs)==null?void 0:k.source}}};var C,B,w;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: "Booking Table / Any Service Columns",
  render: () => <BookingTable table={{
    ...bookingTableConfig.table,
    title: "All Service Bookings",
    minWidth: 1480
  }} actions={bookingTableConfig.actions} sortingHeader={bookingTableConfig.sortingHeader} pagination={{
    ...bookingTableConfig.pagination,
    pageSize: 10
  }} columns={serviceColumns} rows={serviceRows} />
}`,...(w=(B=m.parameters)==null?void 0:B.docs)==null?void 0:w.source}}};var S,A,R;u.parameters={...u.parameters,docs:{...(S=u.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: "Booking Table / Contract Shape",
  render: () => <div className="trem-storybook-column">
      <BookingTable {...bookingTableConfig} columns={bookingColumns} rows={bookingRows.slice(0, 5)} pagination={{
      enabled: false
    }} />
      <pre style={{
      maxWidth: "100%",
      overflow: "auto",
      padding: 16,
      borderRadius: 8,
      background: "#101828",
      color: "#f8fafc",
      fontSize: 13
    }}>
        {JSON.stringify({
        table: bookingTableConfig.table,
        heroBanner: bookingTableConfig.heroBanner,
        actions: bookingTableConfig.actions,
        sortingHeader: bookingTableConfig.sortingHeader,
        pagination: bookingTableConfig.pagination,
        columns: bookingColumns.map(({
          render,
          ...column
        }) => column),
        rows: "dynamic data rows from widget controller"
      }, null, 2)}
      </pre>
    </div>
}`,...(R=(A=u.parameters)==null?void 0:A.docs)==null?void 0:R.source}}};const L=["Playground","BookingList","HeroBannerTable","AnyServiceColumns","ContractShape"];export{m as AnyServiceColumns,c as BookingList,u as ContractShape,d as HeroBannerTable,l as Playground,L as __namedExportsOrder,x as default};
