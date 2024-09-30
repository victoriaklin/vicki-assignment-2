import numpy as np

class KMeans:
    def __init__(self, n_clusters=3, init_method='random'):
        self.n_clusters = n_clusters
        self.init_method = init_method
        self.centroids = None
        self.labels = None
        self.initialized = False

    def initialize_centroids(self, data, manual_centroids=[]):
        if self.init_method == 'random':
            self.centroids = data[np.random.choice(data.shape[0], self.n_clusters, replace=False)]
        elif self.init_method == 'farthest':
            self.centroids = self.initialize_farthest_first(data)
        elif self.init_method == 'kmeans++':
            self.centroids = self.initialize_kmeans_plus_plus(data)
        elif self.init_method == 'manual' and manual_centroids:
            self.centroids = np.array(manual_centroids)

        self.initialized = True

    def initialize_farthest_first(self, data):
        centroids = [data[np.random.randint(len(data))]]
        for _ in range(1, self.n_clusters):
            distances = np.min([np.linalg.norm(data - c, axis=1) for c in centroids], axis=0)
            next_centroid = data[np.argmax(distances)]
            centroids.append(next_centroid)
        return np.array(centroids)

    def initialize_kmeans_plus_plus(self, data):
        centroids = [data[np.random.randint(len(data))]]
        for _ in range(1, self.n_clusters):
            distances = np.min([np.linalg.norm(data - c, axis=1)**2 for c in centroids], axis=0)
            probabilities = distances / np.sum(distances)
            next_centroid = data[np.random.choice(len(data), p=probabilities)]
            centroids.append(next_centroid)
        return np.array(centroids)

    def step(self, data):
        # Assign clusters based on current centroids
        self.labels = np.argmin(np.linalg.norm(self.centroids[:, np.newaxis] - data, axis=2), axis=0)
        
        # Update centroids based on the mean of the clusters
        new_centroids = np.array([data[self.labels == i].mean(axis=0) for i in range(self.n_clusters)])
        
        # Check for convergence (if centroids have not changed)
        if np.all(new_centroids == self.centroids):
            return False  # Converged
        else:
            self.centroids = new_centroids
            return True  # Not converged yet

    def run_to_convergence(self, data):
        converged = False
        while not converged:
            converged = not self.step(data)