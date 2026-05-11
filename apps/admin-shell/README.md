`adminTREM` is the independent admin shell application.

It runs as a separate CRA-based application on port 3002 and is no longer exposed as a Module Federation remote.

The admin runtime now owns its admin pages, services, local store wiring, and API client directly inside this folder so it can talk to the backend independently during development.
