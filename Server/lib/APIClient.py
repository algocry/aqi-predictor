import requests
import json
import math
from base64 import b64decode, b64encode
from datetime import datetime, timezone

class AQIClient:
    def __init__(self):
        BASE_URL = "https://airquality.cpcb.gov.in"
        self.aqi_station_all_india_url = f"{BASE_URL}/aqi_dashboard/aqi_station_all_india"
        self.aqi_all_parameters_url = f"{BASE_URL}/aqi_dashboard/aqi_all_Parameters"

        self.headers = {
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Referer": BASE_URL
        }

        # Bypass Captcha
        ## BYPASS NOTE: So basically the API checks if captcha token is passed, and NOT if it's valid
        self.cookies = {
            "ccr_public": "A"
        }

    # Makes HTTP Post request and returns base64 decoded response
    def mkrqs(self, url, headers, data, cookies):
        resp = requests.post(url=url, headers=headers, data=data, cookies=cookies)
        data = b64decode(resp.content)
        return json.loads(data)

    # Returns all station ids, locations etc.
    def get_all_india(self):
        body = "e30="
        try:
            return self.mkrqs(self.aqi_station_all_india_url, self.headers, body, self.cookies)["stations"]
        except Exception:
            return self.mkrqs(self.aqi_station_all_india_url, self.headers, body, self.cookies)

    # Returns detail of particular station
    def get4station(self, sid, date):
        raw_body = json.dumps({
            "station_id": sid,
            "date": date
        })
        data = b64encode(raw_body.encode()).decode('utf-8')
        return self.mkrqs(self.aqi_all_parameters_url, self.headers, data, self.cookies)

    # converts current date to ISO 8601 format
    def ts2iso8601(self, timestamp):
        datetime_object = datetime.utcfromtimestamp(timestamp / 1000)
        return datetime_object.strftime('%Y-%m-%dT%H:%M:%SZ')

    def get_nearest_station(self, coords):
        ## get all data first
        stations_ = {}
        cities = self.get_all_india()
        X1, Y1 = [float(coords[0]), float(coords[1])]
        for stations in cities:
            for station in stations["stationsInCity"]:
                # find euclideon distance between this station coords vs given coords
                X2, Y2 = [float(station["longitude"]), float(station["latitude"])]
                distance = math.sqrt(((X1-X2)**2) + ((Y1-Y2)**2))
                stations_[station["id"]] = distance
        sorted_stations = dict(sorted(stations_.items(), key=lambda x: x[1]))
        return list(sorted_stations.keys())[0]