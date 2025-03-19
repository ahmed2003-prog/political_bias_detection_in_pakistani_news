from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import uvicorn
import os
from supabase import create_client, Client
from fast_api_app.rag_bias_detection import BiasDetectionSystem


# Supabase client initialization
SUPABASE_URL = "https://ojswfikyzkassfynbbkr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qc3dmaWt5emthc3NmeW5iYmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NTY2ODcsImV4cCI6MjA1NzQzMjY4N30.auGmHOubWEbHXDYsVrIhDfxiMa-jsFapUyLjuY2pDWY"

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize BiasDetectionSystem
bias_method = BiasDetectionSystem(supabase_client)
# FastAPI app initialization
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NewsInput(BaseModel):
    news_text: str

class DatasetUpload(BaseModel):
    file_path: str

@app.post("/analyze_news_bias")
def analyze_news_bias(news: NewsInput):
    if not news.news_text.strip():
        raise HTTPException(status_code=400, detail="News text cannot be empty.")

    if bias_method.is_gibberish(news.news_text):
        return {
            "news_text": news.news_text,
            "bias_analysis": {
                "bias_label": "Unknown",
                "bias_score": 0,
                "bias_classification": "Out of Scope",
                "confidence": 0.0
            },
            "message": "The input was classified as gibberish or not relevant."
        }

    bias_prediction = bias_method.predict_bias(news.news_text)

    return {
        "news_text": news.news_text,
        "bias_analysis": bias_prediction
    }

@app.post("/upload_dataset")
def upload_dataset(upload: DatasetUpload):
    try:
        df = bias_method.preprocess_dataset(upload.file_path)

        bias_method.batch_upload_to_supabase(df)
        return {"message": "Dataset uploaded successfully!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/bias_trends")
def bias_trends(aggregation: str = "daily"):
    try:
        all_data = []
        start_index = 0
        batch_size = 1000

        # Fetch all data in batches to handle Supabase limit
        while True:
            response = supabase_client.table("bias_news_data").select("date, bias_score, source").range(start_index, start_index + batch_size - 1).execute()
            data = response.data

            if not data:
                break

            all_data.extend(data)
            start_index += batch_size

        # Convert to DataFrame
        df = pd.DataFrame(all_data)
        df["date"] = pd.to_datetime(df["date"])
        df["bias_score"] = df["bias_score"].astype(float)
        df = df.dropna(subset=["bias_score"])  # Remove null bias scores

        # Assign unique ID to each date
        unique_dates = {date: idx + 1 for idx, date in enumerate(sorted(df["date"].unique()))}
        df["date_id"] = df["date"].map(unique_dates)

        # Group by date_id and calculate the mean bias score
        aggregated_bias = df.groupby("date_id")["bias_score"].mean().reset_index()

        # Map date_id back to the original date
        aggregated_bias["date"] = aggregated_bias["date_id"].map({v: k for k, v in unique_dates.items()})

        # Convert to JSON
        trend_data = {
            row["date"].strftime("%Y-%m-%d"): row["bias_score"]
            for _, row in aggregated_bias.iterrows()
        }

        return {
            "bias_trends": trend_data,
            "min_bias": aggregated_bias["bias_score"].min(),
            "max_bias": aggregated_bias["bias_score"].max(),
            "trend_direction": "Increasing" if aggregated_bias["bias_score"].iloc[-1] > aggregated_bias["bias_score"].iloc[0] else "Decreasing"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)