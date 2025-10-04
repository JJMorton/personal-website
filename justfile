init:
	uv venv
	uv sync
	npm install

debug:
	# Running debug server with flask
	uv run flask --app website:app run --debug --host 0.0.0.0

lint:
	# Linting Python files with ruff
	uvx ruff format main.py
	find src/ -name '*.py' -exec uvx ruff format {} \;

	# Linting HTML, CSS and JS with prettier
	npx prettier src/website/ --write

todo:
	# Finding TODO comments
	grep 'TODO' $(find src/website/ -type f)
