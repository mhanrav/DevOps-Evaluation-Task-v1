const request = require('supertest');
const app = require('../index');


describe('GET /', () => {
test('responds with JSON message', async () => {
const res = await request(app).get('/');
expect(res.statusCode).toEqual(200);
expect(res.body).toHaveProperty('message');
});
});