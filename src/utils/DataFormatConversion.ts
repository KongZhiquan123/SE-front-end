import {Submission} from "@/types/interfaces";
import {defaultTo} from "lodash-es";
import formatFileSize from "@/utils/formatFileSize";
import {formatDate} from "@/utils/formatDate";

export function submissionsConversion(submissions?): Submission[] {
    if (!submissions || submissions.length === 0) {
        return [];
    }

    return submissions.sort((a, b) => new Date(a.submitTime).getTime() - new Date(b.submitTime).getTime())
        .map((submission, index) => ({
            ...submission,
            submitTime: formatDate(submission.submitTime),
            status: submission.status.toLowerCase(),
            attempts: index + 1,
            textResponse: defaultTo(submission.contents.filter(content => content.type.toLowerCase() === 'text')[0]?.content, ''),
            attachments: submission.contents.filter(content => content.type.toLowerCase() === 'file' && content.file)
                .map(content => ({...content.file, size: formatFileSize(content.file.size)})),
            codeSubmissions: submission.contents.filter(content => content.type.toLowerCase() === 'code')
                .map(content => content.codeSubmission)
        })).reverse();
}
export function submissionConversion(submission): Submission {
    if (!submission) {
        return null;
    }
    return {
        ...submission,
        submitTime: formatDate(submission.submitTime),
        status: submission.status.toLowerCase(),
        textResponse: defaultTo(submission.contents.filter(content => content.type.toLowerCase() === 'text')[0]?.content, ''),
        attachments: submission.contents.filter(content => content.type.toLowerCase() === 'file' && content.file)
            .map(content => ({...content.file, size: formatFileSize(content.file.size)})),
        codeSubmissions: submission.contents.filter(content => content.type.toLowerCase() === 'code')
            .map(content => content.codeSubmission)
    };
}