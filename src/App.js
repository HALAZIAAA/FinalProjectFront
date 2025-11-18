import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './MainPage';

// 나중에 만드실 임시 페이지 컴포넌트들입니다.
import FileConvertPage from './FileConvertPage';
import BraillePage from './BraillePage';
const VoiceRecordPage = () => <h2>음성 녹음 페이지</h2>;
const LectureListPage = () => <h2>강의 자료 목록 페이지</h2>;
const LmsPage = () => <h2>LMS 연동하기 페이지</h2>;


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 메인 페이지 라우트 */}
        <Route path="/" element={<MainPage />} />
        
        {/* 임시로 생성한 페이지 라우트들 */}
        <Route path="/convert" element={<FileConvertPage />} />
        <Route path="/braille" element={<BraillePage />} />
        <Route path="/record" element={<VoiceRecordPage />} />
        <Route path="/lectures" element={<LectureListPage />} />
        <Route path="/lms" element={<LmsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;