import time
import pandas as pd
from .collect import collect_data
from matplotlib import pyplot as plt
from prophet import Prophet
import json
import warnings

warnings.simplefilter(action='ignore', category=FutureWarning)

class Trainer:
    def __init__(self, longitude, latitude, train_duration, from_date_timestamp, prediction_interval, sid):
        with open("db/mapped_data.json", "r") as f:
            mdata = json.load(f)
            if (sid not in list(mdata["data"].keys())):
                collect_data(longitude, latitude, from_date_timestamp, train_duration)
                self.__init__(longitude, latitude, train_duration, from_date_timestamp, prediction_interval, sid)
                return
            else:
                print(str(train_duration), list(mdata["data"][sid].keys()), str(train_duration) not in list(mdata["data"][sid].keys()))
                if (str(train_duration) not in list(mdata["data"][sid].keys())):
                    collect_data(longitude, latitude, from_date_timestamp, train_duration)
                    self.__init__(longitude, latitude, train_duration, from_date_timestamp, prediction_interval, sid)
                    return                    
                else:
                    self.data = mdata["data"][sid][str(train_duration)]
        self.frame = pd.DataFrame.from_dict(self.data, orient="index")
        self.frame.replace("-", 0, inplace=True)
        self.prediction_interval = prediction_interval

    def get_all_attributes(self):
        return list(self.data['day_1'].keys())

    def get_forecast(self, attribute):
        self.attribute = attribute

        model = Prophet(yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=False)
        model.add_seasonality(name='monthly', period=30.5, fourier_order=5)

        cp_frame = self.frame.copy()
        cp_frame.rename(columns={attribute: 'y'}, inplace=True)
        cp_frame['ds'] = pd.to_datetime(cp_frame['timestamp'], unit='s')

        model.fit(cp_frame)

        future = model.make_future_dataframe(periods=self.prediction_interval)

        forecast = model.predict(future)

        return [forecast, model]

    def plot_model(self, forecast, model, attribute, prediction_interval):
        fig = model.plot(forecast)
        plt.title(f'Prediction for {attribute} in the Next {prediction_interval} Days')
        plt.xlabel('Date')
        plt.ylabel('Values')
        return fig

    def get_all_forecasts(self):
        forecasts = {}
        for attribute in self.get_all_attributes()[:-1]:
            forecast, model = self.get_forecast(attribute)
            forecasts[attribute] = forecast.to_json(orient='records')
        return json.dumps(forecasts)