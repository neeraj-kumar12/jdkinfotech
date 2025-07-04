// pages/documents.js
import { useState, useEffect } from 'react';
import Document from '@/models/Document'; // Your new model

export default function DocumentsPage() {
  const [instituteId, setInstituteId] = useState(null);
  
  // Fetch instituteId on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/current-user');
        const data = await response.json();
        if (data.success) {
          setInstituteId(data.data.instituteId);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
  }, []);

  // Modify your upload function
  const proceedWithUpload = async () => {
    if (!instituteId) return;

    const fileExtension = uploadFile.name.split('.').pop();
    const finalFileName = customFileName.trim() + '.' + fileExtension;

    // Convert file to Buffer
    const arrayBuffer = await uploadFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Save to MongoDB
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: finalFileName,
          type: uploadFile.type.includes('pdf') ? 'PDF' : 'JPG/PNG',
          size: Math.round(uploadFile.size / 1024) + ' KB',
          data: buffer.toString('base64'), // Send as base64
          contentType: uploadFile.type,
          instituteId,
          category: uploadCategory === 'personalDocs' ? 'personal' : 'academic'
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Update local state
        setDocuments(prev => ({
          ...prev,
          [uploadCategory]: [...prev[uploadCategory], {
            id: result.data._id,
            name: finalFileName,
            type: uploadFile.type.includes('pdf') ? 'PDF' : 'JPG/PNG',
            size: Math.round(uploadFile.size / 1024) + ' KB',
            updatedAt: new Date().toISOString().split('T')[0],
            status: "Pending",
            url: URL.createObjectURL(uploadFile)
          }]
        }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
}