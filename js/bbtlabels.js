let drawing = false;
let moving = false;
let resizing = false;
let resizeHandle = null;
let startX, startY, endX, endY;
let userRectangle = null;
let offsetX, offsetY;

document.getElementById('drawingCanvas').addEventListener('mousedown', startDrawing, false);
document.getElementById('drawingCanvas').addEventListener('mousemove', drawRectangle, false);
document.getElementById('drawingCanvas').addEventListener('mouseup', endDrawing, false);

function startDrawing(event) {
    const canvas = document.getElementById('drawingCanvas');
    const rect = canvas.getBoundingClientRect();

    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (userRectangle && isInsideRectangle(clickX, clickY, userRectangle)) {
        if (isOnResizeHandle(clickX, clickY, userRectangle)) {
            resizing = true;
            resizeHandle = getResizeHandle(clickX, clickY, userRectangle);
        } else {
            moving = true;
            offsetX = clickX - userRectangle.startX;
            offsetY = clickY - userRectangle.startY;
        }
    } else {
        drawing = true;
        startX = clickX;
        startY = clickY;
    }
}

function drawRectangle(event) {
    if (!drawing && !moving && !resizing) return;
    const canvas = document.getElementById('drawingCanvas');
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    if (drawing) {
        endX = event.clientX - rect.left;
        endY = event.clientY - rect.top;
    } else if (moving) {
        const moveX = event.clientX - rect.left;
        const moveY = event.clientY - rect.top;
        startX = moveX - offsetX;
        startY = moveY - offsetY;
        endX = startX + (userRectangle.endX - userRectangle.startX);
        endY = startY + (userRectangle.endY - userRectangle.startY);
    } else if (resizing) {
        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;
        resizeRectangle(currentX, currentY, resizeHandle);
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawUserRectangle();

    if (drawing || moving || resizing) {
        context.beginPath();
        context.rect(startX, startY, endX - startX, endY - startY);
        context.lineWidth = 2;
        context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        context.stroke();
        drawResizeHandles(context, {
            startX: Math.min(startX, endX),
            startY: Math.min(startY, endY),
            endX: Math.max(startX, endX),
            endY: Math.max(startY, endY)
        });
    }
}

function endDrawing(event) {
    if (!drawing && !moving && !resizing) return;
    drawing = false;
    moving = false;
    resizing = false;
    resizeHandle = null;

    if (endX !== undefined && endY !== undefined) {
        userRectangle = {
            startX: Math.min(startX, endX),
            startY: Math.min(startY, endY),
            endX: Math.max(startX, endX),
            endY: Math.max(startY, endY)
        };
    }

    const canvas = document.getElementById('drawingCanvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawUserRectangle();
}

function drawUserRectangle() {
    const canvas = document.getElementById('drawingCanvas');
    const context = canvas.getContext('2d');
    if (userRectangle) {
        context.beginPath();
        context.rect(userRectangle.startX, userRectangle.startY, userRectangle.endX - userRectangle.startX, userRectangle.endY - userRectangle.startY);
        context.lineWidth = 2;
        context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        context.stroke();
        drawResizeHandles(context, userRectangle);
    }
}

function isInsideRectangle(x, y, rect) {
    return x >= rect.startX && x <= rect.endX && y >= rect.startY && y <= rect.endY;
}

function isOnResizeHandle(x, y, rect) {
    const handles = getResizeHandles(rect);
    return handles.some(handle => x >= handle.x && x <= handle.x + handle.size && y >= handle.y && y <= handle.y + handle.size);
}

function getResizeHandle(x, y, rect) {
    const handles = getResizeHandles(rect);
    return handles.find(handle => x >= handle.x && x <= handle.x + handle.size && y >= handle.y && y <= handle.y + handle.size);
}

function getResizeHandles(rect) {
    const size = 10;
    return [
        { x: rect.startX - size / 2, y: rect.startY - size / 2, size, cursor: 'nw-resize' },
        { x: rect.endX - size / 2, y: rect.startY - size / 2, size, cursor: 'ne-resize' },
        { x: rect.endX - size / 2, y: rect.endY - size / 2, size, cursor: 'se-resize' },
        { x: rect.startX - size / 2, y: rect.endY - size / 2, size, cursor: 'sw-resize' }
    ];
}

function drawResizeHandles(context, rect) {
    const handles = getResizeHandles(rect);
    context.fillStyle = 'rgba(255, 0, 0, 0.5)';
    handles.forEach(handle => {
        context.fillRect(handle.x, handle.y, handle.size, handle.size);
    });
}

function resizeRectangle(currentX, currentY, handle) {
    switch (handle.cursor) {
        case 'nw-resize':
            startX = currentX;
            startY = currentY;
            break;
        case 'ne-resize':
            endX = currentX;
            startY = currentY;
            break;
        case 'se-resize':
            endX = currentX;
            endY = currentY;
            break;
        case 'sw-resize':
            startX = currentX;
            endY = currentY;
            break;
    }
}
