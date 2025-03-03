import {createRouter, createWebHistory} from 'vue-router'
/*
路由元含义：
requiresAuth: 是否需要登录才能访问
hideLayout: 是否隐藏顶部和侧边栏布局，比如登录页面就不需要布局
*/
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: () => import('../views/WithLayoutWrapper.vue'),
            children: [
                {
                    path: '',
                    component: () => import('../views/Home.vue')
                },
                {
                    path: 'calendar',
                    component: () => import('../views/Calendar.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'archived-classes',
                    component: () => import('../views/ArchivedClasses.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'settings',
                    component: () => import('../views/Settings.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'class-materials',
                    component: () => import('../views/ClassMaterials.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'class-basic-info',
                    component: () => import('../views/ClassBasicInformation.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'class-grades',
                    component: () => import('../views/ClassGrades.vue'),
                    meta: { requiresAuth: true }
                }
            ]
        },
        {
            path: '/auth',
            children: [
                {
                    path: 'login',
                    component: () => import('../views/Login.vue')
                },
                {
                    path: 'register',
                    component: () => import('../views/Register.vue')
                },
                {
                    path: 'reset-password',
                    component: () => import('../views/ResetPassword.vue')
                }
            ]
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('../views/404NotFound.vue')
        }
    ]
})

//路由守卫，检查是否登录
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token')
    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/auth/login')
        console.log(`You can't access this page from ${from.fullPath} without logging in`)
    } else {
        next()
    }
})


export default router