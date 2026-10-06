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

    async saveTask(taskData) {
        // Loại bỏ biến tạm local_id trước khi gửi lên Supabase
        const { local_id, day_name, employees, is_visible, role_in_task, ...payload } = taskData;

        const { data, error } = await supabase
            .from('tasks')
            .upsert(payload, { onConflict: 'id' }) // Upsert theo khoá chính id
            .select();

        if (error) throw error;
        return data[0];
    }
}