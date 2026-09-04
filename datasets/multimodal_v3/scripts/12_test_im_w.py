import requests
import time

url_orig = "https://a0.muscache.com/pictures/miso/Hosting-108061/original/9f3e7db0-9239-41ae-bee3-c8b7e501b52b.jpeg"
url_w480 = url_orig + "?im_w=480"
url_w720 = url_orig + "?im_w=720"

headers = {'User-Agent': 'Mozilla/5.0'}

t0 = time.time()
r0 = requests.get(url_orig, headers=headers)
t0_dur = time.time() - t0
print(f"Original: {len(r0.content)} bytes in {t0_dur:.2f}s")

t1 = time.time()
r1 = requests.get(url_w480, headers=headers)
t1_dur = time.time() - t1
print(f"im_w=480: {len(r1.content)} bytes in {t1_dur:.2f}s (Status: {r1.status_code})")
