'use strict';

const mongoose = require('mongoose');
const faker = require('faker');

const chai = require('chai');
const chaiHttp = require('chai-http');

const expect = chai.expect;

const {BlogPost} = ('../models');
const {app, runServer, closeServer} = ('../server');
const {TEST_DATABASE_URL} = ('../config');

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