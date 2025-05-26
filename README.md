# Software Engineering Project
**project detailed information link:** [Blackboard Software Engineering Project](https://bb.sustech.edu.cn/bbcswebdav/pid-508647-dt-content-rid-17334213_1/courses/CS304-30018694-2025SP/project-intro-2025.pdf)  

CS students use Blackboard (BB) for text and image-based assignments submission, Online Judge (OJ) for
code submissions, while midterm and final exams are assessed through traditional paper-based grading.   

However, this fragmented approach presents several challenges. Students must navigate multiple platforms,
making assignment management cumbersome. Code evaluation can be inconsistent due to variations in test
case quality. Handwritten work can affect final scores due to handwriting quality. In addition, high website
traffic during deadlines can cause delays, making submissions stressful and unreliable.    

Your task is to design and implement an improved Assignment Grading System that addresses these
limitations. The system should not be a replica of Blackboard, Sakai, or Online Judge. Instead, it should either
introduce a completely new design or significantly enhance existing systems to resolve the identified
problems.  

Here are some directions you may explore:
- **Unified Platform:** Create a single system that supports text, code, image, and document-based
assignments, eliminating the need for multiple submission platforms.
- **Handwritten Work Processing:** Enable students to upload handwritten assignments, which can be
automatically converted to PDF/DOC for online viewing and grading.
- **Automated & Assisted Grading:** Implement AI or rule-based tools to assist in grading handwritten
coursework and exams, reducing manual effort.
- **Performance Optimization:** Ensure smooth platform access, even during peak submission times,
through caching, load balancing, or other performance-enhancing techniques.
User Experience Improvements: Focus on intuitive UI, real-time feedback on submissions, and
seamless integration with university systems.  

The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.   
Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).  
The `package.json` file includes all the necessary dependencies for a Vue 3 project with TypeScript support, run `npm install` to install them.  
`Vite` is used as the build tool.
## Dev Server
Run the following command to start the development server:
```bash
npm run dev
```
## Build
Run the following command to build the project for production:
```bash
npm run build
```
The output will be in the `dist` directory.
