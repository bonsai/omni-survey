
import { Database } from "bun:sqlite";

const db = new Database("/mnt/c/Users/dance/Documents/MEGA/uber-novels/data/uber_research.db");

// Ensure table exists
db.run(`
  CREATE TABLE IF NOT EXISTS survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
  )
`);

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") return new Response(null, { headers });

    if (url.pathname === "/submit" && req.method === "POST") {
      try {
        const body = await req.json();
        const content = body.content || "";
        const metadata = JSON.stringify(body.metadata || {});
        
        db.run("INSERT INTO survey_responses (content, metadata) VALUES (?, ?)", [content, metadata]);
        
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...headers, "Content-Type": "application/json" } 
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { 
          status: 500, 
          headers: { ...headers, "Content-Type": "application/json" } 
        });
      }
    }

    if (url.pathname === "/results" && req.method === "GET") {
      const results = db.query("SELECT * FROM survey_responses ORDER BY timestamp DESC").all();
      return new Response(JSON.stringify(results), { 
        headers: { ...headers, "Content-Type": "application/json" } 
      });
    }

    // Simple frontend
    return new Response(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Uber Driver Confessions</title>
        <style>
          body { font-family: sans-serif; background: #f0f2f5; display: flex; justify-content: center; padding: 20px; }
          .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; width: 100%; }
          h1 { color: #333; font-size: 1.5rem; margin-bottom: 1rem; }
          p { color: #666; margin-bottom: 1.5rem; line-height: 1.6; }
          textarea { width: 100%; height: 150px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; margin-bottom: 1rem; font-size: 1rem; }
          button { background: #000; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; }
          button:hover { background: #333; }
          .success { color: green; display: none; margin-top: 1rem; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>誰にも言えない事情をここに</h1>
          <p>ウーバーしかやることがない、追い詰められた状況。その本音を、匿名で書き残してください。あなたの言葉が、誰かの物語になります。</p>
          <textarea id="content" placeholder="例：会社をクビになり、貯金が底をついた。でも、バイクを走らせている時だけは自由だ..."></textarea>
          <button onclick="submit()">送信する</button>
          <div id="msg" class="success">送信しました。ありがとうございます。</div>
        </div>
        <script>
          async function submit() {
            const content = document.getElementById('content').value;
            if (!content) return alert('何か書いてください');
            const res = await fetch('/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content, metadata: { ua: navigator.userAgent } })
            });
            if (res.ok) {
              document.getElementById('msg').style.display = 'block';
              document.getElementById('content').value = '';
            }
          }
        </script>
      </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
