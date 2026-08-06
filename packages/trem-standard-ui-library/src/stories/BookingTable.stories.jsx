import React from "react";
import { BookingTable } from "@packages/trem-ui";

const bookingImages = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=160&q=80",
];

const bookingRows = [
  { id: "#TR-1245", service: { name: "Joy Jubilee Jamboree", type: "Adventure tourism", image: bookingImages[0] }, travellers: "2 Adults, 1 Child", days: 4, price: "$11,569", priceValue: 11569, date: "15 May 2025", status: "Upcoming" },
  { id: "#TR-3215", service: { name: "LaughFest Carnival", type: "Escorted tour", image: bookingImages[1] }, travellers: "2 Adults, 2 Child", days: 3, price: "$10,745", priceValue: 10745, date: "20 May 2025", status: "Upcoming" },
  { id: "#TR-4581", service: { name: "PlayPalooza Part", type: "Ground tour", image: bookingImages[2] }, travellers: "2 Adults, 1 Child", days: 2, price: "$8,160", priceValue: 8160, date: "04 Jun 2025", status: "Upcoming" },
  { id: "#TR-6545", service: { name: "Romantic Places", type: "Sightseeing tours", image: bookingImages[3] }, travellers: "1 Adult, 1 Child", days: 5, price: "$14,840", priceValue: 14840, date: "17 Jun 2025", status: "Pending" },
  { id: "#TR-3256", service: { name: "Whimsy Wonderland", type: "Sightseeing tours", image: bookingImages[4] }, travellers: "2 Adults, 1 Child", days: 4, price: "$10,450", priceValue: 10450, date: "25 Jun 2025", status: "Upcoming" },
  { id: "#TR-3654", service: { name: "Giggles & Games Gala", type: "Culinary tourism", image: bookingImages[5] }, travellers: "3 Adults, 2 Child", days: 3, price: "$12,600", priceValue: 12600, date: "02 Jul 2025", status: "Cancelled" },
  { id: "#TR-1458", service: { name: "Fitness Frenzy", type: "Domestic tour operators", image: bookingImages[6] }, travellers: "2 Adults, 2 Child", days: 2, price: "$9,380", priceValue: 9380, date: "12 Jul 2025", status: "Completed" },
  { id: "#TR-6589", service: { name: "Foodie Fiesta", type: "Newyork", image: bookingImages[7] }, travellers: "2 Adults, 1 Child", days: 5, price: "$10,400", priceValue: 10400, date: "26 Jul 2025", status: "Completed" },
  { id: "#TR-2315", service: { name: "Dare DevCon", type: "Agritourism", image: bookingImages[8] }, travellers: "2 Adults, 2 Child", days: 4, price: "$12,810", priceValue: 12810, date: "10 Aug 2025", status: "Completed" },
  { id: "#TR-5414", service: { name: "Innovation Ignited", type: "Romantic", image: bookingImages[9] }, travellers: "3 Adults, 1 Child", days: 3, price: "$15,450", priceValue: 15450, date: "22 Aug 2025", status: "Completed" },
  { id: "#TR-7261", service: { name: "City Lights Stay", type: "Hotel booking", image: bookingImages[1] }, travellers: "2 Adults", days: 2, price: "$7,250", priceValue: 7250, date: "30 Aug 2025", status: "Pending" },
  { id: "#TR-8420", service: { name: "Airport Glide", type: "Transfer", image: bookingImages[2] }, travellers: "1 Adult", days: 1, price: "$680", priceValue: 680, date: "03 Sep 2025", status: "Upcoming" },
];

const bookingTableConfig = {
  heroBanner: {
    title: "Tour",
    subtitle: "No of Booking : 12",
    actions: [
      { id: "dateRange", icon: "calendar", iconOnly: true, label: "Booking date range" },
      {
        id: "export",
        icon: "share",
        label: "Export",
        options: [
          { id: "csv", label: "Export CSV" },
          { id: "pdf", label: "Export PDF" },
        ],
      },
    ],
  },
  table: {
    title: "My Journeys",
    ariaLabel: "Travel service my journeys",
    minWidth: 1120,
  },
  actions: {
    search: {
      placeholder: "Search",
      keys: ["id", "service.name", "service.type", "travellers", "status"],
    },
    filters: [
      {
        id: "serviceType",
        label: "Tour Type",
        accessor: "service.type",
        options: [
          { label: "Tour Type", value: "all" },
          { label: "Adventure tourism", value: "Adventure tourism" },
          { label: "Escorted tour", value: "Escorted tour" },
          { label: "Sightseeing tours", value: "Sightseeing tours" },
          { label: "Hotel booking", value: "Hotel booking" },
          { label: "Transfer", value: "Transfer" },
        ],
      },
      {
        id: "status",
        label: "Status",
        accessor: "status",
        options: [
          { label: "Status", value: "all" },
          { label: "Upcoming", value: "Upcoming" },
          { label: "Pending", value: "Pending" },
          { label: "Cancelled", value: "Cancelled" },
          { label: "Completed", value: "Completed" },
        ],
      },
    ],
  },
  sortingHeader: {
    label: "Sort By :",
    defaultValue: "recommended",
    options: [
      { label: "Recommended", value: "recommended" },
      { label: "Price: Low to High", value: "priceAsc", sort: { columnId: "price", direction: "asc" } },
      { label: "Price: High to Low", value: "priceDesc", sort: { columnId: "price", direction: "desc" } },
      { label: "Soonest Date", value: "dateAsc", sort: { columnId: "date", direction: "asc" } },
    ],
  },
  pagination: {
    enabled: true,
    pageSize: 10,
    pageSizeOptions: [10, 25, 50],
    pageSizeLabel: "Show",
    entriesLabel: "entries",
  },
};

const bookingColumns = [
  { id: "id", label: "ID", minWidth: 140, sortable: true, emphasis: "danger" },
  {
    id: "tour",
    label: "Tour & Type",
    type: "mediaText",
    minWidth: 310,
    titleAccessor: "service.name",
    subtitleAccessor: "service.type",
    mediaAccessor: "service.image",
    sortAccessor: "service.name",
    sortable: true,
  },
  { id: "travellers", label: "Travellers", minWidth: 190 },
  { id: "days", label: "Days", minWidth: 110, suffix: " Days", sortable: true },
  { id: "price", label: "Price", minWidth: 125, sortAccessor: "priceValue", sortable: true },
  { id: "date", label: "Date", minWidth: 155, sortable: true },
  { id: "status", label: "Status", type: "status", minWidth: 150 },
  { id: "actions", label: "", type: "actions", minWidth: 70, align: "right", actions: [{ id: "view", label: "View booking", icon: "eye" }] },
];

const serviceRows = bookingRows.map((row, index) => ({
  ...row,
  supplier: ["Trem Tours", "Blue Trail", "Urban Miles"][index % 3],
  payment: index % 3 === 0 ? "Deposit paid" : index % 3 === 1 ? "Pending invoice" : "Paid in full",
  confirmation: index % 2 === 0 ? "Confirmed" : "Awaiting supplier",
}));

const serviceColumns = [
  ...bookingColumns.slice(0, 2),
  { id: "supplier", label: "Supplier", minWidth: 160, sortable: true },
  { id: "confirmation", label: "Confirmation", minWidth: 180 },
  { id: "payment", label: "Payment", minWidth: 170 },
  ...bookingColumns.slice(2),
];

export default {
  title: "Trem UI/Data Display/Booking Table",
  component: BookingTable,
  tags: ["autodocs"],
  args: {
    ...bookingTableConfig,
    columns: bookingColumns,
    rows: bookingRows,
  },
  argTypes: {
    table: { control: "object" },
    heroBanner: { control: "object" },
    actions: { control: "object" },
    sortingHeader: { control: "object" },
    pagination: { control: "object" },
    columns: { control: "object" },
    rows: { control: "object" },
  },
};

export const BookingList = {
  name: "Booking Table / My Journeys",
  render: () => <BookingTable {...bookingTableConfig} columns={bookingColumns} rows={bookingRows} />,
};

export const HeroBannerTable = {
  name: "Booking Table / Hero Banner Table",
  render: () => (
    <BookingTable
      {...bookingTableConfig}
      heroBanner={{
        ...bookingTableConfig.heroBanner,
        subtitle: "No of Booking : 2",
        actions: [
          { id: "dateRange", icon: "calendar", iconOnly: true, label: "Booking date range" },
          { id: "export", icon: "share", label: "Export", iconRight: "chevronDown" },
        ],
      }}
      table={{ ...bookingTableConfig.table, maxHeight: 620 }}
      columns={bookingColumns}
      rows={bookingRows.slice(0, 2)}
    />
  ),
};

export const AnyServiceColumns = {
  name: "Booking Table / Any Service Columns",
  render: () => (
    <BookingTable
      table={{ ...bookingTableConfig.table, title: "All Service Bookings", minWidth: 1480 }}
      actions={bookingTableConfig.actions}
      sortingHeader={bookingTableConfig.sortingHeader}
      pagination={{ ...bookingTableConfig.pagination, pageSize: 10 }}
      columns={serviceColumns}
      rows={serviceRows}
    />
  ),
};

export const ContractShape = {
  name: "Booking Table / Contract Shape",
  render: () => (
    <div className="trem-storybook-column">
      <BookingTable {...bookingTableConfig} columns={bookingColumns} rows={bookingRows.slice(0, 5)} pagination={{ enabled: false }} />
      <pre style={{ maxWidth: "100%", overflow: "auto", padding: 16, borderRadius: 8, background: "#101828", color: "#f8fafc", fontSize: 13 }}>
        {JSON.stringify(
          {
            table: bookingTableConfig.table,
            heroBanner: bookingTableConfig.heroBanner,
            actions: bookingTableConfig.actions,
            sortingHeader: bookingTableConfig.sortingHeader,
            pagination: bookingTableConfig.pagination,
            columns: bookingColumns.map(({ render, ...column }) => column),
            rows: "dynamic data rows from widget controller",
          },
          null,
          2
        )}
      </pre>
    </div>
  ),
};
