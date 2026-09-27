const { toSafePortalUser } = await import(
    "../../modules/portal/portalUser.serializer.js"
);

describe("portal user serialization", () => {
    test("keeps the selected avatar in the shell session contract", () => {
        const createdAt = new Date("2026-08-24T10:00:00.000Z");
        const user = toSafePortalUser({
            _id: { toString: () => "user-1" },
            name: "Partner User",
            email: "partner@example.com",
            role: "agent",
            agencyRole: "partner_admin",
            agencyName: "Shree Air Tours",
            avatar: "hotel",
            createdAt,
        });

        expect(user).toEqual(
            expect.objectContaining({
                id: "user-1",
                avatar: "hotel",
                createdAt: createdAt.toISOString(),
                agencyName: "Shree Air Tours",
            }),
        );
    });

    test("uses the shared default avatar when an account has no selection", () => {
        expect(toSafePortalUser({ _id: "user-2", role: "agent" }).avatar).toBe("user");
    });

    test("does not expose provider profile photos as portal avatars", () => {
        expect(
            toSafePortalUser({
                _id: "user-3",
                role: "member",
                avatar: "https://provider.example/avatar.jpg",
            }).avatar,
        ).toBe("user");
    });
});
