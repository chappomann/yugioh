import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Typography,
    Box,
    Grid,
    Paper,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert
} from '@mui/material'
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { cardsApi } from '../services/api'
import { Card as CardType } from '../types'
import CardImage from './CardImage'

const CardDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [card, setCard] = useState<CardType | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Add to collection dialog
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [quantity, setQuantity] = useState(1)
    const [condition, setCondition] = useState('Near Mint')

    useEffect(() => {
        if (id) {
            fetchCard(id)
        }
    }, [id])

    const fetchCard = async (cardId: string) => {
        try {
            setLoading(true)
            const response = await cardsApi.getById(cardId)
            if (response.data.success) {
                setCard(response.data.card)
            } else {
                setError('Card not found')
            }
        } catch (err) {
            setError('Failed to load card details')
            console.error('Error fetching card:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCollection = async () => {
        if (!card?.id) return

        try {
            // Get current quantity and add to it
            const currentQuantity = card.quantity || 0
            const newQuantity = currentQuantity + quantity

            await cardsApi.updateQuantity(card.id, newQuantity)

            setAddDialogOpen(false)
            setQuantity(1)
            setCondition('Near Mint')

            // Refresh card data to show updated quantity
            if (id) {
                fetchCard(id)
            }

            // Show success message
            alert('Card added to collection successfully!')
        } catch (err) {
            console.error('Error adding to collection:', err)
            alert('Failed to add card to collection')
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

    if (!card) {
        return <Alert severity="info">Card not found</Alert>
    }

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{ mb: 2 }}
            >
                Back to Cards
            </Button>

            <Grid container spacing={3}>
                {/* Card Image */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <CardImage
                            cardId={card.card_id}
                            name={card.name}
                            imageUrl={card.image_url}
                            height="auto"
                            sx={{ maxWidth: '100%', minHeight: 400 }}
                        />

                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={<AddIcon />}
                            onClick={() => setAddDialogOpen(true)}
                            sx={{ mt: 2 }}
                        >
                            Add to Collection
                        </Button>
                    </Paper>
                </Grid>

                {/* Card Details */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h4" gutterBottom>
                            {card.name}
                        </Typography>

                        <Box mb={2}>
                            {card.type && <Chip label={card.type} sx={{ mr: 1, mb: 1 }} />}
                            {card.race && <Chip label={card.race} color="secondary" sx={{ mr: 1, mb: 1 }} />}
                            {card.attribute && <Chip label={card.attribute} color="primary" sx={{ mr: 1, mb: 1 }} />}
                            {card.archetype && <Chip label={card.archetype} variant="outlined" sx={{ mr: 1, mb: 1 }} />}
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {card.atk !== null && (
                                <Grid item xs={6} sm={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h6" color="primary">
                                            {card.atk}
                                        </Typography>
                                        <Typography variant="caption">ATK</Typography>
                                    </Paper>
                                </Grid>
                            )}

                            {card.def !== null && (
                                <Grid item xs={6} sm={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h6" color="secondary">
                                            {card.def}
                                        </Typography>
                                        <Typography variant="caption">DEF</Typography>
                                    </Paper>
                                </Grid>
                            )}

                            {card.level && (
                                <Grid item xs={6} sm={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h6">
                                            {card.level}
                                        </Typography>
                                        <Typography variant="caption">Level</Typography>
                                    </Paper>
                                </Grid>
                            )}

                            {card.price && (
                                <Grid item xs={6} sm={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h6" color="success.main">
                                            ${card.price.toFixed(2)}
                                        </Typography>
                                        <Typography variant="caption">Price</Typography>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>

                        <Typography variant="h6" gutterBottom>
                            Description
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body1">
                                {card.description}
                            </Typography>
                        </Paper>

                        {card.quantity > 0 && (
                            <Box mt={2}>
                                <Alert severity="info">
                                    You own {card.quantity} cop{card.quantity === 1 ? 'y' : 'ies'} of this card
                                </Alert>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Add to Collection Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
                <DialogTitle>Add to Collection</DialogTitle>
                <DialogContent>
                    <Typography variant="h6" gutterBottom>
                        {card.name}
                    </Typography>

                    <TextField
                        fullWidth
                        type="number"
                        label="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        sx={{ mb: 2, mt: 1 }}
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

export default CardDetail
