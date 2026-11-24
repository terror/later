import ConnectPage from '@/pages/connect';
import HomePage from '@/pages/home';
import PrivacyPage from '@/pages/privacy';
import ReaderPage from '@/pages/reader';
import SignInPage from '@/pages/sign-in';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/connect' element={<ConnectPage />} />
        <Route path='/privacy' element={<PrivacyPage />} />
        <Route path='/read/:articleId' element={<ReaderPage />} />
        <Route path='/sign-in' element={<SignInPage />} />
      </Routes>
    </BrowserRouter>
  );
}
