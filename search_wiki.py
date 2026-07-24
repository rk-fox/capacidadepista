import urllib.request
import json
import urllib.parse

# Get imageinfo from wikimedia commons
title = "File:Brasão_do_Centro_de_Gerenciamento_da_Navegação_Aérea.png"
url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(e)
