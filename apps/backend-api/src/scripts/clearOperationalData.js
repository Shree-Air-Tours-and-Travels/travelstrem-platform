import mongoose from "mongoose";
import config from "../config/index.js";
import User from "../modules/auth/models/User.js";

const applyChanges = process.argv.includes("--apply");

// These collections contain the minimum platform bootstrap data needed for the
// applications to load and for the master administrator to authenticate.
const preservedCollections = new Set([
  "authidentities",
  "masteroptionsets",
  "products",
  "users",
  // Platform config that should survive a data reset
  "clients",
  "platformpricingconfigs",
  "roles",
  "taxrules",
  "coupons",
  "tourdiscoverychips",
]);

await mongoose.connect(config.MONGO_URI);

try {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Operational data cleanup is disabled in production.");
  }

  const masterAdmins = await User.find({
    role: "admin",
    adminLevel: "master",
  }).select("_id email role adminLevel").lean();

  if (masterAdmins.length !== 1) {
    throw new Error(
      `Expected exactly one master admin, found ${masterAdmins.length}. No data was changed.`,
    );
  }

  const [masterAdmin] = masterAdmins;
  const collections = await mongoose.connection.db
    .listCollections({}, { nameOnly: true })
    .toArray();
  const collectionNames = collections
    .map(({ name }) => name)
    .filter((name) => !name.startsWith("system."))
    .sort();

  const before = {};
  for (const name of collectionNames) {
    before[name] = await mongoose.connection.db.collection(name).countDocuments();
  }

  const plannedDeletes = Object.fromEntries(
    collectionNames.map((name) => {
      if (name === "users") {
        return [name, Math.max(0, before[name] - 1)];
      }
      if (name === "authidentities") {
        return [name, null];
      }
      return [name, preservedCollections.has(name) ? 0 : before[name]];
    }),
  );

  plannedDeletes.authidentities = await mongoose.connection.db
    .collection("authidentities")
    .countDocuments({ userId: { $ne: masterAdmin._id } });

  if (!applyChanges) {
    console.log(JSON.stringify({
      database: mongoose.connection.name,
      mode: "dry-run",
      preservedMasterAdmin: {
        id: String(masterAdmin._id),
        email: masterAdmin.email,
      },
      preservedCollections: [...preservedCollections].sort(),
      before,
      plannedDeletes,
    }, null, 2));
    process.exitCode = 2;
  } else {
    const deleted = {};

    for (const name of collectionNames) {
      if (preservedCollections.has(name)) continue;
      const result = await mongoose.connection.db.collection(name).deleteMany({});
      deleted[name] = result.deletedCount;
    }

    const usersResult = await mongoose.connection.db.collection("users").deleteMany({
      _id: { $ne: masterAdmin._id },
    });
    deleted.users = usersResult.deletedCount;

    const identitiesResult = await mongoose.connection.db
      .collection("authidentities")
      .deleteMany({ userId: { $ne: masterAdmin._id } });
    deleted.authidentities = identitiesResult.deletedCount;

    const after = {};
    for (const name of collectionNames) {
      after[name] = await mongoose.connection.db.collection(name).countDocuments();
    }

    const remainingUsers = await User.find({})
      .select("_id email role adminLevel")
      .lean();

    if (
      remainingUsers.length !== 1
      || String(remainingUsers[0]._id) !== String(masterAdmin._id)
    ) {
      throw new Error("Cleanup verification failed: the remaining user is not the master admin.");
    }

    console.log(JSON.stringify({
      database: mongoose.connection.name,
      mode: "applied",
      preservedMasterAdmin: {
        id: String(masterAdmin._id),
        email: masterAdmin.email,
      },
      preservedCollections: [...preservedCollections].sort(),
      deleted,
      after,
    }, null, 2));
  }
} finally {
  await mongoose.disconnect();
}
