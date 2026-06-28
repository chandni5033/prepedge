import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing        from './pages/Landing';
import Login          from './pages/Login';
import Register       from './pages/Register';
import AuthCallback   from './pages/AuthCallback';   
import Dashboard      from './pages/Dashboard';
import CreateInterview from './pages/CreateInterview';
import InterviewSession from './pages/InterviewSession';
import Feedback       from './pages/Feedback';
import Analytics      from './pages/Analytics';
import History        from './pages/History';
import Profile        from './pages/Profile';
import SelectRole     from './pages/SelectRole';
import RoleRoundMap   from './pages/RoleRoundMap';
import RoleReport     from './pages/RoleReport';
import Resources      from './pages/Resources';
import QuizTopicSelect from './pages/QuizTopicSelect';
import QuizSession    from './pages/QuizSession';
import QuizResults    from './pages/QuizResults';
import QuizHistory    from './pages/QuizHistory';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"              element={<Landing/>}/>
          <Route path="/login"         element={<Login/>}/>
          <Route path="/register"      element={<Register/>}/>
          <Route path="/auth/callback" element={<AuthCallback/>}/>
          <Route path="/dashboard"     element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
          <Route path="/interview/new" element={<ProtectedRoute><CreateInterview/></ProtectedRoute>}/>
          <Route path="/interview/:id" element={<ProtectedRoute><InterviewSession/></ProtectedRoute>}/>
          <Route path="/feedback/:id"  element={<ProtectedRoute><Feedback/></ProtectedRoute>}/>
          <Route path="/analytics"     element={<ProtectedRoute><Analytics/></ProtectedRoute>}/>
          <Route path="/history"       element={<ProtectedRoute><History/></ProtectedRoute>}/>
          <Route path="/profile"       element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
          <Route path="/roles"                          element={<ProtectedRoute><SelectRole/></ProtectedRoute>}/>
          <Route path="/roles/attempts/:attemptId"        element={<ProtectedRoute><RoleRoundMap/></ProtectedRoute>}/>
          <Route path="/roles/attempts/:attemptId/report" element={<ProtectedRoute><RoleReport/></ProtectedRoute>}/>
          <Route path="/resources"             element={<ProtectedRoute><Resources/></ProtectedRoute>}/>
          <Route path="/practice"              element={<ProtectedRoute><QuizTopicSelect/></ProtectedRoute>}/>
          <Route path="/practice/history"      element={<ProtectedRoute><QuizHistory/></ProtectedRoute>}/>
          <Route path="/practice/:id"          element={<ProtectedRoute><QuizSession/></ProtectedRoute>}/>
          <Route path="/practice/:id/results"  element={<ProtectedRoute><QuizResults/></ProtectedRoute>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}