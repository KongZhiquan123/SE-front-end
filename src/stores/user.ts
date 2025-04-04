import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from "@/utils/request.ts"

interface UserState {
    id: string | null
    username: string | null
    email: string | null
    role: 'admin' | 'student' | 'teacher' | null
    token: string | null
    authorized: boolean
}

export const useUserStore = defineStore('user', () => {

    const id = ref<string | null>(null)
    const username = ref<string | null>(null)
    const email = ref<string | null>(null)
    const role = ref<string | null>(null)
    const token = ref<string | null>(null)
    const authorized = ref<boolean>(false)


    function setUser(userData: Partial<UserState>) {
        const refToProperty = {id, username, email, role, token};
        Object.entries(refToProperty).forEach(([key, ref]) => {
            ref.value = userData[key] ?? ref.value;
        })
        role.value = role.value ? role.value.toLowerCase() : null;
        authorized.value = userData.authorized ?? false;
        token.value = token.value || '';
        localStorage.setItem('token', token.value);
    }

    async function autoLogin() {
        if (!token.value) return false;
        try {
            const response = await request.post('/auth/user');
            if (!response || !response.data || response.data.expired) {
                clearUser();
                return false;
            }
            const userData = response.data;
            setUser({
                id: userData.userId,
                username: userData.username,
                email: userData.email,
                role: userData.role,
                authorized: true
            });

            return true;
        } catch (error) {
            clearUser();
            return false;
        }

    }


    function clearUser() {
        [id, username, email, role, token].forEach(ref => ref.value = null);
        authorized.value = false;
        localStorage.removeItem('token');
    }

    return {
        id, username, email, role, token, authorized,
        setUser, clearUser, autoLogin
    }
}, {
    persist: {
        enabled: true,
        pick: ['id', 'username', 'email', 'role', 'token'],
        storage: localStorage
    }
})