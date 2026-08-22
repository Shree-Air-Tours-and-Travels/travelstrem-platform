import initializeDatabase from "../bootstrap/database.js";
import PaymentConfig from "../core/financial-engine/models/PaymentConfig.js";
import AgencyMerchantConfig from "../core/financial-engine/models/AgencyMerchantConfig.js";
import PaymentProviderConfig from "../core/financial-engine/models/PaymentProviderConfig.js";
import FinancialLedgerEntry from "../core/financial-engine/models/FinancialLedgerEntry.js";
import FinancialSettlement from "../core/financial-engine/models/FinancialSettlement.js";
import BookingQuote from "../modules/bookings/models/BookingQuote.js";
import BookingPayment from "../modules/bookings/models/BookingPayment.js";
import mongoose from "mongoose";

await initializeDatabase();
for (const model of [PaymentConfig, AgencyMerchantConfig, PaymentProviderConfig, FinancialLedgerEntry, FinancialSettlement, BookingQuote, BookingPayment]) {
  const result = await model.syncIndexes();
  console.log(`${model.modelName}:`, result);
}
await mongoose.disconnect();
