#!/usr/bin/env python3
import os
import time
import sqlite3
import requests
import json
from datetime import datetime

# Basic Twitter API v2 search (requires Bearer token)
BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN')
DATABASE = 'jobs.db'

def search_tweets(query, max_results=10):
    if not BEARER_TOKEN:
        print("Twitter Bearer Token not configured")
        return []
    
    url = "https://api.twitter.com/2/tweets/search/recent"
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}
    params = {
        "query": query,
        "max_results": max_results,
        "tweet.fields": "created_at,author_id,public_metrics"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            return response.json().get('data', [])
        else:
            print(f"API Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"Search error: {e}")
        return []

def save_jobs(tweets):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    for tweet in tweets:
        try:
            cursor.execute("""
                INSERT OR IGNORE INTO job_postings 
                (tweet_id, content, author, url, created_at, keywords)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                tweet['id'],
                tweet['text'],
                tweet.get('author_id', ''),
                f"https://twitter.com/i/status/{tweet['id']}",
                tweet.get('created_at', ''),
                'hiring,job,remote,developer'
            ))
        except Exception as e:
            print(f"Save error: {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    keywords = ["hiring", "job opening", "we're hiring", "remote job"]
    query = " OR ".join([f'"{kw}"' for kw in keywords])
    
    tweets = search_tweets(query)
    if tweets:
        save_jobs(tweets)
        print(f"Saved {len(tweets)} job postings")
    else:
        print("No tweets found")
