# AyuVerify 🌿

**Cryptographically Secured, Offline-First Herbal Supply Chain Traceability System**

AyuVerify is an end-to-end provenance platform designed to safeguard the integrity of Ayurvedic herbs and products. Operating across rural and low-connectivity environments, the platform enables field stakeholders—from smallholder farmers to pharmaceutical manufacturers—to log cryptographically signed supply chain events that can be verified instantly by consumers via QR code scanning.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Features Implemented](#core-features-implemented)
  - [1. Shared Cryptographic Engine](#1-shared-cryptographic-engine-packagesshared-crypto)
  - [2. Backend Service & Ingestion API](#2-backend-service--ingestion-api-appsbackend)
  - [3. Enterprise Stakeholder & Consumer Web Portal](#3-enterprise-stakeholder--consumer-web-portal-appsweb)
  - [4. Offline-First Mobile Application](#4-offline-first-mobile-application-appsmobile)
  - [5. End-to-End System Validation](#5-end-to-end-system-validation-appsbackendsrce2e-testjs)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the System](#running-the-system)
- [Future Roadmap](#future-roadmap)
  - [Priority 1: High Priority](#priority-1-high-priority-data-quality--key-security)
  - [Priority 2: Medium Priority](#priority-2-medium-priority-access-control--qr-generation)
  - [Priority 3: Low Priority](#priority-3-low-priority-infrastructure--deployment)

---

## Architecture Overview

AyuVerify uses a multi-tier monorepo architecture to enforce strict separation of cryptographic primitives, backend ingestion pipelines, desktop enterprise dashboards, and offline-first mobile operations.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           @ayuverify/shared-crypto                              │
│            (Ed25519 Signing, Canonical JSON Hashing, Base64 Encoding)           │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                          │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│   @ayuverify/backend    │  │     @ayuverify/web      │  │    @ayuverify/mobile    │
│ (Express, SQLite, Auth, │  │   (Next.js 15, Tailwind │  │  (React Native / Expo,  │
│ Verification & Ingest)  │  │   Dashboards & Scanner) │  │  Camera & Local SQLite) │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
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
- **Public Batch Verification Service** — REST endpoint (`/api/v1/batches/verify/:batchId`) that re-verifies all historical signatures across the supply chain timeline.

### 3. Enterprise Stakeholder & Consumer Web Portal (`apps/web`)

- **Consumer QR Verification Page** (`/verify/[batchId]`) — Polished, interactive landing page displaying overall chain authenticity status, verified stage timelines, and embedded raw crop photo proofs.
- **Quality Control Laboratory Portal** (`/dashboard/qc`) — Specialized web form for uploading purity percentages, heavy metal test parameters, and signed lab certificates.
- **Processing Plant Dashboard** (`/dashboard/processor`) — Event submission portal for logging extraction methods, yield weights, and moisture metrics.
- **Pharmaceutical Manufacturing Portal** (`/dashboard/manufacturer`) — Packaging interface for assigning packaging types, batch size specifications, and expiry parameters.

### 4. Offline-First Mobile Application (`apps/mobile`)

- **Local SQLite Event Queue** — Device-level store (`pending_events`) built on `expo-sqlite` for rural, low-connectivity data capture.
- **Raw Herb Camera Proof** — Integrated camera module (`expo-camera`) enabling farmers to capture, preview, and attach high-resolution crop photos to harvest records.
- **Sequential Offline Sync Manager** — Background sync engine that uploads queued events to the central backend in batch order once network connectivity is restored.

### 5. End-to-End System Validation (`apps/backend/src/e2e-test.js`)

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
│   ├── backend/                # Express REST API & SQLite Database
│   │   ├── src/
│   │   │   ├── config/db.js    # Database schema definition
│   │   │   ├── middlewares/    # Cryptographic signature validation
│   │   │   ├── routes/         # Auth, Batches, & Ingestion API
│   │   │   ├── e2e-test.js     # End-to-end integration test script
│   │   │   └── server.js       # Backend entry point
│   │   └── package.json
│   ├── web/                    # Next.js 15 Web Application
│   │   ├── src/app/
│   │   │   ├── verify/[batchId]/ # Public consumer QR verification page
│   │   │   └── dashboard/      # Role-based portals (QC, Processor, Manufacturer)
│   │   └── package.json
│   └── mobile/                 # React Native / Expo Mobile Application
│       ├── src/
│       │   ├── components/     # CameraModal & UI utilities
│       │   ├── database/       # Local SQLite queue management
│       │   └── screens/        # Farmer collection & sync portal
│       └── package.json
├── package.json                # Root workspace configuration
└── README.md
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | v20.x or higher |
| NPM | v10.x or higher |
| Expo Go App | Installed on a physical mobile device (for mobile testing) |

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/bhu-web/AyuVerify.git
cd AyuVerify
```

**2. Install workspace dependencies**

```bash
# Install backend
cd apps/backend && npm install

# Install web frontend
cd ../web && npm install --legacy-peer-deps

# Install mobile app
cd ../mobile && npm install --legacy-peer-deps
```

### Running the System

**Start Backend Server**

```bash
cd apps/backend
node src/server.js
```
Runs at: `http://localhost:5000`

**Start Next.js Web Application**

```bash
cd apps/web
npm run dev
```
Runs at: `http://localhost:3000`

**Start Mobile Expo App**

```bash
cd apps/mobile
npx expo start -c
```
Scan the terminal QR code with Expo Go to open the Farmer portal.

**Run End-to-End Simulation Test**

```bash
cd apps/backend
node src/e2e-test.js
```

---

## Future Roadmap

Work is ordered by priority for upcoming development sprints.

### Priority 1: High Priority (Data Quality & Key Security)

- **Quality Anomaly Detection Engine** (`apps/backend`) — Finalize server-side validation rules to flag out-of-range quality parameters (excessive moisture, failed heavy metal tests, low purity levels) and display warning alerts on public verification pages.
- **Secure On-Device Key Storage** (`apps/mobile`) — Migrate mobile Ed25519 key storage to Expo SecureStore / React Native Keychain to secure private keys at rest.

### Priority 2: Medium Priority (Access Control & QR Generation)

- **Role-Based Access Control (RBAC)** — Restrict API ingestion endpoints so users can only submit events corresponding to their authorized role.
- **Dynamic QR Code Generator Service** — Generate downloadable SVG/PNG QR code labels directly from the backend during packaging for physical printing.

### Priority 3: Low Priority (Infrastructure & Deployment)

- **Production Database Migration** — Add support for PostgreSQL or AWS RDS for cloud environments while retaining SQLite for local development.
- **Automated CI/CD Pipeline** — Configure GitHub Actions for running end-to-end integration tests on pull requests.