import React, { useState, useEffect } from 'react'
import {
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    CardActions,
    Chip,
    Pagination,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    Skeleton
} from '@mui/material'
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
import { cardsApi } from '../services/api'
import { Card as CardType, FilterOptions } from '../types'
import { useApi } from '../hooks/useApi'
import CardImage from './CardImage'

const CardList: React.FC = () => {
    const [cards, setCards] = useState<CardType[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<FilterOptions | null>(null)

    // Search and filter states
    const [search, setSearch] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [selectedRace, setSelectedRace] = useState('')
    const [selectedAttribute, setSelectedAttribute] = useState('')
    const [selectedArchetype, setSelectedArchetype] = useState('')
    const [selectedLevel, setSelectedLevel] = useState('')

    // Pagination
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const limit = 20

    // Add to collection dialog
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
    const [quantity, setQuantity] = useState(1)
    const [condition, setCondition] = useState('Near Mint')

    // Card detail modal
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [detailCard, setDetailCard] = useState<CardType | null>(null)

    useEffect(() => {
        fetchFilters()
    }, [])

    useEffect(() => {
        fetchCards()
    }, [page, search, selectedType, selectedRace, selectedAttribute, selectedArchetype, selectedLevel])

    const fetchFilters = async () => {
        try {
            const response = await cardsApi.getFilters()
            if (response.data.success) {
                setFilters(response.data.filters)
            }
        } catch (err) {
            console.error('Error fetching filters:', err)
        }
    }

    const fetchCards = async () => {
        try {
            setLoading(true)
            const params = {
                limit,
                offset: (page - 1) * limit,
                ...(search && { search }),
                ...(selectedType && { type: selectedType }),
                ...(selectedRace && { race: selectedRace }),
                ...(selectedAttribute && { attribute: selectedAttribute }),
                ...(selectedArchetype && { archetype: selectedArchetype }),
                ...(selectedLevel && { level: selectedLevel }),
            }

            const response = await cardsApi.getAll(params)
            if (response.data.success) {
                setCards(response.data.cards)
                // Use the total count from the API response, or fall back to calculating from cards length
                const totalCount = response.data.total || response.data.totalCount || response.data.count
                if (totalCount !== undefined) {
                    setTotalPages(Math.ceil(totalCount / limit))
                } else {
                    // If no total is provided, estimate based on whether we have a full page
                    const hasMorePages = response.data.cards.length === limit
                    if (hasMorePages) {
                        // If we have a full page, there might be more pages
                        setTotalPages(Math.max(page + 1, totalPages))
                    } else {
                        // If we have less than a full page, this is likely the last page
                        setTotalPages(page)
                    }
                }
            }
        } catch (err) {
            setError('Failed to load cards')
            console.error('Error fetching cards:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCollection = async () => {
        if (!selectedCard?.id) return

        try {
            // Get current quantity and add to it
            const currentQuantity = selectedCard.quantity || 0
            const newQuantity = currentQuantity + quantity

            await cardsApi.updateQuantity(selectedCard.id, newQuantity)

            setAddDialogOpen(false)
            setSelectedCard(null)
            setQuantity(1)
            setCondition('Near Mint')

            // Refresh the cards list to show updated quantity
            fetchCards()
        } catch (err) {
            console.error('Error adding to collection:', err)
        }
    }

    const handleCardClick = (card: CardType) => {
        setDetailCard(card)
        setDetailModalOpen(true)
    }

    const clearFilters = () => {
        setSearch('')
        setSelectedType('')
        setSelectedRace('')
        setSelectedAttribute('')
        setSelectedArchetype('')
        setSelectedLevel('')
        setPage(1)
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Card Database
            </Typography>

            {/* Search and Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Search cards"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1) // Reset to page 1 when searching
                            }}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={1.5}>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={selectedType}
                                label="Type"
                                onChange={(e) => {
                                    setSelectedType(e.target.value)
                                    setPage(1) // Reset to page 1 when filter changes
                                }}
                            >
                                <MenuItem value="">All Types</MenuItem>
                                {filters?.types?.map((type) => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={1.5}>
                        <FormControl fullWidth>
                            <InputLabel>Race</InputLabel>
                            <Select
                                value={selectedRace}
                                label="Race"
                                onChange={(e) => {
                                    setSelectedRace(e.target.value)
                                    setPage(1) // Reset to page 1 when filter changes
                                }}
                            >
                                <MenuItem value="">All Races</MenuItem>
                                {filters?.races?.map((race) => (
                                    <MenuItem key={race} value={race}>{race}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={1.5}>
                        <FormControl fullWidth>
                            <InputLabel>Attribute</InputLabel>
                            <Select
                                value={selectedAttribute}
                                label="Attribute"
                                onChange={(e) => {
                                    setSelectedAttribute(e.target.value)
                                    setPage(1) // Reset to page 1 when filter changes
                                }}
                            >
                                <MenuItem value="">All Attributes</MenuItem>
                                {filters?.attributes?.map((attr) => (
                                    <MenuItem key={attr} value={attr}>{attr}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={1.5}>
                        <FormControl fullWidth>
                            <InputLabel>Level</InputLabel>
                            <Select
                                value={selectedLevel}
                                label="Level"
                                onChange={(e) => {
                                    setSelectedLevel(e.target.value)
                                    setPage(1) // Reset to page 1 when filter changes
                                }}
                            >
                                <MenuItem value="">All Levels</MenuItem>
                                {filters?.levels?.map((level) => (
                                    <MenuItem key={level} value={level.toString()}>{level}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <Autocomplete
                            options={filters?.archetypes || []}
                            value={selectedArchetype}
                            onChange={(_, newValue) => {
                                setSelectedArchetype(newValue || '')
                                setPage(1) // Reset to page 1 when filter changes
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Archetype" fullWidth />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} md={1}>
                        <Button
                            variant="outlined"
                            onClick={clearFilters}
                            fullWidth
                        >
                            Clear
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Loading */}
            {loading && (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            )}

            {/* Cards Grid */}
            <Grid container spacing={2}>
                {cards.map((card) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={card.card_id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: (theme) => theme.shadows[8]
                                }
                            }}
                            onClick={() => handleCardClick(card)}
                        >
                            <CardImage
                                cardId={card.card_id}
                                name={card.name}
                                imageUrl={card.image_url}
                                height={200}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" component="h2" gutterBottom noWrap>
                                    {card.name}
                                </Typography>

                                <Box mb={1}>
                                    {card.type && <Chip label={card.type} size="small" sx={{ mr: 0.5, mb: 0.5 }} />}
                                    {card.attribute && <Chip label={card.attribute} size="small" color="primary" sx={{ mr: 0.5, mb: 0.5 }} />}
                                </Box>

                                {card.atk !== null && (
                                    <Typography variant="body2" color="text.secondary">
                                        ATK: {card.atk} / DEF: {card.def}
                                    </Typography>
                                )}

                                {card.level && (
                                    <Typography variant="body2" color="text.secondary">
                                        Level: {card.level}
                                    </Typography>
                                )}

                                {card.price && (
                                    <Typography variant="body2" color="primary" fontWeight="bold">
                                        ${card.price.toFixed(2)}
                                    </Typography>
                                )}

                                {card.quantity !== undefined && (
                                    <Typography
                                        variant="body2"
                                        color={card.quantity > 0 ? "success.main" : "error.light"}
                                        fontWeight="bold"
                                    >
                                        In Collection: {card.quantity}
                                    </Typography>
                                )}
                            </CardContent>

                            <CardActions>
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={(e) => {
                                        e.stopPropagation() // Prevent triggering card click
                                        setSelectedCard(card)
                                        setAddDialogOpen(true)
                                    }}
                                >
                                    Add to Collection
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Pagination */}
            <Box
                display="flex"
                justifyContent="center"
                mt={4}
                sx={{ width: '100%', overflowX: 'auto', pb: 2 }}
            >
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                    size="large"
                    sx={{ mx: 'auto', minWidth: 0 }}
                />
            </Box>

            {/* Card Detail Modal */}
            <Dialog
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: '70vh',
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogContent sx={{ p: 4 }}>
                    <Grid container spacing={4} sx={{ height: '100%' }}>
                        {/* Left side - Card Image */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                height: '100%'
                            }}>
                                <CardImage
                                    cardId={detailCard?.card_id || ''}
                                    name={detailCard?.name || ''}
                                    imageUrl={detailCard?.image_url}
                                    height="auto"
                                    sx={{
                                        maxWidth: '100%',
                                        maxHeight: '600px',
                                        objectFit: 'contain'
                                    }}
                                />
                            </Box>
                        </Grid>

                        {/* Right side - Card Details */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {/* Card Type and Basic Info */}
                                <Box mb={2}>
                                    <Box mb={1} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {detailCard?.type && (
                                            <Chip label={detailCard.type} variant="outlined" />
                                        )}
                                        {detailCard?.race && (
                                            <Chip label={detailCard.race} variant="outlined" color="secondary" />
                                        )}
                                        {detailCard?.attribute && (
                                            <Chip label={detailCard.attribute} variant="outlined" color="primary" />
                                        )}
                                        {detailCard?.archetype && (
                                            <Chip label={detailCard.archetype} variant="outlined" color="success" />
                                        )}
                                    </Box>
                                </Box>

                                {/* Stats */}
                                <Box mb={2}>
                                    <Grid container spacing={2}>
                                        {detailCard?.level && (
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Level
                                                </Typography>
                                                <Typography variant="h6">
                                                    {detailCard.level}
                                                </Typography>
                                            </Grid>
                                        )}
                                        {detailCard?.atk !== null && detailCard?.atk !== undefined && (
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    ATK
                                                </Typography>
                                                <Typography variant="h6">
                                                    {detailCard.atk}
                                                </Typography>
                                            </Grid>
                                        )}
                                        {detailCard?.def !== null && detailCard?.def !== undefined && (
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    DEF
                                                </Typography>
                                                <Typography variant="h6">
                                                    {detailCard.def}
                                                </Typography>
                                            </Grid>
                                        )}
                                        {detailCard?.price && (
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Price
                                                </Typography>
                                                <Typography variant="h6" color="primary.main">
                                                    ${detailCard.price.toFixed(2)}
                                                </Typography>
                                            </Grid>
                                        )}
                                        {detailCard?.quantity !== undefined && (
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Quantity in Collection
                                                </Typography>
                                                <Typography
                                                    variant="h6"
                                                    color={detailCard.quantity > 0 ? "success.main" : "error.light"}
                                                >
                                                    {detailCard.quantity}
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Box>

                                {/* Description */}
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Description
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            lineHeight: 1.6,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            pr: 1
                                        }}
                                    >
                                        {detailCard?.description || 'No description available.'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 4, pt: 2 }}>
                    <Button
                        onClick={() => {
                            if (detailCard) {
                                setDetailModalOpen(false)
                                setSelectedCard(detailCard)
                                setAddDialogOpen(true)
                            }
                        }}
                        variant="contained"
                        startIcon={<AddIcon />}
                    >
                        Add to Collection
                    </Button>
                    <Button onClick={() => setDetailModalOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add to Collection Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
                <DialogTitle>Add to Collection</DialogTitle>
                <DialogContent>
                    <Typography variant="h6" gutterBottom>
                        {selectedCard?.name}
                    </Typography>

                    <TextField
                        fullWidth
                        type="number"
                        label="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        sx={{ mb: 2 }}
                        inputProps={{ min: 1 }}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Condition</InputLabel>
                        <Select
                            value={condition}
                            label="Condition"
                            onChange={(e) => setCondition(e.target.value)}
                        >
                            <MenuItem value="Mint">Mint</MenuItem>
                            <MenuItem value="Near Mint">Near Mint</MenuItem>
                            <MenuItem value="Lightly Played">Lightly Played</MenuItem>
                            <MenuItem value="Moderately Played">Moderately Played</MenuItem>
                            <MenuItem value="Heavily Played">Heavily Played</MenuItem>
                            <MenuItem value="Damaged">Damaged</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddToCollection} variant="contained">
                        Add to Collection
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default CardList
