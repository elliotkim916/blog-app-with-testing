'use strict';

const mongoose = require('mongoose');
const faker = require('faker');

const chai = require('chai');
const chaiHttp = require('chai-http');

const expect = chai.expect;

const {BlogPost} = ('../models');
const {app, runServer, closeServer} = ('../server');
const {TEST_DATABASE_URL} = ('../config');