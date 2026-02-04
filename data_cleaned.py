import pandas as pd
import re
import json
from datasets import load_dataset

# =======================
# LOAD DATA
# =======================
ds = load_dataset("FreedomIntelligence/medical-o1-reasoning-SFT", "en")
df = pd.DataFrame(ds['train'])

df['Question'] = df['Question'].fillna('').astype(str)
df['Response'] = df['Response'].fillna('').astype(str)

# =======================
# REGEX DEFINITIONS
# =======================
age_pattern = r'(\d+)\s*-?\s*year\s*-?\s*old|age\s*(?:of)?\s*(\d+)'
male_pattern = r'\b(?:man|male|boy|gentleman)\b'
female_pattern = r'\b(?:woman|female|girl|lady)\b'

disease_map = {
    'Gastrointestinal': r'stomach|abdominal|nausea|vomiting|diarrhea|gastric',
    'Heart/Cardiac': r'heart attack|chest pain|angina|hypertension',
    'Infectious Disease': r'fever|infection|sepsis|virus|bacteria',
    'Neurological': r'stroke|weakness|headache|seizure',
    'Respiratory': r'cough|asthma|shortness of breath|pneumonia',
    'Endocrine/Diabetes': r'diabetes|thyroid|insulin',
    'Dermatology': r'psoriasis|skin|rash|eczema',
    'Orthopedic': r'fracture|joint pain|arthritis|muscle',
    'Renal/Urology': r'kidney|renal|uti|urinary',
    'Mental Health': r'anxiety|depression|stress|bipolar'
}

# =======================
# 1. AGE × DISEASE (Pre-aggregated for D3)
# =======================
age_disease_raw = []

for q in df['Question']:
    for disease, pattern in disease_map.items():
        if re.search(pattern, q, re.I):
            age_match = re.search(age_pattern, q, re.I)
            if age_match:
                age = int(age_match.group(1) or age_match.group(2))
                group = (
                    'Pediatric (0-18)' if age <= 18 else
                    'Young Adult (19-40)' if age <= 40 else
                    'Adult (41-65)' if age <= 65 else
                    'Senior (65+)'
                )
                age_disease_raw.append({
                    'disease': disease,
                    'age_group': group
                })

# Pre-aggregate for easier D3 consumption
age_df = pd.DataFrame(age_disease_raw)
if len(age_df) > 0:
    age_pivot = age_df.groupby(['disease', 'age_group']).size().unstack(fill_value=0)
    age_pivot['Total'] = age_pivot.sum(axis=1)
    age_pivot = age_pivot.sort_values('Total', ascending=True).drop(columns=['Total'])
    
    age_disease = []
    for disease in age_pivot.index:
        row = {'disease': disease}
        for col in age_pivot.columns:
            row[col] = int(age_pivot.loc[disease, col])
        age_disease.append(row)
else:
    age_disease = []

# =======================
# 2. GENDER × DISEASE (Pre-aggregated for D3)
# =======================
gender_disease_raw = []

for q in df['Question']:
    gender = (
        'Male' if re.search(male_pattern, q, re.I) else
        'Female' if re.search(female_pattern, q, re.I) else None
    )
    if gender:
        for disease, pattern in disease_map.items():
            if re.search(pattern, q, re.I):
                gender_disease_raw.append({
                    'disease': disease,
                    'gender': gender
                })

# Pre-aggregate for easier D3 consumption
gender_df = pd.DataFrame(gender_disease_raw)
if len(gender_df) > 0:
    gender_pivot = gender_df.groupby(['disease', 'gender']).size().unstack(fill_value=0)
    gender_pivot = gender_pivot.sort_values('Male', ascending=True)
    
    gender_disease = []
    for disease in gender_pivot.index:
        row = {'disease': disease}
        for col in gender_pivot.columns:
            row[col] = int(gender_pivot.loc[disease, col])
        gender_disease.append(row)
else:
    gender_disease = []

# =======================
# 3. MEDICAL NETWORK (Enhanced)
# =======================
nodes = {}
links_set = set()  # Use set to avoid duplicate links
node_counts = {}   # Track connection counts for node sizing

def add_node(name, group):
    if name not in nodes:
        nodes[name] = {'id': name, 'group': group}
        node_counts[name] = 0
    node_counts[name] += 1

def add_link(source, target, link_type):
    key = (source, target)
    if key not in links_set:
        links_set.add(key)

for _, row in df.head(1000).iterrows():
    text = (row['Question'] + " " + row['Response']).lower()

    # Extended symptom patterns
    symptoms = {
        'Chest Pain': r'chest pain',
        'Fever': r'fever',
        'Headache': r'headache',
        'Nausea': r'nausea',
        'Weakness': r'weakness',
        'Shortness of Breath': r'shortness of breath|dyspnea'
    }
    
    # Extended disease patterns
    diseases = {
        'Heart Attack': r'heart attack|myocardial infarction',
        'Stroke': r'stroke',
        'Diabetes': r'diabetes',
        'Hypertension': r'hypertension|high blood pressure',
        'Asthma': r'asthma'
    }
    
    # Extended medication patterns
    meds = {
        'Aspirin': r'aspirin',
        'Insulin': r'insulin',
        'Beta Blockers': r'beta blocker|metoprolol',
        'Antibiotics': r'antibiotic'
    }
    
    # Risk factors
    risks = {
        'Smoking': r'smoking|smoker',
        'Obesity': r'obesity|obese',
        'High Cholesterol': r'cholesterol',
        'Family History': r'family history'
    }
    
    # Diagnostic tests
    diagnostics = {
        'ECG': r'ecg|electrocardiogram',
        'Blood Test': r'blood test',
        'MRI': r'mri',
        'CT Scan': r'ct scan'
    }
    
    # Procedures
    procedures = {
        'Surgery': r'surgery',
        'Angioplasty': r'angioplasty',
        'Dialysis': r'dialysis',
        'Inhaler': r'inhaler'
    }

    found_s = [k for k, p in symptoms.items() if re.search(p, text)]
    found_d = [k for k, p in diseases.items() if re.search(p, text)]
    found_m = [k for k, p in meds.items() if re.search(p, text)]
    found_r = [k for k, p in risks.items() if re.search(p, text)]
    found_diag = [k for k, p in diagnostics.items() if re.search(p, text)]
    found_proc = [k for k, p in procedures.items() if re.search(p, text)]

    for s in found_s:
        add_node(s, 'symptom')
    for d in found_d:
        add_node(d, 'disease')
    for m in found_m:
        add_node(m, 'medication')
    for r in found_r:
        add_node(r, 'risk')
    for diag in found_diag:
        add_node(diag, 'diagnostic')
    for proc in found_proc:
        add_node(proc, 'procedure')

    # Create links between entities
    for d in found_d:
        for s in found_s:
            add_link(s, d, 'symptom')
        for m in found_m:
            add_link(d, m, 'treatment')
        for r in found_r:
            add_link(r, d, 'risk')
        for diag in found_diag:
            add_link(d, diag, 'diagnostic')
        for proc in found_proc:
            add_link(d, proc, 'procedure')

# Convert links set to list with proper format
links = [{'source': s, 'target': t} for s, t in links_set]

# Add count to nodes for sizing
for name in nodes:
    nodes[name]['count'] = node_counts.get(name, 1)

# =======================
# SAVE JSON FILES
# =======================
with open('data/age_disease.json', 'w') as f:
    json.dump(age_disease, f, indent=2)

with open('data/gender_disease.json', 'w') as f:
    json.dump(gender_disease, f, indent=2)

with open('data/medical_network.json', 'w') as f:
    json.dump({
        'nodes': list(nodes.values()),
        'links': links
    }, f, indent=2)

print("✅ Data preprocessing complete.")
