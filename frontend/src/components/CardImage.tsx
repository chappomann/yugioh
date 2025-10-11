import React, { useState } from 'react'
import { CardMedia, Box, Typography } from '@mui/material'

interface CardImageProps {
    cardId: string
    name: string
    imageUrl?: string | null
    height?: number | string
    sx?: any
}

const CardImage: React.FC<CardImageProps> = ({
    cardId,
    name,
    imageUrl,
    height = 200,
    sx = {}
}) => {
    const [imageError, setImageError] = useState(false)
    const [fallbackError, setFallbackError] = useState(false)

    const localImagePath = `/images/${cardId}.jpg`

    const handleImageError = () => {
        setImageError(true)
    }

    const handleFallbackError = () => {
        setFallbackError(true)
    }

    // If both local and small image failed, show placeholder
    if (imageError && fallbackError) {
        return (
            <Box
                sx={{
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.200',
                    color: 'text.secondary',
                    ...sx
                }}
            >
                <Typography variant="caption" align="center">
                    No image available
                </Typography>
            </Box>
        )
    }

    // If local image failed but we have image URL, use it
    if (imageError && imageUrl && !fallbackError) {
        return (
            <CardMedia
                component="img"
                height={height}
                image={imageUrl}
                alt={name}
                onError={handleFallbackError}
                sx={{ objectFit: 'contain', ...sx }}
            />
        )
    }

    // Try local image first
    return (
        <CardMedia
            component="img"
            height={height}
            image={localImagePath}
            alt={name}
            onError={handleImageError}
            sx={{ objectFit: 'contain', ...sx }}
        />
    )
}

export default CardImage
