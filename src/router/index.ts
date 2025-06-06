import {createRouter, createWebHistory} from 'vue-router'
import {useUserStore} from "@/stores/user";
/*
路由元含义：
requiresAuth: 是否需要登录才能访问
roles: 访问该路由需要的角色
*/
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: () => import('@/views/HomeLayout.vue'),
            meta: {requiresAuth: true, roles: ['student', 'teacher', 'admin']},
            children: [
                {
                    path: '',
                    component: () => import('@/views/HomePages/Home.vue'),
                    meta: {requiresAuth: false, roles: ['student', 'teacher', 'admin', null]},
                },
                {
                    path: 'calendar',
                    component: () => import('@/views/HomePages/Calendar.vue'),
                },
                {
                    path: 'settings',
                    component: () => import('@/views/HomePages/ProfileSettings.vue'),
                },
                {
                    path: 'notifications',
                    component: () => import('@/views/HomePages/Notifications.vue'),
                }
            ]
        },
        {
            path: '/student-course',
            component: () => import('@/views/CourseLayout.vue'),
            meta: {requiresAuth: true, roles: ['student', 'admin']},
            children: [
                {
                    path: 'course-materials',
                    component: () => import('@/views/CoursePages/CourseMaterials.vue'),

                },
                {
                    path: 'course-basic-info',
                    component: () => import('@/views/CoursePages/CourseBasicInformation.vue'),
                },
                {
                    path: 'course-grades',
                    component: () => import('@/views/CoursePages/CourseGrades.vue'),
                },
                {
                    path: 'course-assignments',
                    component: () => import('@/views/CoursePages/CourseAssignments.vue'),
                },
                {
                    path: 'submit-assignments',
                    component: () => import('@/views/CoursePages/CourseSubmission.vue'),
                }
            ]
        },
        {
            path: '/teacher-course',
            component: () => import('@/views/CourseLayout.vue'),
            meta: {requiresAuth: true, roles: ['teacher', 'admin']},
            children: [
                {
                    path: 'course-basic-info',
                    component: () => import('@/views/CoursePages/CourseBasicInformation.vue'),
                },
                {
                    path: 'assignment-management',
                    component: () => import('@/views/CoursePages/AssignmentManagement.vue'),
                },
                {
                    path: 'create-assignment',
                    component: () => import('@/components/AssignmentComponents/AssignmentCreate.vue')
                },
                {
                    path: 'update-assignment',
                    component: () => import('@/components/AssignmentComponents/AssignmentUpdate.vue')
                },
                {
                    path: 'grading-assignment',
                    component: () => import('@/components/AssignmentComponents/AssignmentGrading.vue')
                },
                {
                    path: 'grading-submission',
                    component: () => import('@/components/AssignmentComponents/SubmissionView.vue')
                },
                {
                    path: 'resource-management',
                    component: () => import('@/views/CoursePages/ResourceManagement.vue'),
                },
                {
                    path: 'create-resource',
                    component: () => import('@/components/ResourceComponents/ResourceCreate.vue')
                },
                {
                    path: 'update-resource',
                    component: () => import('@/components/ResourceComponents/ResourceUpdate.vue')
                },
                
            ]
        },
        {
            path: '/auth',
            children: [
                {
                    path: 'login',
                    component: () => import('@/views/AuthPages/Login.vue')
                },
                {
                    path: 'register',
                    component: () => import('@/views/AuthPages/Register.vue')
                },
                {
                    path: 'reset-password',
                    component: () => import('@/views/AuthPages/ResetPassword.vue')
                }
            ]
        },
        {
            path: '/code-edit-and-run',
            component: () => import('@/views/CodeEditorLayout.vue'),
            meta: {requiresAuth: true},
            children: [
                {
                    path: 'code-edit',
                    component: () => import('@/views/CodeEditAndAssessmentPages/CodeEditor.vue'),
                },
                {
                    path: 'code-run',
                    component: () => import('@/views/CodeEditAndAssessmentPages/CodeRun.vue'),
                }
            ]
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('@/views/404NotFound.vue')
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