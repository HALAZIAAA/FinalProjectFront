import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css'; // 스타일을 위한 CSS 파일을 임포트합니다.

const MainPage = () => {
  const navigate = useNavigate();

  // 페이지 이동을 처리하는 핸들러 함수
  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="main-container">
      {/* LMS 연동하기 버튼 */}
      <button 
        className="lms-button" 
        onClick={() => handleNavigate('/lms')}
      >
        COSMOS 연동하기
      </button>

      {/* 4개의 기능을 담는 그리드 컨테이너 */}
      <div className="grid-container">
        {/* 1. 파일 변환 (버튼) */}
        <button 
          className="grid-item button-item" 
          onClick={() => handleNavigate('/convert')} // 임시 경로: /convert
        >
          <h2>파일 변환</h2>
          <p>PPT, PDF 파일 내 시각자료를 텍스트로 변환하여 추가해 DOCX, HWP로 변환합니다.</p>
        </button>
                <button 
          className="grid-item button-item" 
          onClick={() => handleNavigate('/braille')} // 임시 경로: /lectures
        >
          <h2>점자 변환</h2>
          <p>DOCX, HWP를 점자로 변환합니다.</p>
        </button>

        {/* 2. 음성 녹음 (버튼) */}
        <button 
          className="grid-item button-item" 
          onClick={() => handleNavigate('/record')} // 임시 경로: /record
        >
          <h2>음성 녹음</h2>
          <p>실시간으로 음성 녹음을 진행하고 녹음이 완료되면 지시어 처리와 요약이 진행됩니다.</p>
        </button>

        {/* 3. 강의 자료 목록 (버튼) */}
        <button 
          className="grid-item button-item" 
          onClick={() => handleNavigate('/lectures')} // 임시 경로: /lectures
        >
          <h2>강의 자료 목록</h2>
          <p>COSMOS 연동을 통해 강좌 목록을 불러와 자료를 주차별로 정리합니다.</p>
        </button>
        
      </div>
    </div>
  );
};

export default MainPage;