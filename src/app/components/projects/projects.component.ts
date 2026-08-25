import { Component, signal } from '@angular/core';

interface Project {
  id: string;
  name: string;
  year: string;
  why: string;
  chips: string[];
  details: string[];
  endpoints: string[];
  repoUrl: string;
}

@Component({
  selector: 'app-projects',
  imports: [],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  protected openId = signal<string | null>(null);

  protected projects: Project[] = [
    {
      id: 'smartdocqna',
      name: 'SmartDocQna',
      year: '2026',
      why: 'I was paying to ask questions of my own notes. So I stopped — and made a thing that answers from a PDF, offline, for free.',
      chips: ['ASP.NET Core', 'RAG', 'Ollama', 'Vector Search'],
      details: [
        'End-to-end local RAG: PDF in, paragraph-aware chunks, embeddings, cosine-similarity search. <b>Answers stay grounded in the document — no hallucinated facts.</b>',
        'Ollama over raw HTTP: <span class="mono t-data">nomic-embed-text</span> for embeddings, <span class="mono t-data">qwen2.5-coder:7b</span> for chat. Zero cloud, zero keys.',
        'Responsive chat UI built for local-first use — it runs on my machine and that\'s the point.'
      ],
      endpoints: ['POST /api/ask', 'GET /health'],
      repoUrl: 'https://github.com/Mariomedhat899/SmartDocQna'
    },
    {
      id: 'ims-backend',
      name: 'IMS-Backend',
      year: '2026',
      why: 'A friend\'s shop kept running out of stock by surprise. The only feature he uses is the email that says "buy more, today."',
      chips: ['ASP.NET Core', 'EF Core', 'SQL Server', 'Identity', 'SMTP'],
      details: [
        'Inventory API: products & categories, transaction tracking, and a <b>Low Stock Alerts</b> system that watches thresholds so a human doesn\'t have to.',
        'Auth via ASP.NET Core Identity — role-based, with a seeder that sets up admin/user on first run.',
        'CSV import/export for bulk work, plus reports that a shop owner would actually read.',
        'SMTP notifications through <span class="mono t-data">IEmailService</span> — the owner gets the email before he notices the gap.'
      ],
      endpoints: ['GET /api/products', 'POST /api/auth/register'],
      repoUrl: 'https://github.com/Mariomedhat899/InventoryManagementAPI'
    },
    {
      id: 'roknacafe-pos',
      name: 'RoknaCafe-POS',
      year: '2026',
      why: 'Every café POS I found treated Arabic as an afterthought. So I built one that\'s RTL first, receipts and all.',
      chips: ['.NET 10', 'WinForms', 'EF Core', 'SQLite', 'Clean Architecture'],
      details: [
        'Full café POS desktop app, <b>full Arabic RTL</b>, real-time order building, 80mm thermal receipt printing.',
        'Paid-orders view with date filtering, daily totals and item breakdowns via ListView + MonthCalendar.',
        'Layered Domain / Infrastructure / UI with Repository Pattern; EF Core + SQLite handle persistence, migrations and seeding.'
      ],
      endpoints: ['desktop · win-x64', 'db · sqlite / ef-core'],
      repoUrl: 'https://github.com/Mariomedhat899/RoknaCafe-POS'
    },
    {
      id: 'aimemory',
      name: 'AiMemory',
      year: '2026',
      why: 'My "let\'s do architecture properly" repo. I\'d delete half of it today — and that\'s the point of keeping it public.',
      chips: ['.NET 8', 'Web API', 'SQL Server', 'AI'],
      details: [
        '.NET 8 task API with AI woven into the workflow; the place I learned to <b>profile SQL before blaming the ORM</b>.',
        'Clean Architecture throughout — testable, modular, maybe a layer too many. Honest.',
        'If I rewrote it tomorrow it\'d be smaller. That gap is how I know I got better.'
      ],
      endpoints: ['GET /api/tasks', 'PUT /api/tasks/:id'],
      repoUrl: 'https://github.com/Mariomedhat899/AiMemory'
    }
  ];

  toggle(projectId: string) {
    this.openId.update(current => current === projectId ? null : projectId);
  }

  isOpen(projectId: string) {
    return this.openId() === projectId;
  }
}