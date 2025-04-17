import {ElMessage} from "element-plus";

export function checkDate(openDate: Date, dueDate: Date): boolean {
    const currentDate = new Date();
    if (dueDate < currentDate) {
        ElMessage.error("Due date must be after current date");
        return false;
    }
    if (dueDate < openDate) {
        ElMessage.error("Due date must be after open date");
        return false;
    }
    // Check if due date is more than 7 days from open date
    const timeDifference = dueDate.getTime() - openDate.getTime();
    const dayDifference = timeDifference / (1000 * 3600 * 24);
    if (dayDifference < 7) {
        ElMessage.warning("Due date should be at least 7 days after open date");
        return false;
    }
    if (dayDifference > 365) {
        ElMessage.warning("Due date should be within 365 days from open date");
        return false;
    }
    return true;
}