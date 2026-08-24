import { Component, signal } from '@angular/core';

interface Project {
  id: string;
  name: string;
  year: string;
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
      chips: ['ASP.NET Core', 'RAG Pipeline', 'Ollama', 'Vector Search'],
      details: [
        'End-to-end local RAG: PDF ingestion, paragraph-aware chunking, embedding generation, cosine-similarity vector search — fully grounded answers, no external API dependencies.',
        'Ollama models integrated over raw HTTP: <span class="t-data">nomic-embed-text</span> for embeddings, <span class="t-data">qwen2.5-coder:7b</span> for chat.',
        'Responsive chat UI with real-time document loading, designed for local-first deployment.'
      ],
      endpoints: ['POST /api/ask', 'GET /health'],
      repoUrl: 'https://github.com/Mariomedhat899/SmartDocQna'
    },
    {
      id: 'ims-backend',
      name: 'IMS-Backend',
      year: '2026',
      chips: ['ASP.NET Core', 'EF Core', 'SQL Server', 'Identity', 'SMTP'],
      details: [
        'Full inventory API: CRUD for products & categories, transaction tracking, and a Low Stock Alerts system that watches thresholds for you.',
        'Secure auth with ASP.NET Core Identity — role-based authorization with a seeder for admin/user roles.',
        'CSV import/export for bulk operations, plus reports built for actual business insight.',
        'SMTP notifications via <span class="t-data">IEmailService</span> and NotificationSettings keep the owner updated in real time; payments workflow kept cleanly separated.'
      ],
      endpoints: ['GET /api/products', 'POST /api/auth/register'],
      repoUrl: 'https://github.com/Mariomedhat899/InventoryManagementAPI'
    },
    {
      id: 'roknacafe-pos',
      name: 'RoknaCafe-POS',
      year: '2026',
      chips: ['.NET 10', 'WinForms', 'EF Core', 'SQLite', 'Clean Architecture'],
      details: [
        'Complete café POS desktop app with a full Arabic RTL interface, real-time order building, and 80mm thermal receipt printing.',
        'Paid-orders viewer with date filtering, daily totals and item breakdowns via ListView and MonthCalendar.',
        'Solution structured across Domain, Infrastructure and UI layers with Repository Pattern; EF Core + SQLite handling persistence, migrations and seeding.'
      ],
      endpoints: ['desktop · win-x64', 'db · sqlite/ef-core'],
      repoUrl: 'https://github.com/Mariomedhat899/RoknaCafe-POS'
    },
    {
      id: 'aimemory',
      name: 'AiMemory',
      year: '2026',
      chips: ['.NET 8', 'Web API', 'SQL Server', 'AI Integration'],
      details: [
        '.NET 8 API handling complex task-domain logic and data relationships, written to coding best practices throughout.',
        'AI features woven into the task workflow; SQL Server queries profiled and optimized for persistence performance.',
        'Clean Architecture keeps components testable, modular and maintainable.'
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