import numpy as np
from scipy.signal import find_peaks

class SignalProcessor:
    """
    Extracts the 19 CTG features from raw FHR (Fetal Heart Rate) and UC (Uterine Contraction) signal arrays.
    These features match the structure expected by the FetalGuard AI model.
    """

    def __init__(self, fhr_signal=None, uc_signal=None):
        self.fhr = np.array(fhr_signal) if fhr_signal is not None else np.array([140.0] * 120)
        self.uc = np.array(uc_signal) if uc_signal is not None else np.array([15.0] * 120)

    def process_signal_window(self, fhr_signal, uc_signal):
        self.fhr = np.array(fhr_signal)
        self.uc = np.array(uc_signal)
        return self.extract_features()

    def extract_features(self):
        # 1. Baseline FHR
        baseline_value = np.mean(self.fhr)
        
        # 2. Accelerations
        # A simple approximation: FHR peaks that are 15 bpm above baseline
        fhr_peaks, _ = find_peaks(self.fhr, height=baseline_value + 15, distance=10)
        accelerations = float(len(fhr_peaks))
        
        # 3. Fetal Movement
        # Rough proxy: high frequency small variations in FHR
        fetal_movement = float(np.sum(np.abs(np.diff(self.fhr)) > 5))
        
        # 4. Uterine Contractions
        # UC peaks above a threshold
        uc_baseline = np.mean(self.uc)
        uc_peaks, _ = find_peaks(self.uc, height=uc_baseline + 20, distance=30)
        uterine_contractions = float(len(uc_peaks))
        
        # 5-7. Decelerations (light, severe, prolonged)
        # Trough logic
        fhr_inverted = -self.fhr
        baseline_inverted = -baseline_value
        
        light_dec, _ = find_peaks(fhr_inverted, height=baseline_inverted + 15, distance=10)
        severe_dec, _ = find_peaks(fhr_inverted, height=baseline_inverted + 30, distance=10)
        # For prolonged, we'd need duration, but we'll approximate with wider distance
        prolongued_dec, _ = find_peaks(fhr_inverted, height=baseline_inverted + 15, distance=40)
        
        # 8-11. Variability features (Short-term and Long-term)
        diff_fhr = np.diff(self.fhr)
        mean_stv = float(np.mean(np.abs(diff_fhr)))
        abnormal_stv = float(np.sum(np.abs(diff_fhr) < 1.0) / len(diff_fhr) * 100) if len(diff_fhr) > 0 else 0.0
        
        # LTV approximation (using moving average difference)
        window = min(len(self.fhr), 10)
        if window > 0:
            moving_avg = np.convolve(self.fhr, np.ones(window)/window, mode='valid')
            mean_ltv = float(np.mean(np.abs(self.fhr[:len(moving_avg)] - moving_avg)))
            perc_abnormal_ltv = float(np.sum(np.abs(self.fhr[:len(moving_avg)] - moving_avg) > 10) / len(moving_avg) * 100)
        else:
            mean_ltv = 0.0
            perc_abnormal_ltv = 0.0
            
        # 12-19. Histogram features
        hist, bin_edges = np.histogram(self.fhr, bins=10)
        hist_min = float(np.min(self.fhr))
        hist_max = float(np.max(self.fhr))
        hist_width = hist_max - hist_min
        hist_mean = float(np.mean(self.fhr))
        hist_median = float(np.median(self.fhr))
        hist_variance = float(np.var(self.fhr))
        
        hist_mode_idx = np.argmax(hist)
        hist_mode = float((bin_edges[hist_mode_idx] + bin_edges[hist_mode_idx+1]) / 2)
        
        # Tendency: -1 (left asymmetry), 0 (symmetric), 1 (right asymmetry)
        skewness = hist_mean - hist_median
        if skewness > 2:
            hist_tendency = 1.0
        elif skewness < -2:
            hist_tendency = -1.0
        else:
            hist_tendency = 0.0
            
        return {
            "baseline_value": baseline_value,
            "accelerations": accelerations,
            "fetal_movement": fetal_movement,
            "uterine_contractions": uterine_contractions,
            "light_decelerations": float(len(light_dec)),
            "severe_decelerations": float(len(severe_dec)),
            "prolongued_decelerations": float(len(prolongued_dec)),
            "abnormal_short_term_variability": abnormal_stv,
            "mean_value_of_short_term_variability": mean_stv,
            "percentage_of_time_with_abnormal_long_term_variability": perc_abnormal_ltv,
            "mean_value_of_long_term_variability": mean_ltv,
            "histogram_width": hist_width,
            "histogram_min": hist_min,
            "histogram_max": hist_max,
            "histogram_mode": hist_mode,
            "histogram_mean": hist_mean,
            "histogram_median": hist_median,
            "histogram_variance": hist_variance,
            "histogram_tendency": hist_tendency,
        }
