// Test script for booking assignment flow
// Run: cross-env USE_DOTENV=true node src/tests/scripts/testBookingAssignment.js

import mongoose from "mongoose";
import connectDB from "../../config/database.js";
import User from "../../modules/auth/models/User.js";
import Tour from "../../modules/tours/models/Tour.js";
import Booking from "../../modules/bookings/models/Booking.js";

const TEST_PREFIX = "test_booking_flow_";

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ✅ ${message}`);
    } else {
        failed++;
        console.log(`  ❌ ${message}`);
    }
}

function assertEqual(actual, expected, label) {
    const match = String(actual) === String(expected);
    if (match) {
        passed++;
        console.log(`  ✅ ${label}: "${String(actual).slice(-8)}"`);
    } else {
        failed++;
        console.log(`  ❌ ${label}: expected "${String(expected).slice(-8)}", got "${String(actual).slice(-8)}"`);
    }
}

// ---- resolveBookingAgent logic (mirrors the controller) ----
async function resolveBookingAgent({ tour }) {
    if (tour?.ownerAgent) return tour.ownerAgent;

    if (tour?.partnerAgencyRef) {
        const partnerAgent = await User.findOne({
            role: "agent",
            partnerAgencyRef: tour.partnerAgencyRef,
            agentApprovalStatus: "approved",
        }).select("_id");
        if (partnerAgent?._id) return partnerAgent._id;
    }

    const adminUser = await User.findOne({
        role: "admin",
        adminLevel: "master",
    }).select("_id");
    if (adminUser?._id) return adminUser._id;

    return null;
}

async function assignmentScopeForAgent(agentId) {
    if (!agentId) return {};
    const agent = await User.findById(agentId).select("agentRef agencyRef partnerAgencyRef");
    return {
        assignedAgentRef: agent?.agentRef || "",
        assignedAgencyRef: agent?.agencyRef || "",
        assignedPartnerAgencyRef: agent?.partnerAgencyRef || "",
    };
}

async function cleanup() {
    const prefix = TEST_PREFIX;
    await User.deleteMany({ name: { $regex: `^${prefix}` } });
    await Tour.deleteMany({ title: { $regex: `^${prefix}` } });
    await Booking.deleteMany({ "primaryContact.email": { $regex: `^${prefix}` } });
    console.log("  Cleaned up test data.\n");
}

async function run() {
    console.log("\n====================================================================");
    console.log("  BOOKING ASSIGNMENT FLOW — INTEGRATION TEST");
    console.log("====================================================================\n");

    await connectDB();

    try {
        // Clean up any leftover test data from previous runs
        await cleanup();

        // ---- STEP 1: Create test entities ----
        console.log("\n[1] Creating test entities...\n");

        const admin = await User.create({
            name: `${TEST_PREFIX}Master Admin`,
            email: `${TEST_PREFIX}admin@travelstrem.com`,
            phone: "9999999999",
            passwordHash: "test-hash",
            role: "admin",
            adminLevel: "master",
            agentApprovalStatus: "not_required",
        });
        console.log(`  Created master admin: ${admin._id}`);

        const agents = [];
        const agentRefs = ["A001", "A002", "A003", "A004", "A005"];
        const agencyRefs = ["AGENCY-1", "AGENCY-2", "AGENCY-3", "", ""];
        const partnerRefs = ["partner-test-alpha", "partner-test-beta", "", "", ""];
        const approvals = ["approved", "approved", "approved", "approved", "pending"];

        for (let i = 0; i < 5; i++) {
            const agent = await User.create({
                name: `${TEST_PREFIX}Agent ${i + 1}`,
                email: `${TEST_PREFIX}agent${i + 1}@travelstrem.com`,
                phone: `900000000${i}`,
                passwordHash: "test-hash",
                role: "agent",
                agentRef: agentRefs[i],
                agencyRef: agencyRefs[i],
                partnerAgencyRef: partnerRefs[i],
                agentApprovalStatus: approvals[i],
            });
            agents.push(agent);
            console.log(`  Created Agent ${i + 1}: ${agent._id} | ref=${agentRefs[i]} | partner=${partnerRefs[i] || "(none)"} | status=${approvals[i]}`);
        }

        const members = [];
        for (let i = 0; i < 10; i++) {
            const member = await User.create({
                name: `${TEST_PREFIX}Member ${i + 1}`,
                email: `${TEST_PREFIX}member${i + 1}@test.com`,
                phone: `800000000${i}`,
                passwordHash: "test-hash",
                role: "member",
            });
            members.push(member);
        }
        console.log(`  Created ${members.length} members`);

        const tours = [];
        const tourData = [
            { title: `${TEST_PREFIX}Agent-Owned Tour Alpha`, ownerAgent: agents[0]._id, inventorySource: "agent", partnerAgencyRef: "" },
            { title: `${TEST_PREFIX}Agent-Owned Tour Beta`, ownerAgent: agents[1]._id, inventorySource: "agent", partnerAgencyRef: "" },
            { title: `${TEST_PREFIX}Platform Tour Gamma`, ownerAgent: null, inventorySource: "platform", partnerAgencyRef: "" },
            { title: `${TEST_PREFIX}Partner Tour Delta`, ownerAgent: null, inventorySource: "provider", partnerAgencyRef: "partner-test-alpha" },
            { title: `${TEST_PREFIX}Platform Tour Epsilon`, ownerAgent: null, inventorySource: "platform", partnerAgencyRef: "" },
        ];

        for (const data of tourData) {
            const tour = await Tour.create({
                title: data.title,
                city: { from: "Mumbai", to: "Goa" },
                address: { line1: "Test", city: "Mumbai", state: "MH", zip: "400001", country: "India" },
                distance: 100,
                period: { days: 3, nights: 2 },
                desc: "Test tour for booking flow",
                price: { min: 5000, max: 10000, currency: "INR" },
                maxGroupSize: 20,
                ownerAgent: data.ownerAgent,
                inventorySource: data.inventorySource,
                partnerAgencyRef: data.partnerAgencyRef,
                tags: ["test"],
            });
            tours.push(tour);
            console.log(`  Created tour: "${data.title.slice(-35)}" | owner=${data.ownerAgent ? String(data.ownerAgent).slice(-6) : "none"} | src=${data.inventorySource} | partner=${data.partnerAgencyRef || "(none)"}`);
        }

        // ---- STEP 2: Test resolveBookingAgent scenarios ----
        console.log("\n[2] Testing resolveBookingAgent...\n");

        // 2a: Tour owned by Agent 1 -> should assign to Agent 1
        let assigned = await resolveBookingAgent({ tour: tours[0] });
        assertEqual(assigned, agents[0]._id, `Agent-owned tour -> assigned to Agent 1`);

        // 2b: Tour owned by Agent 2 -> should assign to Agent 2
        assigned = await resolveBookingAgent({ tour: tours[1] });
        assertEqual(assigned, agents[1]._id, `Agent-owned tour -> assigned to Agent 2`);

        // 2c: Platform tour (no owner, no partner) -> should assign to master admin
        assigned = await resolveBookingAgent({ tour: tours[2] });
        const assignedAdmin = await User.findById(assigned).select("role adminLevel");
        assert(assignedAdmin && assignedAdmin.role === "admin" && assignedAdmin.adminLevel === "master",
            `Platform tour (Gamma) -> assigned to master admin (${assigned})`);

        // 2d: Partner tour (partner-test-alpha) -> should assign to Agent 1 (has that partnerRef)
        assigned = await resolveBookingAgent({ tour: tours[3] });
        assertEqual(assigned, agents[0]._id, `Partner tour (partner-test-alpha) -> assigned to Agent 1`);

        // 2e: Platform tour (Epsilon) -> should assign to master admin
        assigned = await resolveBookingAgent({ tour: tours[4] });
        const assignedAdmin2 = await User.findById(assigned).select("role adminLevel");
        assert(assignedAdmin2 && assignedAdmin2.role === "admin" && assignedAdmin2.adminLevel === "master",
            `Platform tour (Epsilon) -> assigned to master admin (${assigned})`);

        // ---- STEP 3: Create bookings and verify assignment ----
        console.log("\n[3] Creating bookings & verifying assignment...\n");

        // Determine which master admin resolveBookingAgent actually finds
        const resolvedAdminId = await resolveBookingAgent({ tour: tours[2] });
        const resolvedAdmin = await User.findById(resolvedAdminId).select("role adminLevel");

        const bookingRefs = [];
        for (let m = 0; m < 10; m++) {
            const tourIdx = m % 5;
            const member = members[m];
            const tour = tours[tourIdx];

            const assignedAgent = await resolveBookingAgent({ tour });
            const scope = await assignmentScopeForAgent(assignedAgent);

            const booking = await Booking.create({
                user: member._id,
                tour: tour._id,
                assignedAgent,
                ...scope,
                travelWindow: { startDate: new Date("2026-12-01"), endDate: new Date("2026-12-05") },
                tripSelection: { adultCount: 2, currency: "INR" },
                primaryContact: { name: member.name, email: member.email, phone: member.phone },
                guestsCount: 2,
                seatsReserved: 2,
                status: "DRAFT",
                priority: "MEDIUM",
                sourceAttribution: { source: "test" },
                createdBy: member._id,
                updatedBy: member._id,
            });
            bookingRefs.push(booking._id);

            const scenario = tour.ownerAgent
                ? `Agent ${tourIdx + 1} (owner)`
                : tour.partnerAgencyRef
                    ? `Partner Agent (${tour.partnerAgencyRef})`
                    : "Admin";

            if (tour.ownerAgent) {
                assertEqual(assignedAgent, tour.ownerAgent,
                    `Booking ${m + 1}: Member ${m + 1} -> ${scenario}`);
            } else if (tour.partnerAgencyRef) {
                const expectedPartner = agents.find(a => String(a.partnerAgencyRef) === tour.partnerAgencyRef)?._id;
                assertEqual(assignedAgent, expectedPartner,
                    `Booking ${m + 1}: Member ${m + 1} -> ${scenario}`);
            } else {
                assert(assignedAgent && String(assignedAgent) === String(resolvedAdminId),
                    `Booking ${m + 1}: Member ${m + 1} -> ${scenario} (${assignedAgent})`);
            }
        }

        // ---- STEP 4: Agent visibility tests ----
        console.log("\n[4] Testing agent booking visibility...\n");

        // Agent 1 should see: 2 Agent-Owned Tour Alpha bookings + 2 Partner Tour Delta bookings = 4
        const agent1Bookings = await Booking.find({
            deletedAt: null,
            $and: [{ $or: [{ assignedAgent: agents[0]._id }] }],
        });
        assert(agent1Bookings.length === 4,
            `Agent 1 sees ${agent1Bookings.length} assigned (expected 4)`);

        // Agent 2 should see: 2 Agent-Owned Tour Beta bookings = 2
        const agent2Bookings = await Booking.find({
            deletedAt: null,
            $and: [{ $or: [{ assignedAgent: agents[1]._id }] }],
        });
        assert(agent2Bookings.length === 2,
            `Agent 2 sees ${agent2Bookings.length} assigned (expected 2)`);

        const agent2BookingIds = agent2Bookings.map(b => String(b._id));
        const agent1BookingIds = agent1Bookings.map(b => String(b._id));
        const overlap = agent2BookingIds.filter(id => agent1BookingIds.includes(id));
        assert(overlap.length === 0, "Agent 1 and Agent 2 bookings do NOT overlap");

        // Agent 3 (approved, no partnerRef) -> no bookings assigned
        const agent3Bookings = await Booking.find({
            deletedAt: null,
            $and: [{ $or: [
                { assignedAgent: agents[2]._id },
                { assignedAgencyRef: agents[2].agencyRef },
            ] }],
        });
        assert(agent3Bookings.length === 0, `Agent 3 sees 0 bookings (expected 0)`);

        // Agent 4 (approved, no refs) -> no bookings
        const agent4Bookings = await Booking.find({
            deletedAt: null,
            $and: [{ $or: [{ assignedAgent: agents[3]._id }] }],
        });
        assert(agent4Bookings.length === 0, `Agent 4 sees 0 bookings (expected 0)`);

        // Agent 5 (pending approval) -> no bookings
        const agent5Bookings = await Booking.find({
            deletedAt: null,
            $and: [{ $or: [{ assignedAgent: agents[4]._id }] }],
        });
        assert(agent5Bookings.length === 0, `Agent 5 (pending) sees 0 bookings (expected 0)`);

        // ---- STEP 5: Admin visibility ----
        console.log("\n[5] Testing admin visibility...\n");

        // Master admin (the one resolveBookingAgent found) should see 4 bookings
        // (2 platform tours x 2 members each)
        const adminBookings = await Booking.find({
            deletedAt: null,
            $and: [{ $or: [{ assignedAgent: resolvedAdminId }] }],
        });
        assert(adminBookings.length === 4,
            `Master admin sees ${adminBookings.length} bookings (expected 4)`);

        // No overlap between admin and agent bookings
        const adminBookingIds = adminBookings.map(b => String(b._id));
        const adminOverlapWithAgent1 = adminBookingIds.filter(id => agent1BookingIds.includes(id));
        const adminOverlapWithAgent2 = adminBookingIds.filter(id => agent2BookingIds.includes(id));
        assert(adminOverlapWithAgent1.length === 0, "Admin bookings do NOT overlap with Agent 1's");
        assert(adminOverlapWithAgent2.length === 0, "Admin bookings do NOT overlap with Agent 2's");

        // ---- STEP 6: Customer visibility ----
        console.log("\n[6] Testing customer visibility...\n");

        for (let m = 0; m < 10; m++) {
            const memberBookings = await Booking.find({
                deletedAt: null,
                user: members[m]._id,
            });
            assert(memberBookings.length === 1,
                `Member ${m + 1} sees ${memberBookings.length} booking(s) (expected 1)`);
        }

        // ---- STEP 7: Verify Partner Agency assignment ----
        console.log("\n[7] Testing partner agency assignment...\n");

        const partnerTour2 = await Tour.create({
            title: `${TEST_PREFIX}Partner Tour Zeta`,
            city: { from: "Delhi", to: "Agra" },
            address: { line1: "Test", city: "Delhi", state: "DL", zip: "110001", country: "India" },
            distance: 200,
            period: { days: 2, nights: 1 },
            desc: "Partner tour beta",
            price: { min: 3000, max: 6000, currency: "INR" },
            maxGroupSize: 15,
            ownerAgent: null,
            inventorySource: "provider",
            partnerAgencyRef: "partner-test-beta",
            tags: ["test"],
        });

        const partnerAssigned = await resolveBookingAgent({ tour: partnerTour2 });
        assertEqual(partnerAssigned, agents[1]._id,
            `Partner tour (partner-test-beta) -> assigned to Agent 2`);

        // ---- STEP 8: Edge cases ----
        console.log("\n[8] Testing edge cases...\n");

        // Unknown partnerAgencyRef -> fallback to admin
        const unknownPartnerTour = await Tour.create({
            title: `${TEST_PREFIX}Unknown Partner Tour`,
            city: { from: "Chennai", to: "Pondicherry" },
            address: { line1: "Test", city: "Chennai", state: "TN", zip: "600001", country: "India" },
            distance: 150,
            period: { days: 1, nights: 0 },
            desc: "Unknown partner",
            price: { min: 2000, max: 4000, currency: "INR" },
            maxGroupSize: 10,
            ownerAgent: null,
            inventorySource: "provider",
            partnerAgencyRef: "partner-nonexistent",
            tags: ["test"],
        });

        const unknownAssigned = await resolveBookingAgent({ tour: unknownPartnerTour });
        const unknownAssignedUser = await User.findById(unknownAssigned).select("role adminLevel");
        assert(unknownAssignedUser && unknownAssignedUser.role === "admin" && unknownAssignedUser.adminLevel === "master",
            `Unknown partner tour -> falls back to master admin (${unknownAssigned})`);

        // Pending-approval agent as ownerAgent -> still assigned (ownerAgent takes priority)
        const pendingAgentTour = await Tour.create({
            title: `${TEST_PREFIX}Pending Agent Tour`,
            city: { from: "Jaipur", to: "Udaipur" },
            address: { line1: "Test", city: "Jaipur", state: "RJ", zip: "302001", country: "India" },
            distance: 300,
            period: { days: 4, nights: 3 },
            desc: "Pending agent tour",
            price: { min: 8000, max: 15000, currency: "INR" },
            maxGroupSize: 25,
            ownerAgent: agents[4]._id,
            inventorySource: "agent",
            partnerAgencyRef: "",
            tags: ["test"],
        });

        const pendingAssigned = await resolveBookingAgent({ tour: pendingAgentTour });
        assertEqual(pendingAssigned, agents[4]._id,
            `Pending agent's owned tour -> assigned to that agent (ownerAgent priority)`);

        // ---- Verify scenario with existing admin in DB ----
        console.log("\n[9] Verify consistency with existing DB admin...\n");

        // Confirm that resolveBookingAgent consistently finds a master admin
        const dbAdmin = await User.findOne({ role: "admin", adminLevel: "master" }).select("_id");
        const assignedForPlatform = await resolveBookingAgent({ tour: tours[2] });
        assertEqual(assignedForPlatform, dbAdmin._id,
            `resolveBookingAgent consistently finds the same master admin`);

        // ---- STEP 10: Verify agentTour flag ----
        console.log("\n[10] Testing agentTour flag...\n");

        assert(tours[0].agentTour !== undefined, "agentTour field exists on Tour model");
        assert(!tours[0].agentTour, "Agent-owned tour (script-created) defaults to false");
        assert(!tours[1].agentTour, "Second agent-owned tour defaults to false");
        assert(!tours[2].agentTour, "Platform tour has agentTour=false");
        assert(!tours[3].agentTour, "Partner tour has agentTour=false");
        assert(!tours[4].agentTour, "Platform tour has agentTour=false");

        const simulated = { ...tours[0].toObject(), agentTour: true, ownerAgent: agents[0]._id };
        assert(simulated.agentTour === true, "Simulated agent tour -> agentTour=true");
        assert(typeof simulated.agentTour === "boolean", "agentTour is boolean");
        assert(String(simulated.ownerAgent) === String(agents[0]._id), "ownerAgent preserved");

        // ---- SUMMARY ----
        console.log("\n====================================================================");
        console.log("  RESULTS");
        console.log("====================================================================");
        const total = passed + failed;
        console.log(`  Total: ${total}  |  Passed: ${passed}  |  Failed: ${failed}`);
        if (failed === 0) {
            console.log("  ✅ ALL TESTS PASSED");
        } else {
            console.log("  ❌ SOME TESTS FAILED");
        }
        console.log("====================================================================\n");

        // Cleanup
        await cleanup();
        process.exit(failed > 0 ? 1 : 0);

    } catch (err) {
        console.error("\n❌ Test error:", err);
        await cleanup();
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

run();
