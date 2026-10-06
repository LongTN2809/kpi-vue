<script setup>
import { computed } from 'vue'
import { formatDateForDB } from '@/helpers/weeklyPlan/calWeeks'

const weekData = defineProps({
    dateStart: String
})

const weekDays = computed(() => {
    if (!weekData.dateStart) return []

    return getDayFromDateString(weekData.dateStart)
})

// hàm tính thứ trong tuần
function getDayFromDateString(startDateString) {
    if (!startDateString) return;

    const startDate = new Date(startDateString + 'T00:00:00');

    if (isNaN(startDate.getTime())) {
        console.error('Chuỗi ngày không hợp lệ');
        return [];
    }

    const result = [];
    const dayOfWeekNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i); // Cộng thêm i ngày     

        const formattedDate = formatDateForDB(currentDate)

        const dayOfMonth = currentDate.getDate();

        result.push({
            dayOfWeek: dayOfWeekNames[currentDate.getDay()], // Tên thứ
            date: formattedDate,                            // '2026-09-28'
            day: dayOfMonth                                 // 28
        });
    }

    return result;
}
</script>

<template>
    <tr class="task_row">
        <td class="task_col date">
        </td>
        <td class="task_col shifts"></td>
        <td class="task_col groups"></td>
        <td class="task_col areas"></td>
        <td class="task_col content"></td>
        <td class="task_col evidents"></td>
        <td class="task_col forms"></td>
        <td class="task_col staff_actions"></td>
        <td class="task_col kpi-progress"></td>
        <td class="task_col notes"></td>
        <td class="task_col actions"></td>
    </tr>
</template>

<style></style>