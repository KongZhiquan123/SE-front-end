import { ref } from 'vue'
import request from "@/utils/request"

export default function useVerificationCode() {
    const countdown = ref(0)

    const startCountdown = () => {
        countdown.value = 60
        const timer = setInterval(() => {
            countdown.value--
            if (countdown.value <= 0) {
                clearInterval(timer)
            }
        }, 1000)
    }

    const sendCode = async (email: string, endpoint: string) => {
        await request.post(`${endpoint}${email}`)
        startCountdown()
    }

    return {
        countdown,
        sendCode,
        startCountdown
    }
}