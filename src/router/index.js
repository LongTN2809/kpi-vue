import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/weekly-plan' },
  { path: '/weekly-plan', name: 'WeeklyPlan', component: () => import('../views/WeeklyPlanView.vue') },
  { path: '/backlog', name: 'Backlog', component: () => import('../views/BackLogView.vue') },
  { path: '/maintenance-form', name: 'MaintenanceForm', component: () => import('../views/MaintenanceFormView.vue') },
  { path: '/kpi-dashboard', name: 'KpiDashboard', component: () => import('../views/KpiDashboardView.vue') },
  { path: '/admin-config', name: 'AdminConfig', component: () => import('../views/AdminConfigView.vue') },
  { path: '/account', name: 'StaffAccount', component: () => import('../views/AccountView.vue') },
  { path: '/login', name: 'LoginView', component: () => import('../views/Login.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router