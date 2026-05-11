import React, { Suspense, lazy } from "react";
import GlobalLoader from "../Loader/Loader";
import MicroAppErrorView from "./MicroAppErrorView";

const REMOTE_CHECK_TIMEOUT = 2500;
const REMOTE_STATUS = {
    checking: "checking",
    ready: "ready",
    unavailable: "unavailable",
};

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
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        if (process.env.NODE_ENV !== "development") {
            console.error(`Failed to load ${this.props.label} remote:`, error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return <MicroAppErrorView {...this.props.errorView} onRetry={this.props.onRetry} />;
        }

        return this.props.children;
    }
}

export default function FederatedMicroApp({
    label,
    importer,
    exportName,
    remoteUrl,
    fallbackRemoteUrls = [],
    checkingText,
    loadingText,
    errorView,
    remoteProps = {},
}) {
    const [retryKey, setRetryKey] = React.useState(0);
    const [remoteStatus, setRemoteStatus] = React.useState(REMOTE_STATUS.checking);
    const [activeRemoteUrl, setActiveRemoteUrl] = React.useState(remoteUrl);
    const remoteCandidates = React.useMemo(
        () => uniqueRemoteUrls([remoteUrl, ...fallbackRemoteUrls]),
        [fallbackRemoteUrls, remoteUrl]
    );
    const RemoteApp = React.useMemo(
        () => createRemoteComponent({ importer, exportName, label, retryKey }),
        [exportName, importer, label, retryKey]
    );

    const handleRetry = React.useCallback(() => {
        setRemoteStatus(REMOTE_STATUS.checking);
    }, []);

    React.useEffect(() => {
        if (remoteStatus !== REMOTE_STATUS.checking) return undefined;

        let active = true;
        const check = async () => {
            for (const candidate of remoteCandidates) {
                const available = await checkRemoteAvailable(getRemoteEntryUrl(candidate));
                if (!active) return;
                if (available) {
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
    }, [remoteCandidates, remoteStatus]);

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
