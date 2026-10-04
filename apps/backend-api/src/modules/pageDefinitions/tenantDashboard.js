export function scopeTenantDashboard(component, client) {
    if (!client) return component;
    const tours = client.productAccess.includes('trevista');
    const inventory = client.productAccess.some((key) => ['trevista', 'trevio'].includes(key));
    const allowed = (target) => (target !== 'tenancy' || client.partnerEnabled) && (target !== 'services' || inventory) && (target !== 'support' || client.accountModules.includes('support'));
    const result = structuredClone(component);
    Object.assign(result.elements.labels, {
        dashboardTitle: `${client.globalBrand?.label || client.name} overview`, dashboardDescription: 'Your company’s bookings, enquiries and enabled services.',
        inventoryTitle: 'Enabled services', inventoryDescription: 'Services available to your company.',
        platformTitle: 'Company overview', platformDescription: 'Your licensed products and company accounts.',
        recentEmptyTitle: 'No company activity yet', recentDescription: 'Recent changes in your company workspace.',
        activeMembers: 'Active company members',
    });
    result.structure.widgets = result.structure.widgets.filter((widget) => {
        const key = widget.props?.endpoint?.split('/').pop();
        return (!['progress', 'listing'].includes(key) || tours) && (key !== 'upcomingDepartures' || inventory) && key !== 'systemStatus';
    }).map((widget) => ({ ...widget, props: { ...widget.props, ...(widget.props?.items ? { items: widget.props.items.filter((item) => allowed(item.target)) } : {}), ...(widget.props?.dataKey === 'platform' ? { fields: ['activeProducts', ...(client.partnerEnabled ? ['activePartners', 'activeAgents'] : []), 'activeMembers'] } : {}) } }));
    result.structure.actions = result.structure.actions.filter((action) => allowed(action.target)).map((action) => ({ ...action, masterOnly: false }));
    return result;
}

export function scopeTenantHome(component, client) {
    if (!client) return component;
    const result = structuredClone(component);
    const name = client.globalBrand?.label || client.name;
    const home = client.homePage || {};
    const heroImage = home.hero?.image || client.heroImages?.appShell;
    if (heroImage && result.elements.urls) {
        result.elements.urls.heroBackgroundImage = heroImage;
    }
    for (const [key, value] of Object.entries(result.elements.labels || {})) {
        if (typeof value === 'string') result.elements.labels[key] = value.replace(/TravelsTREM|TravelsTrem/g, name);
    }
    const enabled = (key) => client.productAccess.includes(key);
    const services = client.modules?.trehub || ['flights', 'hotels'];
    const modes = { tour: enabled('trevista'), trip: enabled('trevio'), flight: enabled('trehub') && services.includes('flights'), hotel: enabled('trehub') && services.includes('hotels') };
    const labels = result.elements.labels;
    const setLabel = (key, value) => { if (typeof value === 'string') labels[key] = value; };
    setLabel('heroEyebrow', home.hero?.eyebrow);
    setLabel('heroDiscoverTitle', home.hero?.title);
    setLabel('heroDiscoverDescription', home.hero?.description);
    for (const field of ['eyebrow', 'title', 'description']) {
        setLabel(`featured${field[0].toUpperCase()}${field.slice(1)}`, home.featured?.[field]);
    }
    const showFaq = home.faq?.visible === true && home.faq.items?.length > 0;
    result.structure.widgets = result.structure.widgets.filter((widget) =>
        (widget.type !== 'HomeInsights' || showFaq) &&
        (widget.type !== 'HomeCardsWithFeature' || home.featured?.visible !== false));
    for (const widget of result.structure.widgets) {
        if (widget.type === 'JourneyHero') {
            if (widget.props?.search) {
                widget.props.search.modes = widget.props.search.modes.filter((mode) => modes[mode.id]);
                if (home.hero?.searchVisible === false || !widget.props.search.modes.length) delete widget.props.search;
            }
            if (Array.isArray(home.hero?.trustItems)) widget.props.trustItems = home.hero.trustItems;
        }
    }
    if (result.data.homeFeatures) {
        const categories = { tours: modes.tour, trips: modes.trip, flights: modes.flight, hotels: modes.hotel };
        result.data.homeFeatures.categories = result.data.homeFeatures.categories.filter((category) => categories[category.id]);
        result.data.homeFeatures.defaultCategory = result.data.homeFeatures.categories[0]?.id || '';
    }
    if (home.featured?.visible === false) delete result.data.homeFeatures;
    if (showFaq) {
        result.data.homeInsights = {
            ariaLabel: home.faq.title || 'Frequently asked questions',
            faq: { title: home.faq.title || 'Frequently asked questions', description: home.faq.description || '', items: home.faq.items },
        };
    } else delete result.data.homeInsights;
    if (result.data.journeyStory) {
        const story = result.data.journeyStory;
        story.contentVisible = home.customise?.visible !== false;
        story.stats = home.statistics?.visible === false ? [] : [
            ...(home.statistics?.customerCount != null ? [{ id: 'customers', label: home.statistics.customerLabel || 'Happy customers', value: String(home.statistics.customerCount) }] : []),
            ...(home.statistics?.items || []),
        ];
        for (const field of ['eyebrow', 'title', 'highlight', 'description']) {
            setLabel(`story${field[0].toUpperCase()}${field.slice(1)}`, home.customise?.[field]);
        }
        if (home.customise?.image) story.visual = { ...story.visual, src: home.customise.image };
        if (Array.isArray(home.customise?.advantages)) story.advantages = home.customise.advantages;
        result.data.journeyStory.advantages = result.data.journeyStory.advantages.filter((item) =>
            item.id !== 'visa' && (item.id !== 'support' || (client.accountModules || []).includes('support')));
        if (!story.contentVisible && !story.stats.length) {
            delete result.data.journeyStory;
            result.structure.widgets = result.structure.widgets.filter((widget) => widget.type !== 'JourneyStory');
        }
    }
    return result;
}
