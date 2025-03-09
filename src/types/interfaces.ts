//CourseGrades.vue
export interface Grade {
    id: number;
    name: string;
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
    size: string
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
    status: 'open' | 'closed' | 'upcoming';
    instructions?: string;
}

export interface Submission {
    id: number,
    submitTime: string,
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED',
    attempts: number
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
    description?: string;
}

//Home.vue
export interface CourseItem {
    id: number
    courseCode: string
    courseName: string
    semester: string
    description: string
    isActive: boolean
    createdTime: string
}

//CourseBasicInformation.vue
export interface CourseBasicInfo {
    courseName: string;
    instructor: string;
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


