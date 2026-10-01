process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'testsecret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const User = require('../models/userModel');
const Course = require('../models/courseModel');
const generateJWT = require('../utils/JWTFunction');
const userRoles = require('../utils/userRoles');

jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
});

async function createUserDirect({ firstName = 'Test', lastName = 'User', email, password = 'password123', role = userRoles.user } = {}) {
    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ firstName, lastName, email, password: hashed, role });
    await u.save();
    return u;
}

async function tokenFor(userDoc) {
    return generateJWT({ email: userDoc.email, id: userDoc.id, role: userDoc.role });
}

// ---------- register ----------
describe('register', () => {
    test('success returns 201 with user and token, no password', async () => {
        const res = await request(app).post('/api/users/register').send({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'password123'
        });
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.user.email).toBe('john@example.com');
        expect(res.body.data.user.password).toBeUndefined();
    });

    test('duplicate email returns 409', async () => {
        const payload = { firstName: 'Jane', lastName: 'Doe', email: 'dup@example.com', password: 'password123' };
        const first = await request(app).post('/api/users/register').send(payload);
        expect(first.status).toBe(201);
        const second = await request(app).post('/api/users/register').send(payload);
        expect(second.status).toBe(409);
    });

    test('invalid email returns 400', async () => {
        const res = await request(app).post('/api/users/register').send({
            firstName: 'John', lastName: 'Doe', email: 'not-an-email', password: 'password123'
        });
        expect(res.status).toBe(400);
    });

    test('short password returns 400', async () => {
        const res = await request(app).post('/api/users/register').send({
            firstName: 'John', lastName: 'Doe', email: 'short@example.com', password: 'short'
        });
        expect(res.status).toBe(400);
    });

    test('missing fields returns 400', async () => {
        const res = await request(app).post('/api/users/register').send({
            email: 'missing@example.com', password: 'password123'
        });
        expect(res.status).toBe(400);
    });
});

// ---------- login ----------
describe('login', () => {
    test('success returns token', async () => {
        await createUserDirect({ email: 'login@example.com', password: 'password123' });
        const res = await request(app).post('/api/users/login').send({
            email: 'login@example.com', password: 'password123'
        });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.password).toBeUndefined();
    });

    test('wrong password returns 401', async () => {
        await createUserDirect({ email: 'wrongpass@example.com', password: 'password123' });
        const res = await request(app).post('/api/users/login').send({
            email: 'wrongpass@example.com', password: 'wrongpassword'
        });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    test('unknown email returns 401 with same message as wrong password', async () => {
        await createUserDirect({ email: 'exists@example.com', password: 'password123' });
        const wrongPass = await request(app).post('/api/users/login').send({
            email: 'exists@example.com', password: 'wrongpassword'
        });
        const unknown = await request(app).post('/api/users/login').send({
            email: 'nouser@example.com', password: 'password123'
        });
        expect(wrongPass.status).toBe(401);
        expect(unknown.status).toBe(401);
        expect(unknown.body.message).toBe('Invalid email or password');
        expect(unknown.body.message).toBe(wrongPass.body.message);
    });
});

// ---------- courses public GET ----------
describe('courses public GET', () => {
    test('default pagination returns courses', async () => {
        await Course.create([{ title: 'A', price: 100 }, { title: 'B', price: 200 }]);
        const res = await request(app).get('/api/courses');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(Array.isArray(res.body.data.courses)).toBe(true);
        expect(res.body.data.courses.length).toBe(2);
    });

    test('valid limit returns limited results', async () => {
        await Course.create([{ title: 'A', price: 100 }, { title: 'B', price: 200 }, { title: 'C', price: 300 }]);
        const res = await request(app).get('/api/courses?limit=2');
        expect(res.status).toBe(200);
        expect(res.body.data.courses.length).toBe(2);
    });

    test('invalid limit returns 400', async () => {
        const res = await request(app).get('/api/courses?limit=abc');
        expect(res.status).toBe(400);
    });

    test('limit > 100 returns 400', async () => {
        const res = await request(app).get('/api/courses?limit=101');
        expect(res.status).toBe(400);
    });

    test('GET by invalid id returns 400', async () => {
        const res = await request(app).get('/api/courses/abc');
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid id format/i);
    });

    test('GET missing id returns 404', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).get(`/api/courses/${fakeId}`);
        expect(res.status).toBe(404);
    });
});

// ---------- authorization matrix ----------
describe('authorization matrix', () => {
    let userToken, managerToken, adminToken;

    beforeEach(async () => {
        const u = await createUserDirect({ email: 'u@example.com', role: userRoles.user });
        const m = await createUserDirect({ email: 'm@example.com', role: userRoles.manager });
        const a = await createUserDirect({ email: 'a@example.com', role: userRoles.admin });
        userToken = await tokenFor(u);
        managerToken = await tokenFor(m);
        adminToken = await tokenFor(a);
    });

    test('no token returns 401 on POST/PATCH/DELETE', async () => {
        const c = await Course.create({ title: 'T', price: 100 });
        const postRes = await request(app).post('/api/courses').send({ title: 'New', price: 100 });
        expect(postRes.status).toBe(401);
        const patchRes = await request(app).patch(`/api/courses/${c._id}`).send({ title: 'Upd', price: 150 });
        expect(patchRes.status).toBe(401);
        const delRes = await request(app).delete(`/api/courses/${c._id}`);
        expect(delRes.status).toBe(401);
    });

    test('USER role returns 403 on POST/PATCH/DELETE', async () => {
        const c = await Course.create({ title: 'T', price: 100 });
        const h = { Authorization: `Bearer ${userToken}` };
        const postRes = await request(app).post('/api/courses').set(h).send({ title: 'New', price: 100 });
        expect(postRes.status).toBe(403);
        const patchRes = await request(app).patch(`/api/courses/${c._id}`).set(h).send({ title: 'Upd', price: 150 });
        expect(patchRes.status).toBe(403);
        const delRes = await request(app).delete(`/api/courses/${c._id}`).set(h);
        expect(delRes.status).toBe(403);
    });

    test('MANAGER returns 403 on POST/PATCH and 200 on DELETE', async () => {
        const h = { Authorization: `Bearer ${managerToken}` };
        const postRes = await request(app).post('/api/courses').set(h).send({ title: 'New', price: 100 });
        expect(postRes.status).toBe(403);
        const c1 = await Course.create({ title: 'T1', price: 100 });
        const patchRes = await request(app).patch(`/api/courses/${c1._id}`).set(h).send({ title: 'Upd', price: 150 });
        expect(patchRes.status).toBe(403);
        const c2 = await Course.create({ title: 'T2', price: 100 });
        const delRes = await request(app).delete(`/api/courses/${c2._id}`).set(h);
        expect(delRes.status).toBe(200);
    });

    test('ADMIN succeeds on all', async () => {
        const h = { Authorization: `Bearer ${adminToken}` };
        const postRes = await request(app).post('/api/courses').set(h).send({ title: 'New', price: 100 });
        expect(postRes.status).toBe(201);
        const c = await Course.create({ title: 'T', price: 100 });
        const patchRes = await request(app).patch(`/api/courses/${c._id}`).set(h).send({ title: 'Upd', price: 150 });
        expect(patchRes.status).toBe(200);
        expect(patchRes.body.data.course.title).toBe('Upd');
        const c2 = await Course.create({ title: 'T2', price: 100 });
        const delRes = await request(app).delete(`/api/courses/${c2._id}`).set(h);
        expect(delRes.status).toBe(200);
    });
});

// ---------- course price validation ----------
describe('course price validation', () => {
    let adminToken;
    beforeEach(async () => {
        const a = await createUserDirect({ email: 'admin2@example.com', role: userRoles.admin });
        adminToken = await tokenFor(a);
    });

    const badPrices = [
        { price: -5, label: 'negative' },
        { price: 0, label: 'zero' },
        { price: 'abc', label: 'non-numeric' }
    ];

    test.each(badPrices)('create with $label price returns 400', async ({ price }) => {
        const res = await request(app).post('/api/courses')
            .set({ Authorization: `Bearer ${adminToken}` })
            .send({ title: 'Valid', price });
        expect(res.status).toBe(400);
    });

    test.each(badPrices)('update with $label price returns 400', async ({ price }) => {
        const c = await Course.create({ title: 'T', price: 100 });
        const res = await request(app).patch(`/api/courses/${c._id}`)
            .set({ Authorization: `Bearer ${adminToken}` })
            .send({ title: 'Valid', price });
        expect(res.status).toBe(400);
    });
});

// ---------- GET /api/users ----------
describe('GET /api/users', () => {
    test('403 for USER, 200 for ADMIN, never contains password or token', async () => {
        const u = await createUserDirect({ email: 'regular@example.com', role: userRoles.user });
        const a = await createUserDirect({ email: 'admin3@example.com', role: userRoles.admin });
        const uTok = await tokenFor(u);
        const aTok = await tokenFor(a);

        const forbidden = await request(app).get('/api/users').set({ Authorization: `Bearer ${uTok}` });
        expect(forbidden.status).toBe(403);

        const ok = await request(app).get('/api/users').set({ Authorization: `Bearer ${aTok}` });
        expect(ok.status).toBe(200);
        expect(ok.body.status).toBe('success');
        const raw = JSON.stringify(ok.body);
        expect(raw).not.toMatch(/password/);
        // ensure no token field leaked in user objects
        const users = ok.body.data.users;
        expect(Array.isArray(users)).toBe(true);
        for (const usr of users) {
            expect(usr.password).toBeUndefined();
            expect(usr.token).toBeUndefined();
        }
    });

    test('pagination invalid limit returns 400', async () => {
        const a = await createUserDirect({ email: 'adminpag@example.com', role: userRoles.admin });
        const aTok = await tokenFor(a);
        const res = await request(app).get('/api/users?limit=abc').set({ Authorization: `Bearer ${aTok}` });
        expect(res.status).toBe(400);
    });
});
