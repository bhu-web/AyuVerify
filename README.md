# AyuVerify 🌿

**Cryptographically Secured, Offline-First Herbal Supply Chain Traceability System**

AyuVerify is an end-to-end provenance platform designed to safeguard the integrity of Ayurvedic herbs and products. Operating across rural and low-connectivity environments, the platform enables field stakeholders — from smallholder farmers to pharmaceutical manufacturers — to log cryptographically signed supply chain events that can be verified instantly by consumers via QR code scanning.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Features Implemented](#core-features-implemented)
  - [1. Shared Cryptographic Engine](#1-shared-cryptographic-engine-packagesshared-crypto)
  - [2. Backend Service & Ingestion API](#2-backend-service--ingestion-api-appsbackend)
  - [3. Mobile Offline Queue & Sync Engine](#3-mobile-offline-queue--sync-engine-appsmobile)
  - [4. End-to-End System Validation](#4-end-to-end-system-validation-appsbackendsrce2e-testjs)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Future Roadmap & Work to Be Done](#future-roadmap--work-to-be-done)
  - [Priority 1: High Priority](#priority-1-high-priority-core-interfaces--client-applications)
  - [Priority 2: Medium Priority](#priority-2-medium-priority-data-quality--verification)
  - [Priority 3: Low Priority](#priority-3-low-priority-enhancements--deployment)

---

## Architecture Overview

AyuVerify uses a multi-tier workspace architecture to enforce strict separation of cryptographic primitives, backend ingestion pipelines, and offline-first mobile operations.

```
┌──────────────────────────────────────────────────────────────────┐
│                    @ayuverify/shared-crypto                      │
│     (Ed25519 Signing, Canonical JSON Hashing, Base64 Encoding)   │
└──────────────────────────────────────────────┬───────────────────┘
                                                │
                    ┌───────────────────────────┴───────────────────────┐
                    ▼                                                   ▼
┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│             @ayuverify/backend               │ │              @ayuverify/mobile               │
│  (Express, SQLite, Signature Verification,    │ │  (React Native / Expo, Local SQLite Queue,    │
│   Auth, REST APIs, HTML Public Scanner)       │ │   Offline Sync Manager, Event Capturer)       │
└──────────────────────────────────────────────┘ └──────────────────────────────────────────────┘
```

---

## Core Features Implemented

### 1. Shared Cryptographic Engine (`packages/shared-crypto`)

- **Asymmetric Key Provisioning** — Ed25519 key pair generation via `libsodium-wrappers`.
- **Canonical JSON Deterministic Hashing** — Hash generation using SHA-256 with key sorting to ensure invariant byte representations across platforms.
- **Detached Digital Signatures** — Asymmetric signing and verification of payload hashes to prevent record tampering.

### 2. Backend Service & Ingestion API (`apps/backend`)

- **Relational Schema (SQLite)** — Schema enforcing referential integrity for users, batches, and `event_records`.
- **Stakeholder Auth & Identity** — Registration endpoints storing public keys alongside user profiles, coupled with JWT session management.
- **Signature Verification Middleware** — Middleware that intercepts event submissions, retrieves the actor's registered public key, and validates the cryptographic signature prior to database write.
- **Public QR Verification Service** — REST endpoint (`/api/v1/batches/verify/:batchId`) and rendered HTML web view (`/verify/:batchId`) that re-verifies all historical signatures across the supply chain timeline.

### 3. Mobile Offline Queue & Sync Engine (`apps/mobile`)

- **Local SQLite Store** — Device-level event queue (`pending_events`) built on `expo-sqlite` for offline data capture.
- **Unified Event Capturer** — Client utility executing payload construction, canonical hashing, asymmetric signing, and local queueing in a single step.
- **Sequential Offline Sync Manager** — Background sync engine that uploads queued events to the central backend in batch order once connectivity is restored.

### 4. End-to-End System Validation (`apps/backend/src/e2e-test.js`)

- Complete automated simulation script verifying all 4 primary supply chain stages (**Collection → Processing → QC Testing → Packaging**) and asserting overall chain authenticity.

---

## Project Structure

```
AyuVerify/
├── packages/
│   └── shared-crypto/          # Cryptographic hashing & signing primitives
│       ├── src/index.js        # Core libsodium export methods
│       └── package.json
├── apps/
│   ├── backend/                # Primary REST API & Verification Server
│   │   ├── src/
│   │   │   ├── config/db.js    # SQLite database schema initialization
│   │   │   ├── middlewares/    # Cryptographic signature validation
│   │   │   ├── routes/         # Auth, Batches, & Public Web routes
│   │   │   ├── utils/          # QR payload generation
│   │   │   ├── e2e-test.js     # End-to-end integration test runner
│   │   │   └── server.js       # Express application entry point
│   │   └── package.json
│   └── mobile/                 # React Native / Expo Mobile Application
│       ├── src/
│       │   ├── api/            # Synchronization manager
│       │   ├── crypto/         # Offline event capture wrapper
│       │   ├── database/       # Local SQLite queue management
│       │   └── screens/        # Stakeholder dashboard views
│       └── package.json
├── package.json                # Workspace configuration
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js**: v20.x or higher
- **NPM**: v10.x or higher
- **Git**

### Installation

**1. Clone the repository:**

```bash
git clone https://github.com/bhu-web/AyuVerify.git
cd AyuVerify
```

**2. Install workspace dependencies:**

```bash
# Install backend dependencies
cd apps/backend
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

### Running the Application

**Start the backend server:**

```bash
cd apps/backend
node src/server.js
```

Server runs at: `http://localhost:5000`

**Run the end-to-end simulation test:**

```bash
cd apps/backend
node src/e2e-test.js
```

Outputs a live verification URL (e.g., `http://localhost:5000/verify/BATCH-2026-ASHWA-...`)

**Inspect the consumer verification page:**

Open the generated URL in any web browser to view the interactive provenance timeline.

---

## Future Roadmap & Work to Be Done

Work is ordered by priority for upcoming development sprints.

### Priority 1: High Priority (Core Interfaces & Client Applications)

- **Dedicated Web Frontend Application (React / Next.js)**
  - **Enterprise Stakeholder Dashboard** — Web portal for Processors and Manufacturers to perform bulk batch logging, certificate uploads, and batch-splitting workflows.
  - **Regulatory & Auditor Portal** — Compliance interface for government regulators to audit batch lineages, inspect flagged anomalies, and bulk-verify cryptographic signatures across regions.
  - **Enhanced Consumer Verification Web Portal** — Polished, interactive consumer landing page for QR code scans featuring interactive supply chain maps, farmer profiles, and downloadable Certificates of Analysis (CoAs).
- **Mobile Stakeholder UI Forms (React Native)** — Build specialized role-based UI screens for field stakeholders (Farmer, Processor, QC Testing Lab, Manufacturer).
- **Camera & Barcode Scanner Integration** — Integrate native barcode and QR scanning (`expo-camera`) into the mobile app to scan physical batch containers directly.
- **Secure On-Device Key Storage** — Migrate key pair storage to Expo SecureStore / React Native Keychain to secure private keys at rest.

### Priority 2: Medium Priority (Data Quality & Verification)

- **Quality Anomaly Detection Engine** — Add backend validation rules / threshold checks to automatically flag out-of-range quality parameters (e.g., excessive moisture, failed heavy metal tests) or suspicious timestamps.
- **Role-Based Access Control (RBAC)** — Restrict event ingestion endpoints so users can only submit events corresponding to their authorized role (e.g., prevent Farmers from logging Packaging events).

### Priority 3: Low Priority (Enhancements & Deployment)

- **Dynamic QR Code Rendering** — Generate downloadable SVG/PNG QR codes on the backend during the packaging stage for physical printing on product labels.
- **Cloud Database Migration** — Add support for PostgreSQL or AWS RDS for production environments while retaining SQLite for local development.
- **Automated CI/CD Pipeline** — Configure GitHub Actions for running integration tests on pull requests.