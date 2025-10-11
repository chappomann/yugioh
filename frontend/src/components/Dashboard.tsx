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
import { useApi } from '../hooks/useApi'

const Dashboard: React.FC = () => {
    const statsApi = useApi<Stats>()
    const [collectionStats, setCollectionStats] = useState<any>(null)

    useEffect(() => {
        const fetchStats = async () => {
            // Use the new backend stats endpoint instead of fetching all cards
            await statsApi.execute(() => cardsApi.getStats())

            // For collection stats, we'll need a separate endpoint from backend
            // For now, using a smaller query
            try {
                const allCardsRes = await cardsApi.getAll({ limit: 100, quantity_gt: 0 }) // Only get cards in collection

                if (allCardsRes.data?.success && allCardsRes.data?.data) {
                    const collectionCards = allCardsRes.data.data.filter((card: any) => card.quantity && card.quantity > 0)
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
                console.error('Error fetching collection stats:', err)
            }
        }

        fetchStats()
    }, [])

    if (statsApi.loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={60} />
            </Box>
        )
    }

    if (statsApi.error) {
        return <Alert severity="error">{statsApi.error}</Alert>
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
                                {statsApi.data?.totalCards?.toLocaleString() || 0}
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
                            {statsApi.data?.cardTypes?.map((type: any, index: number) => (
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
                            {statsApi.data?.attributes?.map((attr: any, index: number) => (
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
