from flask import Flask, request, jsonify
from lib.APIClient import AQIClient
from flask_cors import CORS
from Trainer.train import Trainer
import json
import threading

app = Flask(__name__)
CORS(app)
client = AQIClient()

yet_mapping_nsid = []

def start_trainer(longitude, latitude, train_duration, from_date_timestamp, prediction_interval, sid):
    trainer = Trainer(longitude, latitude, train_duration, from_date_timestamp, prediction_interval)
    forecasts = trainer.get_all_forecasts()
    with open("db/mapped.json", "r+") as f:
        data = json.load(f)
        data["stations"][sid] = forecasts
        f.seek(0)
        json.dump(data, f, indent=2)
        f.truncate()
    yet_mapping_nsid.remove(sid)

@app.route('/station', methods=["GET"])
def get_station():
    timestamp = int(request.args['ts'])
    longitude = request.args['longitude']
    latitude = request.args['latitude']
    nsid = client.get_nearest_station([longitude, latitude])
    return jsonify(client.get4station(nsid, client.ts2iso8601(timestamp)))

@app.route('/all', methods=["GET"])
def get_all():
    return jsonify(client.get_all_india())

@app.route('/stationForecast', methods=["GET"])
def get_station_forecast():
    timestamp = int(request.args['ts'])
    longitude = request.args['longitude']
    latitude = request.args['latitude']
    train_duration = int(request.args['td'])
    prediction_interval = int(request.args['pi'])

    from_date_timestamp = int(timestamp)

    response = None
    nsid = client.get_nearest_station([longitude, latitude])
    with open("db/mapped.json", "r") as f:
        data = json.load(f)
        if nsid in list(data["stations"].keys()):
            response = {
                "status": 101,
                "data": data["stations"][nsid]
            }
        else:
            response = {
                "status": 102,
                "data": "Your area does not appear mapped. Mapping your area..."
            }
         
            if nsid not in yet_mapping_nsid:
                yet_mapping_nsid.append(nsid)
                t1 = threading.Thread(target=start_trainer, args=(longitude, latitude, train_duration, from_date_timestamp, prediction_interval, nsid))
                t1.start()

    return jsonify(response)

@app.route('/', methods=["GET"])
def get_home():
    return '1'

app.run(host= '0.0.0.0', port=5000)
