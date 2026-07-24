import urllib.request
import json

url = "https://pt.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=Centro_de_Gerenciamento_da_Navega%C3%A7%C3%A3o_A%C3%A9rea&format=json&pithumbsize=500"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    pages = data['query']['pages']
    for page_id in pages:
        if 'thumbnail' in pages[page_id]:
            img_url = pages[page_id]['thumbnail']['source']
            print("Found:", img_url)
            urllib.request.urlretrieve(img_url, "public/cgna.png")
            break
