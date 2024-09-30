from flask import Flask, render_template, jsonify, request
import numpy as np
from kmeans import KMeans

app = Flask(__name__)

# Global variables to hold dataset and KMeans instance
current_dataset = []
kmeans = None

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/generate_dataset', methods=['GET'])
def generate_dataset():
    global current_dataset
    current_dataset = np.random.rand(100, 2)  # Generate a random 2D dataset
    return jsonify(current_dataset.tolist())


@app.route('/run_kmeans', methods=['POST'])
def run_kmeans():
    global kmeans, current_dataset

    # Get the request data from the frontend
    data = request.json
    init_method = data['method']
    step = data['step']
    num_clusters = data['num_clusters']
    manual_centroids = data.get('centroids', [])

    # Initialize the KMeans object if it's the first run or the algorithm has been reset
    if kmeans is None or not kmeans.initialized or kmeans.n_clusters != num_clusters:
        kmeans = KMeans(n_clusters=num_clusters, init_method=init_method)
        kmeans.initialize_centroids(np.array(current_dataset), manual_centroids)

    # Run one step or complete convergence based on the user's input
    if step:
        has_more_steps = kmeans.step(np.array(current_dataset))
        converged = not has_more_steps
    else:
        kmeans.run_to_convergence(np.array(current_dataset))
        converged = True

    # Return the current centroids and clusters to the frontend
    return jsonify({
        'centroids': kmeans.centroids.tolist(),
        'clusters': kmeans.labels.tolist(),
        'converged': converged
    })

if __name__ == '__main__':
    app.run(host='localhost', port=3000)