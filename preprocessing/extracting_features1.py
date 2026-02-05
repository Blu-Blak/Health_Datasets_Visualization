import pandas as pd
import re
import json
from collections import Counter, defaultdict

# Load data
df = pd.read_csv("data/medical_questions.csv")
print(f"Loaded {len(df)} rows")

# ============================================================
# EXTRACTION PATTERNS
# ============================================================

# Age extraction patterns
age_patterns = [
    r'(\d{1,3})[-\s]?year[-\s]?old',
    r'(\d{1,3})[-\s]?month[-\s]?old',
    r'(\d{1,3})[-\s]?week[-\s]?old',
    r'(\d{1,3})[-\s]?day[-\s]?old',
    r'aged?\s*(\d{1,3})',
]

# Gender patterns
male_patterns = [r'\bmale\b', r'\bman\b', r'\bbox\b', r'\bhis\b', r'\bhe\b', r'\bfather\b', r'\bhusband\b']
female_patterns = [r'\bfemale\b', r'\bwoman\b', r'\bgirl\b', r'\bher\b', r'\bshe\b', r'\bmother\b', r'\bpregnant\b', r'\bwife\b']

# Body system keywords mapping
body_systems = {
    'Brain/Neurological': {
        'keywords': ['headache', 'seizure', 'stroke', 'confusion', 'memory', 'brain', 'neural', 'cognitive', 
                     'alzheimer', 'parkinson', 'epilepsy', 'migraine', 'dementia', 'consciousness', 'coma',
                     'meningitis', 'encephalitis', 'neuropathy', 'tremor', 'paralysis', 'numbness'],
        'color': '#FF6B6B'
    },
    'Eyes': {
        'keywords': ['vision', 'blind', 'eye', 'retina', 'cataract', 'glaucoma', 'optic', 'pupil', 
                     'conjunctiv', 'cornea', 'visual', 'ophthalmol'],
        'color': '#4ECDC4'
    },
    'Ears/Nose/Throat': {
        'keywords': ['hearing', 'deaf', 'ear', 'throat', 'sinus', 'tinnitus', 'nasal', 'pharynx', 
                     'larynx', 'tonsil', 'otitis', 'vertigo', 'nose', 'smell'],
        'color': '#45B7D1'
    },
    'Cardiovascular': {
        'keywords': ['heart', 'cardiac', 'chest pain', 'palpitation', 'hypertension', 'blood pressure',
                     'arrhythmia', 'myocardial', 'coronary', 'angina', 'atrial', 'ventricular', 
                     'murmur', 'infarction', 'cardiomyopathy', 'aorta', 'valve'],
        'color': '#E74C3C'
    },
    'Respiratory': {
        'keywords': ['lung', 'breath', 'cough', 'pneumonia', 'asthma', 'bronch', 'pulmonary', 
                     'respiratory', 'dyspnea', 'wheez', 'copd', 'tuberculosis', 'chest x-ray',
                     'sputum', 'pleural', 'emphysema'],
        'color': '#3498DB'
    },
    'Gastrointestinal': {
        'keywords': ['stomach', 'abdominal', 'nausea', 'vomit', 'diarrhea', 'constipation', 
                     'gastric', 'intestin', 'bowel', 'liver', 'hepat', 'pancrea', 'gallbladder',
                     'ulcer', 'gastritis', 'colitis', 'appendic', 'hernia', 'esophag', 'colon',
                     'rectal', 'jaundice', 'cirrhosis', 'spleen'],
        'color': '#F39C12'
    },
    'Kidney/Urinary': {
        'keywords': ['kidney', 'renal', 'urinary', 'urine', 'bladder', 'ureter', 'creatinine',
                     'dialysis', 'nephro', 'urolog', 'proteinuria', 'hematuria', 'cystitis'],
        'color': '#9B59B6'
    },
    'Reproductive': {
        'keywords': ['pregnan', 'menstrual', 'ovary', 'uterus', 'vaginal', 'cervix', 'obstetric',
                     'gynec', 'fertility', 'contracepti', 'menopause', 'breast', 'mammary',
                     'prostate', 'testicular', 'penile', 'erectile', 'fetus', 'delivery', 'labor'],
        'color': '#E91E63'
    },
    'Musculoskeletal': {
        'keywords': ['bone', 'fracture', 'joint', 'arthritis', 'muscle', 'osteo', 'spine', 'spinal',
                     'back pain', 'neck pain', 'orthopedic', 'ligament', 'tendon', 'rheumat',
                     'scoliosis', 'disc', 'lumbar', 'cervical', 'hip', 'knee', 'shoulder', 'ankle'],
        'color': '#795548'
    },
    'Skin': {
        'keywords': ['skin', 'rash', 'dermat', 'itch', 'lesion', 'wound', 'eczema', 'psoriasis',
                     'acne', 'urticaria', 'melanoma', 'burn', 'ulcer', 'blister', 'pruritus'],
        'color': '#FF9800'
    },
    'Blood/Immune': {
        'keywords': ['anemia', 'bleeding', 'blood', 'platelet', 'leukemia', 'lymphoma', 'immune',
                     'hiv', 'aids', 'autoimmune', 'allergy', 'hematol', 'coagulation', 'transfusion',
                     'hemoglobin', 'wbc', 'rbc', 'infection', 'sepsis', 'fever'],
        'color': '#F44336'
    },
    'Endocrine': {
        'keywords': ['diabetes', 'thyroid', 'hormone', 'insulin', 'glucose', 'adrenal', 'pituitary',
                     'endocrin', 'metabolic', 'obesity', 'hyperthyroid', 'hypothyroid', 'cortisol'],
        'color': '#8BC34A'
    },
    'Mental Health': {
        'keywords': ['depression', 'anxiety', 'psychiatric', 'psycho', 'schizophrenia', 'bipolar',
                     'suicide', 'mood', 'mental', 'insomnia', 'panic', 'phobia', 'addiction',
                     'substance abuse', 'alcohol', 'drug abuse', 'eating disorder'],
        'color': '#673AB7'
    }
}

# Symptom keywords
symptom_keywords = [
    'pain', 'fever', 'cough', 'headache', 'nausea', 'vomiting', 'diarrhea', 'fatigue',
    'weakness', 'swelling', 'bleeding', 'rash', 'itching', 'dizziness', 'shortness of breath',
    'chest pain', 'abdominal pain', 'back pain', 'weight loss', 'weight gain', 'loss of appetite',
    'difficulty breathing', 'palpitations', 'numbness', 'tingling', 'confusion', 'seizure',
    'tremor', 'blurred vision', 'hearing loss', 'sore throat', 'runny nose', 'constipation',
    'frequent urination', 'blood in urine', 'blood in stool', 'jaundice', 'bruising'
]

# ============================================================
# EXTRACTION FUNCTIONS
# ============================================================

def extract_age(text):
    """Extract age and return age group"""
    text = text.lower()
    
    for pattern in age_patterns:
        match = re.search(pattern, text)
        if match:
            age = int(match.group(1))
            
            # Handle month/week/day old (convert to 0)
            if 'month' in pattern or 'week' in pattern or 'day' in pattern:
                return 0, 'Infant (0-1)'
            
            # Age groups
            if age <= 1:
                return age, 'Infant (0-1)'
            elif age <= 12:
                return age, 'Child (2-12)'
            elif age <= 19:
                return age, 'Adolescent (13-19)'
            elif age <= 39:
                return age, 'Young Adult (20-39)'
            elif age <= 59:
                return age, 'Middle Age (40-59)'
            elif age <= 79:
                return age, 'Senior (60-79)'
            else:
                return age, 'Elderly (80+)'
    
    return None, 'Unknown'

def extract_gender(text):
    """Extract gender from text"""
    text = text.lower()
    
    male_score = sum(1 for p in male_patterns if re.search(p, text))
    female_score = sum(1 for p in female_patterns if re.search(p, text))
    
    if female_score > male_score:
        return 'Female'
    elif male_score > female_score:
        return 'Male'
    else:
        return 'Unknown'

def extract_body_systems(text):
    """Extract body systems mentioned in text"""
    text = text.lower()
    systems = []
    
    for system, data in body_systems.items():
        for keyword in data['keywords']:
            if keyword in text:
                systems.append(system)
                break
    
    return systems if systems else ['General/Other']

def extract_symptoms(text):
    """Extract symptoms from text"""
    text = text.lower()
    found_symptoms = []
    
    for symptom in symptom_keywords:
        if symptom in text:
            found_symptoms.append(symptom)
    
    return found_symptoms

# ============================================================
# PROCESS ALL DATA
# ============================================================

print("Processing data...")

processed_data = []

for idx, row in df.iterrows():
    question = str(row['Open-ended Verifiable Question'])
    answer = str(row['Ground-True Answer'])
    
    age, age_group = extract_age(question)
    gender = extract_gender(question)
    body_sys = extract_body_systems(question + " " + answer)
    symptoms = extract_symptoms(question)
    
    processed_data.append({
        'id': idx,
        'question': question[:200] + '...' if len(question) > 200 else question,  # Truncate for JSON size
        'answer': answer,
        'age': age,
        'age_group': age_group,
        'gender': gender,
        'body_systems': body_sys,
        'primary_system': body_sys[0] if body_sys else 'General/Other',
        'symptoms': symptoms,
        'question_length': len(question.split())
    })
    
    if (idx + 1) % 10000 == 0:
        print(f"Processed {idx + 1} rows...")

print(f"Processed all {len(processed_data)} rows")

# ============================================================
# GENERATE STATISTICS
# ============================================================

print("\nGenerating statistics...")

# 1. Demographics for Sunburst
demographics = defaultdict(lambda: defaultdict(int))
for item in processed_data:
    demographics[item['age_group']][item['gender']] += 1

sunburst_data = {
    "name": "Patients",
    "children": []
}

for age_group, genders in demographics.items():
    age_node = {
        "name": age_group,
        "children": [
            {"name": gender, "value": count}
            for gender, count in genders.items()
        ]
    }
    sunburst_data["children"].append(age_node)

# 2. Body System Stats for Anatomy Visualization
body_system_stats = {}
for system in list(body_systems.keys()) + ['General/Other']:
    system_items = [item for item in processed_data if system in item['body_systems']]
    
    if system_items:
        # Get top conditions (answers)
        conditions = Counter([item['answer'] for item in system_items])
        top_conditions = conditions.most_common(10)
        
        # Get top symptoms
        all_symptoms = []
        for item in system_items:
            all_symptoms.extend(item['symptoms'])
        top_symptoms = Counter(all_symptoms).most_common(10)
        
        # Age distribution
        age_dist = Counter([item['age_group'] for item in system_items])
        
        # Gender distribution
        gender_dist = Counter([item['gender'] for item in system_items])
        
        body_system_stats[system] = {
            'count': len(system_items),
            'top_conditions': [{'name': c[0], 'count': c[1]} for c in top_conditions],
            'top_symptoms': [{'name': s[0], 'count': s[1]} for s in top_symptoms],
            'age_distribution': dict(age_dist),
            'gender_distribution': dict(gender_dist),
            'color': body_systems.get(system, {}).get('color', '#95A5A6'),
            'sample_questions': [item['question'] for item in system_items[:3]]
        }

# 3. Sankey Data (Symptom -> Diagnosis)
symptom_diagnosis_pairs = defaultdict(int)
for item in processed_data:
    for symptom in item['symptoms'][:3]:  # Limit to first 3 symptoms per question
        symptom_diagnosis_pairs[(symptom, item['answer'])] += 1

# Get top pairs
top_pairs = sorted(symptom_diagnosis_pairs.items(), key=lambda x: x[1], reverse=True)[:100]

# Build Sankey structure
all_symptoms_sankey = list(set([p[0][0] for p in top_pairs]))
all_diagnoses_sankey = list(set([p[0][1] for p in top_pairs]))

sankey_data = {
    "nodes": [{"name": s, "type": "symptom"} for s in all_symptoms_sankey] + 
             [{"name": d, "type": "diagnosis"} for d in all_diagnoses_sankey],
    "links": []
}

for (symptom, diagnosis), count in top_pairs:
    source_idx = all_symptoms_sankey.index(symptom)
    target_idx = len(all_symptoms_sankey) + all_diagnoses_sankey.index(diagnosis)
    sankey_data["links"].append({
        "source": source_idx,
        "target": target_idx,
        "value": count
    })

# 4. Treemap Data (Specialty Hierarchy)
treemap_data = {
    "name": "Medical Questions",
    "children": []
}

for system, stats in body_system_stats.items():
    system_node = {
        "name": system,
        "color": stats['color'],
        "children": [
            {"name": cond['name'], "value": cond['count']}
            for cond in stats['top_conditions'][:8]
        ]
    }
    if system_node["children"]:  # Only add if has conditions
        treemap_data["children"].append(system_node)

# ============================================================
# SAVE ALL JSON FILES
# ============================================================

print("\nSaving JSON files...")

# Save processed data (sample for reference)
with open('data/processed_data.json', 'w') as f:
    json.dump(processed_data[:1000], f, indent=2)  # Save first 1000 for reference
print("Saved: data/processed_data.json (sample of 1000 records)")

# Save body system stats
with open('data/body_system_stats.json', 'w') as f:
    json.dump(body_system_stats, f, indent=2)
print("Saved: data/body_system_stats.json")

# Save demographics
with open('data/demographics.json', 'w') as f:
    json.dump(sunburst_data, f, indent=2)
print("Saved: data/demographics.json")

# Save sankey data
with open('data/sankey_data.json', 'w') as f:
    json.dump(sankey_data, f, indent=2)
print("Saved: data/sankey_data.json")

# Save treemap data
with open('data/treemap_data.json', 'w') as f:
    json.dump(treemap_data, f, indent=2)
print("Saved: data/treemap_data.json")

# ============================================================
# PRINT SUMMARY STATISTICS
# ============================================================

print("\n" + "="*60)
print("EXTRACTION SUMMARY")
print("="*60)

# Age extraction rate
ages_found = sum(1 for item in processed_data if item['age'] is not None)
print(f"\nAge extracted: {ages_found} / {len(processed_data)} ({100*ages_found/len(processed_data):.1f}%)")

# Gender extraction rate
genders_found = sum(1 for item in processed_data if item['gender'] != 'Unknown')
print(f"Gender extracted: {genders_found} / {len(processed_data)} ({100*genders_found/len(processed_data):.1f}%)")

# Body system distribution
print(f"\nBody System Distribution:")
system_counts = Counter([item['primary_system'] for item in processed_data])
for system, count in system_counts.most_common():
    print(f"  {system}: {count} ({100*count/len(processed_data):.1f}%)")

# Age group distribution
print(f"\nAge Group Distribution:")
age_counts = Counter([item['age_group'] for item in processed_data])
for age, count in age_counts.most_common():
    print(f"  {age}: {count} ({100*count/len(processed_data):.1f}%)")

# Gender distribution
print(f"\nGender Distribution:")
gender_counts = Counter([item['gender'] for item in processed_data])
for gender, count in gender_counts.most_common():
    print(f"  {gender}: {count} ({100*count/len(processed_data):.1f}%)")

print("\n" + "="*60)
print("DATA PREPROCESSING COMPLETE!")
print("="*60)