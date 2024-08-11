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
