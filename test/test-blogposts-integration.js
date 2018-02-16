'use strict';

const mongoose = require('mongoose');
const faker = require('faker');

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);
// seed the database
function seedBlogPostData() {
    console.info('seeding blog post data');
    const seedData = [];

    for (let i=1; i<=5; i++) {
        seedData.push(generateBlogPostData());
    }

    return BlogPost.insertMany(seedData);
}

// to generate fake titles
function generateTitle() {
    const title = [
        'yesterday', 
        'today', 
        'tomorrow', 
        'next', 
        'never'
    ];
    return title[Math.floor(Math.random() * title.length)];
}

// to generate fake blog posts
function generateBlogPostData() {
    return {
        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        title: generateTitle(),
        content: faker.lorem.paragraph()
    }
}

// deletes database in between tests 
// to not maintain state between tests
function tearDownDb() {
    console.warn('Deleting database!');
    return mongoose.connection.dropDatabase();
}

describe('Blog Post API Resource', function() {
// in testing, mocha is expecting promises!

    // starts server with test database url
    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    // seeds database with test data before each test runs
    beforeEach(function() {
        return seedBlogPostData();
    });

    // zeroes out database after each test has run
    afterEach(function() {
        return tearDownDb();
    });

    // closes server after all tests have run
    after(function() {
        return closeServer();
    });
});

describe('GET endpoint', function() {
    it('should return all blog posts', function() {
        let res;
        return chai.request(app)
            .get('/posts')
            .then(function(_res) {
                res = _res;
                expect(res).to.have.status(200);
                expect(res).to.be(json);
                expect(res.body).to.have.length.of.at.least(1);
                expect(res.body).to.be.a('array');
                return BlogPost.count();
            })
            .then(function(count) {
                expect(res.body).to.have.length.of(count);
            
            });
    });

    it('should return posts with the right fields', function() {
     // Strategy: Get back all restaurants, and ensure they have expected keys
     let resBlogPost;

     return chai.request(app)
        .get('/posts')
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be(json);
            expect(res.body).to.have.length.of.at.least(1);
            expect(res.body).to.be.a('array');

            res.body.forEach(function(post) {
                expect(post).to.be.a('object');
                expect(post).to.include.keys('title', 'content', 'author');
            });

            resBlogPost = res.body[0];
            return BlogPost.findById(resBlogPost.id);
        })
        .then(function(post) {
            expect(resBlogPost.title).to.equal(post.title);
            expect(resBlogPost.content).to.equal(post.content);
            expect(resBlogPost.author.firstName).to.equal(post.author.firstName);
            expect(resBlogPost.author.lastName).to.equal(post.author.lastName);
        });   
    });

describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the restaurant we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new blog post', function() {
    const newPost = generateBlogPostData();

    return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then(function(res) {
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body).to.include.keys('title', 'content', 'author');
            expect(res.body.title).to.equal(newPost.title);
            expect(res.body.content).to.equal(newPost.content);
            expect(res.body.author.firstName).to.equal(newPost.author.firstName);
            expect(res.body.author.lastName).to.equal(newPost.author.lastName);
        })
        .then(function(post) {
            expect(post.title).to.equal(newPost.title);
            expect(post.content).to.equal(newPost.content);
            expect(post.author.firstName).to.equal(newPost.author.firstName);
            expect(post.author.lastName).to.equal(newPost.author.lastName);
        });
    });
});

describe('PUT endpoint', function() {
    it('should update a blog post', function() {
        const updateData = {
            title: 'SERIOUSLY WHY?',
            content: 'WHY WONT THIS WORK?!?!',
            author: {
                firstName: 'Tommy',
                lastName: 'David'
            }
        };

    return BlogPost
        .findOne()
        .then(function(post) {
            updateData.id = post.id;

    return chai.request(app)
        .put(`/posts/${post.id}`)
        .send(updateData);
    })
    .then(function(res) {
        expect(res).to.have.status(204);

        return BlogPost.findById(updateData.id);
    })
    .then(function(post){
        expect(post.title).to.equal(updataData.title);
        expect(post.content).to.equal(updataData.content);
        expect(post.author.firstName).to.equal(updateData.author.firstName);
        expect(post.author.lastName).to.equal(updateData.author.lastName);
    });
    });
});

describe('DELETE endpoint', function() {
    it('should delete a blog post', function() {
    
    let post;

    return BlogPost
        .findOne()
        .then(function(_post) {
            post = _post;
            return chai.request(app).delete(`/posts/${post.id}`)
        })
        .then(function(res) {
            expect(res).to.have.status(204);
            return BlogPost.findById(post.id);
        })
        .then(function(_post) {
            expect(_post).to.be.null;
        });
    });
});
});