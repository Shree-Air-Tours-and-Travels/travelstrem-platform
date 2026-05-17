import React, { Suspense, lazy } from "react";
import { GlobalLoader } from "@packages/trem-ui";
import MicroAppErrorView from "./MicroAppError";

const REMOTE_CHECK_TIMEOUT = 2500;
const REMOTE_STATUS = {
    checking: "checking",
    ready: "ready",
    unavailable: "unavailable",
};
const REMOTE_AVAILABILITY_CACHE = new Map();

const isReactComponent = (Component) =>
    typeof Component === "function" ||
    (typeof Component === "object" && Component !== null && Boolean(Component.$$typeof));

const resolveRemoteComponent = (module, exportName) => {
    const candidates = [
        module?.default,
        module?.[exportName],
        module?.default?.default,
        module?.default?.[exportName],
        module,
    ];

    return candidates.find(isReactComponent);
};

const normalizeRemoteModule = (module, exportName, label) => {
    const Component = resolveRemoteComponent(module, exportName);

    if (!isReactComponent(Component)) {
        throw new Error(`${label} remote did not expose a valid React component.`);
    }

    return { default: Component };
};

const createRemoteComponent = ({ importer, exportName, label, retryKey }) =>
    lazy(() => importer(retryKey).then((module) => normalizeRemoteModule(module, exportName, label)));

const getRemoteEntryUrl = (remoteUrl) => `${remoteUrl.replace(/\/$/, "")}/remoteEntry.js`;
const uniqueRemoteUrls = (urls = []) =>
    Array.from(
        new Set(
            urls
                .map((url) => String(url || "").trim())
                .filter(Boolean)
        )
    );

const checkRemoteAvailable = async (remoteEntryUrl) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REMOTE_CHECK_TIMEOUT);

    try {
        const response = await fetch(remoteEntryUrl, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
        });

        return response.ok;
    } catch (error) {
        return false;
    } finally {
        window.clearTimeout(timeoutId);
    }
};

class RemoteBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error(`Failed to render ${this.props.label} remote:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const errorMessage = this.state.error?.message || "Unknown remote render error";
            return (
                <MicroAppErrorView
                    {...this.props.errorView}
                    title={`${this.props.label} render failed`}
                    message={errorMessage}
                    onRetry={this.props.onRetry}
                />
            );
        }

        return this.props.children;
    }
}

export default function FederatedMicroApp({
    label,
    remoteKey,
    importer,
    exportName,
    remoteUrl,
    fallbackRemoteUrls = [],
    checkingText,
    loadingText,
    errorView,
    remoteProps = {},
    preflightRemote = false,
}) {
    const cacheId = React.useMemo(
        () => remoteKey || label || remoteUrl || "remote",
        [label, remoteKey, remoteUrl]
    );
    const cachedRemote = REMOTE_AVAILABILITY_CACHE.get(cacheId);
    const [retryKey, setRetryKey] = React.useState(0);
    const [remoteStatus, setRemoteStatus] = React.useState(preflightRemote && !cachedRemote ? REMOTE_STATUS.checking : REMOTE_STATUS.ready);
    const [activeRemoteUrl, setActiveRemoteUrl] = React.useState(cachedRemote || remoteUrl);
    const remoteCandidates = React.useMemo(
        () => uniqueRemoteUrls([remoteUrl, ...fallbackRemoteUrls]),
        [fallbackRemoteUrls, remoteUrl]
    );
    const RemoteApp = React.useMemo(
        () => createRemoteComponent({ importer, exportName, label, retryKey }),
        [exportName, importer, label, retryKey]
    );

    const handleRetry = React.useCallback(() => {
        setRetryKey((key) => key + 1);
        setRemoteStatus(preflightRemote ? REMOTE_STATUS.checking : REMOTE_STATUS.ready);
    }, [preflightRemote]);

    React.useEffect(() => {
        if (!preflightRemote) return undefined;
        if (remoteStatus !== REMOTE_STATUS.checking) return undefined;
        const cached = REMOTE_AVAILABILITY_CACHE.get(cacheId);
        if (cached) {
            setActiveRemoteUrl(cached);
            setRemoteStatus(REMOTE_STATUS.ready);
            return undefined;
        }
        if (remoteKey && typeof window !== "undefined" && window[remoteKey]) {
            const knownUrl = activeRemoteUrl || remoteCandidates[0] || remoteUrl;
            REMOTE_AVAILABILITY_CACHE.set(cacheId, knownUrl);
            setActiveRemoteUrl(knownUrl);
            setRemoteStatus(REMOTE_STATUS.ready);
            return undefined;
        }

        let active = true;
        const check = async () => {
            for (const candidate of remoteCandidates) {
                const available = await checkRemoteAvailable(getRemoteEntryUrl(candidate));
                if (!active) return;
                if (available) {
                    REMOTE_AVAILABILITY_CACHE.set(cacheId, candidate);
                    setActiveRemoteUrl(candidate);
                    setRemoteStatus(REMOTE_STATUS.ready);
                    setRetryKey((key) => key + 1);
                    return;
                }
            }
            setRemoteStatus(REMOTE_STATUS.unavailable);
        };

        check();

        return () => {
            active = false;
        };
    }, [activeRemoteUrl, cacheId, preflightRemote, remoteCandidates, remoteKey, remoteStatus, remoteUrl]);

    if (remoteStatus === REMOTE_STATUS.checking) {
        return <GlobalLoader visible text={checkingText} />;
    }

    if (remoteStatus === REMOTE_STATUS.unavailable) {
        return <MicroAppErrorView {...errorView} onRetry={handleRetry} remoteUrl={activeRemoteUrl || remoteCandidates[0] || ""} />;
    }

    return (
        <RemoteBoundary key={retryKey} label={label} onRetry={handleRetry} errorView={errorView}>
            <Suspense fallback={<GlobalLoader visible text={loadingText} />}>
                <RemoteApp {...remoteProps} />
            </Suspense>
        </RemoteBoundary>
    );
}
