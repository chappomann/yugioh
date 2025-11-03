import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardBody,
    Grid,
    Heading,
    Text,
    VStack,
    HStack,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Input,
    Textarea,
    Badge,
    Image,
    Stack,
    IconButton,
    Spinner,
    Flex,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Radio,
    RadioGroup,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, ViewIcon } from '@chakra-ui/icons';
import axios from 'axios';

function DecksPage() {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeck, setSelectedDeck] = useState(null);
    const [deckCards, setDeckCards] = useState([]);
    const [newDeckName, setNewDeckName] = useState('');
    const [newDeckDescription, setNewDeckDescription] = useState('');
    const [selectedCards, setSelectedCards] = useState([]); // Array of {cardId, quantity, category}
    const [selectedCategory, setSelectedCategory] = useState('main'); // Current category for adding cards
    const [editingDeck, setEditingDeck] = useState(null);
    const [deletingDeck, setDeletingDeck] = useState(null);
    const [allCards, setAllCards] = useState([]);
    const [cardSearch, setCardSearch] = useState('');
    const [filteredCards, setFilteredCards] = useState([]);

    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

    const toast = useToast();

    useEffect(() => {
        fetchDecks();
        fetchAllCards();
    }, []);

    useEffect(() => {
        // Filter cards based on search
        if (cardSearch.trim()) {
            const filtered = allCards.filter(card =>
                card.name?.toLowerCase().includes(cardSearch.toLowerCase())
            );
            setFilteredCards(filtered.slice(0, 20)); // Limit to 20 results for performance
        } else {
            setFilteredCards([]);
        }
    }, [cardSearch, allCards]);

    const fetchAllCards = async () => {
        try {
            const response = await axios.get('/api/cards');
            setAllCards(response.data.cards);
        } catch (error) {
            console.error('Error loading cards:', error);
        }
    };

    const fetchDecks = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/decks');
            setDecks(response.data.decks);
        } catch (error) {
            toast({
                title: 'Error loading decks',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDeck = async () => {
        if (!newDeckName.trim()) {
            toast({
                title: 'Name required',
                description: 'Please enter a deck name',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        try {
            const response = await axios.post('/api/decks', {
                name: newDeckName,
                description: newDeckDescription,
                cards: selectedCards
            });

            setDecks(prev => [...prev, response.data.deck]);
            setNewDeckName('');
            setNewDeckDescription('');
            setSelectedCards([]);
            setCardSearch('');
            onCreateClose();

            const totalCards = selectedCards.reduce((sum, card) => sum + card.quantity, 0);
            toast({
                title: 'Deck created',
                description: `"${newDeckName}" has been created with ${totalCards} cards`,
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Error creating deck',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleViewDeck = async (deck) => {
        setSelectedDeck(deck);
        try {
            const response = await axios.get(`/api/decks/${deck.id}/cards`);
            setDeckCards(response.data.cards || []);
            onViewOpen();
        } catch (error) {
            toast({
                title: 'Error loading deck cards',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleEditDeck = (deck) => {
        setEditingDeck(deck);
        setNewDeckName(deck.name);
        setNewDeckDescription(deck.description || '');

        // Handle both old format (cardIds) and new format (cards with quantities)
        if (deck.cards && Array.isArray(deck.cards)) {
            setSelectedCards(deck.cards);
        } else if (deck.cardIds && Array.isArray(deck.cardIds)) {
            // Convert old format to new format
            const cards = deck.cardIds.map(cardId => ({ cardId, quantity: 1 }));
            setSelectedCards(cards);
        } else {
            setSelectedCards([]);
        }

        setCardSearch('');
        onEditOpen();
    };

    const handleUpdateDeck = async () => {
        if (!newDeckName.trim()) {
            toast({
                title: 'Name required',
                description: 'Please enter a deck name',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        try {
            const response = await axios.put(`/api/decks/${editingDeck.id}`, {
                name: newDeckName,
                description: newDeckDescription,
                cards: selectedCards
            });

            setDecks(prev => prev.map(deck =>
                deck.id === editingDeck.id ? response.data.deck : deck
            ));

            setNewDeckName('');
            setNewDeckDescription('');
            setSelectedCards([]);
            setCardSearch('');
            setEditingDeck(null);
            onEditClose();

            const totalCards = selectedCards.reduce((sum, card) => sum + card.quantity, 0);
            toast({
                title: 'Deck updated',
                description: `"${newDeckName}" has been updated with ${totalCards} cards`,
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Error updating deck',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleDeleteDeck = async () => {
        try {
            await axios.delete(`/api/decks/${deletingDeck.id}`);
            setDecks(prev => prev.filter(deck => deck.id !== deletingDeck.id));

            toast({
                title: 'Deck deleted',
                description: `"${deletingDeck.name}" has been deleted`,
                status: 'success',
                duration: 3000,
            });

            setDeletingDeck(null);
            onDeleteClose();
        } catch (error) {
            toast({
                title: 'Error deleting deck',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const confirmDelete = (deck) => {
        setDeletingDeck(deck);
        onDeleteOpen();
    };

    const toggleCardSelection = (cardId) => {
        setSelectedCards(prev => {
            // Find existing card with same cardId and category
            const existingCardIndex = prev.findIndex(card =>
                card.cardId === cardId && card.category === selectedCategory
            );

            if (existingCardIndex !== -1) {
                const existingCard = prev[existingCardIndex];
                if (existingCard.quantity < 3) {
                    // Increase quantity up to 3
                    return prev.map((card, index) =>
                        index === existingCardIndex
                            ? { ...card, quantity: card.quantity + 1 }
                            : card
                    );
                } else {
                    // Already at max, remove the card
                    return prev.filter((card, index) => index !== existingCardIndex);
                }
            } else {
                // Add new card with quantity 1 and current category
                return [...prev, { cardId, quantity: 1, category: selectedCategory }];
            }
        });
    };

    const removeSelectedCard = (cardId, category) => {
        setSelectedCards(prev => prev.filter(card =>
            !(card.cardId === cardId && card.category === category)
        ));
    };

    const updateCardQuantity = (cardId, category, newQuantity) => {
        if (newQuantity <= 0) {
            removeSelectedCard(cardId, category);
        } else if (newQuantity <= 3) {
            setSelectedCards(prev => prev.map(card =>
                (card.cardId === cardId && card.category === category)
                    ? { ...card, quantity: newQuantity }
                    : card
            ));
        }
    };

    const getSelectedCardDetails = () => {
        return selectedCards.map(cardEntry => {
            const card = allCards.find(card => card.id === cardEntry.cardId);
            return card ? { ...card, quantity: cardEntry.quantity, category: cardEntry.category } : null;
        }).filter(Boolean);
    };

    const getCardsByCategory = (category) => {
        return selectedCards
            .filter(card => card.category === category)
            .map(cardEntry => {
                const card = allCards.find(card => card.id === cardEntry.cardId);
                return card ? { ...card, quantity: cardEntry.quantity, category: cardEntry.category } : null;
            }).filter(Boolean);
    };

    const getCardQuantity = (cardId) => {
        const card = selectedCards.find(card =>
            card.cardId === cardId && card.category === selectedCategory
        );
        return card ? card.quantity : 0;
    };

    const getTotalCardCount = () => {
        return selectedCards.reduce((sum, card) => sum + card.quantity, 0);
    };

    const resetDeckForm = () => {
        setNewDeckName('');
        setNewDeckDescription('');
        setSelectedCards([]);
        setSelectedCategory('main');
        setCardSearch('');
        setEditingDeck(null);
    };

    if (loading) {
        return (
            <Flex h="50vh" align="center" justify="center">
                <Spinner size="xl" color="blue.500" />
            </Flex>
        );
    }

    return (
        <VStack spacing={6} align="stretch">
            {/* Header with Create Button */}
            <HStack justify="space-between" align="center">
                <Box>
                    <Heading size="lg" color="blue.600">My Decks</Heading>
                    <Text color="gray.600">Manage your Yu-Gi-Oh! deck collections</Text>
                </Box>
                <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onCreateOpen}>
                    Create New Deck
                </Button>
            </HStack>

            {/* Decks Grid */}
            {decks.length === 0 ? (
                <Card>
                    <CardBody>
                        <VStack spacing={4} py={8}>
                            <Text fontSize="xl" color="gray.500">No decks created yet</Text>
                            <Text color="gray.400">Create your first deck to get started!</Text>
                            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onCreateOpen}>
                                Create Your First Deck
                            </Button>
                        </VStack>
                    </CardBody>
                </Card>
            ) : (
                <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
                    {decks.map(deck => (
                        <Card key={deck.id} _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }} transition="all 0.2s">
                            <CardBody>
                                <VStack align="stretch" spacing={4}>
                                    <Box>
                                        <Heading size="md" noOfLines={1}>{deck.name}</Heading>
                                        {deck.description && (
                                            <Text fontSize="sm" color="gray.600" noOfLines={2} mt={1}>
                                                {deck.description}
                                            </Text>
                                        )}
                                    </Box>

                                    <HStack>
                                        <Badge colorScheme="blue">
                                            {deck.cards
                                                ? deck.cards.reduce((sum, card) => sum + (card.quantity || 1), 0)
                                                : (deck.cardIds?.length || 0)
                                            } cards
                                        </Badge>
                                        <Badge colorScheme="gray">
                                            {new Date(deck.createdAt).toLocaleDateString()}
                                        </Badge>
                                    </HStack>

                                    <HStack spacing={2}>
                                        <Button
                                            size="sm"
                                            leftIcon={<ViewIcon />}
                                            onClick={() => handleViewDeck(deck)}
                                            flex={1}
                                        >
                                            View
                                        </Button>
                                        <IconButton
                                            size="sm"
                                            icon={<EditIcon />}
                                            onClick={() => handleEditDeck(deck)}
                                            aria-label="Edit deck"
                                        />
                                        <IconButton
                                            size="sm"
                                            icon={<DeleteIcon />}
                                            colorScheme="red"
                                            onClick={() => confirmDelete(deck)}
                                            aria-label="Delete deck"
                                        />
                                    </HStack>
                                </VStack>
                            </CardBody>
                        </Card>
                    ))}
                </Grid>
            )}

            {/* Create Deck Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => { resetDeckForm(); onCreateClose(); }} size="xl">
                <ModalOverlay />
                <ModalContent maxH="90vh">
                    <ModalHeader>Create New Deck</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody overflowY="auto">
                        <VStack spacing={4} align="stretch">
                            <Input
                                placeholder="Deck name"
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                            />
                            <Textarea
                                placeholder="Deck description (optional)"
                                value={newDeckDescription}
                                onChange={(e) => setNewDeckDescription(e.target.value)}
                                rows={3}
                            />

                            {/* Card Selection Section */}
                            <Box>
                                <Heading size="sm" mb={2}>Add Cards to Deck</Heading>
                                <Input
                                    placeholder="Search cards to add..."
                                    value={cardSearch}
                                    onChange={(e) => setCardSearch(e.target.value)}
                                    mb={3}
                                />

                                {/* Category Selection */}
                                <Box mb={3}>
                                    <Text fontWeight="semibold" mb={2}>Add to:</Text>
                                    <RadioGroup value={selectedCategory} onChange={setSelectedCategory}>
                                        <HStack spacing={4}>
                                            <Radio value="main">Main Deck</Radio>
                                            <Radio value="extra">Extra Deck</Radio>
                                            <Radio value="side">Side Deck</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Box>

                                {/* Selected Cards */}
                                {selectedCards.length > 0 && (
                                    <Box mb={4}>
                                        <Text fontWeight="semibold" mb={2}>Selected Cards ({getTotalCardCount()}):</Text>

                                        {/* Main Deck Cards */}
                                        {getCardsByCategory('main').length > 0 && (
                                            <Box mb={3}>
                                                <Text fontSize="sm" fontWeight="semibold" color="blue.600" mb={2}>
                                                    Main Deck ({getCardsByCategory('main').reduce((sum, card) => sum + card.quantity, 0)} cards)
                                                </Text>
                                                <Grid templateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2} maxH="150px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md" borderColor="blue.200">
                                                    {getCardsByCategory('main').map(card => (
                                                        <Box key={`${card.id}-main`} position="relative" borderWidth="1px" borderRadius="md" p={2}>
                                                            <Image
                                                                src={`/images/cards/${card.id}.jpg`}
                                                                alt={card.name}
                                                                w="100%"
                                                                borderRadius="md"
                                                                fallbackSrc="https://via.placeholder.com/100x146?text=Card"
                                                            />
                                                            <IconButton
                                                                icon={<DeleteIcon />}
                                                                size="xs"
                                                                colorScheme="red"
                                                                position="absolute"
                                                                top="2px"
                                                                right="2px"
                                                                onClick={() => removeSelectedCard(card.id, 'main')}
                                                                aria-label="Remove card"
                                                            />
                                                            <Text fontSize="xs" textAlign="center" mt={1} noOfLines={2}>
                                                                {card.name}
                                                            </Text>
                                                            <HStack spacing={1} mt={2} justify="center">
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'main', card.quantity - 1)}
                                                                    isDisabled={card.quantity <= 1}
                                                                >
                                                                    -
                                                                </Button>
                                                                <Badge colorScheme="blue" fontSize="xs">
                                                                    {card.quantity}
                                                                </Badge>
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'main', card.quantity + 1)}
                                                                    isDisabled={card.quantity >= 3}
                                                                >
                                                                    +
                                                                </Button>
                                                            </HStack>
                                                        </Box>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        )}

                                        {/* Extra Deck Cards */}
                                        {getCardsByCategory('extra').length > 0 && (
                                            <Box mb={3}>
                                                <Text fontSize="sm" fontWeight="semibold" color="orange.600" mb={2}>
                                                    Extra Deck ({getCardsByCategory('extra').reduce((sum, card) => sum + card.quantity, 0)} cards)
                                                </Text>
                                                <Grid templateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2} maxH="150px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md" borderColor="orange.200">
                                                    {getCardsByCategory('extra').map(card => (
                                                        <Box key={`${card.id}-extra`} position="relative" borderWidth="1px" borderRadius="md" p={2}>
                                                            <Image
                                                                src={`/images/cards/${card.id}.jpg`}
                                                                alt={card.name}
                                                                w="100%"
                                                                borderRadius="md"
                                                                fallbackSrc="https://via.placeholder.com/100x146?text=Card"
                                                            />
                                                            <IconButton
                                                                icon={<DeleteIcon />}
                                                                size="xs"
                                                                colorScheme="red"
                                                                position="absolute"
                                                                top="2px"
                                                                right="2px"
                                                                onClick={() => removeSelectedCard(card.id, 'extra')}
                                                                aria-label="Remove card"
                                                            />
                                                            <Text fontSize="xs" textAlign="center" mt={1} noOfLines={2}>
                                                                {card.name}
                                                            </Text>
                                                            <HStack spacing={1} mt={2} justify="center">
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'extra', card.quantity - 1)}
                                                                    isDisabled={card.quantity <= 1}
                                                                >
                                                                    -
                                                                </Button>
                                                                <Badge colorScheme="orange" fontSize="xs">
                                                                    {card.quantity}
                                                                </Badge>
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'extra', card.quantity + 1)}
                                                                    isDisabled={card.quantity >= 3}
                                                                >
                                                                    +
                                                                </Button>
                                                            </HStack>
                                                        </Box>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        )}

                                        {/* Side Deck Cards */}
                                        {getCardsByCategory('side').length > 0 && (
                                            <Box mb={3}>
                                                <Text fontSize="sm" fontWeight="semibold" color="purple.600" mb={2}>
                                                    Side Deck ({getCardsByCategory('side').reduce((sum, card) => sum + card.quantity, 0)} cards)
                                                </Text>
                                                <Grid templateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2} maxH="150px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md" borderColor="purple.200">
                                                    {getCardsByCategory('side').map(card => (
                                                        <Box key={`${card.id}-side`} position="relative" borderWidth="1px" borderRadius="md" p={2}>
                                                            <Image
                                                                src={`/images/cards/${card.id}.jpg`}
                                                                alt={card.name}
                                                                w="100%"
                                                                borderRadius="md"
                                                                fallbackSrc="https://via.placeholder.com/100x146?text=Card"
                                                            />
                                                            <IconButton
                                                                icon={<DeleteIcon />}
                                                                size="xs"
                                                                colorScheme="red"
                                                                position="absolute"
                                                                top="2px"
                                                                right="2px"
                                                                onClick={() => removeSelectedCard(card.id, 'side')}
                                                                aria-label="Remove card"
                                                            />
                                                            <Text fontSize="xs" textAlign="center" mt={1} noOfLines={2}>
                                                                {card.name}
                                                            </Text>
                                                            <HStack spacing={1} mt={2} justify="center">
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'side', card.quantity - 1)}
                                                                    isDisabled={card.quantity <= 1}
                                                                >
                                                                    -
                                                                </Button>
                                                                <Badge colorScheme="purple" fontSize="xs">
                                                                    {card.quantity}
                                                                </Badge>
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'side', card.quantity + 1)}
                                                                    isDisabled={card.quantity >= 3}
                                                                >
                                                                    +
                                                                </Button>
                                                            </HStack>
                                                        </Box>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        )}
                                    </Box>
                                )}

                                {/* Search Results */}
                                {cardSearch && (
                                    <Box>
                                        <Text fontWeight="semibold" mb={2}>Search Results:</Text>
                                        <Grid templateColumns="repeat(auto-fill, minmax(100px, 1fr))" gap={2} maxH="300px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md">
                                            {filteredCards.map(card => {
                                                const quantity = getCardQuantity(card.id);
                                                return (
                                                    <Box
                                                        key={card.id}
                                                        position="relative"
                                                        cursor="pointer"
                                                        onClick={() => toggleCardSelection(card.id)}
                                                        borderWidth="2px"
                                                        borderColor={quantity > 0 ? "blue.500" : "transparent"}
                                                        borderRadius="md"
                                                        p={1}
                                                    >
                                                        <Image
                                                            src={`/images/cards/${card.id}.jpg`}
                                                            alt={card.name}
                                                            w="100%"
                                                            borderRadius="md"
                                                            fallbackSrc="https://via.placeholder.com/100x146?text=Card"
                                                        />
                                                        {quantity > 0 && (
                                                            <Box
                                                                position="absolute"
                                                                top="2px"
                                                                right="2px"
                                                                bg="blue.500"
                                                                color="white"
                                                                borderRadius="full"
                                                                w="24px"
                                                                h="24px"
                                                                display="flex"
                                                                alignItems="center"
                                                                justifyContent="center"
                                                                fontSize="sm"
                                                                fontWeight="bold"
                                                            >
                                                                {quantity}
                                                            </Box>
                                                        )}
                                                        <Text fontSize="xs" textAlign="center" mt={1} noOfLines={2}>
                                                            {card.name}
                                                        </Text>
                                                    </Box>
                                                );
                                            })}
                                        </Grid>
                                        {filteredCards.length === 20 && (
                                            <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
                                                Showing first 20 results. Refine your search for more specific results.
                                            </Text>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => { resetDeckForm(); onCreateClose(); }}>
                            Cancel
                        </Button>
                        <Button colorScheme="blue" onClick={handleCreateDeck}>
                            Create Deck ({getTotalCardCount()} cards)
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* View Deck Modal */}
            <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{selectedDeck?.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            {selectedDeck?.description && (
                                <Text color="gray.600">{selectedDeck.description}</Text>
                            )}

                            <HStack>
                                <Badge colorScheme="blue">
                                    {deckCards.reduce((sum, card) => sum + (card.quantity || 1), 0)} cards
                                </Badge>
                                <Badge colorScheme="gray">
                                    Created: {selectedDeck && new Date(selectedDeck.createdAt).toLocaleDateString()}
                                </Badge>
                            </HStack>

                            {deckCards.length === 0 ? (
                                <Text textAlign="center" color="gray.500" py={8}>
                                    This deck is empty. Add some cards to get started!
                                </Text>
                            ) : (
                                <TableContainer maxH="400px" overflowY="auto">
                                    <Table variant="simple" size="sm">
                                        <Thead position="sticky" top={0} bg="white" zIndex={1}>
                                            <Tr>
                                                <Th width="80px">Image</Th>
                                                <Th>Card Name</Th>
                                                <Th width="100px">Category</Th>
                                                <Th width="100px" textAlign="center">Owned - Needed</Th>
                                                <Th width="80px" textAlign="center">Quantity</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {deckCards.map(card => (
                                                <Tr key={card.id}>
                                                    <Td>
                                                        <Image
                                                            src={`/images/cards/${card.id}.jpg`}
                                                            alt={card.name}
                                                            w="60px"
                                                            h="auto"
                                                            borderRadius="md"
                                                            fallbackSrc="https://via.placeholder.com/60x88?text=No+Image"
                                                        />
                                                    </Td>
                                                    <Td>
                                                        <Text fontWeight="semibold" fontSize="sm">
                                                            {card.name || 'Unknown Card'}
                                                        </Text>
                                                    </Td>
                                                    <Td>
                                                        <Badge
                                                            colorScheme={
                                                                card.category === 'side' ? 'purple' :
                                                                    card.category === 'extra' ? 'orange' : 'blue'
                                                            }
                                                            size="sm"
                                                        >
                                                            {card.category === 'side' ? 'Side' :
                                                                card.category === 'extra' ? 'Extra' : 'Main'}
                                                        </Badge>
                                                    </Td>
                                                    {/* <Td>
                                                        {card.type && (
                                                            <Badge colorScheme="blue" size="sm">
                                                                {card.type}
                                                            </Badge>
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        {card.attribute && (
                                                            <Badge colorScheme="purple" size="sm">
                                                                {card.attribute}
                                                            </Badge>
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        {card.level && (
                                                            <Text fontSize="sm">
                                                                ⭐ {card.level}
                                                            </Text>
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        {(card.atk !== undefined || card.def !== undefined) && (
                                                            <VStack spacing={0} align="start">
                                                                <Text fontSize="xs">
                                                                    ATK: {card.atk ?? '?'}
                                                                </Text>
                                                                <Text fontSize="xs">
                                                                    DEF: {card.def ?? '?'}
                                                                </Text>
                                                            </VStack>
                                                        )}
                                                    </Td> */}
                                                    <Td textAlign="center">
                                                        {(() => {
                                                            const owned = card.ownedQuantity || 0;
                                                            const needed = card.quantity || 1;
                                                            const diff = owned - needed;
                                                            return diff > 0 ? (
                                                                <Text fontWeight="semibold" color="inherit">
                                                                    {diff}
                                                                </Text>
                                                            ) : null;
                                                        })()}
                                                    </Td>
                                                    <Td textAlign="center">
                                                        <Badge
                                                            colorScheme="orange"
                                                            fontSize="md"
                                                            px={2}
                                                            py={1}
                                                        >
                                                            {card.quantity || 1}
                                                        </Badge>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onViewClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Edit Deck Modal */}
            <Modal isOpen={isEditOpen} onClose={() => { resetDeckForm(); onEditClose(); }} size="xl">
                <ModalOverlay />
                <ModalContent maxH="90vh">
                    <ModalHeader>Edit Deck</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody overflowY="auto">
                        <VStack spacing={4} align="stretch">
                            <Input
                                placeholder="Deck name"
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                            />
                            <Textarea
                                placeholder="Deck description (optional)"
                                value={newDeckDescription}
                                onChange={(e) => setNewDeckDescription(e.target.value)}
                                rows={3}
                            />

                            {/* Card Selection Section */}
                            <Box>
                                <Heading size="sm" mb={2}>Deck Cards</Heading>
                                <Input
                                    placeholder="Search cards to add..."
                                    value={cardSearch}
                                    onChange={(e) => setCardSearch(e.target.value)}
                                    mb={3}
                                />

                                {/* Category Selection */}
                                <Box mb={3}>
                                    <Text fontWeight="semibold" mb={2}>Add to:</Text>
                                    <RadioGroup value={selectedCategory} onChange={setSelectedCategory}>
                                        <HStack spacing={4}>
                                            <Radio value="main">Main Deck</Radio>
                                            <Radio value="extra">Extra Deck</Radio>
                                            <Radio value="side">Side Deck</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Box>

                                {/* Selected Cards */}
                                {selectedCards.length > 0 && (
                                    <Box mb={4}>
                                        <Text fontWeight="semibold" mb={2}>Current Cards ({getTotalCardCount()}):</Text>

                                        {/* Main Deck Cards */}
                                        {getCardsByCategory('main').length > 0 && (
                                            <Box mb={3}>
                                                <Text fontSize="sm" fontWeight="semibold" color="blue.600" mb={2}>
                                                    Main Deck ({getCardsByCategory('main').reduce((sum, card) => sum + card.quantity, 0)} cards)
                                                </Text>
                                                <Grid templateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2} maxH="150px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md" borderColor="blue.200">
                                                    {getCardsByCategory('main').map(card => (
                                                        <Box key={`${card.id}-main`} position="relative" borderWidth="1px" borderRadius="md" p={2}>
                                                            <Image
                                                                src={`/images/cards/${card.id}.jpg`}
                                                                alt={card.name}
                                                                w="100%"
                                                                borderRadius="md"
                                                                fallbackSrc="https://via.placeholder.com/100x146?text=Card"
                                                            />
                                                            <IconButton
                                                                icon={<DeleteIcon />}
                                                                size="xs"
                                                                colorScheme="red"
                                                                position="absolute"
                                                                top="2px"
                                                                right="2px"
                                                                onClick={() => removeSelectedCard(card.id, 'main')}
                                                                aria-label="Remove card"
                                                            />
                                                            <Text fontSize="xs" textAlign="center" mt={1} noOfLines={2}>
                                                                {card.name}
                                                            </Text>
                                                            <HStack spacing={1} mt={2} justify="center">
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'main', card.quantity - 1)}
                                                                    isDisabled={card.quantity <= 1}
                                                                >
                                                                    -
                                                                </Button>
                                                                <Badge colorScheme="blue" fontSize="xs">
                                                                    {card.quantity}
                                                                </Badge>
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'main', card.quantity + 1)}
                                                                    isDisabled={card.quantity >= 3}
                                                                >
                                                                    +
                                                                </Button>
                                                            </HStack>
                                                        </Box>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        )}

                                        {/* Extra Deck Cards */}
                                        {getCardsByCategory('extra').length > 0 && (
                                            <Box mb={3}>
                                                <Text fontSize="sm" fontWeight="semibold" color="orange.600" mb={2}>
                                                    Extra Deck ({getCardsByCategory('extra').reduce((sum, card) => sum + card.quantity, 0)} cards)
                                                </Text>
                                                <Grid templateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2} maxH="150px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md" borderColor="orange.200">
                                                    {getCardsByCategory('extra').map(card => (
                                                        <Box key={`${card.id}-extra`} position="relative" borderWidth="1px" borderRadius="md" p={2}>
                                                            <Image
                                                                src={`/images/cards/${card.id}.jpg`}
                                                                alt={card.name}
                                                                w="100%"
                                                                borderRadius="md"
                                                                fallbackSrc="https://via.placeholder.com/100x146?text=Card"
                                                            />
                                                            <IconButton
                                                                icon={<DeleteIcon />}
                                                                size="xs"
                                                                colorScheme="red"
                                                                position="absolute"
                                                                top="2px"
                                                                right="2px"
                                                                onClick={() => removeSelectedCard(card.id, 'extra')}
                                                                aria-label="Remove card"
                                                            />
                                                            <Text fontSize="xs" textAlign="center" mt={1} noOfLines={2}>
                                                                {card.name}
                                                            </Text>
                                                            <HStack spacing={1} mt={2} justify="center">
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'extra', card.quantity - 1)}
                                                                    isDisabled={card.quantity <= 1}
                                                                >
                                                                    -
                                                                </Button>
                                                                <Badge colorScheme="orange" fontSize="xs">
                                                                    {card.quantity}
                                                                </Badge>
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'extra', card.quantity + 1)}
                                                                    isDisabled={card.quantity >= 3}
                                                                >
                                                                    +
                                                                </Button>
                                                            </HStack>
                                                        </Box>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        )}

                                        {/* Side Deck Cards */}
                                        {getCardsByCategory('side').length > 0 && (
                                            <Box mb={3}>
                                                <Text fontSize="sm" fontWeight="semibold" color="purple.600" mb={2}>
                                                    Side Deck ({getCardsByCategory('side').reduce((sum, card) => sum + card.quantity, 0)} cards)
                                                </Text>
                                                <Grid templateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2} maxH="150px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md" borderColor="purple.200">
                                                    {getCardsByCategory('side').map(card => (
                                                        <Box key={`${card.id}-side`} position="relative" borderWidth="1px" borderRadius="md" p={2}>
                                                            <Image
                                                                src={`/images/cards/${card.id}.jpg`}
                                                                alt={card.name}
                                                                w="100%"
                                                                borderRadius="md"
                                                                fallbackSrc="https://via.placeholder.com/100x146?text=Card"
                                                            />
                                                            <IconButton
                                                                icon={<DeleteIcon />}
                                                                size="xs"
                                                                colorScheme="red"
                                                                position="absolute"
                                                                top="2px"
                                                                right="2px"
                                                                onClick={() => removeSelectedCard(card.id, 'side')}
                                                                aria-label="Remove card"
                                                            />
                                                            <Text fontSize="xs" textAlign="center" mt={1} noOfLines={2}>
                                                                {card.name}
                                                            </Text>
                                                            <HStack spacing={1} mt={2} justify="center">
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'side', card.quantity - 1)}
                                                                    isDisabled={card.quantity <= 1}
                                                                >
                                                                    -
                                                                </Button>
                                                                <Badge colorScheme="purple" fontSize="xs">
                                                                    {card.quantity}
                                                                </Badge>
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => updateCardQuantity(card.id, 'side', card.quantity + 1)}
                                                                    isDisabled={card.quantity >= 3}
                                                                >
                                                                    +
                                                                </Button>
                                                            </HStack>
                                                        </Box>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        )}
                                    </Box>
                                )}

                                {/* Search Results */}
                                {cardSearch && (
                                    <Box>
                                        <Text fontWeight="semibold" mb={2}>Search Results:</Text>
                                        <Grid templateColumns="repeat(auto-fill, minmax(100px, 1fr))" gap={2} maxH="300px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md">
                                            {filteredCards.map(card => {
                                                const quantity = getCardQuantity(card.id);
                                                return (
                                                    <Box
                                                        key={card.id}
                                                        position="relative"
                                                        cursor="pointer"
                                                        onClick={() => toggleCardSelection(card.id)}
                                                        borderWidth="2px"
                                                        borderColor={quantity > 0 ? "blue.500" : "transparent"}
                                                        borderRadius="md"
                                                        p={1}
                                                    >
                                                        <Image
                                                            src={`/images/cards/${card.id}.jpg`}
                                                            alt={card.name}
                                                            w="100%"
                                                            borderRadius="md"
                                                            fallbackSrc="https://via.placeholder.com/100x146?text=Card"
                                                        />
                                                        {quantity > 0 && (
                                                            <Box
                                                                position="absolute"
                                                                top="2px"
                                                                right="2px"
                                                                bg="blue.500"
                                                                color="white"
                                                                borderRadius="full"
                                                                w="24px"
                                                                h="24px"
                                                                display="flex"
                                                                alignItems="center"
                                                                justifyContent="center"
                                                                fontSize="sm"
                                                                fontWeight="bold"
                                                            >
                                                                {quantity}
                                                            </Box>
                                                        )}
                                                        <Text fontSize="xs" textAlign="center" mt={1} noOfLines={2}>
                                                            {card.name}
                                                        </Text>
                                                    </Box>
                                                );
                                            })}
                                        </Grid>
                                        {filteredCards.length === 20 && (
                                            <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
                                                Showing first 20 results. Refine your search for more specific results.
                                            </Text>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => { resetDeckForm(); onEditClose(); }}>
                            Cancel
                        </Button>
                        <Button colorScheme="blue" onClick={handleUpdateDeck}>
                            Update Deck ({getTotalCardCount()} cards)
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Deck
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete "{deletingDeck?.name}"? This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button onClick={onDeleteClose}>Cancel</Button>
                            <Button colorScheme="red" onClick={handleDeleteDeck} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </VStack>
    );
}

export default DecksPage;