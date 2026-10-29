import { supabase } from '@/lib/supabase'

export const userServices = {
    // Lay id , ten nhan vien 
    async getUserInfor() {
        const { data, error } = await supabase
            .from('users')
            .select('id, display_name')

        if (error) throw error;
        return data;
    }
}