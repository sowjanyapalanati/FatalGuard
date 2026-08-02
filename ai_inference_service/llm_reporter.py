import os
from dotenv import load_dotenv

try:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import PromptTemplate
    GROQ_AVAILABLE = True
except ImportError:
    ChatGroq = None
    PromptTemplate = None
    GROQ_AVAILABLE = False

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# We use the Groq API key set by the user
groq_api_key = os.getenv("GROQ_API_KEY")

class LLMClinicalReporter:
    def __init__(self, model_name="llama-3.1-8b-instant"):
        self.cache = {}
        if not GROQ_AVAILABLE or not groq_api_key:
            self.llm = None
            return
            
        try:
            self.llm = ChatGroq(
                temperature=0.2,
                model_name=model_name,
                api_key=groq_api_key,
                max_retries=1
            )
            self.prompt = PromptTemplate(
                input_variables=["fhr_baseline", "variability", "accelerations", "decelerations", "prediction", "language"],
                template="""
                You are a senior obstetric consultant evaluating Cardiotocography (CTG) telemetry data according to FIGO (International Federation of Gynecology and Obstetrics) standards.
                FIGO Guidelines Context:
                - Normal FHR Baseline: 110-160 bpm.
                - Normal Variability: 5-25 bpm.
                - Accelerations (>15 bpm for >15s): Sign of fetal reactivity and well-being.
                - Decelerations: Late or prolonged decelerations indicate potential fetal hypoxia / acidosis.

                Synthesize a precise 3-sentence medical summary based on:
                - Fetal Heart Rate (FHR) Baseline: {fhr_baseline} bpm
                - Variability: {variability}
                - Accelerations: {accelerations}
                - Decelerations: {decelerations}
                - AI Risk Classification: {prediction}

                Focus on physiological interpretability and immediate clinical decision support. Do not use markdown. Do not provide disclaimers.
                IMPORTANT: Write the entire report in this language: {language}.
                """
            )
            self.chain = self.prompt | self.llm
        except Exception:
            self.llm = None

    def generate_report(self, metrics: dict, prediction_label: str, language: str = "English") -> str:
        fhr_base = metrics.get("baseline_value", metrics.get("fhr_baseline", 135.0))
        var_ltv = metrics.get("mean_value_of_long_term_variability", metrics.get("variability_long_term", "Normal (5-25 bpm)"))
        accel = metrics.get("accelerations", 0.0)
        light_dec = metrics.get("light_decelerations", 0.0)
        sev_dec = metrics.get("severe_decelerations", 0.0)
        prolong_dec = metrics.get("prolongued_decelerations", 0.0)
        tot_dec = light_dec + sev_dec + prolong_dec

        # Cache key based on feature bucket
        cache_key = (round(float(fhr_base), 0), round(float(accel), 0), round(float(tot_dec), 0), prediction_label, language)
        if cache_key in self.cache:
            return self.cache[cache_key]

        api_key = os.getenv("GROQ_API_KEY")
        if not self.llm and api_key:
            try:
                self.llm = ChatGroq(
                    temperature=0.2,
                    model_name="llama-3.1-8b-instant",
                    api_key=api_key,
                    max_retries=1
                )
                self.chain = self.prompt | self.llm
            except Exception as e:
                return f"Explainable AI initialization error: {e}"

        if not self.llm:
            return f"Explainable AI report for {prediction_label}: Baseline FHR {fhr_base} bpm, accelerations {accel}/min. Plan monitoring per FIGO guidelines."
            
        try:
            result = self.chain.invoke({
                "fhr_baseline": fhr_base,
                "variability": f"{var_ltv}",
                "accelerations": f"{accel}",
                "decelerations": f"{tot_dec}",
                "prediction": prediction_label,
                "language": language
            })
            text = result.content.strip()
            self.cache[cache_key] = text
            return text
        except Exception as e:
            fallback_text = f"FIGO Clinical Assessment ({prediction_label}): FHR baseline at {fhr_base} bpm with accelerations ({accel}/min) and decelerations ({tot_dec}/min). Continue routine monitoring."
            self.cache[cache_key] = fallback_text
            return fallback_text
