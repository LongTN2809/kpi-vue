
import * as XLSX from 'xlsx';
import { maintenanceServices } from '@/services/maintenanceServices.js'
function getProgressText(progress) {
    let progressText = '';
    switch (progress) {
        case '-1':
            progressText = 'Chọn tiến độ';
            break;
        case '0':
            progressText = 'Làm lại';
            break;
        case '1':
            progressText = 'Hoàn thành';
            break;
        case '2':
            progressText = 'Đang thực hiện';
            break;
        case '3':
            progressText = 'Bàn giao';
            break;
        default:
            progressText = 'Tiến độ không hợp lệ'
            break;
    }
    return progressText;
}

function getGroupText(group) {
    let groupText = '';
    switch (group) {
        case 1:
            groupText = 'Bảo trì'
            break;
        case 2:
            groupText = 'Event'
            break;
        case 3:
            groupText = 'Defect'
            break;
        case 4:
            groupText = 'Vận hành'
            break;
        case 5:
            groupText = 'Carpenter'
            break;

        default:
            groupText = 'Chọn nhóm'
            break;
    }
    return groupText
}

async function getFolderName(folderId) {

    if (!folderId) return null;

    const folders = await maintenanceServices.getAllFolders();


    const folder = folders.find((folder) => folder.id === folderId);


    if (folder) {

        return folder.name;
    }

    return undefined;
}

async function getFormName(formId) {
    console.log("Form id : ", formId)
    if (!formId) return null;

    const forms = await maintenanceServices.getAllForms();

    console.log("Kết quả lấy form: ", forms);
    console.log("Kiểu dữ liệu : ", typeof forms);


    const form = forms.find((form) => form.id === formId);

    console.log("Kết quả lọc form :", form);


    if (form) {
        console.log("Chui vô return true");
        console.log("Kết quả cuối cùng folder.name: ", form.form_name);
        return form.form_name;
    }

    return undefined;
}

export const exportTasksToExcel = async (tasks, weekNum) => {

    const exportData = await Promise.all(

        tasks.map(async (task) => {
            return {
                'Ngày thực hiện': task.task_date,
                'Nhóm': getGroupText(task.group),
                'Ca làm việc': task.shift_text || '',
                'Khu vực': task.area || '',
                'Nội dung công việc': task.content || '',
                'Tiến độ': getProgressText(task.progress),
                'Thư mục bảo trì': await getFolderName(task.maintenance_system_id),
                'Form bảo trì': await getFormName(task.maintenance_form_id),
                'Ghi chú': task.task_note || '',
                'Liên kết Google Sheets': task.google_sheet_link || '',
            };
        })
    );


    // Chuyển dữ liệu nhiệm vụ thành worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Tạo workbook chứa worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng phân công tuần');

    // Đặt độ rộng cột để dễ đọc
    worksheet['!cols'] = [
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 40 },
        { wch: 15 },
        { wch: 30 },
        { wch: 35 },
        { wch: 15 }
    ];

    // Tạo và tải file Excel
    XLSX.writeFile(workbook, `KPI_Tuan_${weekNum}.xlsx`);
};
