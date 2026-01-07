import { User, UserRole, Lesson, Certificate } from '../types';
import { lessonService } from './lessonService';
import { authService } from './authService';

export class ExportService {

  // Gather stats based on role
  async getStats(user: User): Promise<string> {
    const timestamp = new Date().toLocaleString();
    let stats = `BUILD BIBLICAL LEADERS - PERFORMANCE REPORT\n`;
    stats += `User: ${user.name} (${user.role})\n`;
    stats += `Date: ${timestamp}\n`;
    stats += `--------------------------------------------------\n\n`;

    if (user.role === UserRole.STUDENT) {
      stats += `PERSONAL STATISTICS:\n`;
      stats += `- Weekly Score: 980 (+12%)\n`;
      stats += `- Modules Completed: 12\n`;
      stats += `- Study Hours: 24.5h\n`;
      stats += `- Group Rank: #3\n`;
    } 
    else if (user.role === UserRole.MENTOR) {
      stats += `GROUP STATISTICS:\n`;
      stats += `- Active Students: 14\n`;
      stats += `- Team Average Score: 88%\n`;
      stats += `- Assignments Due: 3\n`;
    }
    else if (user.role === UserRole.ORGANIZATION) {
       stats += `ORGANIZATION METRICS:\n`;
       stats += `- Network Growth: +8%\n`;
       stats += `- Active Groups: 12\n`;
       stats += `- Compliance Rate: 100%\n`;
    }
    else if (user.role === UserRole.ADMIN || user.role === UserRole.CO_ADMIN) {
       stats += `SYSTEM OVERVIEW:\n`;
       stats += `- Total Users: 2,450\n`;
       stats += `- Active Groups: 85\n`;
       stats += `- Question Bank: 15,000+\n`;
    }

    return stats;
  }

  // Export a single lesson for offline study
  exportSingleLesson(lesson: Lesson, format: 'txt' | 'print') {
      let textOut = `OFFLINE STUDY GUIDE: ${lesson.title}\n`;
      textOut += `Reference: ${lesson.book} ${lesson.chapter}\n`;
      textOut += `Category: ${lesson.lesson_type}\n`;
      textOut += `--------------------------------------------------\n\n`;

      let htmlOut = `<div style="max-width:800px; margin:auto; font-family: sans-serif;">`;
      htmlOut += `<h1 style="color:#1e1b4b; border-bottom: 4px solid #f59e0b;">${lesson.title}</h1>`;
      htmlOut += `<p><strong>Ref:</strong> ${lesson.book} ${lesson.chapter} | <strong>Type:</strong> ${lesson.lesson_type}</p>`;

      for (const section of lesson.sections) {
          if (section.type === 'note') {
              const cleanBody = section.body?.replace(/<[^>]*>?/gm, '') || '';
              textOut += `[NOTES: ${section.title}]\n${cleanBody}\n\n`;
              htmlOut += `<div style="background:#f8fafc; padding:20px; border-left: 5px solid #6366f1; margin: 20px 0;">`;
              htmlOut += `<h2>${section.title}</h2>${section.body}</div>`;
          } else if (section.type === 'quiz_group') {
              textOut += `[PRACTICE QUIZ: ${section.title}]\n`;
              htmlOut += `<h2>${section.title}</h2><div style="display:grid; gap:20px;">`;
              section.quizzes?.forEach((q, idx) => {
                  textOut += `${idx + 1}. ${q.text}\n`;
                  htmlOut += `<div><p><strong>${idx + 1}. ${q.text}</strong></p><ul>`;
                  q.options.forEach(opt => {
                      textOut += `   [ ] ${opt.text}\n`;
                      htmlOut += `<li>${opt.text}</li>`;
                  });
                  htmlOut += `</ul></div>`;
              });
              htmlOut += `</div>`;
          }
      }

      if (format === 'txt') {
          this.downloadTxt(`${lesson.title}_StudyGuide.txt`, textOut);
      } else {
          this.printHtml(`Study Guide - ${lesson.title}`, htmlOut);
      }
  }

  // Get unattempted lessons formatted for text/print
  async getUnattemptedContent(user: User): Promise<{ text: string, html: string }> {
    const allLessons = await lessonService.getLessons();
    const unattemptedLessons: Lesson[] = [];

    for (const lesson of allLessons) {
      const attempted = await lessonService.hasUserAttemptedLesson(user.id, lesson.id);
      if (!attempted) {
        unattemptedLessons.push(lesson);
      }
    }

    if (unattemptedLessons.length === 0) {
       return { text: "No unattempted lessons found.\n", html: "<p>No unattempted lessons found.</p>" };
    }

    let textOut = `UNATTEMPTED LESSONS REPORT\nTotal Found: ${unattemptedLessons.length}\n--------------------------------------------------\n\n`;
    let htmlOut = `<div class="lessons-container"><h2>Unattempted Lessons (${unattemptedLessons.length})</h2>`;

    for (const lesson of unattemptedLessons) {
       textOut += `LESSON: ${lesson.title}\nRef: ${lesson.book} ${lesson.chapter} | Type: ${lesson.lesson_type}\n\n`;
       htmlOut += `<div class="lesson-card"><h3>${lesson.title}</h3><p class="meta">${lesson.book} ${lesson.chapter} • ${lesson.lesson_type}</p></div><hr/>`;
    }
    
    htmlOut += `</div>`;
    return { text: textOut, html: htmlOut };
  }

  async getCertificatesContent(user: User): Promise<{ text: string, html: string }> {
      const certs = await lessonService.getUserCertificates(user.id);
      if (certs.length === 0) return { text: "No certificates earned yet.\n", html: "<p>No certificates earned yet.</p>" };

      let textOut = `EARNED CERTIFICATES REPORT\nTotal Earned: ${certs.length}\n--------------------------------------------------\n\n`;
      let htmlOut = `<div class="certs-container"><h2>Earned Certificates (${certs.length})</h2><table style="width:100%; border-collapse:collapse; margin-top:10px;"><tr style="background:#f3f4f6; text-align:left;"><th style="padding:8px;">Module</th><th style="padding:8px;">Date Issued</th><th style="padding:8px;">Certificate ID</th></tr>`;

      for (const cert of certs) {
          const dateStr = new Date(cert.issueDate).toLocaleDateString();
          textOut += `MODULE: ${cert.moduleTitle}\nIssued: ${dateStr}\nID: ${cert.uniqueCode}\nIssuer: ${cert.issuerName}\n\n`;
          htmlOut += `<tr><td style="padding:8px; border-bottom:1px solid #e5e7eb;"><strong>${cert.moduleTitle}</strong></td><td style="padding:8px; border-bottom:1px solid #e5e7eb;">${dateStr}</td><td style="padding:8px; border-bottom:1px solid #e5e7eb; font-family:monospace;">${cert.uniqueCode}</td></tr>`;
      }

      htmlOut += `</table></div>`;
      return { text: textOut, html: htmlOut };
  }

  downloadTxt(filename: string, content: string) {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  printHtml(title: string, contentHtml: string) {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            h1 { color: #1e1b4b; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; }
            h2 { color: #3730a3; margin-top: 30px; page-break-before: always; }
            h2:first-of-type { page-break-before: auto; }
            h3 { color: #1f2937; margin-top: 20px; }
            .meta { color: #6b7280; font-size: 0.9em; margin-bottom: 15px; }
            .section-note { background: #f9fafb; padding: 15px; border-left: 4px solid #3b82f6; margin-bottom: 20px; }
            .section-quiz { margin-top: 20px; }
            .question { margin-bottom: 15px; page-break-inside: avoid; }
            ul { list-style-type: circle; margin-left: 20px; }
            li { margin-bottom: 5px; }
            hr { border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0; }
            @media print { body { font-size: 12pt; } .lesson-card { page-break-after: always; } }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${contentHtml}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
       printWindow.print();
       printWindow.close();
    }, 500);
  }
}

export const exportService = new ExportService();