
import { createRouter, createWebHistory } from 'vue-router';
import { supabase } from '@/lib/supabase.js';

const routes = [
    { path: '/', redirect: '/weekly-plan' },

    {
        path: '/weekly-plan',
        name: 'WeeklyPlan',
        component: () => import('../views/WeeklyPlanView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/backlog',
        name: 'Backlog',
        component: () => import('../views/BackLogView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/maintenance-form',
        name: 'MaintenanceForm',
        component: () => import('../views/MaintenanceFormView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/kpi-dashboard',
        name: 'KpiDashboard',
        component: () => import('../views/KpiDashboardView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/admin-config',
        name: 'AdminConfig',
        component: () => import('../views/AdminConfigView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/account',
        name: 'StaffAccount',
        component: () => import('../views/AccountView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/login',
        name: 'LoginView',
        component: () => import('../views/Login.vue'),
        meta: { requiresAuth: false }
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to) => {
    const { data, error } = await supabase.auth.getSession();

    const isLoggedIn = !error && !!data.session;

    if (to.meta.requiresAuth && !isLoggedIn) {
        return '/login';
    }

    if (to.path === '/login' && isLoggedIn) {
        return '/weekly-plan';
    }
});

export default router;
