import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Heading,
    Input,
    Select,
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
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, AddIcon, MinusIcon } from '@chakra-ui/icons';
import axios from 'axios';

const CARDS_PER_PAGE = 100;

function App() {
    const [cards, setCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchName, setSearchName] = useState('');
    const [metadata, setMetadata] = useState({});
    const [filters, setFilters] = useState({
        type: '',
        race: '',
        attribute: '',
        level: '',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCard, setSelectedCard] = useState(null);
    const [editedQuantity, setEditedQuantity] = useState(0);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // Load all cards and metadata
    useEffect(() => {
        fetchCards();
        fetchMetadata();
    }, []);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/cards');
            setCards(response.data.cards);
            setFilteredCards(response.data.cards);
        } catch (error) {
            toast({
                title: 'Error loading cards',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const response = await axios.get('/api/cards/metadata');
            setMetadata(response.data);
        } catch (error) {
            console.error('Error loading metadata:', error);
        }
    };

    // Apply filters and reset to page 1
    useEffect(() => {
        let result = [...cards];

        if (searchName) {
            result = result.filter(card =>
                card.name?.toLowerCase().includes(searchName.toLowerCase())
            );
        }

        if (filters.type) {
            result = result.filter(card =>
                card.type?.toLowerCase().includes(filters.type.toLowerCase())
            );
        }

        if (filters.race) {
            result = result.filter(card =>
                card.race?.toLowerCase() === filters.race.toLowerCase()
            );
        }

        if (filters.attribute) {
            result = result.filter(card =>
                card.attribute?.toLowerCase() === filters.attribute.toLowerCase()
            );
        }

        if (filters.level) {
            result = result.filter(card => card.level == filters.level);
        }

        setFilteredCards(result);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchName, filters, cards]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        setSearchName('');
        setFilters({ type: '', race: '', attribute: '', level: '' });
    };

    const handleCardClick = (card) => {
        setSelectedCard(card);
        setEditedQuantity(card.quantity || 0);
        onOpen();
    };

    const incrementQuantity = () => {
        setEditedQuantity(prev => prev + 1);
    };

    const decrementQuantity = () => {
        setEditedQuantity(prev => Math.max(0, prev - 1));
    };

    const handleSaveQuantity = async () => {
        try {
            // Update via API
            await axios.put(`/api/cards/${selectedCard.id}/quantity`, {
                quantity: editedQuantity
            });

            // Update the card in local state
            const updatedCards = cards.map(card =>
                card.id === selectedCard.id
                    ? { ...card, quantity: editedQuantity }
                    : card
            );
            setCards(updatedCards);
            setFilteredCards(updatedCards);

            toast({
                title: 'Quantity updated',
                description: `${selectedCard.name} quantity set to ${editedQuantity}`,
                status: 'success',
                duration: 2000,
            });

            onClose();
        } catch (error) {
            toast({
                title: 'Error updating quantity',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    // Pagination calculations
    const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const currentCards = filteredCards.slice(startIndex, endIndex);

    const goToPage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (loading) {
        return (
            <Flex h="100vh" align="center" justify="center">
                <Spinner size="xl" color="blue.500" />
            </Flex>
        );
    }

    return (
        <Box bg="gray.50" minH="100vh" py={8}>
            <Container maxW="container.xl">
                <VStack spacing={8} align="stretch">
                    {/* Header */}
                    <Heading size="2xl" textAlign="center" color="blue.600">
                        Yu-Gi-Oh! Card Collection
                    </Heading>

                    {/* Filters */}
                    <Card>
                        <CardBody>
                            <VStack spacing={4} align="stretch">
                                <Input
                                    placeholder="Search by card name..."
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    size="lg"
                                />

                                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                                    <Select
                                        placeholder="Filter by Type"
                                        value={filters.type}
                                        onChange={(e) => handleFilterChange('type', e.target.value)}
                                    >
                                        {metadata.types?.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </Select>

                                    <Select
                                        placeholder="Filter by Race"
                                        value={filters.race}
                                        onChange={(e) => handleFilterChange('race', e.target.value)}
                                    >
                                        {metadata.races?.map(race => (
                                            <option key={race} value={race}>{race}</option>
                                        ))}
                                    </Select>

                                    <Select
                                        placeholder="Filter by Attribute"
                                        value={filters.attribute}
                                        onChange={(e) => handleFilterChange('attribute', e.target.value)}
                                    >
                                        {metadata.attributes?.map(attr => (
                                            <option key={attr} value={attr}>{attr}</option>
                                        ))}
                                    </Select>

                                    <Select
                                        placeholder="Filter by Level"
                                        value={filters.level}
                                        onChange={(e) => handleFilterChange('level', e.target.value)}
                                    >
                                        {metadata.levels?.map(level => (
                                            <option key={level} value={level}>Level {level}</option>
                                        ))}
                                    </Select>
                                </Grid>

                                <HStack justify="space-between" wrap="wrap">
                                    <Button onClick={clearFilters} colorScheme="red" variant="outline">
                                        Clear Filters
                                    </Button>
                                    <Text fontSize="sm" color="gray.600">
                                        Showing {startIndex + 1}-{Math.min(endIndex, filteredCards.length)} of {filteredCards.length} cards
                                    </Text>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Pagination Controls (Top) */}
                    {totalPages > 1 && (
                        <Flex justify="center" align="center" gap={2} wrap="wrap">
                            <IconButton
                                icon={<ChevronLeftIcon />}
                                onClick={prevPage}
                                isDisabled={currentPage === 1}
                                aria-label="Previous page"
                            />

                            <ButtonGroup spacing={2}>
                                {getPageNumbers().map((page, index) => (
                                    page === '...' ? (
                                        <Text key={`ellipsis-${index}`} px={2} alignSelf="center">...</Text>
                                    ) : (
                                        <Button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            colorScheme={currentPage === page ? 'blue' : 'gray'}
                                            variant={currentPage === page ? 'solid' : 'outline'}
                                        >
                                            {page}
                                        </Button>
                                    )
                                ))}
                            </ButtonGroup>

                            <IconButton
                                icon={<ChevronRightIcon />}
                                onClick={nextPage}
                                isDisabled={currentPage === totalPages}
                                aria-label="Next page"
                            />
                        </Flex>
                    )}

                    {/* Cards Grid */}
                    <Grid
                        templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
                        gap={6}
                    >
                        {currentCards.map(card => (
                            <Card
                                key={card.id}
                                overflow="hidden"
                                _hover={{ transform: 'scale(1.05)', transition: '0.2s', cursor: 'pointer' }}
                                onClick={() => handleCardClick(card)}
                            >
                                <Image
                                    src={`/images/cards/${card.id}.jpg`}
                                    alt={card.name}
                                    objectFit="cover"
                                    h="300px"
                                    fallbackSrc="https://via.placeholder.com/250x366?text=No+Image"
                                />
                                <CardBody>
                                    <Stack spacing={3}>
                                        <Heading size="sm" noOfLines={2}>
                                            {card.name || 'Unknown Card'}
                                        </Heading>

                                        <HStack wrap="wrap" spacing={2}>
                                            {card.type && (
                                                <Badge colorScheme="blue">{card.type}</Badge>
                                            )}
                                            {card.race && (
                                                <Badge colorScheme="green">{card.race}</Badge>
                                            )}
                                            {card.attribute && (
                                                <Badge colorScheme="purple">{card.attribute}</Badge>
                                            )}
                                        </HStack>

                                        {card.level && (
                                            <Text fontSize="sm">Level: {card.level}</Text>
                                        )}

                                        {(card.atk !== undefined || card.def !== undefined) && (
                                            <HStack>
                                                <Text fontSize="sm" fontWeight="bold">ATK: {card.atk ?? '?'}</Text>
                                                <Text fontSize="sm" fontWeight="bold">DEF: {card.def ?? '?'}</Text>
                                            </HStack>
                                        )}

                                        {card.quantity !== undefined && card.quantity > 0 && (
                                            <Badge colorScheme="orange" fontSize="md">
                                                Owned: {card.quantity}
                                            </Badge>
                                        )}
                                    </Stack>
                                </CardBody>
                            </Card>
                        ))}
                    </Grid>

                    {filteredCards.length === 0 && (
                        <Text textAlign="center" fontSize="xl" color="gray.500">
                            No cards found matching your filters
                        </Text>
                    )}

                    {/* Pagination Controls (Bottom) */}
                    {totalPages > 1 && (
                        <Flex justify="center" align="center" gap={2} wrap="wrap">
                            <IconButton
                                icon={<ChevronLeftIcon />}
                                onClick={prevPage}
                                isDisabled={currentPage === 1}
                                aria-label="Previous page"
                            />

                            <ButtonGroup spacing={2}>
                                {getPageNumbers().map((page, index) => (
                                    page === '...' ? (
                                        <Text key={`ellipsis-${index}`} px={2} alignSelf="center">...</Text>
                                    ) : (
                                        <Button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            colorScheme={currentPage === page ? 'blue' : 'gray'}
                                            variant={currentPage === page ? 'solid' : 'outline'}
                                        >
                                            {page}
                                        </Button>
                                    )
                                ))}
                            </ButtonGroup>

                            <IconButton
                                icon={<ChevronRightIcon />}
                                onClick={nextPage}
                                isDisabled={currentPage === totalPages}
                                aria-label="Next page"
                            />
                        </Flex>
                    )}
                </VStack>
            </Container>

            {/* Card Detail Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{selectedCard?.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Image
                                src={`/images/cards/${selectedCard?.id}.jpg`}
                                alt={selectedCard?.name}
                                objectFit="contain"
                                maxH="500px"
                                mx="auto"
                                fallbackSrc="https://via.placeholder.com/421x614?text=No+Image"
                            />

                            <Stack spacing={2}>
                                <HStack wrap="wrap" spacing={2}>
                                    {selectedCard?.type && (
                                        <Badge colorScheme="blue" fontSize="md">{selectedCard.type}</Badge>
                                    )}
                                    {selectedCard?.race && (
                                        <Badge colorScheme="green" fontSize="md">{selectedCard.race}</Badge>
                                    )}
                                    {selectedCard?.attribute && (
                                        <Badge colorScheme="purple" fontSize="md">{selectedCard.attribute}</Badge>
                                    )}
                                </HStack>

                                {selectedCard?.level && (
                                    <Text><strong>Level:</strong> {selectedCard.level}</Text>
                                )}

                                {(selectedCard?.atk !== undefined || selectedCard?.def !== undefined) && (
                                    <HStack>
                                        <Text><strong>ATK:</strong> {selectedCard.atk ?? '?'}</Text>
                                        <Text><strong>DEF:</strong> {selectedCard.def ?? '?'}</Text>
                                    </HStack>
                                )}

                                {selectedCard?.archetype && (
                                    <Text><strong>Archetype:</strong> {selectedCard.archetype}</Text>
                                )}

                                {selectedCard?.desc && (
                                    <Box>
                                        <Text fontWeight="bold">Description:</Text>
                                        <Text fontSize="sm">{selectedCard.desc}</Text>
                                    </Box>
                                )}

                                {/* Quantity Controls */}
                                <Box borderWidth="2px" borderRadius="lg" p={4} borderColor="orange.400">
                                    <VStack spacing={3}>
                                        <Text fontWeight="bold" fontSize="lg">Quantity Owned</Text>
                                        <HStack spacing={4}>
                                            <IconButton
                                                icon={<MinusIcon />}
                                                onClick={decrementQuantity}
                                                colorScheme="red"
                                                isDisabled={editedQuantity === 0}
                                                aria-label="Decrease quantity"
                                            />
                                            <Text fontSize="3xl" fontWeight="bold" minW="60px" textAlign="center">
                                                {editedQuantity}
                                            </Text>
                                            <IconButton
                                                icon={<AddIcon />}
                                                onClick={incrementQuantity}
                                                colorScheme="green"
                                                aria-label="Increase quantity"
                                            />
                                        </HStack>
                                    </VStack>
                                </Box>
                            </Stack>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="blue" onClick={handleSaveQuantity}>
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default App;