'use strict';

const mongoose = require('mongoose');
const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');

const expect = chai.expect;
const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

// deletes database in between tests 
// to not maintain state between tests
function tearDownDb() {
    console.warn('Deleting database!');
    return mongoose.connection.dropDatabase();
}

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

describe('GET endpoint', function() {
// STRATEGY: make a get request to get all existing blog posts, 
// check that the response has a status of 200 and the length is at least 1
// and then assert/check that number of posts in res.body is equal to count
    it('should return all blog posts', function() {
        let res;
        return chai.request(app)
            .get('/posts')
            .then(function(_res) {
                res = _res;
                expect(res).to.be.status(200);
                expect(res.body).to.have.length.of.at.least(1);

                // will return number of posts in test database
                return BlogPost.count();
            })
            
            .then(function(count) {
                expect(res.body).to.have.lengthOf(count);
            });
    });

    // REMEMBER - res.body is an ARRAY filled with OBJECTS
    it('should return posts with the right fields', function() {
// Strategy: Get back all posts, check status, if its json, length, and if its an array
// res.body is an array, and within that array are objects, so check that each IS an object
// and check that each object has the necessary keys, THEN -
// Get the id for one of the blog posts, then return a promise of BlogPost.findById(resBlogPost.id)
// Then check that the values in our blog post that we got back correspond with those in the database

     let resBlogPost;
     return chai.request(app)
        .get('/posts')
        .then(function(res) {
            expect(res).to.be.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.length.of.at.least(1);
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
            expect(resBlogPost.author).to.equal(post.authorName);
        });   
    });

describe('POST endpoint', function() {
// STRATEGY: create a new blog post first, then make a post request to /posts, then send the new blog post
// then check that is has status of 201, json, is an object, has the right keys, and
// check that the returned object is equal to data that we sent over
// After that, we retrieve the new post from the db and compare its data to the data we sent over
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
            expect(res.body.author).to.equal(
                `${newPost.author.firstName} ${newPost.author.lastName}`
            );
            return BlogPost.findById(res.body.id);
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
// STRATEGY: create an object with the fields you want to update first
// then retrieve one blog post and set that posts id to our updateData objects id property
// then return results of making a put request with that id, and send the updated data
// after sending data, check status to be 204, and then we retrieve the updated post from the db
// and prove the post in the db contains the updated values
    it('should update the fields you send over', function() {
        const updateData = {
            title: 'SERIOUSLY WHY?',
            content: 'WHY WONT THIS WORK?!?!',
            author: {
                firstName: 'Tracy',
                lastName: 'McGrady'
            }
        };

    return BlogPost
        .findOne()
        .then(post => {
            updateData.id = post.id;

    return chai.request(app)
        .put(`/posts/${post.id}`)
        .send(updateData);
    })
    .then(res => {
        expect(res).to.have.status(204);
        return BlogPost.findById(updateData.id);
    })
    .then(post => {
        expect(updateData.title).to.equal(post.title);
        expect(updateData.content).to.equal(post.content);
        expect(updateData.author.firstName).to.equal(post.author.firstName);
        expect(updateData.author.lastName).to.equal(post.author.lastName);
    });
    });
});

describe('DELETE endpoint', function() {
// STRATEGY: get the id of an existing post from the db, delete it through the api layer
// check that it has a status of 204
// and then demonstrate the item is no longer in the database
    it('should delete a blog post', function() {
    let post;
    return BlogPost
        .findOne()
        .then(function(_post) {
            post = _post;
            return chai.request(app)
            .delete(`/posts/${post.id}`)
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
});