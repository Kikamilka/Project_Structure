//var assert = require('assert');
var add    = require('../src/add.js');
"use strict";

var chai = require('chai');
chai.config.includeStack = true;
var expect = chai.expect;

describe('add()', function() {
  it('should return 5 when you pass it 2, 3', function() {
    expect(add(2, 3)).to.be.equal(5);
    //assert.equal(add(1, 1), 2);
  });
});