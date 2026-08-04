# ClamAV Installation & Configuration Guide

ClamAV is the open-source antivirus engine used by the Module Library Security Pipeline for malware detection.

> **If ClamAV is not installed**, the server will log a warning and fall back to a `NoOpScanner` — uploads will still work but files will **not be scanned**. Always run ClamAV in production.

---

## macOS (Homebrew)

```bash
# Install ClamAV
brew install clamav

# Copy the default config files
cp /opt/homebrew/etc/clamav/freshclam.conf.sample /opt/homebrew/etc/clamav/freshclam.conf
cp /opt/homebrew/etc/clamav/clamd.conf.sample     /opt/homebrew/etc/clamav/clamd.conf

# Edit freshclam.conf — comment out the "Example" line
sed -i '' 's/^Example/#Example/' /opt/homebrew/etc/clamav/freshclam.conf

# Edit clamd.conf — comment out "Example" and set socket or TCP port
sed -i '' 's/^Example/#Example/' /opt/homebrew/etc/clamav/clamd.conf

# Add these lines to clamd.conf (or use the TCPSocket option below)
echo "TCPSocket 3310"           >> /opt/homebrew/etc/clamav/clamd.conf
echo "TCPAddr 127.0.0.1"        >> /opt/homebrew/etc/clamav/clamd.conf

# Update virus definitions (run once; takes a few minutes)
freshclam

# Start the clamd daemon
clamd

# Verify it's running
echo "Test scan:" && echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' | clamscan -
# Expected output: EICAR-Test-File FOUND
```

---

## Ubuntu / Debian

```bash
# Install ClamAV + daemon
sudo apt-get update
sudo apt-get install -y clamav clamav-daemon

# Stop the daemon while configuring
sudo systemctl stop clamav-daemon

# Update virus definitions
sudo freshclam

# Start daemon
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon

# Verify
sudo systemctl status clamav-daemon
```

---

## CentOS / RHEL / Amazon Linux

```bash
# Enable EPEL repository (required for clamav)
sudo amazon-linux-extras install epel     # Amazon Linux 2
# or:
sudo yum install epel-release             # CentOS/RHEL

# Install
sudo yum install -y clamav clamav-update clamav-server clamav-server-systemd

# Update definitions
sudo freshclam

# Copy and configure clamd
sudo cp /usr/share/clamav/template/clamd.conf /etc/clamd.d/scan.conf
# Edit /etc/clamd.d/scan.conf: comment out "Example", set TCPSocket 3310

# Start service
sudo systemctl start clamd@scan
sudo systemctl enable clamd@scan
```

---

## Docker (recommended for CI/CD)

```yaml
# docker-compose.yml addition
services:
  clamav:
    image: clamav/clamav:stable
    ports:
      - "3310:3310"
    volumes:
      - clamav_db:/var/lib/clamav
    environment:
      - CLAMAV_NO_FRESHCLAMD=false
    healthcheck:
      test: ["CMD", "clamdcheck.sh"]
      interval: 60s
      retries: 3

volumes:
  clamav_db:
```

Then in `server/.env`:
```
CLAMAV_HOST=clamav
CLAMAV_PORT=3310
```

---

## Environment Variables

Add these to `server/.env`:

```bash
# Set to false to force NoOpScanner in development (files won't be scanned)
CLAMAV_ENABLED=true

# clamd daemon address (TCP mode)
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310

# UNIX socket mode (faster; overrides HOST+PORT if set)
# CLAMAV_SOCKET=/var/run/clamav/clamd.ctl

# How long to wait for a scan result (milliseconds)
CLAMAV_TIMEOUT_MS=30000
```

---

## Verify Your Setup

### 1. Test the daemon is reachable
```bash
echo "PING" | nc 127.0.0.1 3310
# Expected: PONG
```

### 2. Test with the EICAR test file (safe, industry-standard test string)
```bash
# Create the EICAR test file
echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > /tmp/eicar.txt

# Scan it
clamscan /tmp/eicar.txt
# Expected: /tmp/eicar.txt: Eicar-Signature FOUND

# Clean up
rm /tmp/eicar.txt
```

### 3. Test via the API
```bash
# Upload the EICAR test string as a .js file — should be rejected with HTTP 400
curl -X POST http://localhost:8000/api/modules \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "artifact=@/tmp/eicar.js" \
  -F "title=@org/test" \
  -F "description=test" \
  -F "category=Other" \
  -F "technology=JavaScript" \
  -F "repositoryUrl=https://github.com/org/test"

# Expected response:
# {
#   "success": false,
#   "message": "Upload rejected: malware was detected in the submitted file.",
#   "threat": { "name": "Eicar-Signature", "riskScore": 60, "riskLevel": "high" },
#   "reportId": "..."
# }
```

---

## Keeping Definitions Up To Date

ClamAV signatures must be updated regularly to catch new threats.

```bash
# Run manually
freshclam

# Or set up a daily cron job
echo "0 3 * * * /usr/bin/freshclam --quiet" | crontab -
```

On systems with `clamav-freshclam.service`:
```bash
sudo systemctl enable clamav-freshclam
sudo systemctl start clamav-freshclam
```

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `connect ECONNREFUSED 127.0.0.1:3310` | clamd is not running. Run `clamd` or `sudo systemctl start clamav-daemon` |
| `freshclam: ERROR: Can't open /var/log/clamav/freshclam.log` | `sudo chown clamav /var/log/clamav/freshclam.log` |
| Scan times out | Increase `CLAMAV_TIMEOUT_MS` or check clamd CPU/memory under load |
| Definition database is old | Run `freshclam` to update |
| Server logs `NoOpScanner active` | ClamAV is not reachable. Check daemon status and `.env` config |

---

## How Scanning Integrates in This Project

```
POST /api/modules (with file upload)
         │
         ▼
   multer saves file to disk
         │
         ▼
   scanUpload middleware
         │
   ┌─────▼───────────────────────────────────┐
   │  securityPipeline.runUploadScan()        │
   │                                         │
   │  1. Create SecurityReport (running)     │
   │  2. extractForScan() → unzip if .zip    │
   │  3. getActiveScanner() → ClamAV|NoOp   │
   │  4. scanner.scanPath(extractedDir)      │
   │  5. cleanup temp files                  │
   │  6. Persist results + durationMs        │
   └─────┬───────────────────────────────────┘
         │
   passed?
         │
   NO ───► delete file + 400 + threat details
         │
   YES ──► next() → createModule → links report
```
