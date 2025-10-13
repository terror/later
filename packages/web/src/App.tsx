import HomePage from '@/pages/home';
import SignInPage from '@/pages/sign-in';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/sign-in' element={<SignInPage />} />
        <Route path='/signin' element={<Navigate to='/sign-in' replace />} />
      </Routes>
    </BrowserRouter>
  );
}
