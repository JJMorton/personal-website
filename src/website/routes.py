"""
Defines the endpoints available (i.e. the valid paths that users can make requests to),
and their responses.
"""

from flask import render_template

from . import app


@app.route("/")
def home():
    return render_template("home/index.html", id="home")


@app.route("/other")
def other():
    return render_template("other/index.html", id="other", title="Other")


@app.route("/contact")
def contact():
    return render_template("contact/index.html", id="contact", title="Contact Me")


@app.route("/colourtest")
def colourtest():
    return render_template(
        "colourtest/index.html", id="colourtest", title="Colour Test"
    )


@app.route("/moire")
def moire():
    return render_template("moire/index.html", id="other", title="Moiré Patterns")


@app.route("/toys/test")
def toy_test():
    return render_template(
        "toys/test.html", id="other", title="Test Simulation"
    )


@app.route("/toys/doublependulum")
def toy_doublependulum():
    return render_template(
        "toys/doublependulum.html",
        id="other",
        title="Double Pendulum",
    )


@app.route("/toys/snowflake")
def toy_snowflake():
    return render_template(
        "toys/snowflake.html",
        id="other",
        title="Snowflake Automata",
    )


@app.route("/toys/fractals")
def toy_fractals():
    return render_template(
        "toys/fractals.html",
        id="other",
        title="Fractals",
    )
