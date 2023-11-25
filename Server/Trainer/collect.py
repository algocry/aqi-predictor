import os
import sys
from rich.progress import track

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from lib.APIClient import AQIClient

def collect_data(longitude, latitude, initial_ts, days_count):
    client = AQIClient()
    CHECK_INTERVAL = 86400000
    periodic_aqi_data = {}
    sid = client.get_nearest_station([longitude, latitude])
    for i in track(range(days_count), description="Downloading training data"):
        iter_aqi_data = client.get4station(sid, client.ts2iso8601(initial_ts))
        period = f"day_{i+1}"
        periodic_aqi_data[period] = {}
        periodic_aqi_data[period]["AQI"] = iter_aqi_data["aqi"]["value"]
        
        for metric in iter_aqi_data["metrics"]:
            periodic_aqi_data[period][metric["name"]] = metric["avg"]

        periodic_aqi_data[period]["timestamp"] = int(initial_ts/1000)
        initial_ts -= CHECK_INTERVAL

    return periodic_aqi_data