//var assert = require('assert');
var add    = require('../src/add.js');
"use strict";

var chai = require('chai');
chai.config.includeStack = true;
var expect = chai.expect;

describe('add()', function() {
  it('should return 2 when you pass it 1, 1', function() {
    expect(add(1, 1)).to.be.equal(2);
    //assert.equal(add(1, 1), 2);
  });
});