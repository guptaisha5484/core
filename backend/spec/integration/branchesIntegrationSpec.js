'use strict';

const instanceUrl = process.env.INSTANCE_URL;
const app = instanceUrl || require('../../src/app');
const integrationTestHelpers = require('./integrationTestHelpers.js');
const sample = require('lodash').sample;
const uuid = require('node-uuid');

const request = require('supertest-as-promised');

const listOfBranches = res => {
  if (!('branches' in res.body)) {
    throw new Error('branches not found');
  }
};

const listOfGroups = res => {
  if (!('groups' in res.body)) {
    throw new Error('groups not found');
  }
};

const listOfAdmins = res => {
  if (!('admins' in res.body)) {
    throw new Error('admins not found');
  }
};

const getBranches = () => request(app)
        .get('/branches')
        .expect(200)
        .expect(listOfBranches);

const makeBranch = () => ({
  name: 'Melbourne',
  notes: 'organiser',
  contact: 'hey i\'m a contact',
});

const makeBranchUpdates = branch => {
  branch.name = 'New Name!';
  return branch;
};

const hasBranch = res => {
  if (!(res.body.id)) {
    throw new Error('missing created branch');
  }
};

describe('Branches Integration Test', () => {
  let agent;
  let browserState;

  beforeEach(() => {
    agent = request.agent(app);
    browserState = {};

    return integrationTestHelpers.resetDatabase()
        .then(() => integrationTestHelpers.createBranch(agent))
        .then(branch => { browserState.branch = branch; return branch; })
        .then(integrationTestHelpers.createBranchAdmin(agent))
        .then(integrationTestHelpers.authenticateBranchAdmin(agent));
  });

  it('should return a list of branches', () => (
    getBranches())
  );

  it('should return a list of groups for a branch', () => (
    agent
      .get(`/branches/${browserState.branch.id}/groups`)
      .expect(200)
      .expect(listOfGroups)
  ));

  it('should return a list of admins for a branch', () => (
    agent
      .get(`/branches/${browserState.branch.id}/admins`)
      .expect(200)
      .expect(listOfAdmins)
  ));

  it('should return the list of branches the admin user has access to', () => (
    agent.get('/admin/branches')
      .expect(200)
      .then(res => {
        expect(res.body.branches).not.to.eql(null);
        expect(res.body.branches.length).to.equal(1);
        expect(res.body.branches[0].id).to.equal(browserState.branch.id);
      })
  ));

  it('should return a list of all branches for a super admin', () => (
    integrationTestHelpers.createBranch(agent)
      .then(() => integrationTestHelpers.createBranch(agent))
      .tap(integrationTestHelpers.createSuperAdmin(agent))
      .tap(integrationTestHelpers.authenticateSuperAdmin(agent))
      .then(() => (
        agent.get('/admin/branches')
          .expect(200)
          .then(res => {
            expect(res.body.branches).not.to.eql(null);
            expect(res.body.branches.length).to.equal(3);
            expect(sample(res.body.r));
          })
      ))
  ));

  it('should return branches notes for super admins', () => (
    agent.get('/admin/branches')
      .expect(200)
      .then(res => {
        expect(res.body.branches).not.to.eql(null);
        expect(sample(res.body.branches).notes).not.to.eql(null);
      })
  ));

  it('should not return branches notes for branch admins', () => (
    agent.get('/admin/branches')
      .expect(200)
      .then(res => {
        expect(res.body.branches).not.to.eql(null);
        expect(sample(res.body.branches).notes).to.eql(undefined);
      })
  ));

  describe('delete', () => {
    it('should return a 200 when the branch is successfully deleted', () => (
      integrationTestHelpers.createBranch(agent)
        .tap(integrationTestHelpers.createSuperAdmin(agent))
        .tap(integrationTestHelpers.authenticateSuperAdmin(agent))
        .then(
          branch => agent.delete(`/branches/${branch.id}/`)
            .expect(200)
        )
    ));

    it('should return 404 when trying to delete a branch that does not exist', () => (
      integrationTestHelpers.createBranch(agent)
        .tap(integrationTestHelpers.createSuperAdmin(agent))
        .tap(integrationTestHelpers.authenticateSuperAdmin(agent))
        .then(
          () => agent.delete(`/branches/${uuid.v4()}/`)
            .expect(404)
        )
    ));
  });

  describe('add', () => {
    it('should return 200 and a created branch when the input is valid', () => (
      integrationTestHelpers.createSuperAdmin(agent)()
        .then(integrationTestHelpers.authenticateSuperAdmin(agent))
        .then(() => (
          agent.post('/branches')
            .set('Content-Type', 'application/json')
            .send(makeBranch())
            .expect(200)
            .expect(getBranches)
        ))
    ));

    it('should return 400 if the input is null', () => (
      integrationTestHelpers.createSuperAdmin(agent)()
        .then(integrationTestHelpers.authenticateSuperAdmin(agent))
        .then(() => (
          agent.post('/branches')
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(null)
            .expect(400)
        ))
    ));

    it('should return 400 if the input is incomplete', () => (
      integrationTestHelpers.createSuperAdmin(agent)()
        .tap(integrationTestHelpers.authenticateSuperAdmin(agent))
        .then(() => (
          agent.post('/branches')
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send({ invalid: 'invalid' })
            .expect(400)
        ))
    ));
  });

  describe('update', () => {
    it('should return 200 and an updated branch when the input is valid', () => (
      integrationTestHelpers.createBranch(agent)
        .tap(integrationTestHelpers.createSuperAdmin(agent))
        .tap(integrationTestHelpers.authenticateSuperAdmin(agent))
        .then(branch => (
          agent.put(`/branches/${branch.id}/`)
            .set('Content-Type', 'application/json')
            .send(makeBranchUpdates(branch))
            .expect(200)
            .expect(hasBranch)
        ))
    ));

    it('should allow update without the password field in the payload', () => (
      integrationTestHelpers.createBranch(agent)
        .tap(integrationTestHelpers.createSuperAdmin(agent))
        .tap(integrationTestHelpers.authenticateSuperAdmin(agent))
        .then(branch => (
          agent.put(`/branches/${branch.id}`)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(makeBranchUpdates(branch))
            .expect(200)
            .expect(hasBranch)
        ))
    ));

    it('should return 400 if the input is null', () => (
      integrationTestHelpers.createBranch(agent)
        .tap(integrationTestHelpers.createSuperAdmin(agent))
        .tap(integrationTestHelpers.authenticateSuperAdmin(agent))
        .then(branch => (
          agent.put(`/branches/${branch.id}`)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(null)
            .expect(400)
        ))
    ));

    it('should return 400 if the input is incomplete', () => (
      integrationTestHelpers.createBranch(agent)
        .tap(integrationTestHelpers.createSuperAdmin(agent))
        .tap(integrationTestHelpers.authenticateSuperAdmin(agent))
        .then(branch => (
          agent.put(`/branches/${branch.id}`)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send({ invalid: 'invalid' })
            .expect(400)
        ))
    ));

    it('should return 404 if the input is incomplete', () => (
      integrationTestHelpers.createBranch(agent)
        .tap(integrationTestHelpers.createSuperAdmin(agent))
        .tap(integrationTestHelpers.authenticateSuperAdmin(agent))
        .then(() => (
          agent.put('/branches/bad-branch-id')
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send({ invalid: 'invalid' })
            .expect(404)
        ))
    ));
  });
});
