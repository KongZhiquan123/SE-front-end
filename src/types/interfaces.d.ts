//CourseGrades.vue
export interface Grade {
    id: number;
    title: string;
    type: string;
    score?: number | null;
    aiGrading?: AIGrading | null;
    maxScore: number;
    dueDate: string;
    submittedDate?: string | null;
    gradedDate?: string | null;
    feedback?: string | null;
    appealReason?: string | null;
    appealTime?: string | null;
    status: 'graded' | 'upcoming' | 'submitted' | 'missing' | 'appealing' | 'appealed';
    assignmentId?: number;
}

export interface AIGrading {
    id: number;
    aiScore: number;
    confidence: number;
    feedbackSuggestions: string;
}

//CourseMaterial.vue
export interface Attachment {
    id: number
    name: string
    size: number | string
    url: string
}
export interface Resource {
    id: number
    title: string
    type: string
    description: string
    attachments?: Attachment[] | null
    uploadTime: string
}
interface TestCase {
    id: number
    input: string
    expectedOutput: string
    weight: number;
}
//CourseAssignment.vue
export interface Assignment {
    id: number
    title: string
    type: string
    description: string
    attachments?: Attachment[] | null
    dueDate: string;
    maxScore: number;
    openDate: string;
    status: 'open' | 'closed' | 'upcoming';
    instructions?: string | null;
    codeConfig?: CodeAssignmentConfig | null
    testcases? : TestCase[] | null
}

export interface CodeSubmission {
    id: number,
    script: string,
    language: string,
    versionIndex: number
}

export interface Submission {
    id: number,
    studentName: string,
    submitTime: string,
    status: 'pending' | 'graded' | 'draft',
    attempts?: number
    textResponse?: string
    attachments?: Attachment[] | null
    codeSubmissions?: CodeSubmission[] | null
    grade?: Grade
    aiGrading?: AIGrading | null
    codeExecutionResult?: CodeExecutionResult[]
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

//AssignmentManagement.vue
export interface CodeAssignmentConfig {
    id: number
    allowedLanguages: string,
    memoryLimitEnabled: boolean,
    memoryLimitMB: number,
    timeLimitEnabled: boolean,
    timeLimitSeconds: number,
}

//CodeRun.vue
interface CodeExecutionResult {
    submissionId: number;
    script: string;
    language: string;
    versionIndex: number;
    score: number;
    testCaseResults: TestCaseResult[];
}

interface TestCaseResult {
    testCaseId: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error: string;
    statusCode: number;
    memory: string;
    cpuTime: string;
    compilationStatus: string;
    executionSuccess: boolean;
    compiled: boolean;
    passed: boolean;
    weight: number;
}

