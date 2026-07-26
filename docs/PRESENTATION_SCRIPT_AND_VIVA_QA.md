# 🎙️ FetalGuard AI — Easy Presentation Script & Viva Q&A

This document contains:
1. **19-Slide Presentation Script in Simple English** (Word-for-word, clear, easy-to-speak presentation script matching `MTechPro_Fixed.pptx` slide-by-slide).
2. **Exhaustive Viva Voce Q&A** (25 technical questions with simple, accurate answers categorized into 6 domains).

---

# 📖 PART 1: 19-SLIDE PRESENTATION SCRIPT (SIMPLE & DETAILED)

---

### 🟢 Slide 1: Title Slide
* **Slide Header:** FETAL HEALTH MONITORING AND DISEASE DETECTION SYSTEM USING GENERATIVE AI
* **Time:** 30 Seconds
* **What to Say (Simple & Clear):**
  > *"Respected teachers and panel members, good morning. 
  > 
  > Today, I am presenting my M.Tech project titled **'Fetal Health Monitoring and Disease Detection System Using Generative AI'**, which we call **FetalGuard AI**.
  > 
  > The goal of this project is to build a real-time computer system that helps doctors monitor baby health during pregnancy and labor using artificial intelligence."*
* 💡 **Pro Tip:** Smile, maintain eye contact with the panel, and introduce the topic clearly.

---

### 🟢 Slide 2: INTRODUCTION
* **Slide Header:** INTRODUCTION
* **Time:** 30 Seconds
* **What to Say (Simple & Clear):**
  > *"Monitoring the health of an unborn baby is very important during pregnancy and childbirth.
  > 
  > In hospitals, doctors use a machine called Cardiotocography, or CTG. This machine records two things: the baby's heart rate and the mother's uterine contractions.
  > 
  > Our project uses artificial intelligence to continuously read these signals and give instant safety warnings to doctors if any problem is detected."*

---

### 🟢 Slide 3: BACKGROUND
* **Slide Header:** BACKGROUND
* **Time:** 30 Seconds
* **What to Say (Simple & Clear):**
  > *"Currently, doctors look at paper graphs or digital screens to read the baby's heart rate by hand.
  > 
  > However, reading these graphs manually is difficult because different doctors often interpret the same graph in different ways.
  > 
  > Also, in busy hospital labor wards, doctors get tired during long night shifts. This increases the risk of missing early signs of danger."*

---

### 🟢 Slide 4: ROLE OF AI IN HEALTHCARE
* **Slide Header:** ROLE OF AI IN HEALTHCARE
* **Time:** 30 Seconds
* **What to Say (Simple & Clear):**
  > *"Artificial Intelligence is now playing a major role in modern healthcare.
  > 
  > AI can process complex medical signals very fast without getting tired. It can spot small hidden patterns in heart rate data that a human eye might miss.
  > 
  > By using AI, we can reduce medical errors and give fast warnings to doctors when a patient needs urgent care."*

---

### 🟢 Slide 5: ROLE OF AI IN FETAL HEALTH MONITORING
* **Slide Header:** ROLE OF AI IN FETAL HEALTH MONITORING
* **Time:** 40 Seconds
* **What to Say (Simple & Clear):**
  > *"In our project, we use three powerful types of Artificial Intelligence:
  > 
  > 1. **Deep Learning (CNN and LSTM):** This learns heart rate patterns over time to classify whether the baby is safe or in danger.
  > 2. **Generative AI (GANs):** This generates artificial data samples for rare medical emergency cases so the AI can train better.
  > 3. **Large Language Models (LLMs):** This translates complex AI numbers into simple, 3-sentence English notes for doctors."*

---

### 🟢 Slide 6: KEY CHALLENGES IN EXISTING SYSTEMS
* **Slide Header:** KEY CHALLENGES IN EXISTING SYSTEMS
* **Time:** 45 Seconds
* **What to Say (Simple & Clear):**
  > *"Existing hospital systems face four main problems:
  > 
  > * **Problem 1: Manual Reading:** Up to 30% of doctors disagree on the same heart rate graph.
  > * **Problem 2: Delayed Warnings:** Traditional methods can take too long to detect low oxygen levels in the baby.
  > * **Problem 3: Black-Box AI:** Older AI systems give numbers like '85%' without explaining *why*.
  > * **Problem 4: Data Imbalance:** Over 80% of real patient records are normal. There are very few danger records, making AI models biased toward guessing 'Normal'."*

---

### 🟢 Slide 7: PROPOSED APPROACH
* **Slide Header:** PROPOSED APPROACH
* **Time:** 40 Seconds
* **What to Say (Simple & Clear):**
  > *"To solve these four problems, our proposed system combines four smart solutions:
  > 
  > * First, we bring together medical data from three international databases: Kaggle, UCI, and PhysioNet.
  > * Second, we use a **Hybrid CNN-LSTM Deep Learning model** to catch sequence patterns.
  > * Third, we use a **Generative AI (GAN)** to create synthetic danger cases and fix data imbalance.
  > * Fourth, we use **Llama-3.1 LLM Explainable AI** to write clear medical notes for doctors."*

---

### 🟢 Slide 8: BENEFITS OF PROPOSED SYSTEM
* **Slide Header:** BENEFITS OF PROPOSED SYSTEM
* **Time:** 30 Seconds
* **What to Say (Simple & Clear):**
  > *"The main benefits of our FetalGuard AI system are:
  > 
  > * **Early Danger Detection:** It detects low oxygen levels quickly to protect the baby.
  > * **High Accuracy:** Our model reaches **95.8% accuracy** and **96.1% recall on danger cases**.
  > * **Reduced Human Error:** It works 24/7 without getting tired.
  > * **Clear Explanations:** It explains its reasoning in simple English notes using medical standards."*

---

### 🟢 Slide 9: PROBLEM STATEMENT
* **Slide Header:** PROBLEM STATEMENT
* **Time:** 45 Seconds
* **What to Say (Simple & Clear):**
  > *"To state our problem clearly: Hospitals need a fast, accurate, and easy-to-understand AI system for baby health monitoring.
  > 
  > Our system solves this by addressing five key requirements:
  > * It reads complex heart rate variations.
  > * It sends live warnings to doctors in less than 2 milliseconds.
  > * It reduces diagnostic errors.
  > * It solves data scarcity using Generative AI.
  > * And most importantly, it protects baby safety during childbirth."*

---

### 🟢 Slide 10: OBJECTIVES
* **Slide Header:** OBJECTIVES
* **Time:** 35 Seconds
* **What to Say (Simple & Clear):**
  > *"The main objectives of this project are:
  > 
  > 1. Design a real-time baby health monitoring system.
  > 2. Build a Hybrid CNN-LSTM Deep Learning model for accurate risk prediction.
  > 3. Build a Generative AI model (GAN) to create synthetic training data.
  > 4. Use Large Language Models to generate clear clinical reports.
  > 5. Make the data compatible with international hospital standards like HL7 FHIR R4."*

---

### 🟢 Slide 11: METHODOLOGY
* **Slide Header:** METHODOLOGY
* **Time:** 45 Seconds
* **What to Say (Simple & Clear):**
  > *"Our system works in three step-by-step stages:
  > 
  > * **Stage 1 (Data Preparation):** We clean the heart rate data and extract 19 key medical features like baseline heart rate, accelerations, decelerations, and variability.
  > * **Stage 2 (Model Training):** We train our CNN-LSTM model to classify cases into **Normal, Suspect, or Pathological**, while the GAN generates extra synthetic danger data.
  > * **Stage 3 (Real-Time Display):** The AI outputs predictions to a live Next.js web dashboard with automated English summaries."*

---

### 🟢 Slide 12: KEY COMPONENTS (Overview)
* **Slide Header:** KEY COMPONENTS
* **Time:** 15 Seconds
* **What to Say (Simple & Clear):**
  > *"Now, let us look at the main technical components that make up the system architecture."*

---

### 🟢 Slide 13: KEY COMPONENTS — Part 1 (Data, Preprocessing & Prediction)
* **Slide Header:** KEY COMPONENTS — Data Acquisition, Preprocessing & Deep Learning
* **Time:** 45 Seconds
* **What to Say (Simple & Clear):**
  > *"Here are the first three technical components:
  > 
  > * **Component 1 (Data Acquisition):** Collects raw signals from PhysioNet 4Hz datasets, UCI, Kaggle, or live sensor bridges.
  > * **Component 2 (Signal Processing):** Uses signal algorithms (`scipy.signal`) to measure baseline heart rate, accelerations, decelerations, and heart rate variability.
  > * **Component 3 (Deep Learning Prediction):** The CNN-LSTM model processes the 19 features in under 2 milliseconds and classifies the risk level into Normal, Suspect, or Pathological."*

---

### 🟢 Slide 14: KEY COMPONENTS — Part 2 (GAN, XAI & Reporting)
* **Slide Header:** KEY COMPONENTS — Generative AI, Explainable AI & Clinical Reporting
* **Time:** 45 Seconds
* **What to Say (Simple & Clear):**
  > *"Here are the remaining three technical components:
  > 
  > * **Component 4 (Generative AI Module):** A Tabular GAN creates synthetic danger samples to balance our training data.
  > * **Component 5 (Explainable AI):** Llama-3.1 via Groq reads the prediction numbers and writes a 3-sentence summary in plain English.
  > * **Component 6 (Live Web Dashboard & Alerts):** Next.js dashboard receives live data via WebSockets and formats data into standard HL7 FHIR R4 medical files."*

---

### 🟢 Slide 15: PRACTICAL APPLICATIONS
* **Slide Header:** PRACTICAL APPLICATIONS
* **Time:** 35 Seconds
* **What to Say (Simple & Clear):**
  > *"Our project can be used in four practical real-world scenarios:
  > 
  > 1. **Hospital Delivery Rooms:** Acts as a 24/7 assistant for doctors during labor.
  > 2. **Early Emergency Warnings:** Color-codes delivery beds (Green, Yellow, Red) for instant triage.
  > 3. **Rural Healthcare Support:** Helps small clinics without specialist doctors get instant AI advice.
  > 4. **Medical Training & Research:** Synthetic GAN data can be used to train medical students without exposing real patient records."*

---

### 🟢 Slide 16: RESULTS
* **Slide Header:** RESULTS
* **Time:** 45 Seconds
* **What to Say (Simple & Clear):**
  > *"Our test results show outstanding performance across 2,127 patient records:
  > 
  > * **High Accuracy:** Our CNN-LSTM model reached **95.8% Overall Accuracy** and **96.1% Recall on Pathological danger cases**. In comparison, traditional Random Forest only scored 86.4%.
  > * **Super-Fast Speed:** The AI makes predictions in **less than 2 milliseconds**.
  > * **Balanced Training:** The GAN successfully eliminated model bias.
  > * **Clear Summaries:** 100% of predictions generated clear 3-sentence medical notes."*

---

### 🟢 Slide 17: CONCLUSION
* **Slide Header:** CONCLUSION
* **Time:** 30 Seconds
* **What to Say (Simple & Clear):**
  > *"In conclusion, FetalGuard AI successfully combines Deep Learning, Generative AI, and Explainable LLMs into one complete system.
  > 
  > The CNN-LSTM detects heart rate risk accurately, the GAN fixes data imbalance, and Llama-3.1 provides easy-to-read explanations. This system helps doctors save time and protects baby safety during birth."*

---

### 🟢 Slide 18: FUTURE WORK
* **Slide Header:** FUTURE WORK
* **Time:** 35 Seconds
* **What to Say (Simple & Clear):**
  > *"In the future, we plan to extend this project by:
  > 
  > * Deploying the system to cloud servers on Railway and Vercel.
  > * Putting the AI model onto small bedside hardware chips like Raspberry Pi.
  > * Using Federated Learning so different hospitals can share knowledge safely.
  > * Adding multi-lingual voice alerts for nurses in delivery rooms."*

---

### 🟢 Slide 19: Thank You
* **Slide Header:** Thank You
* **Time:** 15 Seconds
* **What to Say (Simple & Clear):**
  > *"Thank you very much, respected panel members, for your time and attention. I am now ready to answer your questions."*

---

# ❓ PART 2: EXHAUSTIVE SUBMISSION & VIVA Q&A (25 QUESTIONS)

---

### 📌 Section A: Medical Domain & Clinical Questions

#### Q1: What is Cardiotocography (CTG) and what physiological parameters does it monitor?
> **Answer:** Cardiotocography (CTG) is a continuous intrapartum monitoring technique that simultaneously records two signals:
> 1. **Fetal Heart Rate (FHR):** Measured in beats per minute (bpm) via an ultrasound transducer placed on the mother's abdomen.
> 2. **Uterine Contractions (UC):** Measured in relative pressure units via a tocodynamometer (toco transducer).
> 
> By analyzing the temporal synchronization between uterine contractions and Fetal Heart Rate baseline drops, clinicians detect fetal hypoxia, cord compression, and placental insufficiency.

#### Q2: What are the specific FIGO guidelines for classifying CTG risk levels?
> **Answer:** According to International Federation of Gynecology and Obstetrics (FIGO) standards:
> * **Normal:** Baseline FHR between $110{-}160\text{ bpm}$, short/long term variability between $5{-}25\text{ bpm}$, presence of accelerations ($\ge 15\text{ bpm}$ for $\ge 15\text{ s}$), and absence of decelerations.
> * **Suspect:** Absence of accelerations, borderline baseline ($100{-}110\text{ bpm}$ or $160{-}180\text{ bpm}$), or reduced variability ($<5\text{ bpm}$ for $30{-}50\text{ min}$).
> * **Pathological:** Baseline FHR $<100\text{ bpm}$, severe variability reduction ($<5\text{ bpm}$ for $>50\text{ min}$), or presence of repetitive late/prolonged decelerations.

#### Q3: What is the clinical difference between Early, Late, and Variable Decelerations?
> **Answer:**
> * **Early Decelerations:** Symmetrical dips in FHR that mirror uterine contractions. Caused by fetal head compression during labor; usually benign.
> * **Late Decelerations:** Dips in FHR where the lowest point (trough) occurs *after* the peak of a contraction. Indicates **uteroplacental insufficiency** and fetal hypoxia (pathological).
> * **Variable Decelerations:** Abrupt drops in FHR of varying shape and timing relative to contractions. Caused by **umbilical cord compression**.

#### Q4: Why is Pathological Recall the single most critical metric in this medical domain?
> **Answer:** In medical diagnostic systems, a **False Negative** (classifying an endangered, pathological fetus as Normal) can result in fetal death, permanent brain damage, or cerebral palsy. A **False Positive** merely results in extra monitoring. Therefore, maximizing **Pathological Recall** ($96.1\%$) ensures that virtually zero distressed fetuses go undetected.

---

### 📌 Section B: System Architecture & Software Engineering

#### Q5: Explain the architectural benefits of an Event-Driven Microservices topology using Apache Kafka.
> **Answer:** An event-driven architecture provides:
> 1. **Ultra-Low Latency Streaming:** High-throughput ingestion of continuous 4Hz telemetry arrays without database write-bottlenecks.
> 2. **Fault Tolerance & Decoupling:** If the patient database service or frontend goes down, Kafka buffers incoming sensor telemetry on `ctg-raw-stream` without dropping a single data point.
> 3. **Horizontal Scalability:** Independent stream processing workers can scale horizontally to monitor hundreds of delivery room beds concurrently.

#### Q6: How does the Faust stream processor work with Kafka topics?
> **Answer:** Faust is a Python stream-processing library built specifically for Kafka. It reads raw signal arrays from the `ctg-raw-stream` topic, executes real-time sliding-window feature extraction, and publishes the standardized 19-feature vector onto `ctg-processed` for model consumption.

#### Q7: Describe the security architecture of the Patient Service.
> **Answer:** 
> * **Authentication:** Passwords are encrypted using **Bcrypt** (`bcrypt.hashpw` with individual salts and cost factor 12).
> * **Authorization:** Stateless **HMAC-SHA256 (HS256) JSON Web Tokens (JWT)** issue access tokens ($24\text{ hrs}$) and refresh tokens ($7\text{ days}$).
> * **Database Access:** Asynchronous MongoDB driver (`motor`) connects to MongoDB Atlas using TLS encryption and environment-configured URI strings.

#### Q8: How does the Next.js 15 dashboard achieve real-time streaming without server lag?
> **Answer:** Next.js 15 utilizes React Server Components for initial static layout rendering, while interactive client components establish a persistent **Socket.IO WebSocket** connection. Live telemetry updates bypass standard HTTP polling overhead, rendering 60-FPS continuous FHR charts via Recharts.

---

### 📌 Section C: Machine Learning & Deep Learning (CNN-BiLSTM)

#### Q9: Walk me through the exact layer-by-layer structure of your PyTorch `FetalHealthClassifier`.
> **Answer:**
> 1. **Input:** 19-dimensional CTG feature vector ($B, 19$).
> 2. **1D-CNN Feature Extractor:**
>    * `Conv1d(19 -> 32, kernel_size=1)` $\rightarrow$ `BatchNorm1d(32)` $\rightarrow$ `ReLU`
>    * `Conv1d(32 -> 64, kernel_size=1)` $\rightarrow$ `BatchNorm1d(64)` $\rightarrow$ `ReLU`
> 3. **Bidirectional LSTM Layer:**
>    * `LSTM(input_size=64, hidden_size=128, num_layers=2, bidirectional=True, dropout=0.3)`
>    * Output dimensions: ($B, 1, 256$) because bidirectional doubles the 128 hidden state.
> 4. **Classifier MLP Head:**
>    * `Linear(256 -> 128)` $\rightarrow$ `BatchNorm1d(128)` $\rightarrow$ `GELU` $\rightarrow$ `Dropout(0.3)`
>    * `Linear(128 -> 64)` $\rightarrow$ `BatchNorm1d(64)` $\rightarrow$ `GELU` $\rightarrow$ `Dropout(0.3)`
>    * `Linear(64 -> 3)` $\rightarrow$ Raw logits for 3 classes.

#### Q10: Why did you use `GELU` activations instead of standard `ReLU` in the dense classifier?
> **Answer:** Gaussian Error Linear Units (GELU) provide a smoother curvature than ReLU by weighting inputs by their probability under a Gaussian distribution ($\text{GELU}(x) = x \cdot \Phi(x)$). Unlike ReLU, GELU allows small negative gradients to flow, avoiding the "Dying ReLU" problem in deep classification heads.

#### Q11: Explain how Bidirectional LSTMs solve the vanishing gradient problem in time-series data.
> **Answer:** LSTMs use additive cell states ($c_t$) regulated by forget ($f_t$) and input ($i_t$) gates, allowing gradients to flow backward through time without exponential decay. The Bidirectional variant processes sequences in both chronological ($1 \rightarrow T$) and reverse ($T \rightarrow 1$) directions, enabling the network to observe both the onset of deceleration and its recovery phase simultaneously.

#### Q12: How did you select the learning rate and regularization parameters?
> **Answer:** We used **AdamW** with initial learning rate $10^{-3}$ and weight decay $10^{-4}$. We implemented PyTorch Lightning's `ReduceLROnPlateau` scheduler monitoring validation AUROC (`mode='max'`, `factor=0.5`, `patience=5`). Weight decay prevents overfitting by penalizing large $L_2$ norm values in dense layers.

#### Q13: What hardware acceleration or model export optimizations did you implement?
> **Answer:** Models were exported to **ONNX (Open Neural Network Exchange)** format via `export_onnx.py`. Running ONNX Runtime CPU execution nodes reduced inference latency from $\sim 15\text{ ms}$ (PyTorch Python runtime) down to $\mathbf{<2\text{ ms}}$.

---

### 📌 Section D: Generative AI (Tabular GAN) & Data Engineering

#### Q14: What is the Minimax objective function of your Tabular GAN?
> **Answer:** The Tabular GAN solves the minimax game:
> $$\min_G \max_D V(D, G) = \mathbb{E}_{x \sim p_{\text{data}}}[\log D(x)] + \mathbb{E}_{z \sim p_z}[\log(1 - D(G(z)))]$$
> * The **Discriminator ($D$)** maximizes the probability of assigning the correct label to real CTG records vs. synthetic samples.
> * The **Generator ($G$)** minimizes $\log(1 - D(G(z)))$, striving to fool $D$ into classifying synthetic samples as real.

#### Q15: Describe the hidden layers of your Generator and Discriminator.
> **Answer:**
> * **Generator ($G$):** Input $z \in \mathbb{R}^{32} \rightarrow \text{Linear}(32 \rightarrow 64) \rightarrow \text{BatchNorm1d} \rightarrow \text{LeakyReLU}(0.2) \rightarrow \text{Linear}(64 \rightarrow 128) \rightarrow \text{BatchNorm1d} \rightarrow \text{LeakyReLU}(0.2) \rightarrow \text{Linear}(128 \rightarrow 19) \rightarrow \text{Tanh()}$.
> * **Discriminator ($D$):** Input $x \in \mathbb{R}^{19} \rightarrow \text{Linear}(19 \rightarrow 128) \rightarrow \text{LeakyReLU}(0.2) \rightarrow \text{Dropout}(0.3) \rightarrow \text{Linear}(128 \rightarrow 64) \rightarrow \text{LeakyReLU}(0.2) \rightarrow \text{Dropout}(0.3) \rightarrow \text{Linear}(64 \rightarrow 1) \rightarrow \text{Sigmoid()}$.

#### Q16: How do you evaluate whether synthetic CTG data generated by the GAN is realistic?
> **Answer:** In [`ml_pipeline/evaluate_synthetic.py`](file:///d:/PROJECTS/PROJECT/fetal-health-realtime/ml_pipeline/evaluate_synthetic.py), we compute:
> 1. **Wasserstein Distance & Kolmogorov-Smirnov (KS) Test:** Evaluates marginal probability distributions between real and synthetic feature columns.
> 2. **Correlation Matrix Distance:** Compares feature covariance matrices ($\Sigma_{\text{real}}$ vs. $\Sigma_{\text{fake}}$) to ensure synthetic samples preserve non-linear physiological relationships (e.g., severe decelerations correlating with high STV).

#### Q17: What signal processing techniques were used in `signal_processor.py`?
> **Answer:**
> * **Accelerations:** `scipy.signal.find_peaks(fhr, height=baseline + 15, distance=10)`.
> * **Uterine Contractions:** `find_peaks(uc, height=mean(uc) + 20, distance=30)`.
> * **Decelerations:** Inverted signal peak detection on $-fhr$ at thresholds $+15\text{ bpm}$ (light) and $+30\text{ bpm}$ (severe).
> * **Short-Term Variability (STV):** $\text{mean}(|\Delta \text{FHR}|)$ and percentage of time $|\Delta \text{FHR}| < 1.0\text{ bpm}$.
> * **Long-Term Variability (LTV):** Convolving FHR with a 10-sample moving average window (`np.convolve`) and computing standard deviation of residuals.

---

### 📌 Section E: Explainable AI (LLMs) & Medical Standards

#### Q18: Why did you choose Llama 3.1 8B via Groq instead of OpenAI GPT-4?
> **Answer:**
> 1. **Ultra-Low Latency:** Groq's LPU (Language Processing Unit) architecture executes Llama 3.1 8B inference in under $200\text{ ms}$, compared to $1.5{-}3.0\text{ seconds}$ for GPT-4. Real-time telemetry monitoring requires sub-second response times.
> 2. **Open-Weights Privacy:** Llama 3.1 is an open-weights model, allowing hospital self-hosting for HIPAA compliance.

#### Q19: Show me the exact prompt template used to generate clinical reports.
> **Answer:** From [`ai_inference_service/llm_reporter.py`](file:///d:/PROJECTS/PROJECT/fetal-health-realtime/ai_inference_service/llm_reporter.py):
> ```text
> You are a senior obstetric consultant evaluating Cardiotocography telemetry data according to FIGO standards.
> FIGO Guidelines Context:
> - Normal FHR Baseline: 110-160 bpm.
> - Normal Variability: 5-25 bpm.
> - Accelerations (>15 bpm for >15s): Sign of fetal reactivity.
> - Decelerations: Late/prolonged indicate potential fetal hypoxia.
> Synthesize a precise 3-sentence summary based on:
> FHR Baseline: {fhr_baseline}, Variability: {variability}, Accelerations: {accelerations}, Decelerations: {decelerations}, AI Risk: {prediction}.
> ```

#### Q20: What is HL7 FHIR R4, and why is it important for medical AI projects?
> **Answer:** **HL7 FHIR (Fast Healthcare Interoperability Resources) R4** is the international standard for health data exchange. Medical AI models cannot remain isolated silos; they must communicate with hospital Electronic Health Records (EHRs). Formatting output predictions as FHIR `Observation` resources with LOINC standard codes (`8867-4` for Heart Rate) ensures instant compatibility with hospital software like Epic, Cerner, and Allscripts.

#### Q21: How does your system handle missing or noisy CTG data in real time?
> **Answer:** In `physionet_fetcher.py` and `signal_processor.py`, windows with $>20\%$ NaN values are filtered out. For minor missing values, linear interpolation and median imputation based on neighboring 10-second signal windows preserve continuity.

---

### 📌 Section F: Deployment, CI/CD & System Verification

#### Q22: What automated CI/CD workflow did you build using GitHub Actions?
> **Answer:** In [`.github/workflows/ci.yml`](file:///d:/PROJECTS/PROJECT/fetal-health-realtime/.github/workflows/ci.yml):
> 1. **`python-lint-and-test` Matrix:** Automatically runs Ruff linter, `pytest`, and `pytest-cov` across `ai_inference_service`, `patient_service`, `data_acquisition`, and `ml_pipeline`.
> 2. **`frontend-build-check` Job:** Installs Node.js 20 dependencies and executes `npm run build` on the Next.js application.
> 3. **`docker-build-check` Job:** Performs dry-run Docker image builds across all active microservices.

#### Q23: Have you deployed this system to live production cloud servers?
> **Answer:** Currently, the system is tested and verified locally on our development environment. However, the entire codebase is fully pre-configured for cloud deployment:
> * **Backend Services:** Dockerfiles and Railway manifests (`ai_inference_service` and `patient_service`) are configured for **Railway.app**.
> * **Frontend Dashboard:** Pre-configured for one-click deployment on **Vercel**.
> * Live cloud deployment will be executed in the next release phase.

#### Q24: How did you verify the production correctness of the local system?
> **Answer:** We executed two automated verification suites:
> 1. **Next.js Production Build (`npm run build`):** Validated static generation and type correctness across all 13 application routes.
> 2. **Integration Verification Suite (`verify_dashboard.py`):** Verified prediction inference ($<2\text{ ms}$), Llama 3.1 XAI report generation, Bcrypt password hashing, and FHIR resource creation.

#### Q25: What are the limitations of your current implementation, and what is your future research roadmap?
> **Answer:**
> * **Limitations:** Current hardware bridge simulates telemetry stream via TCP/WebSockets rather than direct physical clinical transducer connection.
> * **Future Roadmap:**
>   1. **Bedside Edge Hardware:** Deploy ONNX runtime onto Raspberry Pi / NVIDIA Jetson edge devices at patient bedside.
>   2. **Federated Learning:** Train models across multiple hospital networks without centralizing patient data.
>   3. **Multilingual Nurse Voice Alerts:** Integrate text-to-speech engine for instant audio room alerts in high-risk scenarios.
