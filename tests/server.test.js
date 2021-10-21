const fs = require('fs');
const supertest = require('supertest');

const setup = () => {
  const db = require('../db.json');
  fs.writeFileSync('db.test.json', JSON.stringify(db));
  process.env.DB = 'db.test.json';
  const server = require('../server');
  return [
    server,
    function cleanup() {
      fs.unlinkSync('db.test.json');
      process.env.DB = '';
    }
  ];
};

describe('TODOs REST API', () => {
  let cleanup, server;
  beforeAll(() => {
    [server, cleanup] = setup();
  });
  afterAll(() => {
    cleanup();
  });

  describe('POST /todos', () => {
    it('should create a new task', async () => {
      const response = await supertest(server).post('/todos').send({
        text: 'Random task',
        type: 'short'
      });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        text: 'Random task',
        type: 'short',
        id: 336
      });
    });
  });

  describe('GET /todos/:id', () => {
    it('should get a task based on ID', async () => {
      const response = await supertest(server).get('/todos/33');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        text: 'Random task',
        type: 'short',
        id: 33
      });
    });
  });

  describe('GET /todos', () => {
    it('should get all tasks', async () => {
      const response = await supertest(server).get('/todos');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(33);
    });
    it('should search for tasks matching query', async () => {
      const response = await supertest(server).get('/todos?q=empty');
      expect(response.status).toBe(200);
      response.body.forEach((t) => {
        expect(t.text.toLowerCase().includes('empty')).toBe(true);
      });
    });
    it('should search for tasks based on type', async () => {
      const response = await supertest(server).get('/todos?type=long');
      expect(response.status).toBe(200);
      response.body.forEach((t) => {
        expect(t.type).toBe('long');
      });
    });
    it('should paginate if _page and _limit params supplied', async () => {
      const response = await supertest(server).get('/todos?_page=2&_limit=3');
      expect(response.status).toBe(200);
      expect(response.body[0].id).toBe(4);
      expect(response.body[response.body.length - 1].id).toBe(6);
    });
    it('should slice if _start and _end are provided', async () => {
      const response = await supertest(server).get('/todos?_start=20&_end=30');
      expect(response.status).toBe(200);
      expect(response.body[0].id).toBe(21);
      expect(response.body[response.body.length - 1].id).toBe(30);
    });
  });

  describe('PUT /todos/:id', () => {
    it('should update the task with specified id', async () => {
      const response = await supertest(server).put('/todos/33').send({
        text: 'Updated random task',
        type: 'short'
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        text: 'Updated random task',
        type: 'short',
        id: 33
      });
      const getRes = await supertest(server).get('/todos/33');
      expect(getRes.status).toBe(200);
      expect(getRes.body).toEqual({
        text: 'Updated random task',
        type: 'short',
        id: 33
      });
    });
  });

  describe('PATCH /todos/:id', () => {
    it('should update specified fields in the task', async () => {
      const response = await supertest(server).patch('/todos/33').send({
        type: 'common'
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        text: 'Updated random task',
        type: 'common',
        id: 33
      });
      const getRes = await supertest(server).get('/todos/33');
      expect(getRes.status).toBe(200);
      expect(getRes.body).toEqual({
        text: 'Updated random task',
        type: 'common',
        id: 33
      });
    });
  });

  describe('DELETE /todos/:id', () => {
    it('should delete the specified task', async () => {
      const response = await supertest(server).delete('/todos/33').send({
        type: 'common'
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
      const getRes = await supertest(server).get('/todos/33');
      expect(getRes.status).toBe(404);
      expect(getRes.body).toEqual({});
    });
  });
});
