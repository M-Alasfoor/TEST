import { useCallback } from 'react';
import { Box, Input, Text } from '@chakra-ui/react';

type Props = { onFiles: (files: File[]) => void };

export default function UploadBox({ onFiles }: Props) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onFiles(Array.from(e.target.files));
  }, [onFiles]);

  return (
    <Box border="2px dashed" borderColor="gray.300" p={8} textAlign="center" rounded="md">
      <Text mb={4}>Drag and drop PDFs or click to select</Text>
      <Input type="file" accept="application/pdf" multiple onChange={handleChange} />
    </Box>
  );
}
