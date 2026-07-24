import urllib.request
import json
import re

html = urllib.request.urlopen(urllib.request.Request("https://html.duckduckgo.com/html/?q=CGNA+logo", headers={'User-Agent': 'Mozilla/5.0'})).read().decode('utf-8')
urls = re.findall(r'src="([^"]+)"', html)
print(urls)
