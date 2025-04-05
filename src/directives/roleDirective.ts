// src/directives/roleDirective.ts
import { useUserStore } from "@/stores/user";
import type { Directive, DirectiveBinding } from "vue";

export const vRole: Directive = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
        const userStore = useUserStore();
        const requiredRole = binding.value;

        if (userStore.role !== requiredRole) {
            // 将元素从 DOM 中移除
            el.parentNode?.removeChild(el);
        }
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
        const userStore = useUserStore();
        const requiredRole = binding.value;

        // 处理动态的角色变化
        if (userStore.role !== requiredRole) {
            el.style.display = 'none';
        } else {
            el.style.display = '';
        }
    }
};