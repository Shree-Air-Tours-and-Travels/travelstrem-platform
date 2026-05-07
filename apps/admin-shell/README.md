`adminTREM` is the sibling admin micro-frontend.

It runs as a separate CRA-based application, exposes `./AdminApp` through Module Federation, and is consumed by the main `frontend` shell at runtime.

The admin runtime now owns its admin pages, services, local store wiring, and API client directly inside this folder so it can talk to the backend independently during development.
