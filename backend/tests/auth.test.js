const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('POST /api/auth/register', () => {
  it('rejects invalid input with 400 and field-level errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('creates a new user and returns a token on valid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Chandni Sharma', email: 'chandni@example.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('chandni@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  it('hashes the password — it is never stored in plaintext', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Chandni Sharma', email: 'chandni2@example.com', password: 'secret123' });

    const saved = await User.findOne({ email: 'chandni2@example.com' });
    expect(saved.password).not.toBe('secret123');
    expect(saved.password.length).toBeGreaterThan(20);
  });

  it('rejects a duplicate email with 400', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'First User', email: 'dup@example.com', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Second User', email: 'dup@example.com', password: 'secret123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login Test', email: 'login@example.com', password: 'secret123' });
  });

  it('logs in successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('rejects an incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('rejects a non-existent email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'secret123' });

    expect(res.status).toBe(401);
  });

  it('rejects a malformed body with 400 before even touching the database', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/profile', () => {
  it('rejects requests with no auth token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
  });

  it('returns the user profile with a valid token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Profile Test', email: 'profile@example.com', password: 'secret123' });

    const token = registerRes.body.token;

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('profile@example.com');
    expect(res.body.password).toBeUndefined();
  });
});