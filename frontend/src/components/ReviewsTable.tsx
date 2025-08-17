import { useState } from 'react';
import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Button, Badge, IconButton
} from '@chakra-ui/react';
import { ReviewRow } from '../types';

const headers: [keyof ReviewRow, string][] = [
  ['fileName', 'file name'],
  ['crbr', 'CRBR'],
  ['companyName', 'company name'],
  ['totalAsset', 'total asset'],
  ['currentAssest', 'current assest'],
  ['nonCurrenAssets', 'non-curren assets'],
  ['totalLiability', 'total liability'],
  ['currentLiability', 'current liability'],
  ['nonCurrenLiability', 'non-curren liability'],
  ['totalEquitys', "total equity's"],
  ['currentEquitys', "current equity's"],
  ['nonCurrenEquitys', "non-curren equity's"],
  ['turnover', 'turnover'],
  ['income', 'income'],
  ['expenses', 'expenses'],
  ['interestPaid', 'interest paid'],
  ['interestReceived', 'interest received'],
  ['dividendsPaid', 'dividends paid'],
  ['dividendsReceived', 'dividends received']
];

type Props = {
  data: ReviewRow[];
  onApprove: (id: string) => void;
  onRowClick?: (row: ReviewRow) => void;
};

const pageSize = 10;

export default function ReviewsTable({ data, onApprove, onRowClick }: Props) {
  const [page, setPage] = useState(0);
  const start = page * pageSize;
  const pageData = data.slice(start, start + pageSize);

  return (
    <TableContainer maxH="60vh" overflowY="auto">
      <Table size="sm">
        <Thead position="sticky" top={0} bg="gray.100" zIndex={1}>
          <Tr>
            {headers.map(([key, label]) => (
              <Th key={key}>{label}</Th>
            ))}
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {pageData.map(row => (
            <Tr key={row.id} _hover={{ bg: 'gray.50' }} onClick={() => onRowClick && onRowClick(row)} cursor="pointer">
              {headers.map(([key]) => (
                <Td key={key}>{(row as any)[key]}</Td>
              ))}
              <Td>
                <Badge colorScheme={row.status === 'approved' ? 'green' : row.status === 'failed' ? 'red' : 'yellow'}>
                  {row.status}
                </Badge>
              </Td>
              <Td>
                <Button size="xs" onClick={() => onApprove(row.id)} isDisabled={row.status === 'approved'}>
                  Approve
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Button mt={2} onClick={() => setPage(p => Math.max(p - 1, 0))} mr={2} disabled={page === 0}>
        Prev
      </Button>
      <Button mt={2} onClick={() => setPage(p => (start + pageSize < data.length ? p + 1 : p))}>
        Next
      </Button>
    </TableContainer>
  );
}
