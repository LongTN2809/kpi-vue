import { supabase } from "@/lib/supabase"

export const taskServices = {
    async getTasksByWeekId(weekId) {
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("week_id", weekId)
            .order("task_date", { ascending: true });

        if (error) throw error;
        return data;
    },
    async getLatestTaskOfWeek(weekId){
        const {data , error} = await supabase
        .from("tasks")
        .select("task_date")
        .eq('week_id' , weekId)
        .order('task_date', { ascending: false })
        .limit(1)
        .maybeSingle()

        if(error) throw error;
        return data;
    },

    async createTask(taskData) {
        const { data, error } = await supabase
            .from('tasks')
            .insert(taskData)
            .select()
            .single();

        if (error) throw error;

        return data;
    },

    async updateTask(taskData, taskId) {
        const { error } = await supabase
            .from('tasks')
            .update(taskData)
            .eq('id', taskId)

        if (error) throw error;
    },

    async updateVisible(taskId, is_visible) {
        const { error } = await supabase
            .from('tasks')
            .update({ is_visible: is_visible })
            .eq('id', taskId)

        if (error) throw error;
    },

    async getVisible(taskId) {
        const { data, error } = await supabase
            .from('tasks')
            .select("is_visible")
            .eq('id', taskId)
            .single()

        if (error) throw error;

        return data;
    },

    async createEmptyTasksForWeek(weekId, dates) {
        const emptyTasks = dates.map((date) => ({
            week_id: weekId,
            task_date: date.date,
            shift: '',
            shift_text: '',
            area: '',
            content: '',
            progress: '-1',
            task_note: ''
        }));

        const { data, error } = await supabase
            .from('tasks')
            .insert(emptyTasks)
            .select();

        if (error) throw error;

        return data;
    },

    async deleteTaskOfDay(taskId) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (error) throw error;
    },

    async saveAssignedUsers(taskId, staffIds) {
        const { data, error } = await supabase
            .from('users_tasks')
            // Insert nhieu dong => dung map de dua cac dong vao 1 mang ( bat buoc phai la mang khi insert nhieu dong )
            .insert(
                staffIds.map(staffId => ({
                    task_id: taskId,
                    user_id: staffId
                }))
            );

        if (error) throw error

        return data;
    },

    async getAssignedUsers(taskId) {
        const { data, error } = await supabase
            .from('users_tasks')
            .select(`
      user_id,
      users (
        id,
        display_name
      )
    `)
            .eq('task_id', taskId);

        if (error) throw error;

        return data;
    },
    async deleteAssignedUser(taskId, userId) {
        const { error } = await supabase
            .from('users_tasks')
            .delete()
            .eq('task_id', taskId)
            .eq('user_id', userId);

        if (error) throw error;
    },

    async uploadEvidenceImage(file, taskId) {
        // Tạo tên file riêng để tránh trùng tên ảnh
        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExtension}`;

        // Gom ảnh vào thư mục theo ID công việc
        const filePath = `${taskId}/${fileName}`;

        // Upload file ảnh lên bucket task-evidence
        const { data, error } = await supabase.storage
            .from('task-evidence')
            .upload(filePath, file);

        if (error) {
            throw error;
        }

        // Trả về đường dẫn file trong Storage
        return data.path;
    },

    // Lưu đường dẫn ảnh minh chứng vào bảng task_evidence
    async addEvidence(taskId, filePath) {
        const payload = {
            task_id: taskId,
            file_path: filePath
        };

        console.log('Payload thêm ảnh:', payload);

        const { data, error } = await supabase
            .from('task_evidence')
            .insert(payload)
            .select()
            .single();

        console.log('Kết quả thêm ảnh:', data);
        console.log('Lỗi thêm ảnh:', error);

        if (error) {
            throw error;
        }

        return data;
    },

    async getEvidenceImageUrl(filePath) {
        const { data, error } = await supabase.storage
            .from('task-evidence')
            .createSignedUrl(filePath, 3600);

        if (error) {
            throw error;
        }

        return data.signedUrl;
    },

    // Lấy danh sách ảnh minh chứng của một công việc
    async getEvidenceByTaskId(taskId) {
        const { data, error } = await supabase
            .from('task_evidence')
            .select('id, task_id, file_path, created_at')
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data;
    },

    async deleteEvidenceByImageId(imageId, filePath) {
        console.log('Bắt đầu xóa:', { imageId, filePath });

        // Bước 1: Xóa file trong Storage
        const { data: storageData, error: storageError } =
            await supabase.storage
                .from('task-evidence')
                .remove([filePath]);

        console.log('Kết quả Storage:', storageData);

        if (storageError) {
            console.error('Lỗi xóa Storage:', storageError);
            throw storageError;
        }

        // Bước 2: Xóa bản ghi trong database
        const { data: databaseData, error: databaseError } =
            await supabase
                .from('task_evidence')
                .delete()
                .eq('id', imageId)
                .select();

        console.log('Bản ghi đã xóa:', databaseData);

        if (databaseError) {
            console.error('Lỗi xóa database:', databaseError);
            throw databaseError;
        }

        return {
            storageData,
            databaseData
        };
    },
}