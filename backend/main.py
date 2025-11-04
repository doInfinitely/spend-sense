# backend/main.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import pandas as pd
import json
from glob import glob
from fastapi.responses import JSONResponse


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR = os.path.join(BASE_DIR, "..", "csvs")
INDEX_PATH = os.path.join(BASE_DIR, "customer_index.json")

class CustomerSummary(BaseModel):
    customerId: str
    creditLimit: float
    acqCountry: str
    transactions: List[dict]

class SummaryMeta(BaseModel):
    customerId: str
    creditLimit: float
    acqCountry: str
    txnCount: int
    daysWindow: int
    totalSpend: float

@app.on_event("startup")
def load_index():
    if not os.path.exists(INDEX_PATH):
        build_index()

@app.get("/customers")
def get_customers(
    min_txns: Optional[int] = Query(None, alias="minTransactions"),
    min_days: Optional[int] = Query(None, alias="minDaysWindow"),
    min_spend: Optional[float] = Query(None, alias="minTotalSpend"),
    page: int = Query(1),
    pageSize: int = Query(20)
):
    summaries = []
    for file_path in glob(os.path.join(CSV_DIR, "*.csv")):
        df = pd.read_csv(file_path, parse_dates=['transactionDateTime'])
        if df.empty:
            continue

        txn_count = len(df)
        time_window = (df['transactionDateTime'].max() - df['transactionDateTime'].min()).days
        spend = df['transactionAmount'][df['transactionAmount'] > 0].sum()

        if min_txns and txn_count < min_txns:
            continue
        if min_days and time_window < min_days:
            continue
        if min_spend and spend < min_spend:
            continue

        cust_id = str(df.iloc[0]['customerId'])
        credit_limit = float(df.iloc[0].get('creditLimit', 0))
        acq_country = str(df.iloc[0].get('acqCountry', ''))

        records = df.sort_values('transactionDateTime').copy()
        records['transactionDateTime'] = records['transactionDateTime'].dt.strftime('%Y-%m-%d %H:%M:%S')

        txn_data = records[['transactionDateTime', 'availableMoney', 'transactionAmount']].to_dict(orient='records')

        summaries.append({
            "customerId": cust_id,
            "creditLimit": credit_limit,
            "acqCountry": acq_country,
            "transactions": txn_data
        })

    total = len(summaries)
    start = (page - 1) * pageSize
    end = start + pageSize
    paginated = summaries[start:end]
    total_pages = (total + pageSize - 1) // pageSize

    return JSONResponse(content={
        "data": paginated,
        "totalPages": total_pages
    })

def build_index():
    index = []
    for file_path in glob(os.path.join(CSV_DIR, "*.csv")):
        df = pd.read_csv(file_path, parse_dates=['transactionDateTime'])
        if df.empty:
            continue

        cust_id = str(df.iloc[0]['customerId'])
        credit_limit = float(df.iloc[0].get('creditLimit', 0))
        acq_country = str(df.iloc[0].get('acqCountry', ''))
        txn_count = len(df)
        days_window = (df['transactionDateTime'].max() - df['transactionDateTime'].min()).days
        total_spend = df['transactionAmount'][df['transactionAmount'] > 0].sum()

        index.append({
            "customerId": cust_id,
            "creditLimit": credit_limit,
            "acqCountry": acq_country,
            "txnCount": txn_count,
            "daysWindow": days_window,
            "totalSpend": total_spend
        })

    with open(INDEX_PATH, "w") as f:
        json.dump(index, f, indent=2)
