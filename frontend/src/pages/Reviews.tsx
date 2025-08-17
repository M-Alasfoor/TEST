import { useState } from 'react';
import { VStack, Heading, Button, HStack, useDisclosure } from '@chakra-ui/react';
import Header from '../components/Header';
import RedDivider from '../components/RedDivider';
import ReviewsTable from '../components/ReviewsTable';
import RowDetailsDrawer from '../components/RowDetailsDrawer';
import api from '../api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReviewRow } from '../types';
import { signOut } from '../auth/cognito';
import cfg from '../runtime-config.json';
import { useI18n } from '../i18n';

export default function Reviews() {
  const qc = useQueryClient();
  const { data = [], refetch } = useQuery<ReviewRow[]>({ queryKey: ['reviews'], queryFn: async () => (await api.get('/reviews')).data });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState<ReviewRow>();
  const { toggle } = useI18n();

  const handleApprove = async (id: string) => {
    await api.post(`/reviews/${id}/approve`);
    await qc.invalidateQueries({ queryKey: ['reviews'] });
  };

  const openRow = (row: ReviewRow) => {
    setSelected(row);
    onOpen();
  };

  return (
    <VStack align="stretch" p={4} spacing={4}>
      <Header />
      <RedDivider />
      <HStack justify="flex-end" spacing={2}>
        <Button onClick={() => window.open(cfg.QuicksightUrl, '_blank')}>Quiksight</Button>
        <Button onClick={signOut}>Logout</Button>
        <Button onClick={() => refetch()}>Refresh</Button>
        <Button onClick={toggle}>EN/AR</Button>
      </HStack>
      <Heading size="md">Reviews</Heading>
      <ReviewsTable data={data} onApprove={handleApprove} onRowClick={openRow} />
      <RowDetailsDrawer row={selected} isOpen={isOpen} onClose={onClose} />
    </VStack>
  );
}
