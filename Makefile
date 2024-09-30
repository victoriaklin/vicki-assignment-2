# Install dependencies
install:
	pip3 install -r requirements.txt

# Run the Flask app
run:
	FLASK_APP=app.py flask run --host=localhost --port=3000
