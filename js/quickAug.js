// Your JavaScript file, e.g., main.js

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('backToAnnotated').addEventListener('click', function () {
        const fileInput = document.getElementById('jsonUpload');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please upload a JSON file first.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const jsonData = JSON.parse(e.target.result);

                // Transform the JSON data
                const transformedData = jsonData.map(item => {
                    item.annotations = []; // Clear the annotations
                    item.predictions.forEach(prediction => {
                        item.annotations.push(prediction); // Move predictions to annotations
                    });
                    item.predictions = []; // Clear the predictions
                    return item;
                });

                // Download the transformed JSON
                const blob = new Blob([JSON.stringify(transformedData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transformed_data.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Close the modal
                var myModalEl = document.getElementById('jsonModal');
                var modal = bootstrap.Modal.getInstance(myModalEl);
                modal.hide();

            } catch (err) {
                alert('Failed to process JSON file. Please check the file format.');
            }
        };

        reader.readAsText(file);
    });
});

function attachJsonTransformationHandler() {
    document.getElementById('backToPredicted').addEventListener('click', function () {
        const fileInput = document.getElementById('jsonUpload');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please upload a JSON file first.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                let jsonData = JSON.parse(e.target.result);

                // Process the JSON data (if needed, based on button functionality)
                // For backToPredicted button: no additional processing in this case

                // Download the JSON as is
                const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transformed_data.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Close the modal
                var myModalEl = document.getElementById('jsonModal');
                var modal = bootstrap.Modal.getInstance(myModalEl);
                modal.hide();
                console.log('Modal closed');

            } catch (err) {
                alert('Failed to process JSON file. Please check the file format.');
            }
        };

        reader.readAsText(file);
    });

    document.getElementById('removeDuplicates').addEventListener('click', function () {
        const fileInput = document.getElementById('jsonUpload');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please upload a JSON file first.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                let jsonData = JSON.parse(e.target.result);

                // Remove duplicate rectanglelabels and from_name
                jsonData = removeDuplicateRectangleLabelsAndFromNames(jsonData);

                // Download the transformed JSON
                const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transformed_data_no_duplicates.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Close the modal
                var myModalEl = document.getElementById('jsonModal');
                var modal = bootstrap.Modal.getInstance(myModalEl);
                modal.hide();
                console.log('Modal closed');

            } catch (err) {
                alert('Failed to process JSON file. Please check the file format.');
            }
        };

        reader.readAsText(file);
    });
}

function removeDuplicateRectangleLabelsAndFromNames(data) {
    return data.map(item => {
        // Iterate over predictions and annotations separately
        ['predictions', 'annotations'].forEach(key => {
            if (item[key]) {
                item[key].forEach(entry => {
                    const seenLabels = new Set();
                    const seenFromNames = new Set();
                    entry.result = entry.result.filter(resultItem => {
                        const isRectangleLabel = resultItem.type === 'rectanglelabels';
                        const isDuplicateLabel = isRectangleLabel && seenLabels.has(JSON.stringify(resultItem.rectanglelabels));
                        const isDuplicateFromName = seenFromNames.has(resultItem.from_name);

                        if (isRectangleLabel) {
                            if (isDuplicateLabel) {
                                return false; // Duplicate rectangle label, exclude this entry
                            } else {
                                seenLabels.add(JSON.stringify(resultItem.rectanglelabels)); // Add to seen labels
                            }
                        }

                        if (isDuplicateFromName) {
                            return false; // Duplicate from_name, exclude this entry
                        } else {
                            seenFromNames.add(resultItem.from_name); // Add to seen from_names
                        }

                        return true; // Keep this entry
                    });
                });
            }
        });

        return item;
    });
}
