import {createRouter, createWebHistory} from 'vue-router'
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('../views/Home.vue')
        },
        {
            path: '/calendar',
            name: 'calendar',
            component: () => import('../views/Calendar.vue')
        },
        {
            path: '/archived-classes',
            name: 'archived-classes',
            component: () => import('../views/ArchivedClasses.vue')
        },
        {
            path: '/settings',
            name: 'settings',
            component: () => import('../views/Settings.vue')
        },
        {
            path: '/class-materials',
            name: 'class-materials',
            component: () => import('../views/ClassMaterials.vue')
        },
        {
            path: '/class-basic-info',
            name: 'class-basic-info',
            component: () => import('../views/ClassBasicInformation.vue')
        },
        {
            path: '/class-grades',
            name: 'class-grades',
            component: () => import('../views/ClassGrades.vue')
        },
        //其他的所有路由都会跳转到404页面
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('../views/404NotFound.vue')
        }
    ]
})

export default router