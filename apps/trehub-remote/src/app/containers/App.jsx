import React from "react";
import { useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { ErrorState, PRODUCT_TYPE } from "@packages/trem-ui";
import { buildGlobalAppShellUrl } from "@packages/trem-utils";
import Home from "../views/Home.jsx";
import FlightList from "../views/FlightList.jsx";
import FlightJourney from "../views/FlightJourney.jsx";
import "../../main.scss";

const STANDALONE_ENABLED = false;

class TrehubRouteBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="This section could not be displayed"
          description="Your dashboard is still available. Return to Trehub and try this action again."
          retry={() => window.location.assign(buildGlobalAppShellUrl({ product: PRODUCT_TYPE.TREHUB, tab: PRODUCT_TYPE.TREHUB }))}
          retryText="Back to Trehub"
        />
      );
    }
    return this.props.children;
  }
}

export default function App({ embedded = false }) {
  const location = useLocation();
  if (!embedded && !STANDALONE_ENABLED) {
    return (
      <ErrorState
        title="Trehub now opens in TravelsTREM"
        description="This product is part of the customer dashboard and is no longer available as a standalone application."
        retry={() =>
          window.location.assign(buildGlobalAppShellUrl({ product: PRODUCT_TYPE.TREHUB, tab: PRODUCT_TYPE.TREHUB }))
        }
        retryText="Go to customer shell"
      />
    );
  }

  return (
    <TrehubRouteBoundary resetKey={`${location.pathname}${location.search}`}>
      {/^\/trehub\/flights\/[^/]+/.test(location.pathname) ? (
        <FlightJourney />
      ) : location.pathname.startsWith("/trehub/flights") ? (
        <FlightList />
      ) : (
        <Home />
      )}
      <Analytics />
    </TrehubRouteBoundary>
  );
}
