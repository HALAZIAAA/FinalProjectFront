import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './BraillePage.css';
import { UilCloudUpload, UilFile, UilCheckCircle } from '@iconscout/react-unicons';

const BraillePage = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [conversionJobs, setConversionJobs] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDownload = (job) => {
    if (!job.downloadUrl) return;

    const a = document.createElement('a');
    a.href = job.downloadUrl;
    a.download =
      job.downloadFileName ||
      job.filename.replace(/\.docx$/i, '.brf');
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(job.downloadUrl);
  };

  const handleStartConvert = async () => {
    if (!selectedFile) {
      alert('먼저 DOCX 파일을 업로드해주세요.');
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.docx')) {
      alert('점자 변환은 DOCX 파일만 지원합니다.');
      return;
    }

    const newJob = {
      id: Date.now(),
      filename: selectedFile.name,
      status: 'processing',
      startedAt: new Date().toLocaleTimeString(),
      completedAt: null,
    };

    setConversionJobs((prev) => [newJob, ...prev]);
    setIsConverting(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8000/braille', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('변환 요청에 실패했습니다.');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let downloadFileName = selectedFile.name.replace(/\.docx$/i, '.brf');

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) {
          downloadFileName = decodeURIComponent(match[1]);
        }
      }

      const url = window.URL.createObjectURL(blob);

      setConversionJobs((prev) =>
        prev.map((job) =>
          job.id === newJob.id
            ? {
                ...job,
                status: 'completed',
                completedAt: new Date().toLocaleTimeString(),
                downloadUrl: url,
                downloadFileName,
              }
            : job
        )
      );
    } catch (error) {
      console.error(error);
      alert('점자 변환 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');

      setConversionJobs((prev) =>
        prev.map((job) =>
          job.id === newJob.id
            ? {
                ...job,
                status: 'failed',
                completedAt: new Date().toLocaleTimeString(),
              }
            : job
        )
      );
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="convert-page">
      <div className="convert-container">
        {/* 상단 네비게이션 버튼 */}
      <div className="top-nav-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>홈 화면</button>
        <button className="nav-button active" onClick={() => navigate('/convert')}>파일 변환</button>
        <button className="nav-button" onClick={() => navigate('/braille')}>점자 변환</button>
        <button className="nav-button" onClick={() => navigate('/record')}>음성 녹음</button>
        <button className="nav-button" onClick={() => navigate('/lectures')}>강의 자료 목록</button>
        <button className="lms-button" onClick={() => navigate('/lms')}>LMS 연동하기</button>
      </div>
        


        {/* 업로드 + 변환 내역 2단 레이아웃 */}
        <div className="convert-main-grid">
          {/* 업로드 영역 */}
          <div
            className="upload-card"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="upload-content">
              <div className="upload-icon-wrapper">
                <UilCloudUpload className="upload-icon" />
              </div>
              <p className="upload-title">파일을 이곳에 드래그하거나 클릭해서 업로드하세요</p>
              <p className="upload-subtitle">점자 변환은 DOCX 파일만 지원합니다.</p>

              <button
                type="button"
                className="upload-button"
                onClick={handleUploadClick}
                disabled={isConverting}
              >
                파일 선택
              </button>
              <input
                type="file"
                accept=".docx"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {selectedFile && (
                <div className="selected-file-info">
                  <UilFile className="file-icon" />
                  <div className="file-texts">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="convert-start-button"
                onClick={handleStartConvert}
                disabled={!selectedFile || isConverting}
              >
                {isConverting ? '점자 변환 중...' : '점자 변환 시작'}
              </button>
            </div>
          </div>

          {/* 변환 작업 목록 */}
          <div className="jobs-section">
            <h2 className="section-title">변환 내역</h2>
            {conversionJobs.length === 0 ? (
              <p className="empty-jobs">아직 변환된 파일이 없습니다.</p>
            ) : (
              <ul className="jobs-list">
                {conversionJobs.map((job) => (
                  <li key={job.id} className="job-item">
                    <div className="job-main">
                      <UilFile className="job-file-icon" />
                      <div className="job-texts">
                        <span
                          className="job-filename"
                          onClick={() => {
                            if (job.status === 'completed' && job.downloadUrl) {
                              handleDownload(job);
                            }
                          }}
                        >
                          {job.filename}
                        </span>
                        <span className="job-time">
                          시작: {job.startedAt}
                          {job.completedAt && ` · 완료: ${job.completedAt}`}
                        </span>
                      </div>
                    </div>
                    <div className="job-status-wrapper">
                      {job.status === 'processing' && (
                        <span className="job-status processing">변환 중...</span>
                      )}
                      {job.status === 'completed' && (
                        <span className="job-status completed">
                          <UilCheckCircle className="status-icon" /> 완료
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="job-status failed">실패</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BraillePage;