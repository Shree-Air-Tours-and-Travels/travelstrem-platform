import dns from "node:dns";
import dnsPromises from "node:dns/promises";

// Leave the operating system resolver unchanged unless explicitly configured.
export function configureDns(servers = process.env.DNS_SERVERS) {
    const addresses = String(servers || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    if (addresses.length) {
        dns.setServers(addresses);
        dnsPromises.setServers(addresses);
    }
}

// Opt-in for networks that break SRV/TXT DNS. Only public hostnames go to the resolver.
export async function resolveMongoConnectionUri(uri) {
    if (process.env.MONGO_DNS_OVER_HTTPS !== "true" || !uri?.startsWith("mongodb+srv://"))
        return uri;
    const source = new URL(uri);
    const query = async (name, type) => {
        const endpoint = new URL("https://cloudflare-dns.com/dns-query");
        endpoint.searchParams.set("name", name);
        endpoint.searchParams.set("type", type);
        const response = await fetch(endpoint, {
            headers: { accept: "application/dns-json" },
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error("MongoDB DNS-over-HTTPS lookup failed.");
        const result = await response.json();
        if (result.Status !== 0) throw new Error("MongoDB hostname could not be resolved.");
        return result.Answer || [];
    };
    const [srv, txt] = await Promise.all([
        query(`_mongodb._tcp.${source.hostname}`, "SRV"),
        query(source.hostname, "TXT"),
    ]);
    const suffix = source.hostname.slice(source.hostname.indexOf("."));
    const hosts = srv
        .filter((record) => record.type === 33)
        .map((record) => {
            const [, , port, target] = record.data.trim().split(/\s+/);
            const host = target?.replace(/\.$/, "");
            if (
                !host?.endsWith(suffix) ||
                !/^[a-z\d.-]+$/i.test(host) ||
                !/^\d+$/.test(port) ||
                Number(port) < 1 ||
                Number(port) > 65535
            )
                throw new Error("Invalid MongoDB DNS service record.");
            return `${host}:${port}`;
        });
    if (!hosts.length) throw new Error("MongoDB DNS returned no service records.");
    const options = new URLSearchParams();
    for (const record of txt.filter((record) => record.type === 16)) {
        const text = record.data.replace(/"\s*"/g, "").replace(/^"|"$/g, "");
        for (const [key, value] of new URLSearchParams(text))
            if (["authSource", "replicaSet", "loadBalanced"].includes(key)) options.set(key, value);
    }
    options.set("tls", "true");
    for (const [key, value] of source.searchParams) {
        if (["srvMaxHosts", "srvServiceName"].includes(key))
            throw new Error(
                "Custom SRV options are not supported by the local HTTPS DNS fallback.",
            );
        options.set(key, value);
    }
    const credentials = source.username
        ? `${source.username}${source.password ? `:${source.password}` : ""}@`
        : "";
    return `mongodb://${credentials}${hosts.join(",")}${source.pathname || "/"}?${options}`;
}
