document.addEventListener("DOMContentLoaded", function () {
    let plotDiv = document.getElementById('plot');
    let currentDataset = [];
    let centroids = [];
    let clusters = [];
    let initializationMethod = "random";
    let numClusters = 3;
    let converged = false;
    let manualMode = false;

    const convergenceModal = document.getElementById('convergence-modal');
    const closeModalButton = document.querySelector('.close-button');

    // Load the initial dataset when the page loads
    generateNewDataset();

    // Event listener for initialization method dropdown
    document.getElementById('init-method').addEventListener('change', function (e) {
        initializationMethod = e.target.value;
        manualMode = initializationMethod === 'manual';
        centroids = []; // Reset centroids when initialization method changes
        clusters = []; // Reset clusters as well
        plotDataPoints(currentDataset, centroids); // Re-render the plot to reset
        if (manualMode) {
            alert('Manual Mode: Please click on the plot to select initial centroids.');
        }
    });

    // Event listener for number of clusters input
    document.getElementById('num-clusters').addEventListener('change', function (e) {
        numClusters = parseInt(e.target.value, 10);
    });

    // Event listener for Generate New Dataset button
    document.getElementById('generate-dataset').addEventListener('click', function () {
        generateNewDataset();
    });

    // Event listener for Step Through Algorithm button
    document.getElementById('step-algorithm').addEventListener('click', function () {
        if (!converged) {
            stepThroughKMeans();
        }
    });

    // Event listener for Run to Convergence button
    document.getElementById('run-to-convergence').addEventListener('click', function () {
        runToConvergence();
    });

    // Event listener for Reset Algorithm button
    document.getElementById('reset-algorithm').addEventListener('click', function () {
        resetAlgorithm();
    });

    // Event listener for closing the modal
    closeModalButton.addEventListener('click', function () {
        hideConvergenceModal();
    });

    // Function to generate a new dataset
    function generateNewDataset() {
        fetch('/generate_dataset')
            .then(response => response.json())
            .then(data => {
                currentDataset = data;
                clusters = [];
                centroids = [];
                converged = false;
                hideConvergenceModal();
                plotDataPoints(currentDataset, centroids);
            })
            .catch(error => console.error('Error:', error));
    }

    // Function to step through the KMeans algorithm
    function stepThroughKMeans() {
        if (manualMode && centroids.length < numClusters) {
            alert(`Please select ${numClusters} centroids manually before stepping through the algorithm.`);
            return;
        }

        fetch('/run_kmeans', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: initializationMethod,
                dataset: currentDataset,
                centroids: centroids,
                step: true,
                num_clusters: numClusters
            }),
        })
            .then(response => response.json())
            .then(data => {
                centroids = data.centroids;
                clusters = data.clusters;
                converged = data.converged;
                plotDataPoints(currentDataset, centroids, clusters);

                if (converged) {
                    showConvergenceModal();
                    document.getElementById('step-algorithm').disabled = true;
                }
            })
            .catch(error => console.error('Error:', error));
    }

    // Function to run the algorithm to convergence
    function runToConvergence() {
        if (manualMode && centroids.length < numClusters) {
            alert(`Please select ${numClusters} centroids manually before running to convergence.`);
            return;
        }

        fetch('/run_kmeans', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: initializationMethod,
                dataset: currentDataset,
                centroids: centroids,
                step: false,
                num_clusters: numClusters
            }),
        })
            .then(response => response.json())
            .then(data => {
                centroids = data.centroids;
                clusters = data.clusters;
                converged = data.converged;
                plotDataPoints(currentDataset, centroids, clusters);

                if (converged) {
                    showConvergenceModal();
                    document.getElementById('step-algorithm').disabled = true;
                }
            })
            .catch(error => console.error('Error:', error));
    }

    // Function to reset the algorithm
    function resetAlgorithm() {
        centroids = [];
        clusters = [];
        converged = false;
        document.getElementById('step-algorithm').disabled = false;
        hideConvergenceModal();
        plotDataPoints(currentDataset, centroids);
    }

    // Function to plot data points and centroids
    function plotDataPoints(data, centroids = [], clusters = []) {
        let dataPoints = {
            x: data.map(d => d[0]),
            y: data.map(d => d[1]),
            mode: 'markers',
            type: 'scatter',
            marker: { size: 10, color: clusters.length > 0 ? clusters : 'blue' },
            name: 'Data Points',
        };

        let centroidPoints = {
            x: centroids.map(c => c[0]),
            y: centroids.map(c => c[1]),
            mode: 'markers',
            type: 'scatter',
            marker: { size: 15, color: 'red', symbol: 'x' },
            name: 'Centroids',
        };

        let plotData = [dataPoints];

        if (centroids.length > 0) {
            plotData.push(centroidPoints);
        }

        console.log("Rendering Plot");
        Plotly.newPlot(plotDiv, plotData, {
            title: 'KMeans Clustering',
            xaxis: { title: 'X' },
            yaxis: { title: 'Y' },
        });

        // Attach click event for capturing free clicks and converting them to new centroids
        plotDiv.on('plotly_click', function (eventdata) {
            if (manualMode) {
                // Get the click coordinates in terms of the plot's data
                let xCoord = eventdata.points[0].x;
                let yCoord = eventdata.points[0].y;

                console.log(`New Centroid: (${xCoord}, ${yCoord})`);

                // Add the new centroid to the centroids array
                centroids.push([xCoord, yCoord]);
                console.log("Updated centroids:", centroids);

                // Update the plot with the new centroid
                plotDataPoints(currentDataset, centroids, clusters);

                // Check if the required number of centroids is reached
                if (centroids.length === numClusters) {
                    alert('All centroids selected. You can now step through or run the algorithm.');
                }
            }
        });
    }

    // Show convergence modal
    function showConvergenceModal() {
        convergenceModal.classList.remove('hidden');
        convergenceModal.classList.add('visible');
    }

    // Hide convergence modal
    function hideConvergenceModal() {
        convergenceModal.classList.remove('visible');
        convergenceModal.classList.add('hidden');
    }
});