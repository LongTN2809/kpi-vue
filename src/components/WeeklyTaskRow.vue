<script setup>
import { ref, computed, watchEffect, watch, nextTick, onMounted } from 'vue';
import { autoResizeTextareas } from '@/helpers/weeklyPlan/autoResizes'
import { taskServices } from '@/services/taskServices';



// Data setup
const groups = [
    { id: 1, label: 'Carpenter' },
    { id: 2, label: 'Event' },
    { id: 3, label: 'Defect' },
    { id: 4, label: 'Bảo trì' },
    { id: 5, label: 'Vận hành' }
]

const dataRow = ref({
    taskId: null,
    shift: '',
    shiftText: '',
    group: '',
    area: '',
    taskContent: '',
    evidence: null,
    system: '',
    form: '',
    progress: '',
    note: '',
    employees: []
});

const isAssigneeOpen = ref(false)
// Điều khiển trạng thái đóng/mở popup ảnh
const isImageModalOpen = ref(false);

const searchStaff = ref('')

const isInitializing = ref(true);

const assignedUsers = ref([]);

// Danh sách ID nhân viên đã lưu trong database
const previousStaffIds = ref([]);

let saveTimeOut = null;

const props = defineProps({
    taskDate: Object,
    task: Object,
    staffs: Array,
    folders: Array,
    forms: Array,
    weekId: Number,
    addTask: Function,
    showDate: {
        type: Boolean,
        default: true
    },
    rowspan: {
        type: Number,
        default: 1
    }
});

// Đường dẫn tạm để hiển thị ảnh xem trước
const evidenceImages = ref([]);

const previewImageUrl = ref(null);

// Khi component bị hủy, giải phóng URL tạm
onMounted(() => {
    if (previewImageUrl.value) {
        URL.revokeObjectURL(previewImageUrl.value);
    }
});

// Lay danh sach cac nhan vien duoc phan cong cua moi staff dua tren id cua task tu component cha
const loadAssignedUsers = async (taskId) => {
    if (!taskId) {
        assignedUsers.value = [];
        return;
    }

    try {
        assignedUsers.value =
            await taskServices.getAssignedUsers(taskId);

        dataRow.value.employees = assignedUsers.value
            .filter(item => item.users)
            .map(item => item.users);

        // Lưu lại id những người đã được phân công
        previousStaffIds.value =
            dataRow.value.employees.map(staff => staff.id);

    } catch (error) {
        console.error('Lỗi lấy nhân viên:', error);
    }
};

// Filter Staff 
const filteredStaffs = computed(() => {
    const keyword = searchStaff.value.toLowerCase().trim();

    if (!keyword) return props.staffs;

    return props.staffs.filter((staff) => {
        return staff.display_name.toLowerCase().includes(keyword);
    })
})

// Filter forms by folder

const filteredForms = computed(() => {
    if (dataRow.value.system == "") return [];

    return props.forms.filter((form) => {
        return form.folder_id === dataRow.value.system;
    })
})


// Kiểm tra dòng công việc có dữ liệu cần lưu không
const hasTaskData = () => {
    return (
        dataRow.value.shift !== '' ||
        dataRow.value.shiftText.trim() !== '' ||
        dataRow.value.area.trim() !== '' ||
        dataRow.value.taskContent.trim() !== '' ||
        dataRow.value.group !== '' ||
        dataRow.value.progress !== '' ||
        dataRow.value.note.trim() !== '' ||
        dataRow.value.evidence !== null ||
        dataRow.value.employees.length > 0
    );
};
const saveTask = async () => {
    if (!hasTaskData()) return;

    const dataSetup = {
        task_date: props.taskDate.date,
        shift: dataRow.value.shift,
        shift_text: dataRow.value.shiftText,
        area: dataRow.value.area,
        content: dataRow.value.taskContent,
        group: dataRow.value.group,
        maintenance_system_id: dataRow.value.system || null,
        maintenance_form_id: dataRow.value.form || null,
        progress: dataRow.value.progress || '-1',
        task_note: dataRow.value.note,
        week_id: props.weekId
    };

    try {

        if (dataRow.value.taskId === null) { // neu dong cong viec chua co taskid => dong cong viec moi
            const savedTask = await taskServices.createTask(dataSetup);
            dataRow.value.taskId = savedTask.id;
        } else {
            await taskServices.updateTask(
                dataSetup,
                dataRow.value.taskId
            );
        }

        console.log('Đã tự động lưu task:', dataRow.value.taskId);
    } catch (error) {
        console.error('Lỗi auto save:', error);
    }
};

const saveAssignedStaffs = async (staffIds, taskId) => {
    try {
        await taskServices.saveAssignedUsers(taskId, staffIds)
    } catch (error) {
        console.log('Loi luu nhan vien duco phan viec', error);
    }
}

const handleConfirmAssignemnt = async () => {
    if (dataRow.value.taskId === null) {
        await saveTask();
    }

    const taskId = dataRow.value.taskId;

    if (taskId === null) {
        console.error('Chưa tạo được công việc!');
        return;
    }

    // Lấy danh sách ID của những nhân viên đang được chọn trong checkbox
    const currentStaffIds = dataRow.value.employees
        .map(staff => staff.id);

    // Tìm những nhân viên đã được phân công (đã ấn nút 'xác nhận') trước đó
    // nhưng hiện tại không còn được chọn nữa → cần xóa khỏi DB
    const removedStaffIds = previousStaffIds.value
        .filter(id => !currentStaffIds.includes(id));

    // Tìm những nhân viên hiện đang được chọn
    // nhưng trước đó chưa được phân công  → cần thêm vào DB
    const addedStaffIds = currentStaffIds
        .filter(id => !previousStaffIds.value.includes(id));

    try {
        // Xóa những nhân viên đã bị bỏ chọn
        for (const userId of removedStaffIds) {
            await taskServices.deleteAssignedUser(taskId, userId);
        }

        // Thêm những nhân viên mới được chọn
        if (addedStaffIds.length > 0) {
            await saveAssignedStaffs(addedStaffIds, taskId);
        }

        // Cập nhật danh sách ID đã xác nhận
        previousStaffIds.value = [...currentStaffIds];

        isAssigneeOpen.value = false;
    } catch (error) {
        console.error('Lỗi cập nhật phân công:', error);
    }
};

// Theo doi qua trinh nap du lieu cu tu db (hàm này cũng là đổ dữ liệu vào)
watch(
    () => props.task,
    async (task) => {
        isInitializing.value = true;

        if (task) {
            dataRow.value = {
                ...dataRow.value,
                taskId: task.id,
                shift: task.shift ?? '',
                shiftText: task.shift_text ?? '',
                group: task.group ?? '',
                area: task.area ?? '',
                taskContent: task.content ?? '',
                evidence: task.evidence_url ?? null,
                system: task.maintenance_system_id ?? '',
                form: task.maintenance_form_id ?? '',
                progress: task.progress ?? '',
                note: task.task_note ?? '',
                employees: []
            };

            // Tải danh sách nhân viên được phân công khi nạp dữ liệu 
            await loadAssignedUsers(task.id);

            // Tải ảnh tự động khi nạp dữ liệu
            await loadEvidenceImages(task.id);

        } else {
            dataRow.value.taskId = null;
            assignedUsers.value = [];
        }

        await nextTick();
        isInitializing.value = false;
    },
    { immediate: true }
);



// Theo doi khi nguoi dung chinh sua du lieu thi auto save
watch(
    dataRow,
    () => {
        // Hủy bộ đếm cũ nếu người dùng tiếp tục nhập
        clearTimeout(saveTimeOut);

        // Bỏ qua lúc đang nạp dữ liệu ban đầu
        if (isInitializing.value) {
            return;
        }

        // Không lưu nếu dòng chưa có dữ liệu
        if (!hasTaskData()) {
            return;
        }

        // Đợi người dùng ngừng nhập 800ms
        saveTimeOut = setTimeout(async () => {
            try {
                await saveTask();
                console.log('Lưu công việc thành công!');
            } catch (error) {
                console.error('Lỗi auto save:', error);
            }
        }, 800);
    },
    { deep: true }
);


const emit = defineEmits(['toggle-visibility', 'delete-task']);
const handleToggleVisibility = async () => {
    try {
        const currentStatus = await taskServices.getVisible(props.task.id);
        const newStatus = !currentStatus.is_visible;
        emit('toggle-visibility', {
            taskId: props.task.id,
            isVisible: newStatus
        });
    } catch (error) {
        console.log(error);
    }

}
const handleDeleteTask = () => {
    emit('delete-task', props.task.id);
}

const handleImageChange = async (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    const taskId = dataRow.value.taskId;

    if (!taskId) {
        console.error('Không tìm thấy taskId');
        return;
    }

    try {
        // Xử lý lần lượt từng ảnh
        for (const file of files) {
            // 1. Upload file lên Supabase Storage
            const filePath = await taskServices.uploadEvidenceImage(
                file,
                taskId
            );

            // 2. Lưu đường dẫn ảnh vào bảng task_evidence
            await taskServices.addEvidence(
                taskId,
                filePath
            );
        }

        // Tải lại danh sách ảnh sau khi thêm xong
        await loadEvidenceImages(taskId);

    } catch (error) {
        console.error('Lỗi thêm ảnh minh chứng:', error);
    } finally {
        // Cho phép chọn lại cùng một file ở lần tiếp theo
        event.target.value = '';
    }
};

const loadEvidenceImages = async (taskId) => {
    if (!taskId) {
        evidenceImages.value = [];
        return;
    }

    try {
        // 1. Lấy danh sách ảnh từ database
        const images = await taskServices.getEvidenceByTaskId(taskId);

        // 2. Tạo URL xem ảnh cho từng ảnh
        evidenceImages.value = await Promise.all(
            images.map(async (image) => {
                const previewUrl = await taskServices.getEvidenceImageUrl(
                    image.file_path
                );

                return {
                    ...image,
                    previewUrl: previewUrl
                };
            })
        );
    } catch (error) {
        console.error('Lỗi tải ảnh minh chứng:', error);
        evidenceImages.value = [];
    }
};



const openEvidencePreview = (imageUrl) => {
    previewImageUrl.value = imageUrl;
    isImageModalOpen.value = true;
};


const handleDeleteEvidence = async (image) => {
    console.log('Ảnh được chọn:', image);
    console.log('ID bản ghi:', image.id);
    console.log('Đường dẫn file:', image.file_path);
    if (!image.id) return

    try {
        await taskServices.deleteEvidenceByImageId(image.id, image.file_path);
        await loadEvidenceImages(dataRow.value.taskId);
        console.log("Xoá ảnh thành công");
    } catch (error) {
        console.log("Lỗi khi xoá ảnh minh chứng", error);
    }
}

</script>

<template>

    <tr class="task_row">
        <td v-if="showDate" class="task_col date" :rowspan="rowspan">
            {{ taskDate.dayOfWeek }} <br> {{ taskDate.date }}
        </td>
        <td class="task_col shifts">
            <select v-model="dataRow.shift" name="shift" class="select-shift">
                <option selected disabled value="">Chọn ca</option>
                <option value="a">Ca A</option>
                <option value="b">Ca B</option>
                <option value="c">Ca C</option>
                <option value="n">Ca N</option>
            </select>
            <textarea v-model="dataRow.shiftText" rows="3" cols="3" name="shift_text" class="content_area"
                @input="autoResizeTextareas"></textarea>
        </td>
        <td class="task_col groups">
            <select v-model="dataRow.group" name="groups" class="select-groups">
                <option value="" disabled selected>Chọn nhóm</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.label }}</option>
            </select>
        </td>
        <td class="task_col areas">
            <textarea v-model="dataRow.area" rows="4" cols="8" name="content_area" class="content_area"
                @input="autoResizeTextareas"></textarea>
        </td>
        <td class="task_col content">
            <textarea v-model="dataRow.taskContent" rows="4" cols="8" name="content_area" class="content_area"
                @input="autoResizeTextareas"></textarea>
        </td>
        <td class="task_col evidents">
            <div class="evidence-upload">

                <!-- Hiển thị ảnh xem trước nếu người dùng đã chọn -->
                <div class="evidence-gallery">
                    <!-- Nút chọn ảnh -->
                    <label class="evidence-add">
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                            @change="handleImageChange" />
                        <span class="evidence-add-icon">+</span>
                        <span>Thêm ảnh</span>
                    </label>

                    <!-- Danh sách ảnh đã lưu -->
                    <div v-for="image in evidenceImages" :key="image.id" class="evidence-item"
                        @click="openEvidencePreview(image.previewUrl)">
                        <img :src="image.previewUrl" alt="Ảnh minh chứng" />
                        <button type="button" class="btn-delete-evidence" @click.stop="handleDeleteEvidence(image)">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!--Popup phongs to ảnh -->
                    <div v-if="isImageModalOpen" class="image-modal" @click.self="isImageModalOpen = false">
                        <div class="image-modal-content">
                            <button type="button" class="image-modal-close" @click="isImageModalOpen = false"
                                aria-label="Đóng ảnh">
                                &times;
                            </button>

                            <img :src="previewImageUrl" alt="Ảnh minh chứng phóng to" />
                        </div>
                    </div>
                </div>
            </div>
        </td>
        <td class="task_col forms">
            <select v-model="dataRow.system" name="systems" class="systems">
                <option value="" disabled selected>Hệ thống</option>
                <option v-for="folder in props.folders" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
            </select>
            <select v-model="dataRow.form" name="forms" class="forms">
                <option value="" disabled selected>Biểu mẫu</option>
                <option v-for="form in filteredForms" :key="form.id" :value="form.id">{{ form.form_name }}</option>
            </select>
        </td>
        <td class="task_col staff_actions">
            <div class="assignee-wrapper">

                <!-- Người đã chọn -->
                <div class="selected-staffs">

                    <span v-for="staff in dataRow.employees" :key="staff.id" class="staff-tag">
                        <i class="fa-solid fa-user"></i>
                        {{ staff.display_name }}
                    </span>

                </div>


                <!-- Nút phân việc -->
                <button class="assign-button" @click="isAssigneeOpen = !isAssigneeOpen">
                    <i class="fa-solid fa-users"></i>
                    Phân việc
                </button>


                <!-- Dropdown -->
                <div v-if="isAssigneeOpen" class="assignee-dropdown">

                    <div class="dropdown-title">
                        Phân công nhân sự
                    </div>


                    <!-- Tìm kiếm -->
                    <input v-model="searchStaff" type="text" placeholder="Tìm tên nhân viên..." class="staff-search">


                    <!-- Danh sách -->
                    <div class="staff-list">

                        <label v-for="staff in filteredStaffs" :key="staff.id" class="staff-option">
                            <input v-model="dataRow.employees" type="checkbox" :value="staff">

                            <span>
                                {{ staff.display_name }}
                            </span>
                        </label>


                        <div v-if="filteredStaffs.length === 0" class="no-result">
                            Không tìm thấy nhân viên
                        </div>

                    </div>


                    <!-- Xác nhận -->
                    <button class="confirm-button" @click="handleConfirmAssignemnt">
                        Xác nhận
                    </button>

                </div>

            </div>
        </td>
        <td class="task_col kpi-progress">
            <select v-model="dataRow.progress" name="progress" class="select-progress">
                <option selected value="-1">Chọn tiến độ</option>
                <option value="0">Làm lại</option>
                <option value="1">Hoàn thành</option>
                <option value="2">Đang thực hiện</option>
                <option value="3">Bàn Giao</option>
            </select>
        </td>
        <td class="task_col notes">
            <textarea v-model="dataRow.note" rows="4" cols="8" name="content_area" class="content_area"
                @input="autoResizeTextareas"></textarea>
        </td>
        <td class="task_col actions">
            <button @click="props.addTask(props.taskDate)">
                <i class="fa-solid fa-circle-plus"></i>
            </button>
            <button @click="handleToggleVisibility">
                <i class="fa-solid fa-eye-slash"></i>
            </button>
            <button @click="handleDeleteTask">
                <i class="fa-solid fa-trash"></i>
            </button>

        </td>
    </tr>
</template>

<style>
.assignee-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 50px;
}

.selected-staffs {
    display: flex;
    flex-wrap: wrap;
    max-width: 100%;
}

.staff-tag {
    display: inline-block;
    margin: 2px;
    padding: 3px 6px;

    background: white;
    border: 1px solid #d1d5db;
    border-radius: 5px;

    font-size: 9px;
    font-weight: 700;
    color: #334155;

    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.staff-tag i {
    color: #3b82f6;
    margin-right: 4px;
}

.assign-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;

    padding: 5px 8px;

    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 7px;

    color: #334155;
    font-size: 9px;
    font-weight: 800;

    cursor: pointer;
}

.assign-button:hover {
    background: #e2e8f0;
}

.assignee-dropdown {
    position: absolute;
    top: 100%;
    left: 0;

    z-index: 30;

    width: 208px;
    margin-top: 4px;
    padding: 8px;

    background: white;
    border: 1px solid #dbe2ea;
    border-radius: 12px;

    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);

    display: flex;
    flex-direction: column;
    gap: 5px;
}

.dropdown-title {
    padding-bottom: 5px;

    border-bottom: 1px solid #e5e7eb;

    color: #94a3b8;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
}

.staff-search {
    width: 100%;
    box-sizing: border-box;

    padding: 5px 8px;

    border: 1px solid #d1d5db;
    border-radius: 7px;

    font-size: 10px;
    font-weight: 600;

    outline: none;
}

.staff-search:focus {
    border-color: #60a5fa;
}

.staff-list {
    max-height: 160px;
    overflow-y: auto;
}

.staff-option {
    display: flex;
    align-items: center;
    gap: 7px;

    padding: 5px 8px;

    color: #334155;
    font-size: 12px;
    font-weight: 700;

    cursor: pointer;
}

.staff-option:hover {
    background: #f1f5f9;
}

.staff-option input {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.no-result {
    padding: 10px;

    color: #94a3b8;
    font-size: 10px;
    font-style: italic;
    text-align: center;
}

.confirm-button {
    padding: 5px;

    background: #2563eb;
    border: none;
    border-radius: 5px;

    color: white;
    font-size: 9px;
    font-weight: 700;

    cursor: pointer;
}

.confirm-button:hover {
    background: #1d4ed8;
}

.task_col.actions button {
    background: transparent;
    border: none;
    outline: none;
}


/* Lớp nền phủ toàn màn hình */
.image-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.78);
}

/* Khung chứa ảnh lớn */
.image-modal-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Ảnh không vượt khỏi màn hình */
.image-modal-content img {
    display: block;
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

/* Nút đóng */
.image-modal-close {
    position: absolute;
    top: -14px;
    right: -14px;
    z-index: 1;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 50%;
    background: #ffffff;
    color: #111827;
    font-size: 26px;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.image-modal-close:hover {
    background: #e5e7eb;
}


.evidence-gallery {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 0;
}

/* Nút thêm ảnh */
.evidence-add {
    width: 76px;
    height: 76px;
    flex-shrink: 0;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;

    border: 1px dashed #64748b;
    border-radius: 8px;
    background: #1e293b;
    color: #cbd5e1;

    font-size: 11px;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
}

.evidence-add:hover {
    background: #334155;
    border-color: #38bdf8;
}

.evidence-add input {
    display: none;
}

.evidence-add-icon {
    font-size: 25px;
    line-height: 1;
}

/* Thumbnail ảnh */
.evidence-item {
    position: relative;
    width: 76px;
    height: 76px;
    flex-shrink: 0;

    overflow: hidden;
    border: 1px solid #475569;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s, transform 0.2s;
}

.evidence-item:hover {
    border-color: #38bdf8;
    transform: scale(1.04);
}

.evidence-item img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
}

.btn-delete-evidence {
    position: absolute;
    top: 0px;
    right: 0;
    cursor: pointer;
    color: red;
    border: none;
    background: transparent;
}
</style>