let currentIndex = 0;
let imageUrls = [];
let imageAnnotations = [];
let originalData = [];
let selectedAnnotation = null;
let selectedRectIndex = null;

document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
document.getElementById('prevButton').addEventListener('click', showPrevImage, false);
document.getElementById('nextButton').addEventListener('click', showNextImage, false);
document.getElementById('objectSelect').addEventListener('change', updateSelectedObject, false);
document.getElementById('xInput').addEventListener('input', updateRectangle, false);
document.getElementById('yInput').addEventListener('input', updateRectangle, false);
document.getElementById('widthInput').addEventListener('input', updateRectangle, false);
document.getElementById('heightInput').addEventListener('input', updateRectangle, false);
document.getElementById('exportButton').addEventListener('click', exportJson, false);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const jsonData = JSON.parse(e.target.result);
            originalData = jsonData;
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
        initializeOverlay();
        displayAnnotations(imageAnnotations[currentIndex]);
    };
}

function initializeOverlay() {
    const image = document.getElementById('imageDisplay');
    const overlay = document.getElementById('overlay');
    overlay.style.width = `${image.clientWidth}px`;
    overlay.style.height = `${image.clientHeight}px`;
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.pointerEvents = 'none';
}

function displayAnnotations(annotations) {
    const overlay = document.getElementById('overlay');
    const objectSelect = document.getElementById('objectSelect');
    const previouslySelected = objectSelect.value;

    overlay.innerHTML = '';
    objectSelect.innerHTML = '';

    annotations.forEach((annotation, index) => {
        annotation.result.forEach((result, rectIndex) => {
            if (result.value && result.value.rectanglelabels) {
                const rect = document.createElement('div');
                rect.className = 'rectangle-label';
                rect.style.left = `${result.value.x}%`;
                rect.style.top = `${result.value.y}%`;
                rect.style.width = `${result.value.width}%`;
                rect.style.height = `${result.value.height}%`;
                rect.dataset.index = index;
                rect.dataset.rectIndex = rectIndex;

                rect.addEventListener('click', () => selectObject(index, rectIndex));
                overlay.appendChild(rect);

                const option = document.createElement('option');
                option.value = `${index}-${rectIndex}`;
                option.text = `Object ${index + 1}-${rectIndex + 1} - ${result.value.rectanglelabels[0]}`;
                objectSelect.appendChild(option);
            }
        });
    });

    if (objectSelect.options.length > 0) {
        if (previouslySelected) {
            objectSelect.value = previouslySelected;
        } else {
            objectSelect.selectedIndex = 0;
        }
        updateSelectedObject();
    }
}

function selectObject(index, rectIndex) {
    const objectSelect = document.getElementById('objectSelect');
    objectSelect.value = `${index}-${rectIndex}`;
    updateSelectedObject();
}

function updateSelectedObject() {
    const objectSelect = document.getElementById('objectSelect');
    const [index, rectIndex] = objectSelect.value.split('-').map(Number);
    if (isNaN(index) || isNaN(rectIndex)) return;

    selectedAnnotation = imageAnnotations[currentIndex][index];
    selectedRectIndex = rectIndex;
    const rect = selectedAnnotation.result[rectIndex].value;
    
    document.getElementById('xInput').value = rect.x;
    document.getElementById('yInput').value = rect.y;
    document.getElementById('widthInput').value = rect.width;
    document.getElementById('heightInput').value = rect.height;
}

function updateRectangle() {
    if (!selectedAnnotation || selectedRectIndex === null) return;

    const x = parseFloat(document.getElementById('xInput').value);
    const y = parseFloat(document.getElementById('yInput').value);
    const width = parseFloat(document.getElementById('widthInput').value);
    const height = parseFloat(document.getElementById('heightInput').value);

    const updateMode = document.querySelector('input[name="updateMode"]:checked').value;

    if (updateMode === 'single') {
        // Update only the selected rectangle
        selectedAnnotation.result[selectedRectIndex].value.x = x;
        selectedAnnotation.result[selectedRectIndex].value.y = y;
        selectedAnnotation.result[selectedRectIndex].value.width = width;
        selectedAnnotation.result[selectedRectIndex].value.height = height;
    } else if (updateMode === 'all') {
        // Update all rectangles with the same label
        const label = selectedAnnotation.result[selectedRectIndex].value.rectanglelabels[0];
        applyChangeToAll(label, x, y, width, height);
    }

    displayAnnotations(imageAnnotations[currentIndex]);
}

function applyChangeToAll(label, newX, newY, newWidth, newHeight) {
    const deltaX = newX - selectedAnnotation.result[selectedRectIndex].value.x;
    const deltaY = newY - selectedAnnotation.result[selectedRectIndex].value.y;

    imageAnnotations.forEach(annotationGroup => {
        annotationGroup.forEach(annotation => {
            annotation.result.forEach(result => {
                if (result.value.rectanglelabels && result.value.rectanglelabels.includes(label)) {
                    const rect = result.value;

                    const centroidX = rect.x + rect.width / 2;
                    const centroidY = rect.y + rect.height / 2;

                    rect.x = centroidX - (newWidth / 2) + deltaX;
                    rect.y = centroidY - (newHeight / 2) + deltaY;
                    rect.width = newWidth;
                    rect.height = newHeight;
                }
            });
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

function exportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(originalData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "modified_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
