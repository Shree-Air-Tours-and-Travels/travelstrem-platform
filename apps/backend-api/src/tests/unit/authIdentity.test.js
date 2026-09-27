import { jest } from "@jest/globals";

const identityModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
};
const userModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
};

jest.unstable_mockModule("../../modules/auth/models/AuthIdentity.js", () => ({
    default: identityModel,
}));
jest.unstable_mockModule("../../modules/auth/models/User.js", () => ({ default: userModel }));

const { authenticateWithGoogle, authenticateWithMobile, linkIdentity } =
    await import("../../modules/auth/services/identity.service.js");

const googleClaims = {
    sub: "google-sub-123",
    email: "traveller@example.com",
    email_verified: true,
    name: "Test Traveller",
    picture: "https://example.com/avatar.jpg",
};
const makeUser = (overrides = {}) => ({
    _id: "user-1",
    name: "Test Traveller",
    email: "traveller@example.com",
    emailVerified: true,
    role: "member",
    accountStatus: "active",
    avatar: "user",
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
    identityModel.updateOne.mockResolvedValue({ acknowledged: true });
});

test("existing Google identity logs in its linked user", async () => {
    const user = makeUser();
    identityModel.findOne.mockResolvedValue({ _id: "identity-1", userId: user._id });
    userModel.findById.mockResolvedValue(user);

    await expect(
        authenticateWithGoogle({ claims: googleClaims, portal: "customer" }),
    ).resolves.toBe(user);
    expect(userModel.create).not.toHaveBeenCalled();
    expect(identityModel.updateOne).toHaveBeenCalled();
});

test("new verified Google identity creates a user and provider link", async () => {
    const user = makeUser();
    identityModel.findOne.mockResolvedValue(null);
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue(user);
    identityModel.create.mockResolvedValue({ _id: "identity-1", userId: user._id });

    await authenticateWithGoogle({ claims: googleClaims, portal: "customer" });
    expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
            email: googleClaims.email,
            emailVerified: true,
            role: "member",
            avatar: "user",
        }),
    );
    expect(identityModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
            provider: "GOOGLE",
            providerUserId: googleClaims.sub,
            userId: user._id,
        }),
    );
});

test("verified Google email safely links an existing internal account", async () => {
    const user = makeUser({ emailVerified: false });
    identityModel.findOne.mockResolvedValue(null);
    userModel.findOne.mockResolvedValue(user);
    identityModel.create.mockResolvedValue({ _id: "identity-1", userId: user._id });

    await authenticateWithGoogle({ claims: googleClaims, portal: "customer" });
    expect(userModel.create).not.toHaveBeenCalled();
    expect(user.emailVerified).toBe(true);
    expect(user.avatar).toBe("user");
});

test("an active admin Google identity can also use the customer app", async () => {
    const user = makeUser({ role: "admin", adminApprovalStatus: "approved" });
    identityModel.findOne.mockResolvedValue({ _id: "identity-admin", userId: user._id });
    userModel.findById.mockResolvedValue(user);

    await expect(
        authenticateWithGoogle({ claims: googleClaims, portal: "customer" }),
    ).resolves.toBe(user);
});

test("an admin Google identity still cannot enter PartnerTREM", async () => {
    const user = makeUser({ role: "admin", adminApprovalStatus: "approved" });
    identityModel.findOne.mockResolvedValue({ _id: "identity-admin", userId: user._id });
    userModel.findById.mockResolvedValue(user);

    await expect(
        authenticateWithGoogle({ claims: googleClaims, portal: "partner" }),
    ).rejects.toMatchObject({ code: "PORTAL_ACCESS_DENIED" });
});

test("unverified identities cannot be linked", async () => {
    await expect(
        linkIdentity({
            userId: "user-1",
            provider: "MOBILE",
            providerUserId: "+919876543210",
            verified: false,
        }),
    ).rejects.toMatchObject({ code: "IDENTITY_NOT_VERIFIED" });
});

test("verified mobile OTP logs in an existing mobile identity", async () => {
    const user = makeUser({ mobile: "+919876543210", mobileVerified: true });
    identityModel.findOne.mockResolvedValue({ _id: "identity-mobile", userId: user._id });
    userModel.findById.mockResolvedValue(user);
    await expect(
        authenticateWithMobile({ phoneNumber: "+919876543210", portal: "customer" }),
    ).resolves.toBe(user);
    expect(userModel.create).not.toHaveBeenCalled();
});

test("verified mobile OTP creates a new user and MOBILE identity", async () => {
    const user = makeUser({ email: undefined, mobile: "+919876543210", mobileVerified: true });
    identityModel.findOne.mockResolvedValue(null);
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue(user);
    identityModel.create.mockResolvedValue({ _id: "identity-mobile", userId: user._id });
    await authenticateWithMobile({ phoneNumber: "+919876543210", portal: "customer" });
    expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ mobile: "+919876543210", mobileVerified: true }),
    );
    expect(identityModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ provider: "MOBILE", providerUserId: "+919876543210" }),
    );
});
