import resolveContractRefs from "./resolveContractRefs";

describe("resolveContractRefs", () => {
  it("maps nested labels and URLs without retaining transport ref properties", () => {
    const result = resolveContractRefs(
      {
        titleRef: "title",
        action: { labelRef: "action", hrefRef: "destination" },
        items: [{ ariaLabelRef: "aria" }],
      },
      { title: "Dashboard", action: "Explore", aria: "Explore tours" },
      { destination: "/?tab=trevista" },
    );

    expect(result).toEqual({
      title: "Dashboard",
      action: { label: "Explore", href: "/?tab=trevista" },
      items: [{ ariaLabel: "Explore tours" }],
    });
  });

  it("uses safe empty values for unresolved references", () => {
    expect(resolveContractRefs({ titleRef: "missing", hrefRef: "missing" })).toEqual({
      title: "",
      href: "",
    });
  });
});
