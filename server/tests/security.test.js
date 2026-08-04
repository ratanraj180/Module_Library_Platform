/**
 * @file security.test.js
 * @description Comprehensive backend test suite for the Security Scanning Pipeline.
 *
 * Runs zero-dependency self-contained test modules.
 *
 * Usage:
 *   node tests/security.test.js
 */

const assert = require('assert');
const mongoose = require('mongoose');

console.log('Initializing scanning pipeline test harness...');

// Mock Mongoose documents
const mockModule = {
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Module Alpha',
  status: 'submitted',
  owner: new mongoose.Types.ObjectId(),
  save: async function() { this.saved = true; }
};

const mockAdminUser = {
  id: 'admin-user-id',
  email: 'admin@org.com',
  role: 'admin'
};

const mockDevUser = {
  id: 'dev-user-id',
  email: 'dev@org.com',
  role: 'developer'
};

// Import code units
const { computeRiskScore, scoreToLevel } = require('../src/services/security/riskScorer');
const { approveModule, rejectModule } = require('../src/controllers/moduleController');
const SecurityReport = require('../src/models/SecurityReport');
const Module = require('../src/models/Module');
const Review = require('../src/models/Review');

// Back up original mongoose methods
const origModuleFind = Module.findById;
const origReportFindOne = SecurityReport.findOne;
const origReviewFind = Review.findOne;
const origReviewCreate = Review.create;

let passedTests = 0;
let totalTests = 0;

async function runTest(desc, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ ${desc}`);
    console.error(err);
  }
}

async function main() {
  console.log('\n--- 1. RISK SCORING TESTS ---');

  await runTest('should return 100 and safe for perfect scans', () => {
    const res = computeRiskScore({
      malwareResult: { detected: false },
      staticAnalysis: { findings: [] },
      dependencyScan: { vulnerabilitiesBySeverity: { critical: 0, high: 0, medium: 0 } },
      secretScan: { secretsFound: false }
    });
    assert.strictEqual(res.riskScore, 100);
    assert.strictEqual(res.riskLevel, 'safe');
  });

  await runTest('should deduct 40 points for malware', () => {
    const res = computeRiskScore({
      malwareResult: { detected: true },
      staticAnalysis: { findings: [] },
      dependencyScan: { vulnerabilitiesBySeverity: { critical: 0, high: 0, medium: 0 } },
      secretScan: { secretsFound: false }
    });
    assert.strictEqual(res.riskScore, 60);
    assert.strictEqual(res.riskLevel, 'high');
  });

  await runTest('should deduct 20 points for critical dependencies', () => {
    const res = computeRiskScore({
      malwareResult: { detected: false },
      staticAnalysis: { findings: [] },
      dependencyScan: { vulnerabilitiesBySeverity: { critical: 1, high: 0, medium: 0 } },
      secretScan: { secretsFound: false }
    });
    assert.strictEqual(res.riskScore, 80);
    assert.strictEqual(res.riskLevel, 'medium');
  });

  await runTest('should deduct 15 points for secrets detected', () => {
    const res = computeRiskScore({
      malwareResult: { detected: false },
      staticAnalysis: { findings: [] },
      dependencyScan: { vulnerabilitiesBySeverity: { critical: 0, high: 0, medium: 0 } },
      secretScan: { secretsFound: true }
    });
    assert.strictEqual(res.riskScore, 85);
    assert.strictEqual(res.riskLevel, 'medium');
  });

  await runTest('should deduct 10 points for dangerous static code findings', () => {
    const res = computeRiskScore({
      malwareResult: { detected: false },
      staticAnalysis: { findings: [{ severity: 'high' }] },
      dependencyScan: { vulnerabilitiesBySeverity: { critical: 0, high: 0, medium: 0 } },
      secretScan: { secretsFound: false }
    });
    assert.strictEqual(res.riskScore, 90);
    assert.strictEqual(res.riskLevel, 'medium');
  });

  await runTest('should clamp total deductions at 0', () => {
    const res = computeRiskScore({
      malwareResult: { detected: true }, // -40
      staticAnalysis: { findings: [{ severity: 'critical' }] }, // -10
      dependencyScan: { vulnerabilitiesBySeverity: { critical: 1, high: 1, medium: 1 } }, // -20 -10 -5
      secretScan: { secretsFound: true } // -15
    });
    assert.strictEqual(res.riskScore, 0);
    assert.strictEqual(res.riskLevel, 'critical');
  });

  console.log('\n--- 2. APPROVAL GATE & INTEGRATION TESTS ---');

  // Set up mock context for approve tests
  Module.findById = () => mockModule;
  Review.findOne = () => null;
  Review.create = async (p) => p;

  await runTest('should block approvals if malware is detected', async () => {
    mockModule.status = 'submitted';
    SecurityReport.findOne = () => ({
      sort: () => ({
        malwareResult: { detected: true },
        riskScore: 60,
        riskLevel: 'high'
      })
    });

    let resStatus = 200;
    let resMsg = '';
    const res = {
      status: (code) => { resStatus = code; return res; },
      json: (payload) => { resMsg = payload.message; return res; }
    };

    await approveModule({ params: { id: 'mod-123' }, user: mockAdminUser, body: {} }, res, () => {});
    assert.strictEqual(resStatus, 403);
    assert.match(resMsg, /Approval blocked/);
  });

  await runTest('should require override when score is below 80 and no override flag is present', async () => {
    mockModule.status = 'submitted';
    SecurityReport.findOne = () => ({
      sort: () => ({
        malwareResult: { detected: false },
        riskScore: 75,
        riskLevel: 'high'
      })
    });

    let resStatus = 200;
    let resMsg = '';
    const res = {
      status: (code) => { resStatus = code; return res; },
      json: (payload) => { resMsg = payload.message; return res; }
    };

    await approveModule({ params: { id: 'mod-123' }, user: mockAdminUser, body: {} }, res, () => {});
    assert.strictEqual(resStatus, 403);
    assert.match(resMsg, /override is required/);
  });

  await runTest('should approve successfully when score is below 80 if overrideThreshold is true', async () => {
    mockModule.status = 'submitted';
    SecurityReport.findOne = () => ({
      sort: () => ({
        malwareResult: { detected: false },
        riskScore: 75,
        riskLevel: 'high'
      })
    });

    let resStatus = 200;
    const res = {
      status: (code) => { resStatus = code; return res; },
      json: () => res
    };

    await approveModule({ params: { id: 'mod-123' }, user: mockAdminUser, body: { overrideThreshold: true } }, res, () => {});
    assert.strictEqual(resStatus, 200);
    assert.strictEqual(mockModule.status, 'approved');
  });

  await runTest('should approve immediately if score is 80 or above', async () => {
    mockModule.status = 'submitted';
    SecurityReport.findOne = () => ({
      sort: () => ({
        malwareResult: { detected: false },
        riskScore: 90,
        riskLevel: 'medium'
      })
    });

    let resStatus = 200;
    const res = {
      status: (code) => { resStatus = code; return res; },
      json: () => res
    };

    await approveModule({ params: { id: 'mod-123' }, user: mockAdminUser, body: {} }, res, () => {});
    assert.strictEqual(resStatus, 200);
    assert.strictEqual(mockModule.status, 'approved');
  });

  // Restore mongoose models to original
  Module.findById = origModuleFind;
  SecurityReport.findOne = origReportFindOne;
  Review.findOne = origReviewFind;
  Review.create = origReviewCreate;

  console.log(`\n=== Test Runner Complete ===`);
  console.log(`Passed: ${passedTests} / ${totalTests} tests.`);
  
  if (passedTests !== totalTests) {
    console.error('❌ Security scanner suite has test failures!');
    process.exit(1);
  } else {
    console.log('✓ All scanning pipeline tests passed successfully.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
