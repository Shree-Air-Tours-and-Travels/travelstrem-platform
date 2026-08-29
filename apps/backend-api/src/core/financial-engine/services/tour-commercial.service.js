const PRICING_UNITS = new Set([
    "FIXED",
    "PER_BOOKING",
    "PER_PERSON",
    "PER_ADULT",
    "PER_CHILD",
    "PER_INFANT",
    "PER_ROOM",
    "PER_NIGHT",
    "PER_ROOM_PER_NIGHT",
    "PER_PERSON_PER_NIGHT",
    "PER_VEHICLE",
    "PER_TRIP",
    "PER_DAY",
    "PER_GROUP",
]);

const integer = (value, name, { min = 0 } = {}) => {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min)
        throw new TypeError(`${name} must be an integer >= ${min}`);
    return parsed;
};

const multiply = (left, right, name) => {
    const amount = left * right;
    if (!Number.isSafeInteger(amount)) throw new RangeError(`${name} exceeds the safe money range`);
    return amount;
};

const quantityFor = (unit, basis) => {
    if (!PRICING_UNITS.has(unit)) throw new Error(`Unsupported pricing unit: ${unit}`);
    const travellers = basis.adults + basis.children + basis.infants;
    switch (unit) {
        case "PER_PERSON":
            return travellers;
        case "PER_ADULT":
            return basis.adults;
        case "PER_CHILD":
            return basis.children;
        case "PER_INFANT":
            return basis.infants;
        case "PER_ROOM":
            return basis.rooms;
        case "PER_NIGHT":
            return basis.nights;
        case "PER_ROOM_PER_NIGHT":
            return multiply(basis.rooms, basis.nights, "Room-night quantity");
        case "PER_PERSON_PER_NIGHT":
            return multiply(travellers, basis.nights, "Person-night quantity");
        case "PER_VEHICLE":
            return basis.vehicles;
        case "PER_DAY":
            return basis.days;
        case "PER_GROUP":
        case "PER_TRIP":
        case "PER_BOOKING":
        case "FIXED":
            return 1;
        default:
            throw new Error(`Unsupported pricing unit: ${unit}`);
    }
};

const normalizeBasis = (input = {}, tour = {}) => ({
    adults: integer(input.adults ?? input.travellers?.adults ?? input.adultCount ?? 1, "Adults"),
    children: integer(
        input.children ?? input.travellers?.children ?? input.childCount ?? 0,
        "Children",
    ),
    infants: integer(
        input.infants ?? input.travellers?.infants ?? input.infantCount ?? 0,
        "Infants",
    ),
    rooms: integer(input.rooms ?? 1, "Rooms", { min: 1 }),
    vehicles: integer(input.vehicles ?? 1, "Vehicles", { min: 1 }),
    nights: integer(input.nights ?? tour.period?.nights ?? 1, "Nights"),
    days: integer(input.days ?? tour.period?.days ?? 1, "Days", { min: 1 }),
});

const componentAmount = (component, basis, moneyField) => {
    const pricing = component.pricing || {};
    const unit = pricing.unit || "PER_BOOKING";
    const unitAmountMinor = integer(
        pricing[moneyField] ?? 0,
        `${component.name || component.componentKey} ${moneyField}`,
    );
    const quantity = quantityFor(unit, basis);
    return {
        unit,
        quantity,
        unitAmountMinor,
        amountMinor: multiply(unitAmountMinor, quantity, "Component amount"),
    };
};

const percentageAmount = (amountMinor, percent, name) => {
    const basisPoints = Math.round(Number(percent || 0) * 100);
    if (!Number.isSafeInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000)
        throw new TypeError(`${name} must be between 0 and 100 percent`);
    return Number((BigInt(amountMinor) * BigInt(basisPoints) + 5000n) / 10000n);
};

const uniqueKeys = (values = []) => [...new Set(values.map(String).filter(Boolean))];
const PACKAGE_TIER_RANK = Object.freeze({ BASIC: 1, STANDARD: 2, PREMIUM: 3 });
const packageTierRank = (value) => PACKAGE_TIER_RANK[String(value || "").toUpperCase()] || 0;
const containsEvery = (candidateValues, requiredValues) => {
    const candidate = new Set(uniqueKeys(candidateValues));
    return uniqueKeys(requiredValues).every((key) => candidate.has(key));
};

/**
 * Deterministically prices one configured tour package. All amounts are paise.
 * This is the sole tour component/package calculator; UI totals are previews only.
 */
export function calculateTourCommercials({ tour, packageKey, selections = {} } = {}) {
    if (!tour) throw new TypeError("Tour is required");
    const commercial = tour.commercial || {};
    if (commercial.version !== "COMPONENTS_V1")
        throw new Error("Tour does not use component pricing");
    const packages = Array.isArray(commercial.packages) ? commercial.packages : [];
    const selectedPackage = packages.find(
        (item) =>
            item.enabled !== false && (item.packageKey === packageKey || item.tier === packageKey),
    );
    if (!selectedPackage) throw new Error("A valid enabled package is required");
    const components = new Map(
        (commercial.components || [])
            .filter((item) => item.active !== false)
            .map((item) => [String(item.componentKey), item]),
    );
    const includedKeys = uniqueKeys(selectedPackage.includedComponentKeys);
    const allowedOptionalKeys = new Set(uniqueKeys(selectedPackage.optionalComponentKeys));
    const requestedOptionalKeys = uniqueKeys(
        selections.optionalComponentKeys || selections.addonKeys || [],
    );
    for (const key of requestedOptionalKeys)
        if (!allowedOptionalKeys.has(key))
            throw new Error(`Component '${key}' is not optional for this package`);
    const basis = normalizeBasis(selections, tour);
    if (basis.adults + basis.children + basis.infants < 1)
        throw new Error("At least one traveller is required");

    const lines = [];
    const addLine = (key, selectionType) => {
        const component = components.get(key);
        if (!component) throw new Error(`Package references missing component '${key}'`);
        const cost = componentAmount(component, basis, "costAmountMinor");
        const selling = componentAmount(
            component,
            basis,
            commercial.pricingPolicy ? "costAmountMinor" : "sellingAmountMinor",
        );
        let costAmountMinor = cost.amountMinor;
        let sellingAmountMinor = selling.amountMinor;
        if (selectionType === "OPTIONAL" && component.replacesComponentKey) {
            const replaced = components.get(String(component.replacesComponentKey));
            if (replaced && includedKeys.includes(String(component.replacesComponentKey))) {
                costAmountMinor = Math.max(
                    0,
                    costAmountMinor -
                        componentAmount(replaced, basis, "costAmountMinor").amountMinor,
                );
                sellingAmountMinor = Math.max(
                    0,
                    sellingAmountMinor -
                        componentAmount(replaced, basis, "sellingAmountMinor").amountMinor,
                );
            }
        }
        lines.push({
            componentKey: key,
            type: component.type,
            name: component.name,
            selectionType,
            pricingUnit: selling.unit,
            quantity: selling.quantity,
            costUnitAmountMinor: cost.unitAmountMinor,
            sellingUnitAmountMinor: selling.unitAmountMinor,
            costAmountMinor,
            sellingAmountMinor,
            marginMinor: sellingAmountMinor - costAmountMinor,
            status: component.status || "CONFIRMED",
        });
    };
    includedKeys.forEach((key) => addLine(key, "INCLUDED"));
    requestedOptionalKeys.forEach((key) => addLine(key, "OPTIONAL"));

    const total = (field) => lines.reduce((sum, line) => sum + line[field], 0);
    const costTotalMinor = total("costAmountMinor");
    const componentSubtotalMinor = total("sellingAmountMinor");
    const policy = commercial.pricingPolicy || null;
    const agentFeeMinor = policy
        ? policy.feeType === "FIXED"
            ? integer(policy.feeAmountMinor ?? 0, "Fixed agent fee")
            : percentageAmount(costTotalMinor, policy.feePercent, "Agent fee")
        : Math.max(0, componentSubtotalMinor - costTotalMinor);
    const agentGstMinor = policy
        ? percentageAmount(agentFeeMinor, policy.gstPercent, "Agent GST")
        : 0;
    const sellingTotalMinor = policy
        ? costTotalMinor + agentFeeMinor + agentGstMinor
        : componentSubtotalMinor;
    return {
        version: "COMPONENTS_V1",
        currency: commercial.currency || "INR",
        moneyUnit: "PAISE",
        package: {
            packageKey: selectedPackage.packageKey,
            tier: selectedPackage.tier,
            name: selectedPackage.name,
        },
        basis,
        selections: { optionalComponentKeys: requestedOptionalKeys },
        lines,
        costTotalMinor,
        componentSubtotalMinor,
        agentFeeMinor,
        agentGstMinor,
        sellingTotalMinor,
        agentAmountMinor: sellingTotalMinor,
        componentMarginMinor: agentFeeMinor,
        requiresRepricing: lines.some((line) =>
            ["ESTIMATED", "REPRICE_REQUIRED"].includes(line.status),
        ),
    };
}

export function deriveTourCommercialSummary(tour) {
    const packages = (tour?.commercial?.packages || []).filter((item) => item.enabled !== false);
    if (
        tour?.commercial?.version !== "COMPONENTS_V1" ||
        packages.length < 2 ||
        packages.length > 3
    ) {
        throw new Error("Component-priced tours require two or three enabled packages");
    }
    const previews = packages.map((item) =>
        calculateTourCommercials({
            tour,
            packageKey: item.packageKey,
            selections: tour.commercial.defaultBasis || {},
        }),
    );
    return {
        minMinor: Math.min(...previews.map((item) => item.sellingTotalMinor)),
        maxMinor: Math.max(...previews.map((item) => item.sellingTotalMinor)),
        packages: previews.map((item) => ({
            packageKey: item.package.packageKey,
            tier: item.package.tier,
            costTotalMinor: item.costTotalMinor,
            sellingTotalMinor: item.sellingTotalMinor,
            agentFeeMinor: item.agentFeeMinor,
            agentGstMinor: item.agentGstMinor,
            marginMinor: item.componentMarginMinor,
            requiresRepricing: item.requiresRepricing,
        })),
    };
}

const incrementalSupplement = ({ tour, pricing, basis }) => {
    const costUnitAmountMinor = integer(pricing?.amountMinor ?? 0, "Hotel room supplier cost");
    const unit = pricing?.unit || "PER_ROOM_PER_NIGHT";
    const quantity = quantityFor(unit, basis);
    const costAmountMinor = multiply(costUnitAmountMinor, quantity, "Hotel room supplement");
    const policy = tour?.commercial?.pricingPolicy || null;
    const agentFeeMinor = policy
        ? policy.feeType === "FIXED"
            ? 0
            : percentageAmount(costAmountMinor, policy.feePercent, "Agent fee")
        : 0;
    const agentGstMinor = policy
        ? percentageAmount(agentFeeMinor, policy.gstPercent, "Agent GST")
        : 0;
    return {
        unit,
        quantity,
        costUnitAmountMinor,
        costAmountMinor,
        agentFeeMinor,
        agentGstMinor,
        sellingTotalMinor: costAmountMinor + agentFeeMinor + agentGstMinor,
    };
};

const incrementalRoomUpgrade = ({ tour, targetPricing, includedPricing, basis }) => {
    const target = incrementalSupplement({ tour, pricing: targetPricing, basis });
    if (!includedPricing || includedPricing.amountMinor == null) return target;
    const included = incrementalSupplement({
        tour: { ...tour, commercial: { ...tour.commercial, pricingPolicy: null } },
        pricing: includedPricing,
        basis,
    });
    const costAmountMinor = Math.max(0, target.costAmountMinor - included.costAmountMinor);
    const policy = tour?.commercial?.pricingPolicy || null;
    const agentFeeMinor = policy
        ? policy.feeType === "FIXED"
            ? 0
            : percentageAmount(costAmountMinor, policy.feePercent, "Agent fee")
        : 0;
    const agentGstMinor = policy
        ? percentageAmount(agentFeeMinor, policy.gstPercent, "Agent GST")
        : 0;
    return {
        ...target,
        costAmountMinor,
        agentFeeMinor,
        agentGstMinor,
        sellingTotalMinor: costAmountMinor + agentFeeMinor + agentGstMinor,
    };
};

const publicAmount = (totalMinor, travellers) => ({
    totalMinor,
    perPersonMinor: Math.round(totalMinor / Math.max(1, travellers)),
});

export function calculateTourHotelUnitPrice({ tour, pricing } = {}) {
    if (!pricing || pricing.amountMinor == null) return null;
    const basis = { adults: 1, children: 0, infants: 0, rooms: 1, vehicles: 1, nights: 1, days: 1 };
    const priced = incrementalSupplement({ tour, pricing, basis });
    return {
        amountMinor: priced.sellingTotalMinor,
        currency: pricing.currency || tour?.commercial?.currency || "INR",
        unit: priced.unit,
    };
}

const hotelKey = (option) => String(option?.optionKey || option?._id || "");
const roomKey = (room) => String(room?.roomKey || room?._id || "");
const stayKeyFor = (option) =>
    String(option?.stayKey || option?.location || hotelKey(option))
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
const packageKeysForRoom = (option, room) =>
    (room?.packageKeys?.length ? room.packageKeys : option?.packageKeys || []).map(String);

const normalizeHotelSelections = ({ hotelSelections, hotelOptionKey, roomOptionKey }) => {
    const raw =
        Array.isArray(hotelSelections) && hotelSelections.length
            ? hotelSelections
            : hotelOptionKey
              ? [{ hotelOptionKey, roomOptionKey }]
              : [];
    if (raw.length > 20) throw new RangeError("A maximum of 20 stay selections is allowed");
    return raw.map((item) => ({
        stayKey: String(item?.stayKey || "").slice(0, 100),
        hotelOptionKey: String(item?.hotelOptionKey || "").slice(0, 100),
        roomOptionKey: String(item?.roomOptionKey || "").slice(0, 100),
    }));
};

const resolveHotelSelections = (tour, input) => {
    const options = (tour.hotelOptions || []).filter((item) => item?.active !== false);
    const seenStays = new Set();
    return normalizeHotelSelections(input).map((selection) => {
        const option = options.find((item) => hotelKey(item) === selection.hotelOptionKey);
        if (!option) throw new Error("The selected hotel is not available");
        const resolvedStayKey = stayKeyFor(option);
        if (selection.stayKey && selection.stayKey !== resolvedStayKey) {
            throw new Error(`The selected hotel does not belong to stay '${selection.stayKey}'`);
        }
        if (seenStays.has(resolvedStayKey))
            throw new Error(`Choose only one hotel and room for stay '${resolvedStayKey}'`);
        seenStays.add(resolvedStayKey);
        const room = selection.roomOptionKey
            ? (option.rooms || []).find(
                  (item) => item?.available !== false && roomKey(item) === selection.roomOptionKey,
              )
            : null;
        if (selection.roomOptionKey && !room)
            throw new Error("The selected room is not available at this hotel");
        return { stayKey: resolvedStayKey, option, room };
    });
};

const priceStaySelections = ({ tour, selections, packageKey, travellers, baseBasis }) => {
    let pending = false;
    let supplementTotalMinor = 0;
    const hotels = selections.map(({ stayKey, option, room }) => {
        const groups = (tour.hotelOptions || []).filter(
            (candidate) => candidate?.active !== false && stayKeyFor(candidate) === stayKey,
        );
        const selectedIncluded = packageKeysForRoom(option, room).includes(packageKey);
        const includedChoice = selectedIncluded
            ? { option, room }
            : groups
                  .flatMap((candidate) =>
                      (candidate.rooms || [])
                          .filter((candidateRoom) => candidateRoom?.available !== false)
                          .map((candidateRoom) => ({ option: candidate, room: candidateRoom })),
                  )
                  .find((candidate) =>
                      packageKeysForRoom(candidate.option, candidate.room).includes(packageKey),
                  );
        const targetPricing = room?.pricing?.amountMinor != null ? room.pricing : option?.pricing;
        const includedPricing =
            includedChoice?.room?.pricing?.amountMinor != null
                ? includedChoice.room.pricing
                : includedChoice?.option?.pricing?.amountMinor != null
                  ? includedChoice.option.pricing
                  : null;
        const pricePending = Boolean(
            !selectedIncluded && (!targetPricing || targetPricing.amountMinor == null),
        );
        const maxAdults = Math.max(
            1,
            Number(room?.maxAdults || includedChoice?.room?.maxAdults || 2),
        );
        const stayBasis = {
            ...baseBasis,
            rooms: Math.max(1, Math.ceil(travellers / maxAdults)),
            nights: Math.max(0, Number(option?.nights ?? includedChoice?.option?.nights ?? 0)),
        };
        const supplement = selectedIncluded
            ? { unit: targetPricing?.unit || null, quantity: 0, sellingTotalMinor: 0 }
            : pricePending
              ? { unit: targetPricing?.unit || null, quantity: null, sellingTotalMinor: null }
              : incrementalRoomUpgrade({ tour, targetPricing, includedPricing, basis: stayBasis });
        if (pricePending) pending = true;
        else supplementTotalMinor += supplement.sellingTotalMinor;
        return {
            stayKey,
            location: String(option.location || includedChoice?.option?.location || ""),
            nights: stayBasis.nights,
            optionKey: hotelKey(option),
            optionName: String(option.propertyName || option.title || "Hotel option"),
            roomKey: roomKey(room),
            roomName: String(room?.name || ""),
            includedOptionKey: includedChoice ? hotelKey(includedChoice.option) : "",
            includedOptionName: String(
                includedChoice?.option?.propertyName || includedChoice?.option?.title || "",
            ),
            includedRoomKey: includedChoice ? roomKey(includedChoice.room) : "",
            includedRoomName: String(includedChoice?.room?.name || ""),
            included: selectedIncluded,
            supplement: pricePending
                ? {
                      totalMinor: null,
                      perPersonMinor: null,
                      unit: supplement.unit,
                      quantity: null,
                      status: "PENDING_AGENT_QUOTE",
                  }
                : {
                      ...publicAmount(supplement.sellingTotalMinor, travellers),
                      unit: supplement.unit,
                      quantity: supplement.quantity,
                      status: "CALCULATED",
                  },
        };
    });
    return { hotels, pending, supplementTotalMinor };
};

/**
 * Prices a package plus zero or more stay-scoped hotel/room overrides. Every
 * option is resolved from persisted data and can only replace accommodation
 * carrying the same stayKey; the browser never submits prices.
 */
const normalizeHotelRequests = (tour, hotelRequests = []) => {
    if (!Array.isArray(hotelRequests) || !hotelRequests.length) return [];
    const stays = new Map(
        (tour?.hotelOptions || [])
            .map((option) => [stayKeyFor(option), option])
            .filter(([key]) => key),
    );
    const seen = new Set();
    return hotelRequests.slice(0, 12).map((request) => {
        const stayKey = String(request?.stayKey || "")
            .trim()
            .slice(0, 100);
        const stay = stays.get(stayKey);
        if (!stay)
            throw new RangeError("That destination stay is no longer available for hotel requests");
        if (seen.has(stayKey))
            throw new RangeError(
                "Only one hotel request can be submitted for each destination stay",
            );
        seen.add(stayKey);
        const propertyClass = String(request?.propertyClass || "")
            .trim()
            .slice(0, 80);
        const roomType = String(request?.roomType || "")
            .trim()
            .slice(0, 120);
        const requirements = String(request?.requirements || "")
            .trim()
            .slice(0, 600);
        if (!propertyClass && !roomType && !requirements)
            throw new RangeError("Add a hotel category, room type, or requirement");
        const budgetRaw = String(request?.budgetPerNight || "").trim();
        const budgetPerNightMinor = budgetRaw === "" ? null : Math.round(Number(budgetRaw) * 100);
        if (
            budgetPerNightMinor != null &&
            (!Number.isSafeInteger(budgetPerNightMinor) ||
                budgetPerNightMinor < 0 ||
                budgetPerNightMinor > 100000000)
        ) {
            throw new RangeError("Hotel budget must be a valid amount");
        }
        return {
            stayKey,
            location: String(stay.location || "")
                .trim()
                .slice(0, 120),
            nights: Math.max(0, Number(stay.nights || request?.nights || 0)),
            propertyClass,
            roomType,
            budgetPerNightMinor,
            currency: String(tour?.commercial?.currency || "INR")
                .toUpperCase()
                .slice(0, 3),
            requirements,
            status: "REQUESTED",
        };
    });
};

export function calculateTourCustomizationPreview({
    tour,
    packageKey,
    hotelSelections = [],
    hotelRequests = [],
    hotelOptionKey = "",
    roomOptionKey = "",
    travellerCount = 1,
    selectedAddOnIds = [],
} = {}) {
    if (!tour) throw new TypeError("Tour is required");
    const travellers = integer(travellerCount, "Traveller count", { min: 1 });
    if (travellers > 50) throw new RangeError("Traveller count cannot exceed 50");
    const selections = resolveHotelSelections(tour, {
        hotelSelections,
        hotelOptionKey,
        roomOptionKey,
    });
    const basis = {
        ...(tour.commercial?.defaultBasis || {}),
        adults: travellers,
        children: 0,
        infants: 0,
        rooms: Math.max(1, Math.ceil(travellers / 2)),
        nights: Math.max(0, Number(tour.period?.nights ?? 0)),
        days: Math.max(1, Number(tour.period?.days || 1)),
    };
    const requestedAddOnIds = uniqueKeys(selectedAddOnIds);
    const availableAddOns = new Map(
        (tour.extras || [])
            .filter((item) => item?.active !== false && item?.included !== true)
            .map((item) => [String(item?._id || ""), item]),
    );
    const invalidAddOn = requestedAddOnIds.find((id) => !availableAddOns.has(id));
    if (invalidAddOn) throw new Error("Choose a valid optional add-on for this tour");
    const addOns = requestedAddOnIds.map((id) => {
        const item = availableAddOns.get(id);
        const unit = String(item?.pricing?.unit || "PER_BOOKING");
        const unitAmountMinor = integer(
            item?.pricing?.amountMinor ?? Math.round(Number(item?.price || 0) * 100),
            `${item?.title || "Add-on"} amountMinor`,
        );
        const quantity = quantityFor(unit, basis);
        const totalMinor = multiply(unitAmountMinor, quantity, "Add-on amount");
        return {
            id,
            title: String(item?.title || "Optional add-on"),
            description: String(item?.description || ""),
            unit,
            quantity,
            unitAmountMinor,
            totalMinor,
        };
    });
    const addOnTotalMinor = integer(
        addOns.reduce((sum, item) => sum + item.totalMinor, 0),
        "Add-on total",
    );
    const selected = calculateTourCommercials({ tour, packageKey, selections: basis });
    const selectedKey = String(selected.package.packageKey);
    const pricedStays = priceStaySelections({
        tour,
        selections,
        packageKey: selectedKey,
        travellers,
        baseBasis: basis,
    });
    const customizedTotalMinor = pricedStays.pending
        ? null
        : selected.sellingTotalMinor + pricedStays.supplementTotalMinor + addOnTotalMinor;
    const selectedComponentKeys = new Set(selected.lines.map((line) => String(line.componentKey)));
    const selectedPackageDefinition = (tour.commercial?.packages || []).find(
        (item) => String(item.packageKey) === selectedKey,
    );
    const selectedTierRank = packageTierRank(selectedPackageDefinition?.tier);
    const selectedIncludedStayCount = pricedStays.hotels.filter((item) => item.included).length;
    const evaluatedAlternatives = (tour.commercial?.packages || [])
        .filter((item) => item?.enabled !== false && String(item.packageKey) !== selectedKey)
        .map((item) => {
            const commercial = calculateTourCommercials({
                tour,
                packageKey: item.packageKey,
                selections: basis,
            });
            const alternativeStays = priceStaySelections({
                tour,
                selections,
                packageKey: String(item.packageKey),
                travellers,
                baseBasis: basis,
            });
            const pending = alternativeStays.pending || commercial.requiresRepricing;
            const totalMinor = pending
                ? null
                : commercial.sellingTotalMinor +
                  alternativeStays.supplementTotalMinor +
                  addOnTotalMinor;
            return {
                packageDefinition: item,
                commercial,
                totalMinor,
                pending,
                includedStayCount: alternativeStays.hotels.filter((hotel) => hotel.included).length,
            };
        })
        .map(({ packageDefinition, commercial, totalMinor, pending, includedStayCount }) => {
            const differenceMinor =
                customizedTotalMinor == null || pending ? null : totalMinor - customizedTotalMinor;
            const absoluteDifferenceMinor =
                differenceMinor == null ? null : Math.abs(differenceMinor);
            return {
                packageKey: commercial.package.packageKey,
                packageName: commercial.package.name,
                ...(totalMinor == null
                    ? { totalMinor: null, perPersonMinor: null }
                    : publicAmount(totalMinor, travellers)),
                differenceMinor,
                absoluteDifferenceMinor,
                differencePerPersonMinor:
                    absoluteDifferenceMinor == null
                        ? null
                        : Math.round(absoluteDifferenceMinor / travellers),
                savingsMinor: differenceMinor == null ? null : Math.max(0, -differenceMinor),
                additionalMinor: differenceMinor == null ? null : Math.max(0, differenceMinor),
                tier: packageDefinition.tier,
                tierDirection:
                    packageTierRank(packageDefinition.tier) > selectedTierRank
                        ? "UPGRADE"
                        : "EQUIVALENT",
                preservesSelectedPackage:
                    packageTierRank(packageDefinition.tier) >= selectedTierRank &&
                    (packageTierRank(packageDefinition.tier) > selectedTierRank ||
                        containsEvery(
                            packageDefinition.includedComponentKeys,
                            selectedPackageDefinition?.includedComponentKeys,
                        )),
                includesMoreSelectedStays: includedStayCount > selectedIncludedStayCount,
                additionalBenefits: commercial.lines
                    .filter((line) => !selectedComponentKeys.has(String(line.componentKey)))
                    .map((line) => line.name)
                    .filter(Boolean),
            };
        })
        .sort(
            (left, right) =>
                (left.totalMinor ?? Number.MAX_SAFE_INTEGER) -
                (right.totalMinor ?? Number.MAX_SAFE_INTEGER),
        );
    const alternatives = evaluatedAlternatives
        .filter(
            (item) =>
                item.totalMinor != null &&
                item.preservesSelectedPackage &&
                (item.savingsMinor > 0 || item.includesMoreSelectedStays),
        )
        .map((item) => ({
            ...item,
            recommendationType: item.savingsMinor > 0 ? "BETTER_VALUE" : "MORE_INCLUDED",
            recommendationTitle:
                item.savingsMinor > 0
                    ? "A comparable package may offer better value"
                    : "A higher package includes more of your request",
            recommendationReason:
                item.savingsMinor > 0
                    ? "This option keeps your selected package level and included services while reducing the calculated price."
                    : "This option keeps all selected-package inclusions and covers more of your requested stays.",
        }));
    const recommendedAlternative =
        customizedTotalMinor == null || selected.requiresRepricing ? null : alternatives[0] || null;
    const recommendationDecision = recommendedAlternative
        ? {
              code: "SUITABLE_ALTERNATIVE",
              message: recommendedAlternative.recommendationReason,
          }
        : customizedTotalMinor == null || selected.requiresRepricing
          ? {
                code: "PRICE_CONFIRMATION_REQUIRED",
                message:
                    "TREM Intelligence will not compare incomplete prices. Your selected package remains unchanged while the agent confirms requested items.",
            }
          : {
                code: "SELECTED_PACKAGE_PRESERVED",
                message:
                    "Your selected package level and inclusions are being preserved. Lower-tier packages are not suggested as alternatives.",
            };
    const customized = pricedStays.hotels.some((item) => !item.included) || addOns.length > 0;
    const preview = {
        version: "TOUR_CUSTOMIZATION_V2",
        currency: selected.currency,
        quoteMode: customized ? "CUSTOMIZED" : "PACKAGE",
        travellers,
        rooms: basis.rooms,
        package: {
            packageKey: selected.package.packageKey,
            packageName: selected.package.name,
            ...publicAmount(selected.sellingTotalMinor, travellers),
        },
        hotels: pricedStays.hotels,
        hotel: pricedStays.hotels[0] || null,
        addOns,
        addOnTotalMinor,
        customized:
            customizedTotalMinor == null
                ? { totalMinor: null, perPersonMinor: null, status: "PENDING_AGENT_QUOTE" }
                : { ...publicAmount(customizedTotalMinor, travellers), status: "CALCULATED" },
        recommendedAlternative,
        alternatives,
        recommendationDecision,
        pricingStatus: pricedStays.pending ? "PENDING_AGENT_QUOTE" : "CALCULATED",
        requiresRepricing: Boolean(selected.requiresRepricing || pricedStays.pending),
    };
    const requests = normalizeHotelRequests(tour, hotelRequests);
    if (!requests.length) return preview;
    return {
        ...preview,
        quoteMode: "CUSTOMIZED",
        hotelRequests: requests,
        customized: { totalMinor: null, perPersonMinor: null, status: "PENDING_AGENT_QUOTE" },
        recommendedAlternative: null,
        alternatives: [],
        recommendationDecision: {
            code: "PRICE_CONFIRMATION_REQUIRED",
            message:
                "TREM Intelligence will not compare incomplete prices. Your selected package remains unchanged while the agent confirms requested items.",
        },
        pricingStatus: "PENDING_AGENT_QUOTE",
        requiresRepricing: true,
    };
}

export { PRICING_UNITS };
