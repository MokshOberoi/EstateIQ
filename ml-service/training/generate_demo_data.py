import os
import uuid
import os
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(DATA_DIR, 'lead_training_data.csv')

# Fixed seed for reproducibility
np.random.seed(42)
random = np.random

NUM_ROWS = 4000

# Desired balanced class counts (roughly equal)
class_counts = {'COLD': NUM_ROWS // 3, 'WARM': NUM_ROWS // 3, 'HOT': NUM_ROWS // 3}
# Add any remainder to COLD
remainder = NUM_ROWS - sum(class_counts.values())
class_counts['COLD'] += remainder

rows = []

# Helper to clip numeric ranges
def clip(val, low, high):
    return max(low, min(high, val))

# Define mean and std for each feature per class (values chosen to be realistic and overlapping)
feature_specs = {
    'COLD': {
        'total_views': (10, 30),
        'total_favourites': (1, 5),
        'total_enquiries': (0, 2),
        'total_dwell_time': (200, 400),
        'engagement_score': (15, 20),
        'recency_score': (15, 25),
        'intent_score': (10, 20),
    },
    'WARM': {
        'total_views': (60, 30),
        'total_favourites': (10, 10),
        'total_enquiries': (3, 4),
        'total_dwell_time': (1000, 600),
        'engagement_score': (45, 15),
        'recency_score': (45, 15),
        'intent_score': (35, 15),
    },
    'HOT': {
        'total_views': (120, 40),
        'total_favourites': (30, 10),
        'total_enquiries': (12, 5),
        'total_dwell_time': (3000, 800),
        'engagement_score': (80, 10),
        'recency_score': (80, 10),
        'intent_score': (85, 10),
    },
}

for label, count in class_counts.items():
    specs = feature_specs[label]
    for _ in range(count):
        total_views = int(clip(random.normal(specs['total_views'][0], specs['total_views'][1]), 0, 200))
        total_favourites = int(clip(random.normal(specs['total_favourites'][0], specs['total_favourites'][1]), 0, 50))
        total_enquiries = int(clip(random.normal(specs['total_enquiries'][0], specs['total_enquiries'][1]), 0, 30))
        total_dwell_time = int(clip(random.normal(specs['total_dwell_time'][0], specs['total_dwell_time'][1]), 0, 5000))
        engagement_score = round(clip(random.normal(specs['engagement_score'][0], specs['engagement_score'][1]), 0, 100), 2)
        recency_score = round(clip(random.normal(specs['recency_score'][0], specs['recency_score'][1]), 0, 100), 2)
        intent_score = round(clip(random.normal(specs['intent_score'][0], specs['intent_score'][1]), 0, 100), 2)
        rows.append({
            'total_views': total_views,
            'total_favourites': total_favourites,
            'total_enquiries': total_enquiries,
            'total_dwell_time': total_dwell_time,
            'engagement_score': engagement_score,
            'recency_score': recency_score,
            'intent_score': intent_score,
            'label': label,
        })

df = pd.DataFrame(rows)
# Shuffle rows to avoid any ordering bias
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

df.to_csv(OUTPUT_PATH, index=False)
print(f'Generated {len(df)} rows with class distribution:')
print(df['label'].value_counts().to_dict())
print(f'Data saved to {OUTPUT_PATH}')

