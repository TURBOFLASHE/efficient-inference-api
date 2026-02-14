import requests
import time
import numpy as np

url = "http://127.0.0.1:8000/predict"

dummy_input = np.random.rand(28,28).tolist()

num_requests = 200
latencies = []

for _ in range(num_requests):
    start = time.time()
    requests.post(url, json=dummy_input)
    end = time.time()
    latencies.append((end-start)*1000)

print("Average latency:", sum(latencies)/len(latencies), "ms")
