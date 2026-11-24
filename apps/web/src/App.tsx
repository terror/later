import ConnectPage from '@/pages/connect';
import HomePage from '@/pages/home';
import SignInPage from '@/pages/sign-in';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/connect' element={<ConnectPage />} />
        <Route path='/sign-in' element={<SignInPage />} />
      </Routes>
    </BrowserRouter>
  );
}
