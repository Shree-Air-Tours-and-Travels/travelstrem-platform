import { resolveCustomerDashboardContext } from "../dashboard/context.js";
import { customerScopeQuery } from "../tenancy/customerScope.js";
import Booking from "../bookings/models/Booking.js";
import FlightBooking from "../flights/models/FlightBooking.js";
import ContactLead from "../forms/models/ContactLead.js";
import { bookingStatusDisplay, statusDisplay } from "../../constants/common.js";

export async function supportContexts(userId) {
    const context = await resolveCustomerDashboardContext(userId, "support:view");
    if (!context.permissions.includes("booking:view")) return [];
    const scope = customerScopeQuery(context);
    const product = { $in: context.products };
    const groups = await Promise.all([
        Booking.find({ ...scope, userId, product }).select("bookingRef tourTitle status paymentStatus sourceEnquiryId").sort({ createdAt: -1 }).lean(),
        FlightBooking.find({ ...scope, userId, ...(context.products.includes("trehub") ? {} : { _id: null }) }).select("bookingRef status paymentStatus sourceEnquiryId").sort({ createdAt: -1 }).lean(),
        ContactLead.find({ ...scope, claimedBy: userId, product }).select("enquiryRef tourTitle status").sort({ createdAt: -1 }).lean(),
    ]);
    return groups.flatMap((items, index) => items.map(item => ({
        id: `${index === 2 ? "enquiry" : "booking"}:${item._id}`,
        reference: item.enquiryRef || item.bookingRef,
        title: item.tourTitle || (index === 1 ? "Flight booking" : "Travel enquiry"),
        status: index === 2 ? statusDisplay(item.status).label : bookingStatusDisplay(item.status, item.paymentStatus).label,
        target: `/?tab=bookings&enquiry=${encodeURIComponent(item.sourceEnquiryId || item.enquiryRef || item.bookingRef)}`,
    })));
}
