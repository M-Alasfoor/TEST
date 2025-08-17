import { useState } from 'react';
import { VStack, Heading, Button, HStack } from '@chakra-ui/react';
import Header from '../components/Header';
import RedDivider from '../components/RedDivider';
import UploadBox from '../components/UploadBox';
import FileProgressList, { UploadItem } from '../components/FileProgressList';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../auth/cognito';
import cfg from '../runtime-config.json';
import { useI18n } from '../i18n';

export default function Dashboard() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const navigate = useNavigate();
  const { toggle } = useI18n();

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      const { data } = await api.post('/uploads/init');
      const item: UploadItem = { id: data.uploadId, fileName: file.name, progress: 0, status: 'uploading' };
      setUploads(prev => [...prev, item]);
      await api.put(data.url, file, {
        headers: { 'Content-Type': 'application/pdf' },
        onUploadProgress: e => {
          setUploads(prev => prev.map(u => u.id === item.id ? { ...u, progress: e.total ? e.loaded / e.total * 100 : 0 } : u));
        }
      });
      setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'uploaded', progress: 100 } : u));
      await api.post('/uploads/complete', { uploadId: item.id, key: data.key, fileName: file.name });
      let status = 'extracting';
      while (status === 'extracting') {
        const res = await api.get(`/uploads/${item.id}/status`);
        status = res.data.status;
        await new Promise(r => setTimeout(r, 2000));
      }
      setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status } : u));
    }
  };

  return (
    <VStack spacing={4} align="stretch" p={4}>
      <Header />
      <RedDivider />
      <HStack justify="flex-end" spacing={2}>
        <Button onClick={() => window.open(cfg.QuicksightUrl, '_blank')}>Quiksight</Button>
        <Button onClick={signOut}>Logout</Button>
        <Button onClick={toggle}>EN/AR</Button>
      </HStack>
      <Heading size="md" textAlign="center">Upload file</Heading>
      <UploadBox onFiles={handleFiles} />
      <FileProgressList uploads={uploads} />
      <Button alignSelf="center" mt={4} onClick={() => navigate('/reviews')}>Review</Button>
    </VStack>
  );
}
