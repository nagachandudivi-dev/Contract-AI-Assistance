import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import UploadPage from './pages/admin/UploadPage';
import DocumentsPage from './pages/admin/DocumentsPage';
import DocumentDetailPage from './pages/admin/DocumentDetailPage';
import AiChatPage from './pages/admin/AiChatPage';
import CompareDocumentsPage from './pages/admin/CompareDocumentsPage';
import HistoryPage from './pages/admin/HistoryPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:id" element={<DocumentDetailPage />} />
            <Route path="chat" element={<AiChatPage />} />
            <Route path="compare" element={<CompareDocumentsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
