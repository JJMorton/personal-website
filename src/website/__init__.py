# Create the flask server

from flask import Flask

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/static/",
)


from . import routes
