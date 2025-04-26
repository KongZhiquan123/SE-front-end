import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from "@/utils/request.ts"

export interface UserState {
    id: string | null
    username: string | null
    email: string | null
    role: 'admin' | 'student' | 'teacher' | null
    token: string | null
    createdAt: string | null
    updatedAt: string | null
    avatarUrl: string | null
    bio: string | null
    authorized: boolean
}

export const useUserStore = defineStore('user', () => {

    const id = ref<string | null>(null)
    const username = ref<string | null>(null)
    const email = ref<string | null>(null)
    const role = ref<string | null>(null)
    const token = ref<string | null>(null)
    const createdAt = ref<string | null>(null)
    const updatedAt = ref<string | null>(null)
    const avatarUrl = ref<string | null>(null)
    const bio = ref<string | null>(null)
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
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt,
                avatarUrl: userData.avatarUrl,
                bio: userData.bio,
                authorized: true
            });

            return true;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        id, username, email, role, token, createdAt, updatedAt, avatarUrl, bio, authorized,
        setUser, clearUser, autoLogin
    }
}, {
    persist: {
        enabled: true,
        pick: ['id', 'username', 'email', 'role', 'token'],
        storage: localStorage
    }
})