<script setup>
// Import component and services
import WeeklyTaskRow from '@/components/WeeklyTaskRow.vue';
import { onMounted, ref, computed, watch } from 'vue'
import { userServices } from '@/services/userServices';
import { taskServices } from '@/services/taskServices';
import { maintenanceServices } from '@/services/maintenanceServices.js';
import { weeklyPlanServices, } from '@/services/weeklyPlanServices.js'
import {
    getCurrentWeekDetails,
    formatDateForDB,
    getNextWeekDetailsFromDate,
    getDayInfoFromDate
} from '@/helpers/weeklyPlan/calWeeks.js'
import { isTableVisible, toggleTable } from '@/helpers/weeklyPlan/visibleComponents.js'
import { exportTasksToExcel } from '@/helpers/weeklyPlan/exportTasksToExcel';
import { useResizableColumns } from '@/helpers/weeklyPlan/useResizableColumns'

// Setup data
const selectedWeek = ref(null);
const allWeeks = ref([]);
const allStaffs = ref([]);
const allFolders = ref([]);
const allForms = ref([]);
const allTasks = ref([]);

const headers = [
    'NGÀY', 'CA LÀM', 'NHÓM', 'KHU VỰC', 'NỘI DUNG', 'MINH CHỨNG',
    'FORM BT', 'NGƯỜI THỰC HIỆN', 'TIẾN ĐỘ KPI', 'GHI CHÚ', 'THAO TÁC'
]

// Độ rộng ban đầu lấy đúng từ colgroup hiện tại của bạn
const { widths, totalWidth, startResize } = useResizableColumns(
    [120, 160, 160, 150, 180, 140, 140, 150, 160, 180, 130]
)


// Lấy tuần mới nhất
const loadLatestWeek = async () => {
    const latestWeek = await weeklyPlanServices.getLatestWeek();

    if (latestWeek) {
        selectedWeek.value = latestWeek.week_num;
        return;
    }

    // Database chưa có tuần nào → tạo tuần hiện tại
    const currentWeek = getCurrentWeekDetails();

    const newWeek = await weeklyPlanServices.createNewWeek({
        week_num: currentWeek.weekNumber,
        date_start: formatDateForDB(currentWeek.date_start),
        date_end: formatDateForDB(currentWeek.date_end)
    });

    const createdWeek = newWeek[0];

    // Tạo danh sách 7 ngày
    const dates = getWeekDaysFromDate(
        createdWeek.date_start
    );

    // Tạo 7 dòng công việc
    await taskServices.createEmptyTasksForWeek(
        createdWeek.id,
        dates
    );

    // Chọn tuần vừa tạo
    selectedWeek.value = newWeek.week_num;
    await loadAllWeeks();
};

const loadAllWeeks = async () => {
    allWeeks.value = await weeklyPlanServices.getAllWeeks();
}



// Xử lý tạo tuần mới
const handleCreateNewWeek = async () => {
    try {
        const latestWeek = await weeklyPlanServices.getLatestWeek();

        if (!latestWeek) {
            console.log('Chưa có tuần nào trong database');
            return;
        }

        const nextWeek = getNextWeekDetailsFromDate(
            latestWeek.date_end,
            latestWeek.week_num
        );

        const newWeek = await weeklyPlanServices.createNewWeek({
            week_num: nextWeek.weekNumber,
            date_start: formatDateForDB(nextWeek.date_start),
            date_end: formatDateForDB(nextWeek.date_end)
        });

        const createdWeek = newWeek[0];

        // Tạo danh sách 7 ngày
        const dates = getWeekDaysFromDate(
            createdWeek.date_start
        );

        // Tạo 7 dòng công việc
        await taskServices.createEmptyTasksForWeek(
            createdWeek.id,
            dates
        );

        // Chọn tuần vừa tạo
        selectedWeek.value = createdWeek.week_num;

        // Tải lại danh sách tuần
        await loadAllWeeks();

    } catch (error) {
        console.error('Lỗi khi tạo tuần mới:', error);
    }
};

const handleDeleteWeek = async () => {
    if (!selectedWeek.value) return;
    await weeklyPlanServices.deleteWeek(selectedWeek.value);
    await loadAllWeeks();
    await loadLatestWeek();
}



// Hàm truyền date_start xuống component con
const selectedWeekData = computed(() => {
    return allWeeks.value.find(week => week.week_num === selectedWeek.value)
})


const weekDays = computed(() => {
    if (!selectedWeekData.value?.date_start) {
        return []
    }

    return {
        id: selectedWeekData.value.id,
        dateStart: getWeekDaysFromDate(
            selectedWeekData.value.date_start
        )
    }
})

// hàm tính thứ trong tuần
function getWeekDaysFromDate(startDateString) {
    if (!startDateString) return []

    const startDate = new Date(startDateString + 'T00:00:00')

    if (isNaN(startDate.getTime())) {
        console.error('Chuỗi ngày không hợp lệ')
        return []
    }

    const result = []

    const dayOfWeekNames = [
        'Chủ nhật',
        'Thứ 2',
        'Thứ 3',
        'Thứ 4',
        'Thứ 5',
        'Thứ 6',
        'Thứ 7'
    ]

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate)

        currentDate.setDate(startDate.getDate() + i)

        result.push({
            dayOfWeek: dayOfWeekNames[currentDate.getDay()],
            date: formatDateForDB(currentDate),
            day: currentDate.getDate()
        })
    }

    return result
}

// Thêm 1 dòng công việc mới trong cùng ngày
const addTask = async (taskDate) => {
    try {
        // Tạo task mới trong database
        const savedTask = await taskServices.createTask({
            week_id: weekDays.value.id,
            task_date: taskDate.date,
            shift: '',
            shift_text: '',
            area: '',
            content: '',
            progress: '-1',
            task_note: '',
            is_visible: true
        });

        // Lưu task vừa tạo vào danh sách task đang hiển thị
        allTasks.value.push(savedTask);

        console.log('Task vừa tạo:', savedTask);

    } catch (error) {
        console.error('Lỗi tạo task:', error);
    }
};


// Lấy id và tên nhân viên
const loadAllStaffs = async () => {
    allStaffs.value = await userServices.getUserInfor();
}

const loadAllFolders = async () => {
    allFolders.value = await maintenanceServices.getAllFolders();
}

const loadAllForms = async () => {
    allForms.value = await maintenanceServices.getAllForms();
}

const loadTasksByWeek = async () => {
    if (!weekDays.value?.id) {
        allTasks.value = [];
        return;
    }

    allTasks.value = await taskServices.getTasksByWeekId(
        weekDays.value.id
    );
};

const getTasksByDate = (date) => {
    const tasks = allTasks.value.filter((task) => {
        return task.task_date === date && task.is_visible === true;
    });


    return tasks;
};

const getNoVisibleTasks = () => {
    return allTasks.value.filter((task) => {
        return task.is_visible === false;
    })
}

// Load task theo tuần
watch(
    () => weekDays.value?.id, // Theo doi id cua weekDays
    async (weekId) => { // Ham xu ly khi id thay doi
        if (!weekId) {
            allTasks.value = [];
            return;
        }

        await loadTasksByWeek();
    },
    { immediate: true }
);


const handleToggleVisibility = async ({ taskId, isVisible }) => {
    console.log(taskId, " : ", isVisible);
    try {

        await taskServices.updateVisible(taskId, isVisible);

        const task = allTasks.value.find(
            (item) => item.id === taskId
        );

        if (task) {
            task.is_visible = isVisible;
        }
    } catch (error) {
        console.log("Loi khi an cong viec", error);
    }
}


const handleDeleteTask = async (taskId) => {
    try {
        await taskServices.deleteTaskOfDay(taskId);
        await loadTasksByWeek();

    } catch (error) {
        console.log('Loi khi xoa dong cong viec:', error);
    }
}

const handleExportExcel = async () => {
    try {
        const tasks = await taskServices.getTasksByWeekId(
            weekDays.value.id
        );

        exportTasksToExcel(tasks, selectedWeek.value);
    } catch (error) {
        console.error('Lỗi xuất Excel:', error);
    }
};

const handleCreateNewDate = async () => {
try {
      const hadTasks = await taskServices.getTasksByWeekId(weekDays.value.id);
    let initDate = '';
    if(hadTasks.length === 0){
       initDate = weekDays.value.dateStart[0].date;
    } else {
    const latestTask = await taskServices.getLatestTaskOfWeek(
        weekDays.value.id
    );

    // cộng ngày lên để tạo ngày tiếp theo nếu đã có ngày trước đó
    if (latestTask) {
        const nextDate = new Date(latestTask.task_date);

        nextDate.setDate(nextDate.getDate() + 1);

        initDate = nextDate.toISOString().split('T')[0];
    } else {
        initDate = weekDays.value.dateStart[0].date;
    }

}
        // Tạo task mới trong database
        const savedTask = await taskServices.createTask({
            week_id: weekDays.value.id,
            task_date:initDate ,
            shift: '',
            shift_text: '',
            area: '',
            content: '',
            progress: '-1',
            task_note: '',
            is_visible: true
        });

        // Lưu task vừa tạo vào danh sách task đang hiển thị
        allTasks.value.push(savedTask);

        console.log('Task vừa tạo:', savedTask);

    } catch (error) {
        console.error('Lỗi tạo task:', error);
    }
}

// Khi component vừa mount
onMounted(async () => {
    await loadAllWeeks();
    await loadLatestWeek();
    await loadAllStaffs();
    await loadAllFolders();
    await loadAllForms();
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
                <button @click="handleCreateNewDate" class="create_new_day btn btn-action"><i class="fa-solid fa-circle-plus"></i> Tạo ngày trực
                    mới</button>
                <button @click="handleExportExcel" class="download_week_excel btn btn-action"><i
                        class="fa-solid fa-file-arrow-down"></i> Tải excel
                    tuần</button>
                <button @click="toggleTable" class="show_task btn btn-action"><i class="fa-solid fa-eye-slash"></i> Công
                    việc bị ẩn</button>
            </div>
        </div>
    </article>

    <article class="weekly-plan-wrapper">
        <div class="table-wrapper" style="max-height:700px; overflow-y: auto;">
            <table id="weekly-plan" :style="{ width: totalWidth + 'px' }">
                <colgroup>
                    <col v-for="(w, i) in widths" :key="i" :style="{ width: w + 'px' }" />
                </colgroup>
                <thead>
                    <tr>
                        <th v-for="(h, i) in headers" :key="h">
                            {{ h }}
                            <span class="col-resizer" @pointerdown.prevent="startResize($event, i)"></span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="taskDate in weekDays.dateStart" :key="taskDate.date">
                        <!-- Những task đã lưu -->
                        <WeeklyTaskRow v-for="task in getTasksByDate(taskDate.date)" :key="task.id"
                            :task-date="taskDate" :task="task" :staffs="allStaffs" :week-id="weekDays.id"
                            :folders="allFolders" :forms="allForms" :add-task="addTask"
                            @toggle-visibility="handleToggleVisibility" @delete-task="handleDeleteTask" />

                    </template>
                </tbody>
            </table>
        </div>

        <div class="table-wrapper hide" style="max-height:700px; overflow-y: auto;">
            <table id="weekly-plan-hide" v-show="isTableVisible" :style="{ width: totalWidth + 'px' }">
                <colgroup>
                    <col v-for="(w, i) in widths" :key="i" :style="{ width: w + 'px' }" />
                </colgroup>
                <thead>
                    <tr>
                        <th v-for="(h, i) in headers" :key="h">
                            {{ h }}
                            <span class="col-resizer" @pointerdown.prevent="startResize($event, i)"></span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <WeeklyTaskRow v-for="task in getNoVisibleTasks()" :key="task.id"
                        :task-date="getDayInfoFromDate(task.task_date)" :task="task" :staffs="allStaffs"
                        :week-id="task.week_id" :folders="allFolders" :forms="allForms" :add-task="addTask"
                        @toggle-visibility="handleToggleVisibility" @delete-task="handleDeleteTask" />
                </tbody>
            </table>
        </div>
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
</style>