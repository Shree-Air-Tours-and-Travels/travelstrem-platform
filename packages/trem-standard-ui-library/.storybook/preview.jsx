import React from "react";
import { MemoryRouter } from "react-router-dom";
import "@packages/trem-ui/src/styles/base/_typography.scss";
import "../src/styles/storybook.scss";

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="trem-storybook-shell">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default preview;
