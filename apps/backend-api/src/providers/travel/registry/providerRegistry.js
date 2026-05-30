const providers = new Map();

export function registerTravelProvider(kind, provider) {
  if (!kind) throw new Error("Provider kind is required");
  if (!provider?.name) throw new Error("Provider instance must include a name");
  providers.set(`${kind}:${provider.name}`, provider);
  return provider;
}

export function getTravelProvider(kind, name) {
  return providers.get(`${kind}:${name}`) || null;
}

export function listTravelProviders(kind) {
  return Array.from(providers.entries())
    .filter(([key]) => !kind || key.startsWith(`${kind}:`))
    .map(([, provider]) => provider);
}

export default {
  registerTravelProvider,
  getTravelProvider,
  listTravelProviders,
};

