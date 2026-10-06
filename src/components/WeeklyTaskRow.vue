<script setup>
import { computed } from 'vue'
import { formatDateForDB } from '@/helpers/weeklyPlan/calWeeks'

const weekData = defineProps({
    dateStart: String
})

// Data setup
const groups = [
    { id: 1, label: 'Carpenter' },
    { id: 2, label: 'Event' },
    { id: 3, label: 'Defect' },
    { id: 4, label: 'Bảo trì' },
    { id: 5, label: 'Vận hành' }
]


// 
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

console.log(weekDays.value);
</script>

<template>
    <tr v-for="date in weekDays" :key="date.date" class="task_row">
        <td class="task_col date">{{ date.dayOfWeek }}</td>
        <td class="task_col shifts">
            <select name="shift" class="select-shift">
                <option selected disabled value="">Chọn ca</option>
                <option value="a">Ca A</option>
                <option value="b">Ca B</option>
                <option value="c">Ca C</option>
                <option value="n">Ca N</option>
            </select>
            <textarea rows="3" cols="3" name="shift_text" class="shift_text"></textarea>
        </td>
        <td class="task_col groups">

            <select name="groups" class="select-groups">
                <option value="" disabled selected>Chọn nhóm</option>
                <option v-for="group in groups" :key="group.id" :value="group.label">{{ group.label }}</option>
            </select>
        </td>
        <td class="task_col areas">
            <textarea rows="4" cols="8" name="content_area" class="content_area"></textarea>
        </td>
        <td class="task_col content">
            <textarea rows="4" cols="8" name="content_area" class="content_area"></textarea>
        </td>
        <td class="task_col evidents">
            <input type="file" class="input_evident">
        </td>
        <td class="task_col forms">
            <select name="systems" class="systems">
                <option value="" disabled selected>Hệ thống</option>
            </select>
            <select name="forms" class="forms">
                <option value="" disabled selected>Biểu mẫu</option>
            </select>
        </td>
        <td class="task_col staff_actions"></td>
        <td class="task_col kpi-progress">
            <select name="progress" class="select-progress">
                <option selected disabled value="">Chọn tiến độ</option>
                <option value="0">Làm lại</option>
                <option value="1">Hoàn thành</option>
                <option value="2">Bàn giao</option>
                <option value="3">Đang thực hiện</option>
            </select>
        </td>
        <td class="task_col notes">
            <textarea rows="4" cols="8" name="content_area" class="content_area"></textarea>
        </td>
        <td class="task_col actions">
            <i class="fa-solid fa-circle-plus"></i>
            <i class="fa-solid fa-eye-slash"></i>
            <i class="fa-solid fa-trash"></i>
        </td>
    </tr>
</template>

<style></style>