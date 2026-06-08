import sqlite3
import os
import shutil
import time

db_path = 'database/audio_intelligence.db'
if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print("Deleted database file.")
    except Exception as e:
        print(f"Could not delete db: {e}")

for d in ['uploads', 'transcripts', 'chunks']:
    if os.path.exists(d):
        try:
            shutil.rmtree(d, ignore_errors=True)
            print(f"Cleared directory {d}")
        except Exception as e:
            print(f"Could not fully clear {d}: {e}")
        os.makedirs(d, exist_ok=True)
print("Wipe complete.")

import urllib.request
import urllib.parse
print("Submitting new run for https://www.youtube.com/watch?v=u-CoAXse1YM")
data = urllib.parse.urlencode({'url': 'https://www.youtube.com/watch?v=u-CoAXse1YM'}).encode('utf-8')
req = urllib.request.Request('http://localhost:8000/upload', data=data)
try:
    with urllib.request.urlopen(req) as f:
        print("Success!", f.read().decode('utf-8'))
except Exception as e:
    print("API Error:", e)
