import { supabase } from '@/lib/supabase'

export const weeklyPlanServices = {

    // Xoá tuần 
    async deleteWeek(week_num) {
        const { data, error } = await supabase
            .from('weeks')
            .delete()
            .eq('week_num', week_num)

        if (error) throw error
        return data
    },


    // Lay tuan gan nhat trong db (sap xep theo week_num giam dan => lay 1)
    async getLatestWeek() {
        const { data, error } = await supabase
            .from('weeks')
            .select('*')
            .order('week_num', { ascending: false })
            .limit(1)
            .maybeSingle() // Trả về 1 object hoặc null nếu bảng trống

        if (error) throw error
        return data
    },

    // Tạo tuần mới
    async createNewWeek(weekData) {
        const { data, error } = await supabase
            .from('weeks')
            .insert(weekData)
            .select()
        if (error) throw error
        return data
    },


    // Lay tat ca cac tuan
    async getAllWeeks() {
        const { data, error } = await supabase
            .from('weeks')
            .select('*')

        if (error) throw error
        return data
    },




}