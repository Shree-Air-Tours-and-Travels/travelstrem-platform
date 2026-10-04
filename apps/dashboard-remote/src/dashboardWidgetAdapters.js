const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);

export function widgetsFromTourAnalytics(analytics, { title, description, target, onViewAll } = {}) {
  const summary = analytics?.summary || {};
  const policy = analytics?.trendingPolicy || {};
  const tours = analytics?.topTours || [];
  const timeline = analytics?.timeline;

  return {
    progressWidget: analytics?.summary || analytics?.timeline ? {
      title: title || "Tour performance",
      description,
      icon: "management",
      metrics: [
        { id: "views", label: "Tracked views", value: formatNumber(summary.views), icon: "eye" },
        { id: "enquiries", label: "Enquiries", value: formatNumber(summary.enquiries), icon: "messageCircle" },
        { id: "bookings", label: "Bookings", value: formatNumber(summary.bookings), icon: "calendar" },
        { id: "trending", label: "Trending tours", value: formatNumber(summary.trendingTours), icon: "sparkles" },
      ],
      chart: timeline?.series?.length ? timeline : null,
      progress: { title: "Conversion funnel", items: summary.funnel || [] },
    } : null,
    listingWidget: Array.isArray(analytics?.topTours) ? {
      title: "Top tours",
      icon: "sparkles",
      columns: [
        { key: "title", label: "Tour title" },
        { key: "views", label: "Views" },
        { key: "enquiries", label: "Enquiries" },
        { key: "bookings", label: "Bookings" },
        { key: "status", label: "Status" },
      ],
      rows: tours.map((tour) => ({
        id: tour.id,
        target,
        cells: {
          title: { text: tour.title, detail: tour.trending ? "Trending automatically" : `${tour.trendScore || 0}/100 trend score` },
          views: formatNumber(tour.views),
          enquiries: formatNumber(tour.enquiries),
          bookings: formatNumber(tour.bookings),
          status: { status: tour.trending ? "trending" : tour.status },
        },
      })),
      action: onViewAll ? { label: "View all", onClick: onViewAll } : null,
      emptyLabel: "No tour engagement yet",
    } : null,
    infoWidget: analytics?.trendingPolicy ? {
      title: "How a tour becomes trending",
      icon: "info",
      description: policy.description,
      items: policy.criteria || [],
    } : null,
  };
}
