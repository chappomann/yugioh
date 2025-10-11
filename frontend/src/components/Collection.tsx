import { useState, useEffect, useRef } from 'react'
import {
    Paper,
    Typography,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    CircularProgress,
    Alert,
    Pagination,
    Grid,
    Fade,
    Portal,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
import { cardsApi } from '../services/api'
import { Card } from '../types'
import CardImage from './CardImage'

const Collection = () => {
    const [collection, setCollection] = useState<Card[]>([])
    const [allCards, setAllCards] = useState<Card[]>([]) // Store all collection cards for filtering
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Search and pagination states
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const itemsPerPage = 20

    // Sort states
    const [sortBy, setSortBy] = useState<'name' | 'type' | 'quantity' | 'value'>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingCard, setEditingCard] = useState<Card | null>(null)
    const [editQuantity, setEditQuantity] = useState(1)

    // Hover overlay state
    const [hoveredCard, setHoveredCard] = useState<Card | null>(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const overlayRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchCollection()
    }, [])

    useEffect(() => {
        filterAndPaginateCollection()
    }, [allCards, search, page, sortBy, sortOrder])

    const fetchCollection = async () => {
        try {
            setLoading(true)
            // Get all cards and filter for those with quantity > 0
            const response = await cardsApi.getAll({ limit: 10000 }) // Get a large number to ensure we get all cards
            if (response.data.success) {
                // Filter cards that have quantity > 0
                const collectionCards = response.data.cards.filter((card: Card) => card.quantity && card.quantity > 0)
                setAllCards(collectionCards) // Store all collection cards
            }
        } catch (err) {
            setError('Failed to load collection')
            console.error('Error fetching collection:', err)
        } finally {
            setLoading(false)
        }
    }

    const filterAndPaginateCollection = () => {
        let filteredCards = allCards

        // Apply search filter
        if (search) {
            filteredCards = filteredCards.filter(card =>
                card.name?.toLowerCase().includes(search.toLowerCase()) ||
                card.type?.toLowerCase().includes(search.toLowerCase()) ||
                card.archetype?.toLowerCase().includes(search.toLowerCase())
            )
        }

        // Apply sorting
        filteredCards = filteredCards.sort((a, b) => {
            let comparison = 0

            switch (sortBy) {
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '')
                    break
                case 'type':
                    comparison = (a.type || '').localeCompare(b.type || '')
                    break
                case 'quantity':
                    comparison = (a.quantity || 0) - (b.quantity || 0)
                    break
                case 'value':
                    const aValue = a.price ? a.price * (a.quantity || 1) : 0
                    const bValue = b.price ? b.price * (b.quantity || 1) : 0
                    comparison = aValue - bValue
                    break
                default:
                    comparison = 0
            }

            return sortOrder === 'desc' ? -comparison : comparison
        })

        // Check if current page is beyond the available pages for filtered results
        const totalFilteredPages = Math.ceil(filteredCards.length / itemsPerPage)
        if (page > totalFilteredPages && totalFilteredPages > 0) {
            setPage(1) // Reset to page 1 if current page is beyond available pages
            return // Exit early, useEffect will trigger again with page 1
        }

        // Apply pagination
        const startIndex = (page - 1) * itemsPerPage
        const paginatedCards = filteredCards.slice(startIndex, startIndex + itemsPerPage)

        setCollection(paginatedCards)
    }

    const getFilteredCardsCount = () => {
        let filteredCards = allCards
        if (search) {
            filteredCards = filteredCards.filter(card =>
                card.name?.toLowerCase().includes(search.toLowerCase()) ||
                card.type?.toLowerCase().includes(search.toLowerCase()) ||
                card.archetype?.toLowerCase().includes(search.toLowerCase())
            )
        }
        return filteredCards.length
    }

    // Hover handlers for card image overlay
    const handleMouseEnter = (card: Card, event: React.MouseEvent) => {
        setHoveredCard(card)
        setMousePosition({ x: event.clientX, y: event.clientY })
    }

    const handleMouseMove = (event: React.MouseEvent) => {
        setMousePosition({ x: event.clientX, y: event.clientY })
    }

    const handleMouseLeave = () => {
        setHoveredCard(null)
    }

    const handleEditItem = (card: Card) => {
        setEditingCard(card)
        setEditQuantity(card.quantity || 1)
        setEditDialogOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!editingCard?.id) return

        try {
            setSaving(true)
            setError(null)
            await cardsApi.updateQuantity(editingCard.id, editQuantity)
            setEditDialogOpen(false)
            setEditingCard(null)
            setSuccessMessage('Card quantity updated successfully')
            fetchCollection() // Refresh the collection data
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error updating card quantity:', err)
            setError('Failed to update card quantity')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteItem = async (cardId: string) => {
        if (!confirm('Are you sure you want to remove this card from your collection?')) {
            return
        }

        try {
            setError(null)
            await cardsApi.updateQuantity(parseInt(cardId), 0)
            setSuccessMessage('Card removed from collection successfully')
            fetchCollection() // Refresh the collection data
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error removing card from collection:', err)
            setError('Failed to remove card from collection')
        }
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={60} />
            </Box>
        )
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>
    }

    return (
        <Box>
            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            )}

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    My Collection ({allCards.length} unique cards, {allCards.reduce((total, card) => total + (card.quantity || 0), 0)} total cards)
                </Typography>
            </Box>

            {/* Search and Sort */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Search collection"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1) // Reset to first page when searching
                            }}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Sort by</InputLabel>
                            <Select
                                value={sortBy}
                                label="Sort by"
                                onChange={(e) => setSortBy(e.target.value as 'name' | 'type' | 'quantity' | 'value')}
                            >
                                <MenuItem value="name">Card Name</MenuItem>
                                <MenuItem value="type">Type</MenuItem>
                                <MenuItem value="quantity">Quantity</MenuItem>
                                <MenuItem value="value">Value</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Order</InputLabel>
                            <Select
                                value={sortOrder}
                                label="Order"
                                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                            >
                                <MenuItem value="asc">Ascending</MenuItem>
                                <MenuItem value="desc">Descending</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                            {getFilteredCardsCount() > 0 ? (
                                <>Showing {Math.min((page - 1) * itemsPerPage + 1, getFilteredCardsCount())}-{Math.min(page * itemsPerPage, getFilteredCardsCount())} of {getFilteredCardsCount()} cards</>
                            ) : (
                                <>No cards found</>
                            )}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Card</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {collection.map((card) => (
                            <TableRow
                                key={card.id}
                                onMouseEnter={(e) => handleMouseEnter(card, e)}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                            >
                                <TableCell>
                                    <Box sx={{ position: 'relative' }}>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight="bold"
                                            sx={{
                                                textDecoration: 'underline',
                                                textDecorationStyle: 'dotted',
                                                textDecorationColor: 'transparent',
                                                '&:hover': {
                                                    textDecorationColor: 'primary.main'
                                                }
                                            }}
                                        >
                                            {card.name}
                                        </Typography>
                                        {card.archetype && (
                                            <Typography variant="caption" color="text.secondary">
                                                {card.archetype}
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {card.type && (
                                        <Chip label={card.type} size="small" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="h6">{card.quantity}</Typography>
                                </TableCell>
                                <TableCell>
                                    {card.price ? (
                                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                                            ${(card.price * (card.quantity || 1)).toFixed(2)}
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            N/A
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditItem(card)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => card.id && handleDeleteItem(card.id.toString())}
                                        disabled={!card.id}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {getFilteredCardsCount() > itemsPerPage && (
                <Box
                    display="flex"
                    justifyContent="center"
                    mt={4}
                    sx={{
                        width: '100%',
                        overflowX: 'auto',
                        pb: 2,
                        maxWidth: '100vw',
                        '::-webkit-scrollbar': { display: 'none' },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                    }}
                >
                    <Box sx={{ minWidth: 'max-content', px: 1 }}>
                        <Pagination
                            count={Math.ceil(getFilteredCardsCount() / itemsPerPage)}
                            page={page}
                            onChange={(_, newPage) => setPage(newPage)}
                            color="primary"
                            size={window.innerWidth < 600 ? 'medium' : 'large'}
                            sx={{ mx: 'auto', minWidth: 0 }}
                        />
                    </Box>
                </Box>
            )}

            {collection.length === 0 && allCards.length > 0 && search && (
                <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No cards found matching "{search}"
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Try a different search term
                    </Typography>
                    <Button variant="outlined" onClick={() => setSearch('')} sx={{ mt: 2 }}>
                        Clear Search
                    </Button>
                </Box>
            )}

            {allCards.length === 0 && (
                <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Your collection is empty
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Start building your collection by browsing cards
                    </Typography>
                    <Button variant="contained" href="/cards" sx={{ mt: 2 }}>
                        Browse Cards
                    </Button>
                </Box>
            )}

            {/* Edit Collection Item Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>Edit Quantity</DialogTitle>
                <DialogContent>
                    <Typography variant="h6" gutterBottom>
                        {editingCard?.name}
                    </Typography>

                    <TextField
                        fullWidth
                        type="number"
                        label="Quantity"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                        sx={{ mb: 2, mt: 1 }}
                        inputProps={{ min: 0 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Hover Card Image Overlay */}
            {hoveredCard && (
                <Portal>
                    <Fade in={true}>
                        <Box
                            ref={overlayRef}
                            sx={{
                                position: 'fixed',
                                left: mousePosition.x + 20,
                                top: mousePosition.y - 100,
                                zIndex: 9999,
                                pointerEvents: 'none',
                                borderRadius: 2,
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                transform: 'translateY(-50%)',
                                maxWidth: '200px',
                                opacity: 0.9
                            }}
                        >
                            <CardImage
                                cardId={hoveredCard.id?.toString() || ''}
                                name={hoveredCard.name || ''}
                                imageUrl={hoveredCard.image_url}
                                height={280}
                                sx={{
                                    width: '200px',
                                    height: '280px',
                                    objectFit: 'contain'
                                }}
                            />
                        </Box>
                    </Fade>
                </Portal>
            )}
        </Box>
    )
}

export default Collection
