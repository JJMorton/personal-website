"""
Defines the endpoints available (i.e. the valid paths that users can make requests to),
and their responses.
"""

from flask import render_template

from . import app


@app.route("/")
def home():
    return render_template("home/index.html", title="Home")
