import mongoose from "mongoose";
import config from "../config/index.js";
import ContactLead from "../modules/forms/models/ContactLead.js";
import Tour from "../modules/tours/models/Tour.js";
import TrevioTrip from "../modules/trevio/models/TrevioTrip.js";
import { ensureBookingForEnquiry } from "../modules/forms/services/enquiryBookingService.js";

await mongoose.connect(config.MONGO_URI);

const leads = await ContactLead.find({ bookingId: null }).sort({ createdAt: 1 });
const result = { scanned: leads.length, created: 0, skipped: 0, failed: 0 };

for (const lead of leads) {
  try {
    const EntityModel = lead.product === "trevio" ? TrevioTrip : Tour;
    const entity = lead.tourId && mongoose.Types.ObjectId.isValid(String(lead.tourId))
      ? await EntityModel.findById(lead.tourId)
      : null;
    const booking = await ensureBookingForEnquiry(lead, entity);
    if (booking) result.created += 1;
  } catch (error) {
    result.failed += 1;
    console.error(`Failed ${lead.enquiryRef || lead._id}:`, error.message);
  }
}

console.log(JSON.stringify({ database: mongoose.connection.name, ...result }, null, 2));
await mongoose.disconnect();
if (result.failed) process.exitCode = 1;
