// src/utils/eventBus.ts
import mitt from 'mitt'

const EventTypes = {
    AUTH: {
        LOGIN_SUCCESS: 'auth:login-success',
        SESSION_EXPIRED: 'auth:session-expired'
    },
} as const;

// 为每个事件定义payload类型
type Events = {
    [EventTypes.AUTH.LOGIN_SUCCESS]: void;
    [EventTypes.AUTH.SESSION_EXPIRED]: void;
    [key: string]: any; // 待扩展
}

const eventBus = mitt<Events>()
export {
    eventBus,
    EventTypes
}