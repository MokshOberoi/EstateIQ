import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Paths
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'lead_training_data.csv')
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, 'lead_classifier.joblib')

print('Loading data...')
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"Training data not found at {DATA_PATH}")

df = pd.read_csv(DATA_PATH)

# Features and label
X = df.drop(columns=['label'])
y = df['label']

print(f"Dataset size: {len(df)} rows")
print('Class distribution:', y.value_counts().to_dict())

# Stratified split (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)
print(f"Train size: {len(y_train)} rows, Test size: {len(y_test)} rows")

# Train RandomForest (deterministic seed)
clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
clf.fit(X_train, y_train)

# Evaluation
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
report = classification_report(y_test, y_pred, output_dict=True)

print(f"Accuracy on test set: {acc:.4f}")
print('Classification report:')
for label, metrics in report.items():
    if label in ('accuracy', 'macro avg', 'weighted avg'):
        continue
    print(f"{label}: precision {metrics['precision']:.2f}, recall {metrics['recall']:.2f}, f1 {metrics['f1-score']:.2f}, support {int(metrics['support'])}")

# Save model
joblib.dump(clf, MODEL_PATH)
print(f"Model saved to {MODEL_PATH}")