import urllib.request
import json
import re

url = "https://pt.wikipedia.org/w/api.php?action=query&prop=images&titles=Centro_de_Gerenciamento_da_Navega%C3%A7%C3%A3o_A%C3%A9rea&format=json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    print(data)
