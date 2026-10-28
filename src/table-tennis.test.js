import {test} from 'node:test';import assert from 'node:assert/strict';import {createMatch,score,labels,serving} from './table-tennis.js';
const fresh=()=>createMatch({bestOf:3,server:0});
test('11 points wins a set; first serve switches next set',()=>{let s=fresh();for(let i=0;i<11;i++)s=score(s,0);assert.deepEqual(s.results,[[11,0]]);assert.deepEqual(labels(s),['0','0']);assert.equal(s.sets[0],1);assert.equal(serving(s),1)});
test('10–10 requires a two point lead',()=>{let s={...fresh(),points:[10,10]};s=score(s,0);assert.equal(s.sets[0],0);s=score(s,1);assert.equal(s.sets[0],0);s=score(score(s,1),1);assert.deepEqual(s.results,[[11,13]])});
test('serve switches every two points, every point after 10–10',()=>{let s=fresh();assert.equal(serving(s),0);s=score(s,0);assert.equal(serving(s),0);s=score(s,1);assert.equal(serving(s),1);s={...s,points:[10,10]};assert.equal(serving(s),0);s=score(s,0);assert.equal(serving(s),1);s=score(s,1);assert.equal(serving(s),0)});
test('best of three ends after two sets and rejects more points',()=>{let s=fresh();for(let i=0;i<22;i++)s=score(s,1);assert.equal(s.winner,1);assert.deepEqual(s.sets,[0,2]);assert.equal(score(s,0),s)});
test('best of five requires three sets',()=>{let s=createMatch({bestOf:5,server:1});for(let i=0;i<22;i++)s=score(s,0);assert.equal(s.winner,null);for(let i=0;i<11;i++)s=score(s,0);assert.equal(s.winner,0)});
