import { ref, computed } from 'vue'

export function useResizableColumns(initialWidths, minWidth = 60) {
    const widths = ref([...initialWidths])
    const totalWidth = computed(() => widths.value.reduce((a, b) => a + b, 0))

    function startResize(e, index) {
        const startX = e.clientX
        const startWidth = widths.value[index]

        function onMove(ev) {
            widths.value[index] = Math.max(minWidth, startWidth + ev.clientX - startX)
        }

        function onUp() {
            document.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerup', onUp)
            document.body.classList.remove('is-resizing')
        }

        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
        document.body.classList.add('is-resizing')
    }

    return { widths, totalWidth, startResize }
}