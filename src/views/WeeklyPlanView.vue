<script setup>
import WeeklyTaskRow from '@/components/WeeklyTaskRow.vue';
import { onMounted, ref, computed, watch } from 'vue'
import { weeklyPlanServices, } from '@/services/weeklyPlanServices.js'
import {
    getCurrentWeekDetails,
    formatDateForDB,
    getNextWeekDetailsFromDate
} from '@/helpers/weeklyPlan/calWeeks.js'
import { isTableVisible, toggleTable } from '@/helpers/weeklyPlan/visibleComponents.js'

const selectedWeek = ref(null);
const allWeeks = ref([]);
// Lấy tuần mới nhất
const loadLatestWeek = async () => {
    const latestWeek = await weeklyPlanServices.getLatestWeek()

    if (latestWeek) {
        selectedWeek.value = latestWeek.week_num;
        return
    }

    // Nếu database chưa có tuần nào → tạo tuần hiện tại
    const currentWeek = getCurrentWeekDetails()

    const newWeek = await weeklyPlanServices.createNewWeek({
        week_num: currentWeek.weekNumber,
        date_start: formatDateForDB(currentWeek.date_start),
        date_end: formatDateForDB(currentWeek.date_end)
    })

    selectedWeek.value = newWeek[0].week_num;
    console.log("Load tuần moi nhat khi vao trang:", selectedWeek.value);
}

const loadAllWeeks = async () => {
    allWeeks.value = await weeklyPlanServices.getAllWeeks();
}


// Xử lý tạo tuần mới
const handleCreateNewWeek = async () => {
    const latestWeek = await weeklyPlanServices.getLatestWeek()

    if (!latestWeek) {
        console.log('Chưa có tuần nào trong database')
        return
    }

    const nextWeek = getNextWeekDetailsFromDate(
        latestWeek.date_end,
        latestWeek.week_num
    )

    const newWeek = await weeklyPlanServices.createNewWeek({
        week_num: nextWeek.weekNumber,
        date_start: formatDateForDB(nextWeek.date_start),
        date_end: formatDateForDB(nextWeek.date_end)
    })

    selectedWeek.value = newWeek[0].week_num;

    await loadAllWeeks();

}

const handleDeleteWeek = async () => {
    console.log(selectedWeek.value)
    if (!selectedWeek.value) return;

    await weeklyPlanServices.deleteWeek(selectedWeek.value);
    await loadAllWeeks();
    await loadLatestWeek();
}


// Hàm truyền date_start xuống component con
const selectedWeekData = computed(() => {
    return allWeeks.value.find(week => week.week_num === selectedWeek.value)
})

watch(
    [selectedWeek, allWeeks],
    () => {
        console.log('selectedWeek:', selectedWeek.value)
        console.log('allWeeks:', allWeeks.value)
        console.log('selectedWeekData:', selectedWeekData.value)
    },
    { deep: true }
)


// Khi component vừa mount
onMounted(async () => {
    await loadAllWeeks();
    await loadLatestWeek();
})

</script>

<template>
    <article class="hero-section">
        <div class="hero-section-rows">
            <div class="row">
                <h3 class="">Bảng Kế Hoạch Phân Công Tuần</h3>
                <select v-model="selectedWeek" name="select_week" id="select_week">
                    <option v-if="allWeeks.length <= 0" value="">Chưa có tuần nào được tạo</option>
                    <option v-else v-for="week in allWeeks" :key="week.id" :value="week.week_num">Tuần {{ week.week_num
                    }} (
                        {{ week.date_start }} -
                        {{ week.date_end }} )</option>
                </select>
            </div>
            <div class="row">
                <button @click="handleCreateNewWeek" class="create_new_week btn btn-action"><i
                        class="fa-solid fa-calendar-plus"></i> Tạo tuần trực
                    mới</button>
                <button @click="handleDeleteWeek" class="delete_week btn btn-action"><i
                        class="fa-regular fa-trash-can"></i> Xoá tuần hiện
                    tại</button>
                <button class="create_new_day btn btn-action"><i class="fa-solid fa-circle-plus"></i> Tạo ngày trực
                    mới</button>
                <button class="download_week_excel btn btn-action"><i class="fa-solid fa-file-arrow-down"></i> Tải excel
                    tuần</button>
                <button @click="toggleTable" class="show_task btn btn-action"><i class="fa-solid fa-eye-slash"></i> Công
                    việc bị ẩn</button>
            </div>
        </div>
    </article>

    <article class="weekly-plan-wrapper">
        <div class="table-wrapper">
            <table id="weekly-plan" style="position: relative;">
                <colgroup>
                    <col style="width: 90px"> <!-- Ngày -->
                    <col style="width: 130px"> <!-- Ca làm -->
                    <col style="width: 130px"> <!-- Nhóm -->
                    <col style="width: 150px"> <!-- Khu vực -->
                    <col style="width: 180px"> <!-- Nội dung -->
                    <col style="width: 140px"> <!-- Minh chứng -->
                    <col style="width: 140px"> <!-- Form BT -->
                    <col style="width: 150px"> <!-- Người thực hiện -->
                    <col style="width: 130px"> <!-- Tiến độ KPI -->
                    <col style="width: 180px"> <!-- Ghi chú -->
                    <col style="width: 110px"> <!-- Thao tác -->
                </colgroup>
                <thead>
                    <tr>
                        <th>NGÀY</th>
                        <th>CA LÀM</th>
                        <th>NHÓM</th>
                        <th>KHU VỰC</th>
                        <th>NỘI DUNG</th>
                        <th>MINH CHỨNG</th>
                        <th>FORM BT</th>
                        <th>NGƯỜI THỰC HIỆN</th>
                        <th>TIẾN ĐỘ KPI</th>
                        <th>GHI CHÚ</th>
                        <th>THAO TÁC</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- <WeeklyTaskRow v-for="value in source" /> -->
                    <WeeklyTaskRow :date-start="selectedWeekData?.date_start" />
                </tbody>
            </table>
        </div>


        <table id="weekly-plan-hide" v-show="isTableVisible">
            <thead>
                <tr>
                    <th>NGÀY</th>
                    <th>CA LÀM</th>
                    <th>NHÓM</th>
                    <th>NỘI DUNG</th>
                    <th>THAO TÁC</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>Danh sách công việc bị ẩn</td>
                </tr>
            </tbody>
        </table>
    </article>
</template>

<style>
.hero-section {
    background: white;
    box-shadow: var(--shadow-md);
    border-radius: 10px;
    padding: 20px;
    margin: 30px 0;
}

#select_week {
    width: 300px;
}

.hero-section-rows {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.row {
    display: flex;
    align-items: center;
    gap: 20px;
}

.weekly-plan-wrapper table {
    width: 100%;
    background-color: var(--color-bg);
    border-radius: var(--radius-md);
    border-collapse: collapse;
    table-layout: fixed;
}
</style>