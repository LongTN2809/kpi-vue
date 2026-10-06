<script setup>
import { RouterLink } from 'vue-router';

import { onMounted } from 'vue'

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme')
    applyTheme(current === 'dark' ? 'light' : 'dark')
}

onMounted(() => {
    // Ưu tiên: theme đã lưu trước đó > theme hệ thống > mặc định light
    const saved = localStorage.getItem('theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(saved || (systemDark ? 'dark' : 'light'))
})
</script>
<template>
    <!-- HEADER -->
    <header class="app-header">
        <!-- Logo -->
        <div class="logo-wrapper">
            <img src="@/assets/logo.png" alt="">
        </div>
        <!-- NAVIGATION -->
        <nav class="main-nav">

            <router-link to="/weekly-plan" class="nav-item" active-class="active">
                WEEKLY PLAN
            </router-link>


            <router-link to="/backlog" class="nav-item" active-class="active">
                TỒN ĐỌNG / PHÁT SINH
            </router-link>


            <router-link to="/maintenance-form" class="nav-item" active-class="active">
                FORM BẢO TRÌ
            </router-link>


            <router-link to="/kpi-dashboard" class="nav-item" active-class="active">
                DASHBOARD KPI
            </router-link>


            <router-link to="/admin-config" class="nav-item" active-class="active">
                CẤU HÌNH ADMIN
            </router-link>

        </nav>


        <!-- RIGHT ACTIONS -->
        <div class="header-actions">
            <div>
                <button @click="toggleTheme" id="mode-switch">
                    <i class="fa-regular fa-sun"></i>
                    <i class="fa-regular fa-moon"></i>
                </button>
            </div>
            <router-link to="/account" class="icon-btn">
                <i class="fa-solid fa-circle-user"></i>
            </router-link>
            <router-link to="/login" class="icon-btn icon-btn-danger">
                <i class="fa-solid fa-power-off"></i>
            </router-link>
        </div>

    </header>
</template>

<style scoped>
.app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1.2rem 1.5rem;
    background-color: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
}

/* ---- Logo ---- */
.logo-wrapper {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.logo-wrapper img {
    height: 50px;
    width: auto;
    object-fit: contain;
    border-radius: 5px;
}

/* ---- Navigation ---- */
.main-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    overflow-x: auto;
}

.nav-item {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 0.9rem;
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--color-text-light);
    border-radius: var(--radius-sm);
    white-space: nowrap;
    text-decoration: none;
    transition: background-color var(--transition-fast), color var(--transition-fast);
}

.nav-item:hover {
    background-color: var(--color-tertiary);
    color: var(--color-primary-dark);
    text-decoration: none;
}

.nav-item.active {
    background-color: var(--color-primary);
    color: #ffffff;
}

/* ---- Right actions ---- */
.header-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-shrink: 0;
}

.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: none;
    background-color: var(--color-tertiary);
    color: var(--color-primary);
    font-size: 1rem;
    cursor: pointer;
    text-decoration: none;
    transition: background-color var(--transition-fast), color var(--transition-fast);
}

.icon-btn:hover {
    background-color: var(--color-primary);
    color: #ffffff;
    text-decoration: none;
}

.icon-btn-danger {
    background-color: #fee2e2;
    color: var(--color-danger);
}

.icon-btn-danger:hover {
    background-color: var(--color-danger);
    color: #ffffff;
}

/* ---- Responsive ---- */
@media (max-width: 900px) {
    .app-header {
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .main-nav {
        order: 3;
        width: 100%;
        justify-content: flex-start;
    }
}
</style>