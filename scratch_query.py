import sqlite3
import os
import shutil

db_path = 'database/audio_intelligence.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT audio_id, original_filename FROM audio_sessions")
sessions = c.fetchall()
print("Sessions:", sessions)

count = 0
for session in sessions:
    audio_id, filename = session
    if "never gonna give you up" in filename.lower():
        print(f"Deleting session {audio_id}: {filename}")
        c.execute("DELETE FROM audio_sessions WHERE audio_id = ?", (audio_id,))
        count += 1
        # Also remove dirs if they exist
        for d in ['uploads', 'transcripts', 'chunks']:
            path = os.path.join(d, audio_id)
            if os.path.exists(path):
                shutil.rmtree(path)
                print(f"Deleted {path}")
conn.commit()
conn.close()
print(f"Deleted {count} sessions.")
