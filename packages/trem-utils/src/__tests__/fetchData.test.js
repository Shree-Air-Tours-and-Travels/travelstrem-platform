import { afterEach, describe, expect, it, vi } from "vitest";
import fetchData, { setFetchDataApiClient } from "../http/fetchData.js";

const client = (payload) => ({
  get: vi.fn().mockResolvedValue({ data: payload }),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchData response normalization", () => {
  it("preserves a direct top-level data payload", async () => {
    const data = { desc: "Saved tour description", status: "draft" };
    setFetchDataApiClient(client({ status: "success", builder: { tourId: "tour-1" }, data }));

    const response = await fetchData("/tours.json/builder/steps/audience");

    expect(response.data).toEqual(data);
  });

  it("continues to support legacy component-wrapped payloads", async () => {
    const data = { items: [{ id: "one" }] };
    setFetchDataApiClient(client({ status: "success", component: { data } }));

    const response = await fetchData("/legacy-component");

    expect(response.data).toEqual(data);
  });
});
