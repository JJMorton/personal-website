debug:
	# Running debug server with flask
	uv run flask --app website:app run --debug

lint:
	# Linting Python files with ruff
	uvx ruff format main.py
	find src/ -name '*.py' -exec uvx ruff format {} \;
