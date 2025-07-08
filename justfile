# Run debug server with flask
debug:
	uv run flask --app website:app run --debug

lint:
	# Linting Python files with ruff
	find src/ -name '*.py' -exec uvx ruff format {} \;
