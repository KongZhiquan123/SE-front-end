//ClassGrades.vue
export interface Assignment {
    id: number;
    name: string;
    type: string;
    score: number | null;
    totalPoints: number;
    dueDate: string;
    submittedDate: string | null;
    gradedDate: string | null;
    status: 'graded' | 'upcoming' | 'submitted' | 'missing';
}

//ClassMaterial.vue
export interface Attachment {
    id: string
    name: string
    size: string
}
export interface CourseMaterial {
    id: string
    title: string
    type: string
    description: string
    attachments: Attachment[]
}

//Calendar.vue
export interface Task {
    id: string;
    title: string;
    deadline: string;
    completed: boolean;
    classId: string;
    className: string;
    description?: string;
}

//Home.vue
export interface ClassItem {
    id: string
    name: string
    description: string
}

//ClassBasicInformation.vue
export interface BasicInfo {
    className: string;
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
    role: 'ADMIN' | 'STUDENT' | 'TEACHER'
    verificationCode: string
}


