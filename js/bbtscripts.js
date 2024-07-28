let currentIndex = 0;
let imageUrls = [];
let imageAnnotations = [];
const colors = ["rgba(21, 35, 234, 0.5)", "rgba(253, 79, 191, 0.5)", "rgba(93, 177, 56, 0.5)", "rgba(255, 140, 0, 0.5)", "rgba(75, 0, 130, 0.5)"];

document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
document.getElementById('prevButton').addEventListener('click', showPrevImage, false);
document.getElementById('nextButton').addEventListener('click', showNextImage, false);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const jsonData = JSON.parse(e.target.result);
            const results = analyzeJson(jsonData);
            displayResults(results);
            const { urls, annotations } = extractImageUrlsAndAnnotations(jsonData);
            imageUrls = urls;
            imageAnnotations = annotations;
            if (imageUrls.length > 0) {
                currentIndex = 0;
                displayImage(imageUrls[currentIndex]);
                displayAnnotations(imageAnnotations[currentIndex]);
                updateNavigationButtons();
            }
        };
        reader.readAsText(file);
    }
}

function analyzeJson(jsonData) {
    let stagesData = {
        drafts: { count: 0, toolData: {} },
        annotations: { count: 0, toolData: {} },
        predictions: { count: 0, toolData: {} }
    };

    jsonData.forEach(task => {
        if (task.drafts && task.drafts.length > 0) {
            stagesData.drafts.count += 1;
            processEntries(stagesData.drafts.toolData, task.drafts);
        }
        if (task.annotations && task.annotations.length > 0) {
            stagesData.annotations.count += 1;
            processEntries(stagesData.annotations.toolData, task.annotations);
        }
        if (task.predictions && task.predictions.length > 0) {
            stagesData.predictions.count += 1;
            processEntries(stagesData.predictions.toolData, task.predictions);
        }
    });

    // Calculate statistics
    for (let stage in stagesData) {
        for (let tool in stagesData[stage].toolData) {
            let toolStats = stagesData[stage].toolData[tool];
            calculateStatistics(toolStats);

            for (let label in toolStats.labels) {
                let labelStats = toolStats.labels[label];
                calculateStatistics(labelStats);
            }
        }
    }

    return stagesData;
}

function processEntries(toolData, entries) {
    entries.forEach(entry => {
        entry.result.forEach((result, index) => {
            let tool = result.from_name || "Unknown Tool";
            if (!toolData[tool]) {
                toolData[tool] = { count: 0, labels: {}, xValues: [], yValues: [] };
            }
            toolData[tool].count += 1;

            result.value.rectanglelabels.forEach(label => {
                if (!toolData[tool].labels[label]) {
                    toolData[tool].labels[label] = { count: 0, xValues: [], yValues: [] };
                }
                toolData[tool].labels[label].count += 1;
                toolData[tool].labels[label].xValues.push(result.value.x);
                toolData[tool].labels[label].yValues.push(result.value.y);
            });

            toolData[tool].xValues.push(result.value.x);
            toolData[tool].yValues.push(result.value.y);
        });
    });
}

function calculateStatistics(data) {
    data.avgX = data.xValues.reduce((a, b) => a + b, 0) / data.xValues.length || 0;
    data.avgY = data.yValues.reduce((a, b) => a + b, 0) / data.yValues.length || 0;
    data.stdX = Math.sqrt(data.xValues.map(x => Math.pow(x - data.avgX, 2)).reduce((a, b) => a + b, 0) / data.xValues.length) || 0;
    data.stdY = Math.sqrt(data.yValues.map(y => Math.pow(y - data.avgY, 2)).reduce((a, b) => a + b, 0) / data.yValues.length) || 0;
}

function displayResults(results) {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h2>Results</h2>
    `;

    for (let stage in results) {
        resultsDiv.innerHTML += `
            <h3>Stage: ${stage.charAt(0).toUpperCase() + stage.slice(1)}</h3>
            <p>Count: ${results[stage].count}</p>
        `;

        for (let tool in results[stage].toolData) {
            let toolStats = results[stage].toolData[tool];
            resultsDiv.innerHTML += `
                <h4>Tool: ${tool}</h4>
                <p>Count: ${toolStats.count}</p>
                <p>Average X: ${toolStats.avgX.toFixed(2)}</p>
                <p>Average Y: ${toolStats.avgY.toFixed(2)}</p>
                <p>Std Dev X: ${toolStats.stdX.toFixed(2)}</p>
                <p>Std Dev Y: ${toolStats.stdY.toFixed(2)}</p>
                <h5>Rectangle Labels:</h5>
            `;

            for (let label in toolStats.labels) {
                let labelStats = toolStats.labels[label];
                resultsDiv.innerHTML += `
                    <p>Label: ${label}</p>
                    <p>Count: ${labelStats.count}</p>
                    <p>Average X: ${labelStats.avgX.toFixed(2)}</p>
                    <p>Average Y: ${labelStats.avgY.toFixed(2)}</p>
                    <p>Std Dev X: ${labelStats.stdX.toFixed(2)}</p>
                    <p>Std Dev Y: ${labelStats.stdY.toFixed(2)}</p>
                `;
            }
        }
    }
}

function extractImageUrlsAndAnnotations(jsonData) {
    let urls = [];
    let annotations = [];
    jsonData.forEach(task => {
        if (task.data && task.data.image) {
            urls.push(task.data.image);
            annotations.push(task.annotations || []);
        }
    });
    return { urls, annotations };
}

function displayImage(url) {
    const image = document.getElementById('imageDisplay');
    image.src = url;
    image.onload = function() {
        initializeCanvas();
    };
}

function initializeCanvas() {
    const image = document.getElementById('imageDisplay');
    const annotationCanvas = document.getElementById('annotationCanvas');
    const drawingCanvas = document.getElementById('drawingCanvas');
    annotationCanvas.width = image.clientWidth;
    annotationCanvas.height = image.clientHeight;
    drawingCanvas.width = image.clientWidth;
    drawingCanvas.height = image.clientHeight;
    const context = annotationCanvas.getContext('2d');
    context.drawImage(image, 0, 0, annotationCanvas.width, annotationCanvas.height);
    drawStoredRectangles();
}

function displayAnnotations(annotations) {
    const overlay = document.getElementById('overlay');
    overlay.innerHTML = '';

    annotations.forEach((annotation, index) => {
        annotation.result.forEach(result => {
            const value = result.value;
            if (value && value.rectanglelabels) {
                const rect = document.createElement('div');
                rect.className = 'rectangle-label';
                rect.style.left = `${value.x}%`;
                rect.style.top = `${value.y}%`;
                rect.style.width = `${value.width}%`;
                rect.style.height = `${value.height}%`;
                rect.style.borderColor = colors[index % colors.length];
                rect.style.backgroundColor = colors[index % colors.length].replace('0.5', '0.1');

                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.innerText = `Label: ${value.rectanglelabels[0]}, Tool: ${result.from_name}`;
                rect.appendChild(tooltip);

                rect.addEventListener('mouseover', () => {
                    tooltip.style.display = 'block';
                });

                rect.addEventListener('mouseout', () => {
                    tooltip.style.display = 'none';
                });

                overlay.appendChild(rect);
            }
        });
    });
}

function showPrevImage() {
    if (currentIndex > 0) {
        currentIndex--;
        displayImage(imageUrls[currentIndex]);
        displayAnnotations(imageAnnotations[currentIndex]);
        updateNavigationButtons();
    }
}

function showNextImage() {
    if (currentIndex < imageUrls.length - 1) {
        currentIndex++;
        displayImage(imageUrls[currentIndex]);
        displayAnnotations(imageAnnotations[currentIndex]);
        updateNavigationButtons();
    }
}

function updateNavigationButtons() {
    document.getElementById('prevButton').disabled = currentIndex === 0;
    document.getElementById('nextButton').disabled = currentIndex === imageUrls.length - 1;
}

function drawStoredRectangles() {
    const annotationCanvas = document.getElementById('annotationCanvas');
    const context = annotationCanvas.getContext('2d');
    context.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
    const image = document.getElementById('imageDisplay');
    context.drawImage(image, 0, 0, annotationCanvas.width, annotationCanvas.height);
    imageAnnotations[currentIndex].forEach((annotation, index) => {
        annotation.result.forEach(result => {
            const value = result.value;
            if (value && value.rectanglelabels) {
                context.beginPath();
                context.rect(
                    (value.x / 100) * annotationCanvas.width,
                    (value.y / 100) * annotationCanvas.height,
                    (value.width / 100) * annotationCanvas.width,
                    (value.height / 100) * annotationCanvas.height
                );
                context.lineWidth = 2;
                context.strokeStyle = colors[index % colors.length];
                context.stroke();
            }
        });
    });
    drawUserRectangle();
}
