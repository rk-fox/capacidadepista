import urllib.request
import urllib.parse
import json
import re

def search_images(query):
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            print("Fetched DDG HTML")
    except Exception as e:
        print("Error fetching DDG:", e)

search_images("CGNA DECEA logo png")
