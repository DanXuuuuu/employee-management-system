// frontend/src/pages/employee/DocumentManagement.jsx
import { useState, useEffect } from 'react';
import FileUploadCard from '../components/ui/FileUploadCard';
import axios from 'axios';

const DOCUMENT_TYPES = [
  { key: 'Driver License', label: 'Driver License', required: true },
  { key: 'OPT Receipt', label: 'OPT Receipt', required: false },
  { key: 'OPT EAD', label: 'OPT EAD', required: false },
  { key: 'I-983', label: 'I-983', required: false },
  { key: 'I-20', label: 'I-20', required: false },
];

export default function DocumentManagement() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({});
  const [loading, setLoading] = useState(true);

  // 获取所有文档
  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data.data);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // 上传文件
  const handleUpload = async (docType, file) => {
    if (!file) return;

    setUploading(prev => ({ ...prev, [docType]: true }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', docType);

    try {
      const token = localStorage.getItem('token');
      
      // 检查是否已存在（用于重新上传）
      const existingDoc = documents.find(d => d.type === docType);
      
      let response;
      if (existingDoc && existingDoc.status === 'Rejected') {
        // 重新上传
        response = await axios.put(
          `http://localhost:8080/api/documents/${existingDoc._id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        // 新上传
        response = await axios.post(
          'http://localhost:8080/api/documents',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          }
        );
      }

      alert('Upload successful!');
      fetchDocuments(); // 重新获取文档列表

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  // 下载文件
  const handleDownload = async (docId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/api/documents/download/${docId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
    }
  };

  // 预览文件
  const handlePreview = (docId) => {
    const token = localStorage.getItem('token');
   window.open(
    `http://localhost:8080/api/documents/preview/${docId}?token=${token}`,
    '_blank'
  );
  };

  if (loading) {
    return <div className="p-6">Loading documents...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Document Management</h1>
      
      <div className="space-y-4">
        {DOCUMENT_TYPES.map(docType => {
          const doc = documents.find(d => d.type === docType.key);
          
          return (
            <FileUploadCard
              key={docType.key}
              label={docType.label}
              required={docType.required}
              hint={doc?.status === 'Rejected' ? 'Document was rejected, please reupload' : ''}
              disabled={doc?.status === 'Approved'}
              fileName={doc?.fileName || null}
              onPick={(file) => handleUpload(docType.key, file)}
              onPreview={() => doc && handlePreview(doc._id)}
              onDownload={() => doc && handleDownload(doc._id, doc.fileName)}
              status={doc?.status}
              feedback={doc?.feedback}
              uploading={uploading[docType.key]}
            />
          );
        })}
      </div>
    </div>
  );
}