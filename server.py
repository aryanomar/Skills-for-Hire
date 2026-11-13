"""
P25: Skills for Hire - Local Development Server
Run this file in VS Code terminal using: python server.py
"""
import http.server
import socketserver
import webbrowser

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    url = f"http://localhost:{PORT}"
    print(f"======================================================")
    print(f" P25 Prototype running at: {url}")
    print(f" Press Ctrl+C in this terminal to stop the server.")
    print(f"======================================================")
    webbrowser.open(url)
    httpd.serve_forever()