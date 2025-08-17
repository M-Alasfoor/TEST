import { Flex, Heading, Image } from '@chakra-ui/react';
import logo from '../assets/logo.png';

export default function Header() {
  return (
    <Flex align="center" justify="space-between" p={4}>
      <Heading size="md">EconX</Heading>
      <Image src={logo} alt="logo" h="40px" />
    </Flex>
  );
}
