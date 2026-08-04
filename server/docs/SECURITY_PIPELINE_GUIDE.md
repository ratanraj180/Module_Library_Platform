# Security Scanning Pipeline — Complete Architecture & Operations Guide

This guide documents the architecture, data models, scanning services, risk scoring algorithms, frontend consoles, and deployment procedures for the Module Library Security Scanning Pipeline.

---

## 1. System Architecture

The Security Scanning Pipeline is structured as a fault-tolerant, orchestrator-driven subsystem within the Express + Node.js backend. It operates in two modes:

1. **Synchronous Upload Scan (Blocking)**: Runs *only* the Malware Scanner. If malware is detected, the archive is deleted, a `SecurityReport` is created in MongoDB, and the request is rejected with `400 Bad Request`.
2. **Asynchronous Full Pipeline (Non-Blocking)**: Triggers sequentially after successful upload or repository synchronization. Runs Malware ➔ Static Analysis ➔ Dependency Scan ➔ Secret Detection ➔ Risk Score ➔ AI Posture Summary.

```
                  Client Upload Request (POST /api/modules)
                                     │
                                     ▼
                        [scanUpload Middleware]
                                     │
                           (Malware Scan Only)
                                     │
                      ┌──────────────┴──────────────┐
              Malware Detected?             No Malware Detected
                      │                             │
                      ▼                             ▼
         [Reject Upload: HTTP 400]        [Create Module in DB]
           (File deleted from disk)                 │
                                                    ▼
                                    (Asynchronous Full Pipeline)
                                                    │
                                                    ├─► Malware Scan (blocks subsequent scans)
                                                    ├─► Static Analysis (Semgrep / Fallback)
                                                    ├─► Dependency Scan (npm audit)
                                                    ├─► Secret Detection (Gitleaks / Fallback)
                                                    │
                                                    ▼
                                            [Risk Scorer]
                                     (100 - deductions capped)
                                                    │
                                                    ▼
                                            [AI Summarizer]
                                     (gemini-1.5-flash / Fallback)
                                                    │
                                                    ▼
                                         [SecurityReport Saved]
```

---

## 2. Scanning Services & Pipeline Workflow

All scans are coordinated in [securityPipeline.js](file:///Users/saumyasharma/Desktop/project/Module_Library/server/src/services/security/securityPipeline.js) and execute in sequential order.

### A. Malware Scan (`malwareScanner.js`)
- **Core Engine**: ClamAV. The adapter checks if the daemon port `3310` is active.
- **Graceful Fallback**: If ClamAV is offline or missing, it falls back to a clean mock return (`NoOpScanner`) so developer setups do not break.
- **Workflow**: Unzips package ➔ Scans directories recursively ➔ Flags viruses, returns signature names.

### B. Static Code Analysis (`staticAnalyzer.js` / `semgrepRunner.js` / `customPatternScanner.js`)
- **Core Engine**: Semgrep CLI binary.
- **Graceful Fallback**: If Semgrep is missing, compiles lines using the built-in RegExp pattern matcher.
- **Rules Audited**:
  - Code execution vulnerabilities: `eval()`, `new Function()`, `exec()`, `execSync()`, `spawn()`.
  - Input/path validation concerns: SQL Injection patterns, Command Injection patterns, Path Traversal risks, Unsafe Regular Expressions (ReDoS), and destructive file write calls.

### C. Dependency Vulnerability Scan (`dependencyScanner.js`)
- **Core Engine**: `npm audit --json`.
- **Pre-requisite**: Resolves a package lock file. If the zip does not contain one, it runs `npm install --package-lock-only --ignore-scripts` to construct a local resolve tree without downloading any binaries (protecting CPU and disk storage).
- **Parsers**: Interprets both v1 and v2 npm audit JSON formats, mapping vulnerabilities to: `critical`, `high`, `medium`, `low`, capturing CVE numbers and remediation/patched versions.

### D. Secret Detection (`secretScanner.js` / `gitleaksRunner.js` / `customSecretScanner.js`)
- **Core Engine**: Gitleaks CLI.
- **Graceful Fallback**: Falls back to the custom regex matcher if the Gitleaks binary is missing.
- **Rules Audited**: GitHub tokens, AWS access/secret keys, JSON Web Token (JWT) secrets, database connection passwords, Stripe API keys, and asymmetric private keys.
- **Security Constraint**: **All secrets are redacted/masked before saving** (e.g. `ghp_************************************`) so raw keys are never written to the database.

---

## 3. Risk Scoring Engine

The risk score starts at a perfect baseline score of **100** (safest), and applies flat deductions based on scanner flags:

| Security Threat | Deduction | Condition |
| :--- | :--- | :--- |
| **Malware Detected** | **-40 points** | Flat deduction if virus signatures are detected |
| **Critical Dependency** | **-20 points** | Flat deduction if any critical CVE exists |
| **High Dependency** | **-10 points** | Flat deduction if any high CVE exists |
| **Medium Dependency** | **-5 points** | Flat deduction if any medium CVE exists |
| **Secret Found** | **-15 points** | Flat deduction if any exposed credential is found |
| **Dangerous Code** | **-10 points** | Flat deduction if static analyzer flags high/critical/medium vulnerabilities |

### Risk Level Mapping
- Score = **100**: `'safe'`
- Score between **[80, 99]**: `'medium'`
- Score between **[50, 79]**: `'high'`
- Score **< 50**: `'critical'`

---

## 4. API Endpoints Reference

### 1. Initiate manual rescan
- **Route**: `POST /api/security/scan/:moduleId`
- **RBAC**: Private (Admin)
- **Response**: `202 Accepted`
  ```json
  {
    "status": "success",
    "data": {
      "message": "Security scan initiated successfully. Poll the report endpoint for results.",
      "reportId": "60a7479d2bfdfb2e2d83b632",
      "moduleId": "60a7479d2bfdfb2e2d83b62f",
      "scanStatus": "pending"
    }
  }
  ```

### 2. Retrieve latest report
- **Route**: `GET /api/security/report/:moduleId`
- **RBAC**: Private (Developer & Admin)
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "report": {
        "_id": "60a7479d2bfdfb2e2d83b632",
        "moduleId": "60a7479d2bfdfb2e2d83b62f",
        "scanStatus": "completed",
        "riskScore": 90,
        "riskLevel": "medium",
        "aiSummary": "Security review completed. Posture is rated as medium...",
        "recommendation": "Recommendations: 1. Update Axios dependencies...",
        "malwareResult": { "detected": false, "findings": [] },
        "staticAnalysis": { "totalIssues": 0, "findings": [] },
        "dependencyScan": { "totalDependencies": 150, "vulnerabilitiesBySeverity": { "critical": 0, "high": 1, "medium": 0, "low": 0 }, "findings": [...] },
        "secretScan": { "secretsFound": false, "findings": [] }
      }
    }
  }
  ```

### 3. Re-scan trigger
- **Route**: `POST /api/security/rescan/:moduleId`
- **RBAC**: Private (Admin)
- **Response**: `202 Accepted`

---

## 5. Review Approval Gates & Policies

The security report details are integrated directly into the module approval gate:

1. **Malware Block**: Any module that contains confirmed malware *cannot* be approved. The "Approve" button is disabled on the frontend, and the backend returns a `403 Forbidden` error.
2. **Threshold Gate**: If a module has a safety score below **80**, it cannot be approved under standard review.
3. **Manual Override**: To approve a module with a score below 80, the reviewer must check the override checkbox on the frontend review console, which attaches `{ overrideThreshold: true }` to the approval API payload.
4. **Audit Logging**: Every review action is logged to the console/system logger:
   - `[AuditLog] [Approval] Module "Title" APPROVED by admin "email".`
   - `[AuditLog] [Manual Override] Admin "email" utilized manual threshold override to approve module "Title" with score X.`
   - `[AuditLog] [Blocked Approval] Attempt to approve infected module blocked.`

---

## 6. Installation & Setup Guide

### A. ClamAV Setup
Ensure the ClamAV daemon is running and listening on port `3310`.

**macOS**:
```bash
brew install clamav
# Update virus databases
freshclam
# Start daemon
brew services start clamav
```

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install -y clamav clamav-daemon
# Update databases
sudo freshclam
# Enable daemon
sudo systemctl enable clamav-daemon
sudo systemctl start clamav-daemon
```

### B. Semgrep Setup
Install Semgrep locally to enable semantic/AST analysis of Node.js modules.

**macOS**:
```bash
brew install semgrep
```

**Python pip**:
```bash
pip install semgrep
```

### C. Gitleaks Setup
Install Gitleaks locally to index secrets.

**macOS**:
```bash
brew install gitleaks
```

---

## 7. Troubleshooting & Operations Guide

### 1. ClamAV scan returns "Connection Refused"
- **Reason**: The ClamAV daemon (`clamd`) is not running or listening on standard port `3310`.
- **Fix**: Check `clamd.conf` parameters. Ensure `TCPSocket 3310` is uncommented. Verify it is running via `netstat -an | grep 3310`.

### 2. npm audit fails during ZIP scan
- **Reason**: The module does not have a `package-lock.json` and registry connections are failing.
- **Fix**: The scanner automatically attempts to generate a lock file via `npm install --package-lock-only`. If this fails, ensure the scanning node has internet connection to `registry.npmjs.org`. If dependencies are in private scopes, configure `.npmrc` with appropriate tokens inside the registry directories.

### 3. Semgrep returns exit status 2
- **Reason**: Invalid syntax or rules parameters.
- **Fix**: The engine catches process failures and falls back to regex pattern matchers. Check rule YAML files in temp directories.
