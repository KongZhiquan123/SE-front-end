// 添加的类型定义和数据
export type ProgrammingLanguageVersion = {
    version: string;
    versionIndex: number;
};
//支持的语言
export type ProgrammingLanguage = 'python3' | 'java' | 'cpp' | 'c' | 'sql';
// 不同语言可用的版本信息
export const languageVersions: Record<ProgrammingLanguage, ProgrammingLanguageVersion[]> = {
    java: [
        { version: 'JDK 1.8.0_66', versionIndex: 0 },
        { version: 'JDK 9.0.1', versionIndex: 1 },
        { version: 'JDK 10.0.1', versionIndex: 2 },
        { version: 'JDK 11.0.4', versionIndex: 3 },
        { version: 'JDK 17.0.1', versionIndex: 4 },
        { version: 'JDK 21.0.1', versionIndex: 5 }
    ],
    c: [
        { version: 'GCC 5.3.0', versionIndex: 0 },
        { version: 'Zapcc 5.0.0', versionIndex: 1 },
        { version: 'GCC 7.2.0', versionIndex: 2 },
        { version: 'GCC 8.1.0', versionIndex: 3 },
        { version: 'GCC 9.1.0', versionIndex: 4 },
        { version: 'GCC 11.1.0', versionIndex: 5 },
        { version: 'GCC 13.2.1', versionIndex: 6 }
    ],
    cpp: [
        { version: 'GCC 5.3.0', versionIndex: 0 },
        { version: 'Zapcc 5.0.0', versionIndex: 1 },
        { version: 'GCC 7.2.0', versionIndex: 2 },
        { version: 'GCC 8.1.0', versionIndex: 3 },
        { version: 'GCC 9.1.0', versionIndex: 4 },
        { version: 'GCC 11.1.0', versionIndex: 5 },
        { version: 'GCC 13.2.1', versionIndex: 6 }
    ],
    python3: [
        { version: '3.5.1', versionIndex: 0 },
        { version: '3.6.3', versionIndex: 1 },
        { version: '3.6.5', versionIndex: 2 },
        { version: '3.7.4', versionIndex: 3 },
        { version: '3.9.9', versionIndex: 4 },
        { version: '3.11.5', versionIndex: 5 }
    ],
    sql: [
        { version: 'SQLite 3.9.2', versionIndex: 0 },
        { version: 'SQLite 3.21.0', versionIndex: 1 },
        { version: 'SQLite 3.23.1', versionIndex: 2 },
        { version: 'SQLite 3.29.0', versionIndex: 3 },
        { version: 'SQLite 3.37.0', versionIndex: 4 },
        { version: 'SQLite 3.44.0', versionIndex: 5 }
    ]
};

//不同语言的代码模板
export const codeTemplates: Record<ProgrammingLanguage, string> = {
    python3: `def myFunc(arg1, arg2):
    # Your code here
    pass
`,
    java: `class Solution {
    public int[] myFunc(int[] nums, int target) {
        // Your code here
        return new int[]{0, 0};
    }
}`,
    cpp: `#include <vector>

std::vector<int> myFunc(std::vector<int>& nums, int target) {
    // Your code here
    return {0, 0};
}`,
    c: `#include <stdio.h>
#include <stdlib.h>

int* myFunc(int* nums, int numsSize, int target, int* returnSize) {
    // Your code here
    int* result = (int*)malloc(2 * sizeof(int));
    result[0] = 0;
    result[1] = 0;
    *returnSize = 2;
    return result;
}`,
    sql: "SELECT * FROM table_name WHERE condition;"
};
