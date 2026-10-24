#!/usr/bin/env python3
"""
The local universe: test changes across every site before publishing them.

1. Put every repo side by side in one folder, named exactly as on GitHub:
     pixel-universe/Glacial  pixel-universe/City  pixel-universe/Senate  pixel-universe/Universe  ...
2. From that folder run:   python3 Universe/tools/serve.py
3. Open http://localhost:8000/Universe/

Every page is served from your local copies, and every link or script pointing at
https://dvexperiments.github.io/ is pointed at this server instead, so a site loads its
neighbours from your folder too. A site you haven't cloned falls back to the live one.
Nothing is changed on disk.
"""
import http.server, os, sys, urllib.request

LIVE = 'https://dvexperiments.github.io/'
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.getcwd()
REWRITE = ('.html', '.js', '.css', '.mjs', '.json', '.md')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def do_GET(self):
        path = self.path.split('?')[0].split('#')[0]
        local = os.path.join(ROOT, path.lstrip('/'))
        if os.path.isdir(local):
            local = os.path.join(local, 'index.html')
        if not os.path.exists(local):
            return self.fetch_live(path)
        if not local.endswith(REWRITE):
            return super().do_GET()
        with open(local, 'rb') as f:
            body = f.read().replace(LIVE.encode(), b'/')
        self.reply(body, self.guess_type(local))

    def fetch_live(self, path):
        site = path.lstrip('/').split('/')[0]
        if not site:
            self.send_error(404, 'Open /Universe/')
            return
        try:
            with urllib.request.urlopen(LIVE + path.lstrip('/')) as r:
                body, kind = r.read(), r.headers.get('Content-Type', 'application/octet-stream')
            if path.endswith(REWRITE):
                body = body.replace(LIVE.encode(), b'/')
            self.log_message('live   %s (not cloned)', path)
            self.reply(body, kind)
        except Exception as e:
            self.send_error(404, 'Not here and not live: %s' % e)

    def reply(self, body, kind):
        self.send_response(200)
        self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    print('The local universe is at http://localhost:%d/Universe/  (serving %s)' % (PORT, ROOT))
    http.server.ThreadingHTTPServer(('', PORT), Handler).serve_forever()
