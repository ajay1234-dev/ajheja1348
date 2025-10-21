/**
 * AI-Based Doctor Matching Service using Google Gemini
 * 
 * This service uses Google Gemini AI to analyze medical reports and detect:
 * - Abnormal medical parameters
 * - Health risks and conditions
 * - The most appropriate medical specialization needed
 * 
 * Available Specializations:
 * - Cardiologist, Dermatologist, Orthopedic, Neurologist, Gastroenterologist,
 * - Pulmonologist, Endocrinologist, Ophthalmologist, ENT Specialist, General Physician
 */

import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI (same as gemini.ts)
let gemini: GoogleGenAI | null = null;

if (process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
  console.warn('Warning: GEMINI_API_KEY not set - AI doctor matching will use fallback');
}

/**
 * Uses Google Gemini AI to analyze a medical report and detect the appropriate
 * medical specialization based on abnormal parameters and health conditions.
 * 
 * @param reportText - Full text extracted from the medical report (OCR or PDF text)
 * @returns The detected medical specialization
 */
export async function analyzeReportWithAI(
  reportText: string
): Promise<string> {
  if (!reportText || !reportText.trim()) {
    console.log('⚠️ No report text available for AI analysis - defaulting to General Physician');
    return 'General Physician';
  }

  if (!gemini) {
    console.log('⚠️ Gemini AI not available - defaulting to General Physician');
    return 'General Physician';
  }

  try {
    console.log('🤖 Analyzing medical report with Google Gemini AI...');
    console.log('📝 Report text length:', reportText.length);
    
    const prompt = `You are a medical specialist recommendation system. Carefully analyze the medical report provided and determine the MOST APPROPRIATE medical specialist needed based on the actual medical data and findings.

MEDICAL REPORT:
${reportText}

AVAILABLE SPECIALISTS (choose ONE that best matches):
1. Cardiologist - Heart disease, chest pain, high blood pressure, cardiovascular issues, cholesterol problems, heart attacks, arrhythmia
2. Dermatologist - Skin rashes, acne, eczema, psoriasis, skin cancer, moles, skin infections
3. Orthopedic - Bone fractures, joint pain, arthritis, back pain, spine issues, sports injuries, muscle problems
4. Neurologist - Headaches, migraines, seizures, stroke, Parkinson's, Alzheimer's, nerve pain, brain disorders
5. Gastroenterologist - Stomach pain, digestive issues, liver problems, hepatitis, IBS, ulcers, acid reflux
6. Pulmonologist - Breathing problems, asthma, COPD, pneumonia, lung infections, chronic cough
7. Endocrinologist - Diabetes, thyroid problems, hormonal imbalances, metabolism issues, high blood sugar
8. Ophthalmologist - Eye problems, vision loss, cataracts, glaucoma, eye infections
9. ENT Specialist - Ear infections, hearing loss, sinus problems, throat issues, tonsillitis
10. General Physician - General checkup, minor illnesses, unclear symptoms, routine care

ANALYSIS INSTRUCTIONS:
1. Read ALL the medical report data carefully (lab results, diagnoses, test results, prescriptions)
2. Identify ABNORMAL medical parameters and health conditions mentioned
3. Determine the PRIMARY health concern that needs immediate specialist attention
4. Match the medical findings to the MOST SPECIFIC specialist
5. If multiple specialists could help, choose the one that addresses the MAIN abnormality
6. Only choose "General Physician" if report shows normal results or very minor issues

CRITICAL DETECTION RULES:
- Look for ABNORMAL VALUES and DIAGNOSES in the report
- Diabetes/high blood sugar/HbA1c/insulin → Endocrinologist
- Heart disease/high BP/ECG abnormalities/cholesterol → Cardiologist  
- Bone fractures/joint problems/arthritis/X-ray findings → Orthopedic
- Lung issues/breathing problems/chest X-ray → Pulmonologist
- Liver/stomach/digestive problems/endoscopy → Gastroenterologist
- Skin conditions/dermatology reports → Dermatologist
- Brain/neurological issues/CT scan/MRI findings → Neurologist
- Eye problems/vision tests/ophthalmology → Ophthalmologist
- Ear/nose/throat problems/ENT reports → ENT Specialist

RESPOND WITH ONLY THE SPECIALIST NAME (no explanation, no extra text):`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const aiResponse = (response.text || '').trim();
    
    // Extract the specialization from the response with exact matching
    const validSpecializations = [
      'Cardiologist', 'Dermatologist', 'Orthopedic', 'Neurologist',
      'Gastroenterologist', 'Pulmonologist', 'Endocrinologist',
      'Ophthalmologist', 'ENT Specialist', 'General Physician'
    ];
    
    // First try exact match (case insensitive)
    let detectedSpecialization = validSpecializations.find(spec => 
      aiResponse.toLowerCase().trim() === spec.toLowerCase()
    );
    
    // If no exact match, try partial match
    if (!detectedSpecialization) {
      detectedSpecialization = validSpecializations.find(spec => 
        aiResponse.toLowerCase().includes(spec.toLowerCase())
      );
    }
    
    // Fallback to General Physician if still no match
    detectedSpecialization = detectedSpecialization || 'General Physician';
    
    console.log('🎯 AI Detection Results:', {
      reportTextLength: reportText.length,
      aiResponse: aiResponse,
      detectedSpecialization,
      confidence: 'AI-powered',
      matchType: validSpecializations.find(s => s.toLowerCase() === aiResponse.toLowerCase().trim()) ? 'exact' : 'partial'
    });
    
    return detectedSpecialization;
    
  } catch (error) {
    console.error('❌ Error analyzing report with AI:', error);
    // Fallback to General Physician on error
    return 'General Physician';
  }
}

/**
 * Analyzes the medical report text and returns the detected specialization
 * using AI-powered analysis based solely on the report content.
 * 
 * @param reportText - Full extracted text from the medical report (OCR or PDF text)
 * @returns Object containing detected specialization and analysis details
 */
export async function analyzeReportForSpecialization(
  reportText: string
): Promise<{
  specialization: string;
  confidence: string;
  analyzedText: string;
}> {
  // Use AI to analyze the report based solely on report content
  const specialization = await analyzeReportWithAI(reportText);
  
  return {
    specialization,
    confidence: 'high', // AI-powered analysis
    analyzedText: reportText.substring(0, 200) + '...'
  };
}
