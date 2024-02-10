process.env.NODE_ENV = 'test';
const request = require('supertest');

const app = require('../app');
const db = require('../db');

let testBookIsbn;
beforeEach(async () => {
    let result = await db.query(`
        INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('12345', 'https://amazon.com/fang', 'Cash Money', 'English', 500, 'Fing inc', 'Chocolate Adventures', 2024)
        RETURNING isbn`);

    testBookIsbn = result.rows[0].isbn
})

afterEach(async () => {
    await db.query('DELETE FROM BOOKS');
})

afterAll(async () => {
    if (process.env.NODE_ENV === 'test') {
        await db.end();
    }
})

describe('GET /', () => {
    test('GET list of all books "Fangs book"', async () => {
        const res = await request(app).get('/books');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({books: [{
            isbn: '12345', 
            amazon_url: 'https://amazon.com/fang', 
            author: 'Cash Money',
            language: 'English',
            pages: 500,
            publisher: 'Fing inc',
            title: 'Chocolate Adventures',
            year: 2024
        }]});
    })
})

describe('GET /:isbn', () => {
    test('Gets a single book', async () => {
        const res = await request(app).get(`/books/${testBookIsbn}`)
        expect(res.body.book.isbn).toBe(testBookIsbn);
    })

    test("Gives 404 if can't find book", async () => {
        const res = await request(app).get(`/books/9999999999`);
        expect(res.statusCode).toBe(404);
    })
})

describe('POST /', () => {
    test('Adds a book', async () => {
        const res = await request(app).post('/books').send({
            isbn: '123456', 
            amazon_url: 'https://amazon.com/doge', 
            author: 'Doge Money',
            language: 'English',
            pages: 5000,
            publisher: 'Doge inc',
            title: 'Doge Adventures',
            year: 3000
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.book).toHaveProperty('isbn');
        expect(res.body.book).toHaveProperty('author');
        expect(res.body.book).toHaveProperty('language');
        expect(res.body.book).toHaveProperty('pages');
        expect(res.body.book).toHaveProperty('publisher');
        expect(res.body.book).toHaveProperty('title');
        expect(res.body.book).toHaveProperty('year');
    })

    test("Gives 400 if missing properties", async () => {
        const res = await request(app).post(`/books`).send({author: 'aaaaa'});
        expect(res.statusCode).toBe(400);
    })
})

describe('PUT /:isbn', () => {
    test('Updates a book', async () => {
        const res = await request(app).put(`/books${testBookIsbn}`).send({ 
            amazon_url: 'https://amazon.com/doge', 
            author: 'Doge Money',
            language: 'English',
            pages: 5000,
            publisher: 'Doge inc',
            title: 'Doge Updated',
            year: 3000
        });
        expect(res.body.book.title).toBe('Doge Updated');
    })

    test("Gives 404 if can't find book", async () => {
        await request(app).delete(`/books/${testBookIsbn}`);
        const res = await request(app).get(`/books/${testBookIsbn}`);
        expect(res.statusCode).toBe(404);
    })
})

describe('DELETE /:isbn', () => {
    test('Deletes a book', async () => {
        const res = await request(app).delete(`/books/${testBookIsbn}`);
        expect(res.body).toEqual({message: "Book deleted"});
    })

    test("Gives 404 if can't find book", async () => {
        await request(app).delete(`/books/${testBookIsbn}`);
        const res = await request(app).get(`/books/${testBookIsbn}`);
        expect(res.statusCode).toBe(404);
    })
})