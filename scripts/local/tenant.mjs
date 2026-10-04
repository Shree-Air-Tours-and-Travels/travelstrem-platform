import fs from "node:fs";
import { configureDns, resolveMongoConnectionUri } from "../../apps/backend-api/src/config/dns.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { tenantDeployment } from "../../apps/backend-api/src/modules/clients/configuration.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const backend = path.join(root, "apps/backend-api");
const require = createRequire(path.join(backend, "package.json"));
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const slug = process.argv[2];
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || ""))
  throw new Error("Usage: node scripts/local/tenant.mjs <tenant-slug> [--invite-admin]");
const read = (file) => (fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {});
const envFileIndex = process.argv.indexOf("--env-file");
if (envFileIndex !== -1 && !process.argv[envFileIndex + 1])
  throw new Error("--env-file requires a local environment file path.");
const clientEnvFile =
  envFileIndex === -1
    ? path.join(root, `.env.${slug}.local`)
    : path.resolve(root, process.argv[envFileIndex + 1]);
if (envFileIndex !== -1 && !fs.existsSync(clientEnvFile))
  throw new Error("The specified client environment file does not exist.");
const clientEnv = read(clientEnvFile);
const isAtlasConnection = (uri) => {
  const target = new URL(uri);
  return target.protocol === "mongodb+srv:" || /\.mongodb\.net(?::\d+)?(?:,|$)/i.test(target.host);
};
const source = {
  ...read(path.join(backend, ".env")),
  ...read(path.join(backend, ".env.development")),
  ...read(path.join(backend, ".env.development.local")),
  ...read(path.join(root, ".env.tenants.local")),
};
process.chdir(backend);
Object.assign(process.env, source, { NODE_ENV: "development", USE_DOTENV: "false" });
configureDns();
const connection = await mongoose.connect(
  await resolveMongoConnectionUri(source.MONGO_URI_DEV || source.MONGO_URI),
);
const { default: Client } =
  await import("../../apps/backend-api/src/modules/clients/models/Client.js");
const { default: User } = await import("../../apps/backend-api/src/modules/auth/models/User.js");
const { provisionClient } =
  await import("../../apps/backend-api/src/modules/clients/tenantDatabase.service.js");
const client = await Client.findOne({ slug, status: "active" });
if (!client) throw new Error("Active tenant not found. Complete registration first.");
const master = await User.findOne({
  role: "admin",
  adminLevel: "master",
  email: source.MASTER_ADMIN_EMAIL?.toLowerCase(),
  accountStatus: "active",
  clientId: null,
});
if (!master) throw new Error("The configured master administrator is required.");
if (clientEnv.TENANT_CLIENT_ID && clientEnv.TENANT_CLIENT_ID !== String(client._id))
  throw new Error("The client environment file belongs to another tenant.");
const result =
  client.provisioning?.status === "ready" && !process.argv.includes("--invite-admin")
    ? null
    : await provisionClient(client, master._id, {
        invite: process.argv.includes("--invite-admin"),
        syncConfiguration: false,
      });
if (process.argv.includes("--invite-admin")) {
  client.provisioning = { status: "ready", emailSent: result.emailSent };
  await client.save();
  console.log(
    result.alreadyActive
      ? "Client administrator already active."
      : result.emailSent
        ? "Client administrator activation invitation sent."
        : "Invitation created, but email delivery failed.",
  );
}
const runtimeSecretRef = client.database.secretRef.replace(/^TENANT_DB_/, "TENANT_RUNTIME_DB_");
let runtimeUri = clientEnv.MONGODB_URI || source[runtimeSecretRef];
const provisioningRuntimeUri = source[client.database.secretRef];
if (!runtimeUri && !provisioningRuntimeUri)
  throw new Error(`Configure ${runtimeSecretRef} or MONGODB_URI in the client environment file.`);
const isAtlas = isAtlasConnection(provisioningRuntimeUri || runtimeUri);
if (!runtimeUri) {
  if (isAtlas)
    throw new Error(
      `MongoDB Atlas requires the pre-created scoped runtime credential in ${runtimeSecretRef}. The provisioning credential cannot be used for tenant runtime access.`,
    );
  if (!process.argv.includes("--provision-runtime-user"))
    throw new Error(
      `Configure ${runtimeSecretRef} with collection-scoped runtime credentials, or explicitly run node scripts/local/tenant.mjs ${slug} --provision-runtime-user once.`,
    );
  await import("../../apps/backend-api/src/bootstrap/app.js");
  const { tenantDatabasePrivileges } =
    await import("../../apps/backend-api/src/modules/clients/tenantDatabaseAccess.js");
  const { tenantModelNames } =
    await import("../../apps/backend-api/src/modules/clients/tenantModels.js");
  const provisioningUri = new URL(provisioningRuntimeUri);
  provisioningUri.pathname = `/${client.database.name}`;
  const tenantConnection = await mongoose
    .createConnection(await resolveMongoConnectionUri(provisioningUri.toString()))
    .asPromise();
  try {
    const models = Object.fromEntries(
      [...tenantModelNames(client)]
        .filter((name) => mongoose.models[name])
        .map((name) => [name, mongoose.models[name]]),
    );
    const role = `tenant_${client._id}_runtime`;
    const username = `tenant_${client.slug}_runtime`;
    const password = randomBytes(36).toString("base64url");
    const privileges = tenantDatabasePrivileges(client, {
      name: client.database.name,
      models,
    });
    try {
      await tenantConnection.db.command({ updateRole: role, privileges, roles: [] });
    } catch (error) {
      if (![31, 51024].includes(error.code)) throw error;
      await tenantConnection.db.command({ createRole: role, privileges, roles: [] });
    }
    try {
      await tenantConnection.db.command({
        updateUser: username,
        pwd: password,
        roles: [{ role, db: client.database.name }],
      });
    } catch (error) {
      if (![11, 51003].includes(error.code)) throw error;
      await tenantConnection.db.command({
        createUser: username,
        pwd: password,
        roles: [{ role, db: client.database.name }],
      });
    }
    provisioningUri.username = username;
    provisioningUri.password = password;
    provisioningUri.searchParams.set("authSource", client.database.name);
    runtimeUri = provisioningUri.toString();
    const tenantsFile = path.join(root, ".env.tenants.local");
    const tenantSecrets = { ...read(tenantsFile), [runtimeSecretRef]: runtimeUri };
    fs.writeFileSync(
      tenantsFile,
      Object.entries(tenantSecrets)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join("\n") + "\n",
      { mode: 0o600 },
    );
    console.log(`Created collection-scoped local runtime credentials for ${client.name}.`);
  } finally {
    await tenantConnection.close();
  }
}
const runtimeTarget = new URL(runtimeUri);
runtimeTarget.pathname = `/${client.database.name}`;
const uri = runtimeTarget.toString();
const deployment = tenantDeployment(client);
await mongoose.disconnect();
if (process.argv.includes("--invite-admin"))
  process.exit(result.emailSent || result.alreadyActive ? 0 : 1);
const origins = client.domains;
for (const value of Object.values(origins.toObject?.() || origins)) {
  if (typeof value === "string" && !["127.0.0.1", "localhost"].includes(new URL(value).hostname))
    throw new Error("This launcher supports local tenant origins only.");
}
const secretFile = path.join(root, `.env.tenant-${slug}.local`);
const saved = { ...read(secretFile), ...clientEnv };
const secrets = {
  JWT_ACCESS_SECRET: saved.JWT_ACCESS_SECRET || randomBytes(48).toString("hex"),
  JWT_REFRESH_SECRET: saved.JWT_REFRESH_SECRET || randomBytes(48).toString("hex"),
};
fs.writeFileSync(
  secretFile,
  Object.entries({ ...saved, ...secrets })
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n") + "\n",
  { mode: 0o600 },
);
const integrationKey =
  /^(?:FLIGHT_|MOCK_FLIGHT_|HOTEL_|HOTELBEDS_|PAYMENT_|RAZORPAY_|DOCUMENT_STORAGE_|AWS_|R2_)/;
const clientIntegrations = Object.fromEntries(
  Object.entries(saved).filter(([key]) => integrationKey.test(key)),
);
const runtimeSource = Object.fromEntries(
  Object.entries(source).filter(
    ([key]) =>
      !/^(TENANT_(?:RUNTIME_)?DB_|MONGO_URI|MASTER_ADMIN_)/.test(key) && !integrationKey.test(key),
  ),
);
const backendEnv = {
  ...runtimeSource,
  ...clientIntegrations,
  ...secrets,
  TENANT_CLIENT_ID: String(client._id),
  TENANT_PRODUCT: deployment.product || "",
  USE_DOTENV: "false",
  NODE_ENV: "development",
  PORT: new URL(origins.api).port,
  BASE_URL: origins.api,
  MONGO_URI: uri,
  MONGO_URI_DEV: uri,
  JWT_SECRET: secrets.JWT_ACCESS_SECRET,
  SHELL_URL: origins.website,
  TREHUB_URL: origins.website,
  TREVIO_URL: origins.website,
  TREVISTA_URL: origins.website,
  AUTH_APP_URL: origins.auth,
  ADMIN_URL: origins.admin,
  DASHBOARD_URL: origins.dashboard,
  PARTNER_URL: origins.partner || origins.website,
  FRONTENDS: JSON.stringify(Object.values(origins.toObject?.() || origins)),
  AUTH_COOKIE_DOMAIN: "",
  AUTH_COOKIE_SAMESITE: "lax",
  GOOGLE_AUTH_ENABLED: "false",
  ENABLE_REDIS_SOCKET_ADAPTER: "false",
};
const frontendEnv = {
  NODE_ENV: "development",
  BROWSER: "none",
  HOST: new URL(origins.website).hostname,
  PUBLIC_URL: "/",
  DISABLE_ESLINT_PLUGIN: "true",
  REACT_APP_API_URL: `${origins.api}/api`,
  REACT_APP_BACKEND_URL: origins.api,
  REACT_APP_AUTH_APP_URL: origins.auth,
  REACT_APP_SHELL_URL: origins.website,
  REACT_APP_TRAVELSTREM_APP_URL: origins.website,
  REACT_APP_TREHUB_URL: origins.website,
  REACT_APP_TREVIO_URL: origins.website,
  REACT_APP_TREVISTA_URL: origins.website,
  REACT_APP_ADMIN_SHELL_URL: origins.admin,
  REACT_APP_PARTNER_URL: origins.partner || origins.website,
  REACT_APP_AGENT_SHELL_URL: origins.partner || origins.website,
  REACT_APP_DASHBOARD_URL: origins.dashboard,
  REACT_APP_DASHBOARD_REMOTE_ENTRY: `${origins.dashboard}/remoteEntry.js`,
  REACT_APP_THEME_COOKIE_DOMAIN: "",
  REACT_APP_ALLOW_ENV_OVERRIDES: "true",
  REACT_APP_TENANT_DEPLOYMENT_MODE: deployment.mode,
};
const children = [];
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  });
};
const start = (cwd, command, args, env) => {
  const child = spawn(command, args, {
    cwd,
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          ([key]) =>
            !(key in source) &&
            !/^(TENANT_(?:RUNTIME_)?DB_|MONGO_URI|MASTER_ADMIN_)/.test(key) &&
            !integrationKey.test(key),
        ),
      ),
      ...env,
    },
    stdio: "inherit",
    detached: true,
  });
  children.push(child);
  child.on("error", stop);
  child.on("exit", (code) => {
    if (!stopping) {
      console.error(`${path.basename(cwd)} stopped (${code}).`);
      stop();
    }
  });
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
if (process.argv.includes("--backend-only")) {
  start(
    backend,
    path.join(backend, "node_modules/.bin/nodemon"),
    ["--watch", "src", "--ext", "js,mjs,json", "src/server.js"],
    backendEnv,
  );
} else {
  start(backend, process.execPath, ["src/server.js"], backendEnv);
}
const productApps = {
  trehub: "trehub-remote",
  trevio: "trevio-remote",
  trevista: "trevista-remote",
};
const siteApp = (deployment.product && productApps[deployment.product]) || "app-shell";
const remoteApps = [];
if (siteApp === "app-shell") {
  const occupied = new Set(
    Object.values(origins.toObject?.() || origins)
      .filter(Boolean)
      .map((origin) => Number(new URL(origin).port)),
  );
  let remotePort = Number(new URL(origins.dashboard).port) + 1;
  for (const product of client.productAccess) {
    if (!productApps[product]) continue;
    while (occupied.has(remotePort)) remotePort += 1;
    const remoteOrigin = new URL(origins.website);
    remoteOrigin.port = String(remotePort++);
    occupied.add(Number(remoteOrigin.port));
    frontendEnv[`REACT_APP_${product.toUpperCase()}_REMOTE_ENTRY`] =
      `${remoteOrigin.origin}/remoteEntry.js`;
    remoteApps.push([productApps[product], remoteOrigin.origin]);
  }
}
for (const [app, origin] of process.argv.includes("--backend-only")
  ? []
  : [
      [siteApp, origins.website],
      ["auth-trem", origins.auth],
      ["dashboard-remote", origins.dashboard],
      ["admin-shell", origins.admin],
      ...(client.partnerEnabled && origins.partner ? [["agent-shell", origins.partner]] : []),
      ...remoteApps,
    ]) {
  const cwd = path.join(root, "apps", app);
  start(cwd, path.join(cwd, "node_modules/.bin/craco"), ["start"], {
    ...frontendEnv,
    PORT: new URL(origin).port,
    REACT_APP_REMOTE_ONLY: String(remoteApps.some(([remoteApp]) => remoteApp === app)),
  });
}
console.log(`${client.name}: ${origins.website} | Admin: ${origins.admin}`);
