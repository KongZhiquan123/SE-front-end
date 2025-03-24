// src/directives/roleDirective.ts
import { useUserStore } from "@/stores/user";
import type { Directive, DirectiveBinding } from "vue";

export const vRole: Directive = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
        const userStore = useUserStore();
        const requiredRole = binding.value;

        // Check if user has the required role
        if (userStore.role !== requiredRole) {
            // Remove element from DOM
            el.parentNode?.removeChild(el);
        }
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
        const userStore = useUserStore();
        const requiredRole = binding.value;

        // Handle dynamic role changes
        if (userStore.role !== requiredRole) {
            el.style.display = 'none';
        } else {
            el.style.display = '';
        }
    }
};