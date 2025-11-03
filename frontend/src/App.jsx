import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Heading,
    Input,
    Grid,
    Card,
    CardBody,
    Image,
    Text,
    Badge,
    Stack,
    HStack,
    VStack,
    Spinner,
    useToast,
    Flex,
    Button,
    ButtonGroup,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    CheckboxGroup,
    Checkbox,
    Collapse,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, AddIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import axios from 'axios';

// Import components
import CardsPage from './components/CardsPage';
import DecksPage from './components/DecksPage';

const CARDS_PER_PAGE = 100;

function App() {
    return (
        <Box bg="gray.50" minH="100vh" py={8}>
            <Container maxW="container.xl">
                <VStack spacing={8} align="stretch">
                    {/* Header */}
                    <Heading size="2xl" textAlign="center" color="blue.600">
                        Yu-Gi-Oh! Collection Manager
                    </Heading>

                    {/* Navigation Tabs */}
                    <Tabs variant="enclosed" colorScheme="blue">
                        <TabList>
                            <Tab>Cards</Tab>
                            <Tab>Decks</Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel px={0}>
                                <CardsPage />
                            </TabPanel>
                            <TabPanel px={0}>
                                <DecksPage />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </VStack>
            </Container>
        </Box>
    );
}

export default App;