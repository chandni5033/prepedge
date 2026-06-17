jest.mock('../services/aiService');

const request   = require('supertest');
const app       = require('../app');
const aiService = require('../services/aiService');

async function registerAndGetToken(email = 'interviewuser@example.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Interview User', email, password: 'secret123' });
  return res.body.token;
}

describe('POST /api/interview/create', () => {
  let token;

  beforeEach(async () => {
    token = await registerAndGetToken();
    aiService.generateQuestions.mockResolvedValue([
      { questionText: 'Explain closures in JS', expectedTopics: ['closures'], difficulty: 'medium' },
      { questionText: 'What is a hash map?', expectedTopics: ['hashing'], difficulty: 'medium' },
    ]);
  });

  it('rejects requests with no auth token', async () => {
    const res = await request(app)
      .post('/api/interview/create')
      .send({ category: 'dsa', difficulty: 'medium' });

    expect(res.status).toBe(401);
  });

  it('rejects an invalid category with 400', async () => {
    const res = await request(app)
      .post('/api/interview/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'not-a-real-category', difficulty: 'medium' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });

  it('rejects an invalid difficulty with 400', async () => {
    const res = await request(app)
      .post('/api/interview/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'dsa', difficulty: 'impossible' });

    expect(res.status).toBe(400);
  });

  it('creates an interview with valid input and calls the AI service', async () => {
    const res = await request(app)
      .post('/api/interview/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'dsa', difficulty: 'medium', numQuestions: 2 });

    expect(res.status).toBe(201);
    expect(res.body.interview.category).toBe('dsa');
    expect(res.body.questions).toHaveLength(2);
    expect(aiService.generateQuestions).toHaveBeenCalledTimes(1);
  });

  it('defaults numQuestions to 5 when not provided', async () => {
    aiService.generateQuestions.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({
        questionText: `Q${i}`, expectedTopics: [], difficulty: 'medium',
      }))
    );

    const res = await request(app)
      .post('/api/interview/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'webdev', difficulty: 'easy' });

    expect(res.status).toBe(201);
    expect(res.body.interview.numQuestions).toBe(5);
  });
});

describe('GET /api/interview/history', () => {
  let token;

  beforeEach(async () => {
    token = await registerAndGetToken('historyuser@example.com');
  });

  it('returns an empty list for a user with no interviews', async () => {
    const res = await request(app)
      .get('/api/interview/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.interviews).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('rejects an invalid limit param with 400', async () => {
    const res = await request(app)
      .get('/api/interview/history?limit=9999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/interview/:id', () => {
  let token;

  beforeEach(async () => {
    token = await registerAndGetToken('detailuser@example.com');
  });

  it('rejects a malformed id with 400 instead of crashing', async () => {
    const res = await request(app)
      .get('/api/interview/not-a-valid-object-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 404 for a well-formed id that does not exist', async () => {
    const res = await request(app)
      .get('/api/interview/64f1a2b3c4d5e6f7a8b9c0d1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});