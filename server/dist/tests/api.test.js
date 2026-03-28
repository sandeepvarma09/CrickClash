"use strict";
// ─── CricClash API Integration Tests ─────────────────────────────────────────
// Run with: cd server && npx ts-node src/tests/api.test.ts
// Requires: server running on port 5000
const BASE = 'http://localhost:5000/api';
async function req(method, path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json() };
}
const results = [];
async function test(name, fn) {
    try {
        await fn();
        results.push({ name, ok: true });
    }
    catch (e) {
        results.push({ name, ok: false, error: String(e) });
    }
}
function assert(condition, msg) {
    if (!condition)
        throw new Error(msg);
}
// ─── Test Suite ───────────────────────────────────────────────────────────────
async function runTests() {
    console.log('\n🏏 CricClash — API Integration Tests\n' + '─'.repeat(50));
    // Health check
    await test('GET /api/matches returns 200', async () => {
        const { status } = await req('GET', '/matches');
        assert(status === 200, `Expected 200, got ${status}`);
    });
    // Seed matches
    await test('GET /api/matches/seed creates mock matches', async () => {
        const { status, data } = await req('GET', '/matches/seed');
        assert(status === 200 || status === 403, `Expected 200/403, got ${status}`);
        if (status === 200)
            assert(typeof data.data?.seeded === 'number', 'No seeded count');
    });
    // Get matches
    let matchId = '';
    await test('GET /api/matches returns match list', async () => {
        const { status, data } = await req('GET', '/matches');
        assert(status === 200, `Expected 200, got ${status}`);
        assert(Array.isArray(data.data?.items) || Array.isArray(data.data), 'No match array');
        const items = Array.isArray(data.data) ? data.data : data.data?.items;
        if (items?.[0])
            matchId = items[0]._id;
    });
    // Create challenge
    let challengeId = '';
    const creatorUsername = `test_creator_${Date.now()}`;
    await test('POST /api/challenges creates challenge', async () => {
        if (!matchId) {
            console.log('  ⚠️  Skipped: no matchId');
            return;
        }
        const { status, data } = await req('POST', '/challenges', {
            matchId, username: creatorUsername, stake: 'Buy chai',
            predictions: { tossWinner: 'Team A', matchWinner: 'Team A', topRunScorer: 'Kohli', totalRunsByWinner: 180, playerOfTheMatch: 'Bumrah' },
        });
        assert(status === 201, `Expected 201, got ${status}`);
        assert(data.data?.challengeId?.length > 0, 'No challengeId returned');
        challengeId = data.data.challengeId;
    });
    // Get challenge by short ID
    await test('GET /api/challenges/:id returns challenge', async () => {
        if (!challengeId) {
            console.log('  ⚠️  Skipped: no challengeId');
            return;
        }
        const { status, data } = await req('GET', `/challenges/${challengeId}`);
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.data?.challenge?.challengeId === challengeId, 'challengeId mismatch');
    });
    // Submit prediction (join)
    const joinerUsername = `test_joiner_${Date.now()}`;
    await test('POST /api/predictions joins challenge', async () => {
        if (!challengeId) {
            console.log('  ⚠️  Skipped: no challengeId');
            return;
        }
        const { status } = await req('POST', '/predictions', {
            challengeId, username: joinerUsername,
            predictions: { tossWinner: 'Team B', matchWinner: 'Team B', topRunScorer: 'Dhoni', totalRunsByWinner: 165, playerOfTheMatch: 'Jadeja' },
        });
        assert(status === 201, `Expected 201, got ${status}`);
    });
    // Duplicate prediction
    await test('POST /api/predictions rejects duplicate', async () => {
        if (!challengeId) {
            console.log('  ⚠️  Skipped: no challengeId');
            return;
        }
        const { status } = await req('POST', '/predictions', {
            challengeId, username: joinerUsername,
            predictions: { tossWinner: 'Team B', matchWinner: 'Team B', topRunScorer: 'Dhoni', totalRunsByWinner: 165, playerOfTheMatch: 'Jadeja' },
        });
        assert(status === 409, `Expected 409 (conflict), got ${status}`);
    });
    // Leaderboard
    await test('GET /api/leaderboard/global returns array', async () => {
        const { status, data } = await req('GET', '/leaderboard/global');
        assert(status === 200, `Expected 200, got ${status}`);
        assert(Array.isArray(data.data), 'Expected array');
    });
    // Admin login
    await test('POST /api/admin/login with wrong password returns 401', async () => {
        const { status } = await req('POST', '/admin/login', { username: 'admin', password: 'wrong' });
        assert(status === 401, `Expected 401, got ${status}`);
    });
    // User profile
    await test('GET /api/users/:username returns profile', async () => {
        if (!creatorUsername)
            return;
        const { status } = await req('GET', `/users/${creatorUsername}`);
        assert(status === 200 || status === 404, `Expected 200/404, got ${status}`);
    });
    // 404 for unknown challenge
    await test('GET /api/challenges/nonexistent returns 404', async () => {
        const { status } = await req('GET', '/challenges/xxxxxxxx');
        assert(status === 404, `Expected 404, got ${status}`);
    });
    // ─── Summary ───────────────────────────────────────────────────────────────
    console.log('─'.repeat(50));
    const passed = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok);
    results.forEach(r => {
        console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.error ? `\n   ${r.error}` : ''}`);
    });
    console.log(`\nResults: ${passed} passed, ${failed.length} failed out of ${results.length} tests`);
    if (failed.length > 0)
        process.exit(1);
    else
        console.log('🎉 All API tests passed!\n');
}
runTests().catch(e => { console.error(e); process.exit(1); });
