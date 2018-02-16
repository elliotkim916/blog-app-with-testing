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
                expect(res.body).to.have.length.of.at.least(1);
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

});