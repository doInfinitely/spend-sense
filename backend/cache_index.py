# backend/cache_index.py
import os
import pandas as pd
from glob import glob
import json

CSV_DIR = os.path.join(os.path.dirname(__file__), "..", "csvs")
INDEX_PATH = os.path.join(os.path.dirname(__file__), "index.json")

def build_index():
    index = []
    for file_path in glob(os.path.join(CSV_DIR, "*.csv")):
        df = pd.read_csv(file_path, parse_dates=["transactionDateTime"])
        if df.empty:
            continue
        cid = str(df.iloc[0]['customerId'])
        credit = float(df.iloc[0]['creditLimit'])
        country = str(df.iloc[0]['acqCountry'])
        txn_count = len(df)
        window = (df["transactionDateTime"].max() - df["transactionDateTime"].min()).days
        spend = df['transactionAmount'][df['transactionAmount'] > 0].sum()
        index.append({
            "customerId": cid,
            "creditLimit": credit,
            "acqCountry": country,
            "csvPath": file_path,
            "txnCount": txn_count,
            "daysWindow": window,
            "totalSpend": spend,
        })
    with open(INDEX_PATH, "w") as f:
        json.dump(index, f, indent=2)

if __name__ == "__main__":
    build_index()

