
import { ref } from 'vue'

export const isTableVisible = ref(false)

// Hàm dùng để bật / tắt trạng thái này
export function toggleTable() {
    isTableVisible.value = !isTableVisible.value
}
