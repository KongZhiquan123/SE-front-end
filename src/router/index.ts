import {createRouter, createWebHistory} from 'vue-router'
import {useUserStore} from "@/stores/user";
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
            component: () => import('../views/HomeLayout.vue'),
            children: [
                {
                    path: '',
                    component: () => import('../views/HomePages/Home.vue')
                },
                {
                    path: 'calendar',
                    component: () => import('../views/HomePages/Calendar.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'archived-classes',
                    component: () => import('../views/HomePages/ArchivedClasses.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'settings',
                    component: () => import('../views/HomePages/Settings.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'notifications',
                    component: () => import('../views/HomePages/Notifications.vue'),
                    meta: { requiresAuth: true }
                }
            ]
        },
        {
          path: '/student-course',
          component: () => import('../views/CourseLayout.vue'),
          children: [
              {
                  path: 'course-materials',
                  component: () => import('../views/CoursePages/CourseMaterials.vue'),
                  meta: { requiresAuth: true }
              },
              {
                  path: 'course-basic-info',
                  component: () => import('../views/CoursePages/CourseBasicInformation.vue'),
                  meta: { requiresAuth: true }
              },
              {
                  path: 'course-grades',
                  component: () => import('../views/CoursePages/CourseGrades.vue'),
                  meta: { requiresAuth: true }
              },
              {
                  path: 'course-assignments',
                  component: () => import('../views/CoursePages/CourseAssignments.vue'),
                  meta: { requiresAuth: true }
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
    } else {
        next()
    }
})


export default router