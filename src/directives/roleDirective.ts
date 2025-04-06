// src/directives/roleDirective.ts
import { useUserStore } from "@/stores/user";
import type { Directive, DirectiveBinding } from "vue";

export const vRole: Directive = {
    mounted(el: HTMLElement, binding: DirectiveBinding<Array<string>, never, never>) {
        const userStore = useUserStore();
        const requiredRole = binding.value;

        if (!requiredRole.includes(userStore.role)) {
            // 将元素隐藏
            el.style.display = 'none';
        }
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
        const userStore = useUserStore();
        const requiredRole = binding.value;

        // 处理动态的角色变化
        if (!requiredRole.includes(userStore.role)) {
            el.style.display = 'none';
        }
    }
};