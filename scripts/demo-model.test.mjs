import test from 'node:test';
import assert from 'node:assert/strict';
import { initialDemo, demoReducer } from '../lib/presentation/demo-model.ts';

test('a visitor can complete the Client → Staff → Client lifecycle and retain its history', () => {
  const original = initialDemo();
  let state = demoReducer(original, { type: 'reply', role: 'Client', text: 'This is a fictional request.' });
  state = demoReducer(state, { type: 'assign', role: 'Staff' });
  state = demoReducer(state, { type: 'start', role: 'Staff' });
  state = demoReducer(state, { type: 'resolve', role: 'Staff', text: 'The fictional access problem has been resolved.' });
  assert.equal(state.tickets[0].status, 'Resolved');
  state = demoReducer(state, { type: 'accept', role: 'Client' });
  assert.equal(state.tickets[0].status, 'Closed');
  assert.equal(state.tickets[0].messages.length, 2);
  assert.equal(state.tickets[0].history.length, 6);
  assert.equal(original.tickets[0].status, 'Open');
  assert.deepEqual(demoReducer(state, { type: 'reply', role: 'Staff', text: 'Cannot change closed work' }), state);
});
test('role switching illustrates distinct responsibilities and blocks out-of-order transitions', () => {
  const state = initialDemo();
  for (const action of [{ type: 'assign', role: 'Client' }, { type: 'start', role: 'Staff' }, { type: 'accept', role: 'Staff' }, { type: 'resolve', role: 'Staff', text: 'A sufficiently long solution' }, { type: 'reply', role: 'Admin', text: 'No admin replies' }]) assert.equal(demoReducer(state, action), state);
});
test('new fictional tickets are selectable, bounded and reset independently', () => {
  const original = initialDemo();
  const state = demoReducer(original, { type: 'create', title: 'Example request', description: 'An entirely fictional demo issue.', priority: 'Medium' });
  assert.equal(state.tickets.length, 4);
  assert.equal(state.tickets[0].id, state.selected);
  assert.equal(state.tickets[0].status, 'Open');
  assert.deepEqual(demoReducer(state, { type: 'reset' }), original);
  assert.equal(demoReducer(original, { type: 'create', title: ' ', description: ' ', priority: 'High' }), original);
  assert.equal(demoReducer(original, { type: 'select', id: -1 }), original);
});
