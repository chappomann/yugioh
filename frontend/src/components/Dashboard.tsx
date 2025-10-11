import React, { useState, useEffect } from 'react'
import {
    Card as MuiCard,
    CardContent,
    Typography,
    Grid,
    Box,
    Paper,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material'
import { cardsApi } from '../services/api'
import { Stats } from '../types'

const Dashboard: React.FC = () => {
    const [cardStats, setCardStats] = useState<Stats | null>(null)
    const [collectionStats, setCollectionStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true)
                const [cardStatsRes, allCardsRes] = await Promise.all([
                    cardsApi.getStats(),
                    cardsApi.getAll({ limit: 10000 }) // Get all cards to calculate collection stats
                ])

                if (cardStatsRes.data.success) {
                    setCardStats(cardStatsRes.data.stats)
                }

                if (allCardsRes.data.success) {
                    // Calculate collection stats from cards with quantity > 0
                    const collectionCards = allCardsRes.data.cards.filter((card: any) => card.quantity && card.quantity > 0)
                    const stats = {
                        uniqueCards: collectionCards.length,
                        totalItems: collectionCards.reduce((total: number, card: any) => total + (card.quantity || 0), 0),
                        totalValue: collectionCards.reduce((total: number, card: any) =>
                            total + ((card.price || 0) * (card.quantity || 0)), 0
                        )
                    }
                    setCollectionStats(stats)
                }
            } catch (err) {
                setError('Failed to load dashboard data')
                console.error('Dashboard error:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

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
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>

            <Grid container spacing={3}>
                {/* Total Cards */}
                <Grid item xs={12} sm={6} md={3}>
                    <MuiCard>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Cards in Database
                            </Typography>
                            <Typography variant="h4">
                                {cardStats?.totalCards?.toLocaleString() || 0}
                            </Typography>
                        </CardContent>
                    </MuiCard>
                </Grid>

                {/* Collection Size */}
                <Grid item xs={12} sm={6} md={3}>
                    <MuiCard>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Cards in Collection
                            </Typography>
                            <Typography variant="h4">
                                {collectionStats?.totalItems || 0}
                            </Typography>
                        </CardContent>
                    </MuiCard>
                </Grid>

                {/* Unique Cards in Collection */}
                <Grid item xs={12} sm={6} md={3}>
                    <MuiCard>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Unique Cards in Collection
                            </Typography>
                            <Typography variant="h4">
                                {collectionStats?.uniqueCards || 0}
                            </Typography>
                        </CardContent>
                    </MuiCard>
                </Grid>

                {/* Collection Value */}
                <Grid item xs={12} sm={6} md={3}>
                    <MuiCard>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Collection Value
                            </Typography>
                            <Typography variant="h4">
                                ${collectionStats?.totalValue?.toFixed(2) || '0.00'}
                            </Typography>
                        </CardContent>
                    </MuiCard>
                </Grid>

                {/* Card Types Distribution */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Card Types Distribution
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {cardStats?.cardTypes?.map((type, index) => (
                                <Chip
                                    key={index}
                                    label={`${type.type}: ${type.count}`}
                                    variant="outlined"
                                    size="small"
                                />
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Attributes Distribution */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Attributes Distribution
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {cardStats?.attributes?.map((attr, index) => (
                                <Chip
                                    key={index}
                                    label={`${attr.attribute}: ${attr.count}`}
                                    variant="outlined"
                                    size="small"
                                    color="primary"
                                />
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    )
}

export default Dashboard
