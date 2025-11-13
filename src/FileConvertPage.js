// 전달 변수 file
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './FileConvertPage.css'; // 스타일을 위한 CSS 파일
import { UilCloudUpload, UilFile, UilCheckCircle } from '@iconscout/react-unicons'; // 아이콘 라이브러리
import axios from 'axios';


const FileConvertPage = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [convertFormat, setConvertFormat] = useState('docx'); 
  const [conversionJobs, setConversionJobs] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false); // ⭐️ 1. 드래그 상태 state 추가
  const fileInputRef = useRef(null);

  // ⭐️ 2. 파일 처리 헬퍼 함수 (재사용을 위해 분리)
  const processFile = (file) => {
    if (file) {
      if (['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(file.type)) {
        setSelectedFile(file);
        return true; // 성공
      } else {
        alert('지원하지 않는 파일 형식입니다. (PDF, PPT, PPTX만 가능)');
        return false; // 실패
      }
    }
    return false; // 파일 없음
  };

  const handleFileSelectClick = () => {
    fileInputRef.current.click();
  };

  // ⭐️ 3. onFileChange가 헬퍼 함수를 사용하도록 수정
  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (!processFile(file)) {
      event.target.value = null; 
    }
  };

  // ⭐️ 4. 드래그 앤 드롭 이벤트 핸들러 추가
  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault(); // ⭐️ onDrop 이벤트를 위해 필수
    event.stopPropagation();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);

    const file = event.dataTransfer.files[0]; // 드롭된 파일 가져오기
    processFile(file); // 파일 처리
  };


  const handleConvertClick = async () => {
    if (!selectedFile) {
      alert('먼저 파일을 업로드해주세요.');
      return;
    }

    const originalName = selectedFile.name;
    const lastDotIndex = originalName.lastIndexOf('.');
    const baseName = lastDotIndex > -1 ? originalName.substring(0, lastDotIndex) : originalName;

    // FastAPI process_file(file: UploadFile = File(...))와 맞추어 FormData 구성
    const formData = new FormData();
    formData.append('file', selectedFile); // ✅ 백엔드 파라미터 이름과 동일

    const uploadTime = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    // 현재 백엔드는 항상 DOCX를 반환하므로 확장자를 docx로 고정
    const newExtension = 'docx';
    const newFileName = `${baseName}.${newExtension}`;

    const newJob = {
      id: Date.now(),
      name: newFileName,
      size: (selectedFile.size / 1024).toFixed(2),
      time: uploadTime,
      status: 'processing',
    };

    setConversionJobs(prevJobs => [newJob, ...prevJobs]);

    try {
      const response = await axios.post(
        // ⚠️ prefix를 썼다면 예: 'http://localhost:8000/api/process' 로 수정
        'http://localhost:8000/process',
        formData,
        {
          responseType: 'blob', // 파일 다운로드를 위해 blob으로 받기
        }
      );

      // 응답으로 받은 DOCX 파일을 위한 URL 생성 (클릭 시 다운로드 용)
      const blob = new Blob(
        [response.data],
        {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
      );
      const url = window.URL.createObjectURL(blob);

      // 상태를 완료로 업데이트 + 다운로드 URL 저장
      setConversionJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === newJob.id ? { ...job, status: 'completed', downloadUrl: url } : job
        )
      );
    } catch (error) {
      console.error('파일 변환 중 오류 발생:', error);
      alert('파일 변환 중 오류가 발생했습니다. 백엔드 서버 상태를 확인해주세요.');

      // 실패 상태 표시
      setConversionJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === newJob.id ? { ...job, status: 'failed' } : job
        )
      );
    } finally {
      // 선택된 파일 및 input 초기화
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };

  const handleDownload = (job) => {
    if (!job.downloadUrl) {
      alert('아직 다운로드 가능한 파일이 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const a = document.createElement('a');
    a.href = job.downloadUrl;
    a.download = job.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // 필요하다면 한 번만 다운로드 가능하게 만들고 싶을 때 사용:
    // window.URL.revokeObjectURL(job.downloadUrl);
  };

  const renderJobItem = (job) => (
    <div key={job.id} className="result-item">
      <div className="result-item-header">
        {job.status === 'completed' ? (
          <span 
            className="result-file-name completed-link"
            onClick={() => handleDownload(job)}
            title={`${job.name} 다운로드`}
          >
            {job.name}
          </span>
        ) : (
          <span className="result-file-name">
            {job.name}
          </span>
        )}

        {job.status === 'processing' && (
          <span className="status-tag processing">처리중</span>
        )}
        {job.status === 'completed' && (
          <span className="status-tag completed">
            <UilCheckCircle size="14" /> 처리완료
          </span>
        )}
      </div>
      <div className="result-item-details">
        <span>크기: {job.size} KB</span>
        <span>업로드: {job.time}</span>
      </div>
    </div>
  );

  
  return (
    <div className="convert-container">
      {/* 상단 네비게이션 버튼 */}
      <div className="top-nav-buttons">
        <button className="nav-button active" onClick={() => navigate('/convert')}>파일 변환</button>
        <button className="nav-button" onClick={() => navigate('/record')}>음성 녹음</button>
        <button className="nav-button" onClick={() => navigate('/lectures')}>강의 자료 목록</button>
        <button className="lms-button" onClick={() => navigate('/lms')}>LMS 연동하기</button>
      </div>

      {/* 메인 컨텐츠 영역 (2단 그리드) */}
      <div className="convert-main-grid">
        
        {/* 왼쪽 패널: 파일 업로드 */}
        <div className="upload-panel">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileChange}
            accept=".pdf,.ppt,.pptx"
            style={{ display: 'none' }} 
          />
          
          {!selectedFile ? (
            // ⭐️ 5. JSX에 드래그 이벤트 핸들러 및 동적 클래스 연결
            <div 
              className={`file-drop-zone ${isDraggingOver ? 'dragging-over' : ''}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UilCloudUpload size="60" color="#4a90e2" />
              <p>파일을 드래그하여 놓거나 클릭하여 선택하세요</p>
              <span>지원 형식: PDF, PPT, PPTX</span>
              <button className="select-file-button" onClick={handleFileSelectClick}>
                파일 선택
              </button>
            </div>
          ) : (
            <div className="file-selected-box">
              <h3>파일 업로드</h3>
              <div className="selected-file-info">
                <UilFile size="40" color="#555" />
                <div className="file-details">
                  <span className="file-name-label">파일명</span>
                  <span className="file-name">{selectedFile.name}</span>
                </div>
                <span className="file-ext">{selectedFile.name.split('.').pop()}</span>
              </div>
              
              <div className="format-select-wrapper">
                <label htmlFor="format-select">파일 포맷</label>
                <select 
                  id="format-select" 
                  value={convertFormat}
                  onChange={(e) => setConvertFormat(e.target.value)}
                >
                  <option value="docx">DOCX</option>
                  <option value="doc">DOC</option>
                  <option value="hwp">HWP</option>
                </select>
              </div>

              <button className="convert-button" onClick={handleConvertClick}>
                파일 변환하기
              </button>
            </div>
          )}
        </div>

        {/* 오른쪽 패널: 파일 변환 결과 */}
        <div className="result-panel">
          <h3>파일 변환 결과</h3>
          <div className="result-list-box">
            {conversionJobs.length === 0 ? (
              <div className="empty-result">
                <p>업로드된 파일이 없습니다</p>
                <span>왼쪽에서 파일을 업로드하여 변환하세요</span>
              </div>
            ) : (
              <div className="result-list">
                {conversionJobs.map(renderJobItem)}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FileConvertPage;