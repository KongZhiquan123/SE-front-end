//CourseGrades.vue
export interface Grade {
    id: number;
    title: string;
    type: string;
    score?: number | null;
    maxScore: number;
    dueDate: string;
    submittedDate?: string | null;
    gradedDate?: string | null;
    feedback?: string | null;
    appealReason?: string | null;
    appealTime?: string | null;
    status: 'graded' | 'upcoming' | 'submitted' | 'missing' | 'appealing' | 'appealed';
}

//CourseMaterial.vue
export interface Attachment {
    id: number
    name: string
    size: number | string
    url: string
}
export interface CourseMaterial {
    id: number
    title: string
    type: string
    description: string
    attachments?: Attachment[] | null
}

//Assignment.vue
export interface Assignment extends CourseMaterial {
    dueDate: string;
    maxScore: number;
    openDate: string;
    status: 'open' | 'closed' | 'upcoming';
    instructions?: string | null;
}

export interface Submission {
    id: number,
    submitTime: string,
    status: 'pending' | 'accepted' | 'rejected',
    attempts: number
    textResponse?: string
    attachments: Attachment[]
}

//Calendar.vue
export interface Task {
    id: number;
    title: string;
    deadline: string;
    completed: boolean;
    courseId: string;
    courseName: string;
    description?: string | null;
}

//Home.vue
export interface CourseItem {
    id: number
    courseCode: string
    courseName: string
    semester: string
    description: string
    isActive: boolean
    createdAt: string
}

//CourseBasicInformation.vue
export interface CourseBasicInfo {
    courseName: string;
    teacher: string;
    email: string;
    courseDescription: string;
}

//Register.vue
export interface RegisterForm {
    username: string
    email: string
    password: string
    confirmPassword: string
    role: 'admin' | 'teacher' | 'student'
    verificationCode: string
}

//Notifications.vue
export interface Notification {
    id: number;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    sender?: string;                 // 发送者名称
    relatedCourse?: string;          // 相关课程代码
    priority: 'low' | 'medium' | 'high'; // 优先级
}

