import { defineStore } from 'pinia'

interface UserState {
    id?: string | null
    username: string | null
    email: string | null
    token: string | null
}

export const useUserStore = defineStore('user', {
    state: (): UserState => ({
        id: null,
        username: null,
        email: null,
        token: null
    }),
    actions: {
        setUser(userData: Partial<UserState>) {
            Object.assign(this, userData)
            if (userData.token) {
                //将token存储在浏览器的localStorage中
                localStorage.setItem('token', userData.token)
            }
        },
        clearUser() {
            this.id = null
            this.username = null
            this.email = null
            this.token = null
            localStorage.removeItem('token')
        }
    },
    persist: true
})