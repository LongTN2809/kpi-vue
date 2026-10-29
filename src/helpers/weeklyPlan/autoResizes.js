// Auto resize textareas
export function autoResizeTextareas(event) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
} 