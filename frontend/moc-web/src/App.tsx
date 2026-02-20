import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CssBaseline from '@mui/material/CssBaseline';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import CreateRequest from './pages/CreateRequest';
import MocList from './pages/MocList';
import MocDetail from './pages/MocDetail';
import DmocList from './pages/DmocList';
import DmocDetail from './pages/DmocDetail';
import DmocDraftPage from './pages/DmocDraftPage';
import Manuals from './pages/Manuals';
import Reports from './pages/Reports';
import Feedback from './pages/Feedback';
import Notifications from './pages/Notifications';
import Help from './pages/Help';
import Admin from './pages/Admin';
import Placeholder from './pages/Placeholder';

// Create a React Query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Create MUI theme with enterprise-friendly styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

/**
 * Main App component with routing and providers.
 * Sets up React Router, MUI Theme, and React Query.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="tasks" element={<MyTasks />} />
              <Route path="create" element={<CreateRequest />} />
              <Route path="mocs" element={<MocList />} />
              <Route path="mocs/:id" element={<MocDetail />} />
              <Route path="dmoc" element={<DmocList />} />
              <Route path="dmoc/create" element={<DmocDraftPage />} />
              <Route path="dmoc/:id" element={<DmocDetail />} />
              <Route path="dmoc/:id/edit" element={<DmocDraftPage />} />
              <Route path="manuals" element={<Manuals />} />
              <Route path="reports" element={<Reports />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="help" element={<Help />} />
              <Route path="admin" element={<Admin />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
