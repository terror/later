import PrivateRoute from '@/components/private-route';
import DashboardPage from '@/pages/dashboard';
import HomePage from '@/pages/home';
import SignInPage from '@/pages/sign-in';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/sign-in' element={<SignInPage />} />
        <Route
          path='/dashboard'
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
