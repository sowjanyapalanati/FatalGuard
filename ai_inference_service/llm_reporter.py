import os
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# We use the Groq API key set by the user
groq_api_key = os.getenv("GROQ_API_KEY")

class LLMClinicalReporter:
    def __init__(self, model_name="llama-3.1-8b-instant"):
        if not groq_api_key:
            self.llm = None
            return
            
        self.llm = ChatGroq(
            temperature=0.2,
            model_name=model_name,
            api_key=groq_api_key
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

    def generate_report(self, metrics: dict, prediction_label: str, language: str = "English") -> str:
        if not self.llm:
            return "Explainable AI report unavailable: GROQ_API_KEY not configured."
            
        try:
            # Map metrics to template variables
            # Use safe defaults if some metrics are missing from the live stream
            result = self.chain.invoke({
                "fhr_baseline": metrics.get("fhr_baseline", "Unknown"),
                "variability": f"{metrics.get('variability_long_term', 'Unknown')} ms",
                "accelerations": f"{metrics.get('accelerations', 0)} per min",
                "decelerations": f"{metrics.get('light_decelerations', 0) + metrics.get('severe_decelerations', 0)} per min",
                "prediction": prediction_label,
                "language": language
            })
            return result.content.strip()
        except Exception as e:
            return f"Error generating clinical report: {str(e)}"
