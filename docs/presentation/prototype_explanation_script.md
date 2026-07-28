# 🎙️ FetalGuard AI — Prototype Demonstration Plan & Spoken Script

This document gives you a **step-by-step demo plan** and a **simple English spoken script** to present the **FetalGuard AI** prototype clearly and confidently to evaluators, professors, or clinicians.

---

## 📑 Part 1: Quick 5-Step Demo Plan

| Step | Screen / Module | Action to Show | Key Talking Point |
| :---: | :--- | :--- | :--- |
| **1** | **Live Telemetry Dashboard (`/`)** | Point out the continuous live scrolling FHR & UC graph, AI risk badge, and live alert toast with `X` button. | *"FetalGuard AI monitors continuous Fetal Heart Rate in real time and classifies risks instantly into Normal, Suspect, or Pathological."* |
| **2** | **OB-GYN Central Station (`/dashboard/central-station`)** | Show the 8 delivery room bed cards with green, yellow, and red color codes. | *"Nurses can monitor all active delivery beds concurrently from one single screen to catch emergencies immediately."* |
| **3** | **WHO Clinical Partogram (`/dashboard/partogram`)** | Show the WHO cervical dilation vs. fetal station descent progress chart. | *"We digitize the WHO Partogram to track labor progress against official alert and action boundary lines."* |
| **4** | **AI Model Lab & XAI Studio (`/dashboard/ai-lab`)** | Adjust a feature slider (STV / Baseline FHR) and show SHAP attribution + Llama-3.1 explanation. | *"Black-box AI is not enough for doctors. Our Llama-3.1 LLM converts model outputs into 3 simple FIGO-guided clinical sentences."* |
| **5** | **Clinical Reports & FHIR Export (`/dashboard/reports`)** | Click "Print PDF Report" and show the HL7 FHIR R4 JSON observation payload. | *"Our system seamlessly connects to hospital EHRs like Epic or Cerner using standard HL7 FHIR R4 medical data formats."* |

---

## 🗣️ Part 2: Word-for-Word Simple English Spoken Script

### 1. Introduction (30 Seconds)
> *"Good morning / afternoon, everyone.*
>
> *Today, I am excited to present **FetalGuard AI** — an Intelligent Real-Time Fetal Health Monitoring System.*
>
> *During labor and delivery, doctors use Cardiotocography, or CTG, to measure the baby's heart rate and maternal contractions. Manually reading paper traces is difficult and often leads to human error. Subtle signs of fetal distress like hypoxia or lack of oxygen can be missed.*
>
> *FetalGuard AI solves this problem by providing continuous, real-time AI risk assessment, automated alerts, and doctor-friendly explanations."*

---

### 2. Live Telemetry Dashboard Demonstration (1 Minute)
> *"Let us start with our **Real-Time Telemetry Dashboard**.*
>
> *Here on the main screen, you can see live streaming Fetal Heart Rate and Uterine Contractions. As data streams in through Apache Kafka, our **Hybrid CNN-BiLSTM Deep Learning model** analyzes spatial and temporal patterns across 19 clinical features.*
>
> *On the top right, if a baby shows signs of severe deceleration, a **Critical Alert Toast Notification** pops up instantly with an audible alarm. Clinicians can review the message or dismiss it using the **Close (X) Button**.*
>
> *Below the graph, the **Anomaly Radar** and **Class Probabilities** show the exact confidence score of the AI prediction."*

---

### 3. Ward Triage & WHO Partogram (45 Seconds)
> *"Next, let us look at the **OB-GYN Central Station**.*
>
> *In a busy delivery ward, a charge nurse cannot sit in front of one bed all day. Our Central Station gives a multi-bed grid view of all 8 labor rooms. Normal beds show in calm green, Suspect beds in amber yellow, and Pathological emergencies highlight in high-contrast red.*
>
> *When we open the **Clinical Partogram**, the system plots cervical dilation and fetal station descent against official WHO alert and action lines to prevent prolonged or obstructed labor."*

---

### 4. Explainable AI & Tabular GAN Synthesis (1 Minute)
> *"Now, why do doctors trust FetalGuard AI? Because of **Explainable AI (XAI)**.*
>
> *In the **AI Model Lab**, we don't just give a random number. We use **SHAP feature attributions** to show which exact parameter—such as Short-Term Variability or Late Decelerations—caused the risk level.*
>
> *Furthermore, we pass these feature attributions to **Llama 3.1 LLM via Groq API**, which generates a 3-sentence clinical report written strictly according to **FIGO international guidelines**.*
>
> *To train our model accurately, we also built a **Tabular GAN (Generative Adversarial Network)** in our **GAN Synthesis Studio**. This synthetic generator creates realistic CTG data for rare pathological cases, solving severe dataset class imbalance."*

---

### 5. Hospital EHR Interoperability & Conclusion (30 Seconds)
> *"Finally, in our **Clinical Reports & FHIR Export** section, clinicians can generate a print-ready PDF diagnostic report with one click.*
>
> *More importantly, FetalGuard AI natively exports patient observations into **HL7 FHIR R4 JSON format**, allowing seamless integration into hospital EHR systems like Epic or Cerner.*
>
> *In conclusion, FetalGuard AI brings together **Deep Learning, Generative AI, Explainable AI, and Medical Data Standards** to protect fetal life and support obstetric teams when seconds count.*
>
> *Thank you! I am now happy to answer any questions."*

---

## ❓ Part 3: Quick Viva / Evaluator Q&A Cheat Sheet

#### Q1: Why did you use a hybrid CNN-BiLSTM model instead of simple Random Forest?
> **Simple Answer:** *"Random Forest treats each record as a static snapshot. But fetal heart rate is continuous time-series data. The **1D-CNN** extracts spatial features from CTG signals, while the **Bidirectional LSTM** remembers temporal trends in both past and future time steps. This improved our accuracy from **86.4% to 95.8%** and pathological recall to **96.1%**."*

#### Q2: How does the Tabular GAN help the system?
> **Simple Answer:** *"In medical datasets, 78% of CTG cases are Normal, while Pathological cases are less than 8%. This extreme class imbalance makes standard models miss high-risk babies. Our **Tabular GAN** generates realistic synthetic CTG data vectors for minority risk classes, training a far more balanced and sensitive classifier."*

#### Q3: How do you handle patient data privacy (HIPAA / GDPR)?
> **Simple Answer:** *"To maintain strict privacy, no Patient Identifiable Information (PII) is ever sent to external LLMs or cloud AI models. Telemetry data is stripped of personal details and identified only by anonymized Medical Record Numbers (MRNs). Clinician authentication is secured using **Bcrypt password hashing and JWT tokens**."*

#### Q4: What medical data standards does FetalGuard AI support?
> **Simple Answer:** *"FetalGuard AI supports **HL7 FHIR R4 (Fast Healthcare Interoperability Resources)** with standard **LOINC codes** (like LOINC 73812-0 for Baseline FHR). This allows instant synchronization with hospital electronic health record systems."*
