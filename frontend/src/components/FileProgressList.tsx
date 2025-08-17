import { Progress, Box, Text, VStack } from '@chakra-ui/react';

export interface UploadItem {
  id: string;
  fileName: string;
  progress: number;
  status: string;
}

type Props = { uploads: UploadItem[] };

export default function FileProgressList({ uploads }: Props) {
  return (
    <VStack w="100%" align="stretch" spacing={3} mt={4}>
      {uploads.map(u => (
        <Box key={u.id}>
          <Text fontSize="sm">{u.fileName} - {u.status}</Text>
          <Progress value={u.progress} size="sm" colorScheme="green" />
        </Box>
      ))}
    </VStack>
  );
}
