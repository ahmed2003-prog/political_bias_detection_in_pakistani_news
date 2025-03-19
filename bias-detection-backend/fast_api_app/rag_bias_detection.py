import pandas as pd
import psycopg2
from llama_index.core import GPTVectorStoreIndex
from sentence_transformers import SentenceTransformer, util
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
import re
import os
import enchant
from supabase import create_client

class BiasDetectionSystem:
    def __init__(self, supabase_client, emb_model="sentence-transformers/all-MiniLM-L6-v2",
                 roberta_model="cardiffnlp/twitter-roberta-base-sentiment"):
        self.emb_model = SentenceTransformer(emb_model)
        self.whitelist = {
            # Political Parties
            "pmln", "pti", "ppp", "mqm", "jui-f", "ji", "anp", "bnp", "tlyp", "aml", "juif", "tlp", "psp", "gda", "pta",  
            "pak sarzameen party", "grand democratic alliance", "pakistan muslim league", "pakistan tehreek-e-insaf",  
            "pakistan people's party", "mutahida qaumi movement", "pakistan democratic movement", "balochistan national party",  
            "national party", "pakistan awami tehreek", "pakistan rah-e-haq party", "mqm-p", "mqm-l", "sunni tehreek",  

            # Government & Judiciary
            "sc", "supreme court", "hc", "high court", "ecp", "election commission", "parliament", "senate", "assembly",  
            "speaker", "deputy speaker", "law ministry", "attorney general", "chief justice", "district court",  

            # Political Figures  
            "nawaz", "imran", "bhutto", "benazir", "zardari", "bilawal", "shahbaz", "maryam", "asad umar", "fawad chaudhry",  
            "shah mahmood qureshi", "chaudhry pervaiz elahi", "rana sanaullah", "murad saeed", "pervaiz khattak",  
            "jahangir tareen", "sheikh rashid", "fazlur rehman", "hafiz saeed", "asad qaiser",  

            # Law Enforcement & Security  
            "fbr", "nab", "fia", "isi", "army", "coas", "dg isi", "dg ispr", "ispr", "pak army", "rangers",  
            "pak navy", "pak air force", "igp", "ssp", "dsp", "shc", "phc", "bfc", "fc", "ctd", "counter terrorism department",  

            # Government Titles & Positions  
            "cm", "pm", "mna", "mpa", "mps", "president", "governor", "cabinet", "foreign minister", "interior minister",  
            "defense minister", "chief minister", "opposition leader", "finance minister", "planning commission",  

            # Economic & Financial Institutions  
            "state bank", "sbp", "imf", "world bank", "finance division", "secp", "oecd", "budget", "tax", "inflation",  
            "trade deficit", "stock exchange", "psx", "kse", "forex", "remittances",  

            # Media & Regulatory Bodies  
            "pemra", "pta", "ppra", "ndma", "pmd", "met office", "information ministry", "journalist", "anchor",  
            "media ban", "press conference", "freedom of press",  

            # Other Relevant Terms  
            "cpec", "bri", "gawadar", "karot", "dams", "mangla", "tarbela", "diamir", "motorway", "highway", "tunnel",  
            "chinese investment", "foreign direct investment", "trade agreements", "free trade zone"
        }
        self.dictionary = enchant.Dict("en_US")
        self.supabase = supabase_client
        self.tokenizer = AutoTokenizer.from_pretrained(roberta_model)
        self.roberta_model = AutoModelForSequenceClassification.from_pretrained(roberta_model)

    def is_gibberish(self, text):
        words = re.findall(r'\b\w+\b', text)
        if not words:
            return True
        valid_word_count = sum(1 for word in words if self.dictionary.check(word))
        return (valid_word_count / len(words)) < 0.15

    def batch_upload_to_supabase(self, df, batch_size=100):
        data_list = []
        for _, row in df.iterrows():
            data_list.append({
                "full_text": row["full_text"],
                "embedding": row["embedding"],
                "section": row["Section"],
                "date": str(row["Date"]),
                "source": row["Source"],
                "sentiment": row["Sentiment"],
                "bias_score": row["Bias_Score"],
                "bias_label": row["Bias_Label"]
            })

            if len(data_list) == batch_size:
                self.supabase.table("bias_news_data").insert(data_list).execute()
                data_list.clear()

        if data_list:
            self.supabase.table("bias_news_data").insert(data_list).execute()

    def preprocess_dataset(self, file_path, output_path="news_with_embeddings.csv"):
        df = pd.read_csv(file_path)

        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')

        df['full_text'] = df['Story Heading'].fillna('') + ' ' + df['Story Excerpt'].fillna('')

        df['embedding'] = df['full_text'].apply(lambda x: self.emb_model.encode(x).tolist())

        return df


    def query_supabase(self, query, n_results=5):
        query_embedding = self.emb_model.encode(query)
        response = self.supabase.table("news_embeddings").select("*").execute()
        records = response.data
        embeddings = [record["embedding"] for record in records]
        similarities = util.cos_sim(query_embedding, embeddings)
        top_indices = similarities[0].argsort(descending=True)[:n_results]
        return [records[i] for i in top_indices]

    def predict_bias(self, text):
        if not text.strip() or self.is_gibberish(text):
            return {"bias_label": "Unknown", "bias_score": 0, "bias_classification": "Out of Scope", "confidence": 0.0}

        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            outputs = self.roberta_model(**inputs).logits
        probabilities = torch.nn.functional.softmax(outputs, dim=-1).squeeze().tolist()
        labels = ["Negative", "Neutral", "Positive"]
        max_index = probabilities.index(max(probabilities))
        bias_score = round(probabilities[max_index] * 100)

        bias_classification = (
            "Highly Unbiased" if bias_score <= 10 else
            "Slightly Unbiased" if bias_score <= 20 else
            "Moderately Unbiased" if bias_score <= 40 else
            "Neutral" if bias_score <= 50 else
            "Moderately Biased" if bias_score <= 60 else
            "Biased" if bias_score <= 70 else
            "Highly Biased"
        )

        return {
            "bias_label": labels[max_index],
            "bias_score": bias_score,
            "bias_classification": bias_classification,
            "confidence": probabilities[max_index]
        }
