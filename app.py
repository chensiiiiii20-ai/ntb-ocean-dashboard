from flask import Flask, render_template, jsonify
import pandas as pd
import os

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/data")
def data():
    df = pd.read_csv("data.csv")
    return jsonify(df.to_dict(orient="records"))

@app.route("/history")
def history():
    df = pd.read_csv("history.csv")
    return jsonify(df.to_dict(orient="records"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
