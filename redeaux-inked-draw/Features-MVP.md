## **Features (MVP)**

### **Refined User Onboarding & Profile Atelier**

Provides a sophisticated and secure entry point, encompassing seamless registration, stringent age verification, and an initial preference elicitation process. Profile creation allows for a detailed representation of the user's aficionado persona.

#### **Tech Involved**

* React Native, Expo, Supabase Auth, a dedicated Age Verification API (e.g., Veriff), NestJS, PostgreSQL.

#### **Main Requirements**

* Legally compliant and robust age verification is non-negotiable.  
* Secure storage of user credentials and personal data.  
* The initial taste preference setup must effectively seed the AI engine.

### **Curated Social Salon (Feed & Interaction)**

An elegant, real-time social feed for the exchange of insights. Users can create rich posts, tag items from an integrated database, and engage in thoughtful dialogue with a community of shared expertise.

#### **Tech Involved**

* React Native, Expo, NestJS, PostgreSQL, Supabase Realtime (WebSockets), Supabase Storage/AWS S3.

#### **Main Requirements**

* The feed must update in real-time as new posts and comments are made.  
* High-performance feed loading and smooth, jank-free scrolling are critical for the premium feel.  
* A scalable architecture to handle a high volume of content and interactions.

### **Connoisseur's Compendium (Offline-First)**

A meticulous digital repository for users to catalog their collections of cigars, beers, and wines with granular detail. This feature will be available offline, with data syncing seamlessly to the cloud when a connection is available.

#### **Tech Involved**

* React Native, Expo, **WatermelonDB** (local database), NestJS, PostgreSQL.

#### **Main Requirements**

* Users must be able to view and manage their collections without an internet connection.  
* A robust data synchronization strategy to handle conflicts and ensure data integrity between the local device and the server.  
* Highly structured and flexible database schema for diverse product details.

### **Third-Party Product Data Integration**

A backend service dedicated to ingesting, cleaning, and consolidating product data from various third-party APIs for cigars, beers, and wines. This provides a rich, verified database for users to tag in posts and add to their collections, minimizing manual entry.

#### **Tech Involved**

* NestJS (or a separate serverless function), PostgreSQL, BullMQ (for background job processing), various external product APIs.

#### **Main Requirements**

* An ETL (Extract, Transform, Load) pipeline to handle data from multiple sources.  
* A de-duplication and merging strategy to maintain a clean master product database.  
* The system must be resilient to external API failures or changes.

### **Content-Based AI Recommendation Engine**

An intelligent discovery engine offering personalized suggestions within a single product category. The algorithm will analyze the detailed attributes of items a user has rated highly (e.g., cigar wrapper, beer style, wine varietal) to provide sophisticated, relevant recommendations.

#### **Tech Involved**

* NestJS, PostgreSQL with **pgvector** (for vector similarity search), potentially a separate Python microservice for more complex model training.

#### **Main Requirements**

* The model must leverage detailed product attributes, not just user ratings.  
* Recommendations must be generated with low latency to be displayed seamlessly in the UI.  
* The architecture must be modular to allow for more advanced cross-category models in the future.

### **Proactive Content Moderation**

An automated system to proactively flag potentially inappropriate user-generated content (text and images). This ensures the community remains a safe and premium environment, supplemented by user reporting and admin review.

#### **Tech Involved**

* NestJS, **AWS Rekognition** (for image analysis), **AWS Comprehend** (for text analysis), BullMQ (for background processing).

#### **Main Requirements**

* The system must accurately flag content violating community guidelines.  
* A review queue and dashboard for human moderators to take action on flagged content.  
* The process must be efficient to prevent flagged content from remaining visible for long.

## **System Diagram**

Code snippet  
graph TD  
    subgraph "Client Layer (Offline-First)"  
        ClientApp\[React Native Mobile App w/ Expo\];  
        LocalDB\[WatermelonDB / Local Storage\];  
        ClientApp \-- Syncs \--\> LocalDB;  
    end

    subgraph "Edge & API Layer (AWS App Runner)"  
        API\[NestJS Backend API\];  
    end

    subgraph "Data & Real-time Layer (Supabase)"  
        DB\[(PostgreSQL Database w/ pgvector)\];  
        Auth\[Supabase Auth\];  
        Store\[Supabase Storage\];  
        Realtime\[Supabase Realtime\];  
    end

    subgraph "Third-Party Services"  
        AgeVerify\[Age Verification API\];  
        ProductDBs\[3rd Party Product DBs\];  
        ModerationAI\[AI Moderation Service \<br/\> e.g., AWS Rekognition\];  
        Posthog\[PostHog Analytics\];  
    end

    ClientApp \-- HTTP Requests \--\> API;  
    ClientApp \-- Real-time Subscriptions \--\> Realtime;

    API \-- CRUD Ops \--\> DB;  
    API \-- Auth Checks \--\> Auth;  
    API \-- File Ops \--\> Store;  
    API \-- Publishes Events \--\> Realtime;

    API \-- Verification Requests \--\> AgeVerify;  
    API \-- Ingests Data \--\> ProductDBs;  
    API \-- Moderation Requests \--\> ModerationAI;  
    API \-- Server Events \--\> Posthog;

    ClientApp \-- Client Events \--\> Posthog;

## **List of Technical/Architecture Consideration Questions**

1. **Data Consistency Model:** For inventory updates, what is the acceptable trade-off between strong and eventual consistency, especially considering future marketplace integrations?  
2. **Disaster Recovery:** What are the RPO (Recovery Point Objective) and RTO (Recovery Time Objective) for user collection data? How will backups be managed and tested?  
3. **Data Aggregation Strategy:** What is our strategy for merging and de-duplicating product data from multiple, potentially conflicting, third-party APIs?  
4. **Security & Compliance:** Beyond initial verification, what is the long-term strategy for data security, privacy by design (GDPR/CCPA), and regular security audits?  
5. **AI/ML Scalability:** How will the recommendation engine scale as data volume grows? What are the triggers and cost implications for moving from  
    `pgvector` to a more resource-intensive cloud AI platform?  
6. **Microservices Evolution:** At what point should we consider breaking out specific features (e.g., data ingestion, advanced analytics) into dedicated microservices versus maintaining a modular monolith in NestJS? 

### **1\. Data Consistency Model**

For the best UX, we must prioritize user trust. A user's collection is their most valuable asset in this app; it cannot be compromised.

**My Recommendation:** We will implement a **Strong Consistency model for all user-facing collection data.**

* **How it impacts UX:** When a user adds, updates, or removes an item from their collection, the operation will be confirmed as complete on the database *before* the UI shows a success message. This completely eliminates the risk of a user seeing a successful update only for the data to be lost due to a sync issue. For a premium app, this perception of reliability is non-negotiable.  
* **For secondary data** (like aggregated community ratings or feed updates from other users), we will use an **Eventual Consistency** model, leveraging the real-time capabilities of Supabase. This ensures the app feels fast and responsive without compromising the integrity of a user's personal data.

### **2\. Disaster Recovery (RPO/RTO)**

The UX of trust is built on the promise that a user's meticulously curated collection is safe, no matter what.

**My Recommendation:** We will target an aggressive recovery plan that treats user data as mission-critical.

* **Recovery Point Objective (RPO):** We will target a maximum data loss of **5 minutes**. We can achieve this by leveraging Supabase's Point-in-Time Recovery (PITR) feature, which is designed for this exact purpose.  
* **Recovery Time Objective (RTO):** We will target a maximum downtime of **1 hour**. This is achievable through a well-documented recovery playbook and using infrastructure-as-code to quickly redeploy our entire backend environment on AWS App Runner.  
* **Testing:** We will conduct and automate quarterly restoration drills in a staging environment to ensure our playbook is effective and our team is prepared.

### **3\. Data Aggregation Strategy**

The user experience must be one of authority and clarity. A user should never see duplicate products or conflicting information.

**My Recommendation:** We will create a **"Golden Record" system for all product data.**

* **Process:** Third-party data will first be ingested into a "raw" staging area. A background process will then normalize, de-duplicate, and merge this data into a single, clean "golden record" for each product.  
* **Conflict Resolution:** We will establish a data source hierarchy to automatically resolve most conflicts (e.g., trust Source A for cigar wrapper info, Source B for ABV). For complex conflicts the algorithm cannot solve, the items will be flagged for manual review through an internal admin tool.  
* **UX Impact:** The user will only ever interact with the clean, consolidated master product list. This makes searching, browsing, and adding items to their collection feel seamless and authoritative.

### **4\. Security & Compliance Strategy**

Security is not just a feature; it's a foundation of user trust. The UX should make users feel their data is protected and that they are in control.

**My Recommendation:** We will adopt a **"Privacy by Design"** approach.

* **Minimalism & Control:** We will only collect the data we absolutely need. Users will have access to a clear, simple privacy dashboard to control the visibility of their profile and collection.  
* **Proactive Audits:** We will engage third-party security firms for annual penetration tests and code audits after launch to proactively identify and fix vulnerabilities.  
* **Compliance from Day One:** We will build with GDPR and CCPA principles in mind from the start, ensuring we can service features like "Export My Data" and "Delete My Account" reliably and completely. Transparently offering these controls is a powerful UX trust signal.

### **5\. AI/ML Scalability**

The AI recommendations are a core feature; they must be fast, relevant, and feel intelligent. The quality must improve over time, not degrade.

**My Recommendation:** We will use a **phased, performance-triggered scaling strategy.**

* **Phase 1 (MVP):** We will start with **Postgres and the `pgvector` extension** on Supabase. This is incredibly powerful and cost-effective, allowing us to build the content-based recommendation engine and serve results with very low latency for our initial user base.  
* **Phase 2 (Scale):** The trigger to evolve will be data-driven. When recommendation latency consistently exceeds **500ms**, or when we are ready to implement the more complex cross-category pairing models, we will migrate.  
* **Migration Path:** We will deploy a dedicated Python-based microservice on AWS App Runner or SageMaker. This isolates the heavy ML processing from our main API, ensuring the rest of the app remains fast. This allows us to scale the AI's cost and complexity in lockstep with user growth and revenue.

### **6\. Microservices Evolution**

The app's architecture must support rapid feature development and maintain high performance. The UX goal is to ensure the app always feels snappy and reliable, even as we add complex features.

**My Recommendation:** We will begin with a **"Modular Monolith"** and strategically break out services as needed.

* **Starting Point:** Our NestJS application will be built with clean, well-defined modules (e.g., `collections`, `feed`, `users`). This is fast to develop and easy to manage initially.  
* **Trigger for Extraction:** We will break out a module into a separate microservice only when it develops unique scaling needs or requires a different tech stack.  
* **First Candidates:** The two most logical services to be extracted in the future are the **Third-Party Data Ingestion** pipeline and the **AI/ML Recommendation Engine**. Isolating these resource-intensive, non-user-facing tasks ensures the core user API remains fast and responsive at all times.

