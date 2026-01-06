export interface MCPConfig {
  googleServiceAccountPath: string;
  calendarId: string;
  sheetId: string;
  sheetName: string;
  gmailUserEmail: string;
  gmailFromEmail: string;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface SheetRow {
  date: string;
  time: string;
  topic: string;
  bookingCode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailDraft {
  id?: string;
  to: string;
  subject: string;
  body: string;
}











