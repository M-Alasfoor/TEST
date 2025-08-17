import {
  Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, DrawerCloseButton, Table, Tbody, Tr, Td
} from '@chakra-ui/react';
import { ReviewRow } from '../types';

interface Props {
  row?: ReviewRow;
  isOpen: boolean;
  onClose: () => void;
}

export default function RowDetailsDrawer({ row, isOpen, onClose }: Props) {
  if (!row) return null;
  const entries = Object.entries(row).filter(([k]) => k !== 'id');
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>{row.fileName}</DrawerHeader>
        <DrawerBody>
          <Table size="sm">
            <Tbody>
              {entries.map(([k, v]) => (
                <Tr key={k}>
                  <Td>{k}</Td>
                  <Td>{String(v)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
