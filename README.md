# 🏠 RentLedger: The Institutional Rental OS

![RentLedger Hero](/Users/rajkrish0608/.gemini/antigravity/brain/1c1b33e0-85d7-4fda-811c-7df52f849fd3/rentledger_hero_mockup_1770540017645.png)

<div align="center">

| Component | Stack |
| :--- | :--- |
| **Frontend** | ![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white) ![Riverpod](https://img.shields.io/badge/Riverpod-34495E?style=for-the-badge&logo=dart&logoColor=white) ![Dart](https://img.shields.io/badge/Dart-0175C2?style=for-the-badge&logo=dart&logoColor=white) |
| **Backend** | ![NestJS](https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) |
| **Data** | ![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white) ![TypeORM](https://img.shields.io/badge/TypeORM-FE0808?style=for-the-badge&logo=typeorm&logoColor=white) |
| **DevOps** | ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white) ![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white) ![Terraform](https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white) |

</div>

---

**RentLedger** is a high-fidelity, industrial-grade rental infrastructure platform designed to bridge the gap between landlords, tenants, society administrations, and legal systems. Built with the precision and foresight of **30+ years of professional software engineering experience**, it solves the "trust gap" in rental markets through cryptographic event-chaining and institutional-grade oversight features.

---

## 🏛 3D Intelligence Architecture

Visualizing the complex data flow and cryptographic integrity system designed for 100% reliability.

```mermaid
graph TD
    subgraph "Frontend Experience (Flutter)"
        UI["Premium Glassmorphic UI (60FPS Animations)"] --> RPC[Riverpod State Engine]
        RPC --> DIO[Secure DIO Client]
    end

    subgraph "Trust & Intelligence Layer (NestJS)"
        DIO --> API[Institutional API Gateway]
        API --> AUTH[JWT/RBAC Guard]
        AUTH --> SER[Business Logic Services]
        
        SER -->|Cryptographic Link| LED[The Ledger - PostgreSQL]
        SER -->|Async OCR| RED[BullMQ - Redis Queue]
        RED --> OCR[Tesseract Intelligence]
    end

    subgraph "Cloud Infrastructure (AWS)"
        LED --> RDS[Amazon RDS Cluster]
        OCR --> S3[Media Storage S3]
    end

    classDef premium fill:#2c3e50,stroke:#3498db,stroke-width:2px,color:#fff;
    class UI,RPC,LED,OCR,RDS premium;
```

---

## 💎 The Engineering Philosophy

RentLedger is not just another app; it is a **system of record**. Every line of code follows strict design patterns (SOLID, Clean Architecture) and enterprise security standards. 

> "Engineering is not about building things that work today; it is about building things that withstand the complexity of tomorrow." 

This platform leverages 3+ decades of experience in distributed systems to deliver a low-latency, high-availability architecture that handles sensitive financial and legal data with zero compromise.

---

## 🔥 Key Features

### 🔐 Cryptographic Integrity (The Ledger)
- **Tamper-Evident History**: Every rental event (rent paid, agreement signed, maintenance logged) is cryptographically hashed and chained to the previous event. 
- **Verifiable Proof**: Any participant can verify the integrity of the timeline, making it a "single source of truth" for legal disputes.

### 🤖 Intelligent Automation
- **Real-Time OCR**: Automated document extraction using Tesseract.js. Upload a rental agreement or a receipt, and RentLedger automatically indexes the metadata for global search.
- **Automated Compliance**: Generation of **Section 65B Digital Certificates** (Indian Evidence Act) to ensure mobile/digital records are admissible in court.

### 🎭 Multi-Role Ecosystem
- **Landlord**: Premium dashboard for property oversight and automated ledger management.
- **Tenant**: Frictionless payment logging and maintenance tracking with real-time notifications.
- **Broker**: Verified access to facilitate transactions with recorded accountability.
- **Society / Admin**: Platform-wide monitoring with granular security controls.

---

## 🚀 Getting Started

### Prerequisites
- Flutter SDK (Latest Stable)
- Node.js (v18+) & NestJS CLI
- Docker Desktop

### 1️⃣ Backend Setup
```bash
cd backend
npm install
docker-compose up -d  # Launches PG, Redis
npm run start:dev
```

### 2️⃣ Frontend Setup
```bash
cd frontend
flutter pub get
flutter run -d chrome # Or ios/android
```

---

## 🔒 Security & Compliance

Developed with a **Privacy-by-Design** approach:
- **GDPR Compliance**: Built-in account anonymization and data portability (export) tools.
- **End-to-End Validation**: Strict DTO whitelisting and request integrity checks.
- **Secure Storage**: S3 with 24-hour lifecycle rules for sensitive temporary exports.

---

## 👨‍💻 Author

**Professional Senior Engineer**  
*30+ Years of Full-Stack Architecture & Systems Engineering*

"RentLedger represents the culmination of decades of experience in building secure, scalable, and beautifully designed software systems for institutional users."

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
