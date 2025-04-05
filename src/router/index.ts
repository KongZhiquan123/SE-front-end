import {createRouter, createWebHistory} from 'vue-router'
import {useUserStore} from "@/stores/user";
/*
路由元含义：
requiresAuth: 是否需要登录才能访问
*/
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: () => import('../views/HomeLayout.vue'),
            meta: {requiresAuth: true, roles: ['student', 'teacher', 'admin', null]},
            children: [
                {
                    path: '',
                    component: () => import('../views/HomePages/Home.vue'),
                    meta: {requiresAuth: false}
                },
                {
                    path: 'calendar',
                    component: () => import('../views/HomePages/Calendar.vue'),
                },
                {
                    path: 'archived-classes',
                    component: () => import('../views/HomePages/ArchivedClasses.vue'),
                },
                {
                    path: 'settings',
                    component: () => import('../views/HomePages/Settings.vue'),
                },
                {
                    path: 'notifications',
                    component: () => import('../views/HomePages/Notifications.vue'),
                }
            ]
        },
        {
            path: '/student-course',
            component: () => import('../views/CourseLayout.vue'),
            meta: {requiresAuth: true, roles: ['student', 'admin']},
            children: [
                {
                    path: 'course-materials',
                    component: () => import('../views/CoursePages/CourseMaterials.vue'),

                },
                {
                    path: 'course-basic-info',
                    component: () => import('../views/CoursePages/CourseBasicInformation.vue'),
                },
                {
                    path: 'course-grades',
                    component: () => import('../views/CoursePages/CourseGrades.vue'),
                },
                {
                    path: 'course-assignments',
                    component: () => import('../views/CoursePages/CourseAssignments.vue'),
                },
                {
                    path: 'submit-assignments',
                    component: () => import('../views/CoursePages/CourseSubmission.vue'),
                }
            ]
        },
        {
            path: '/teacher-course',
            component: () => import('../views/CourseLayout.vue'),
            meta: {requiresAuth: true, roles: ['teacher', 'admin']},
            children: [
                {
                    path: 'course-basic-info',
                    component: () => import('../views/CoursePages/CourseBasicInformation.vue'),
                },
                {
                    path: 'create-assignment',
                    component: () => import('../views/CoursePages/CreateAssignment.vue'),
                }
            ]
        },
        {
            path: '/auth',
            children: [
                {
                    path: 'login',
                    component: () => import('../views/AuthPages/Login.vue')
                },
                {
                    path: 'register',
                    component: () => import('../views/AuthPages/Register.vue')
                },
                {
                    path: 'reset-password',
                    component: () => import('../views/AuthPages/ResetPassword.vue')
                }
            ]
        },
        {
            path: '/code-edit-and-run',
            component: () => import('../views/CodeEditorLayout.vue'),
            meta: {requiresAuth: true},
            children: [
                {
                    path: 'code-edit',
                    component: () => import('../views/CodeEditAndAssessmentPages/CodeEditor.vue'),
                },
                {
                    path: 'code-run',
                    component: () => import('../views/CodeEditAndAssessmentPages/CodeRun.vue'),
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
    const userStore = useUserStore()
    if (to.meta.requiresAuth && !userStore.authorized) {
        next('/auth/login')
        console.log(`You can't access this page from ${from.fullPath} without logging in`)
        return
    }
    if (to.meta.roles && !to.meta.roles.includes(userStore.role)) {
        next('/')
        console.log(`User role ${userStore.role} not authorized to access ${to.path}`)
        return
    }
    next()
})


export default router