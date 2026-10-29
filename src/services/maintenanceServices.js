import { supabase } from '@/lib/supabase'
export const maintenanceServices = {
    async getAllFolders() {
        const { data, error } = await supabase
            .from('maintenance_folders')
            .select('id, name, parent_id')

        if (error) throw error
        return data
    },

    async getAllForms() {
        const { data, error } = await supabase
            .from('maintenance_forms')
            .select('*')

        if (error) throw error

        return data
    }
}