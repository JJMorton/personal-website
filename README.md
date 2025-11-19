**My personal website**

This is essentially just a simple static website.
The backend (of which there is almost none) is written in Python using *Flask* and *Jinja2* templating.
The frontend uses a touch of [vuejs](https://vuejs.org/) for the user input elements where things need to be reactive, but it is not used anywhere else to keep the site lean.

---

The `justfile` contains commands to initialise and run the server -- use the [just](https://github.com/casey/just) command runner to execute them if you wish.
Most importantly:
- `just init` will create the Python virtual environment and install the `prettier` linter.
- `just debug` will start the server in debug mode.
I use [uv](https://docs.astral.sh/uv/) to manage and compile python projects, so these commands require that.

