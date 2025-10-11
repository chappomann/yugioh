
import React, { useState } from 'react'
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, useMediaQuery } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'


const Navbar: React.FC = () => {
    const location = useLocation()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

    const navItems = [
        { label: 'Dashboard', path: '/' },
        { label: 'All Cards', path: '/cards' },
        { label: 'My Collection', path: '/collection' },
    ]

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    return (
        <AppBar position="static" color="primary">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    🃏 Yu-Gi-Oh! Collection Manager
                </Typography>
                {isMobile ? (
                    <>
                        <IconButton
                            color="inherit"
                            edge="end"
                            aria-label="menu"
                            onClick={handleMenuOpen}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            {navItems.map((item) => (
                                <MenuItem
                                    key={item.path}
                                    component={Link}
                                    to={item.path}
                                    selected={location.pathname === item.path}
                                    onClick={handleMenuClose}
                                >
                                    {item.label}
                                </MenuItem>
                            ))}
                        </Menu>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {navItems.map((item) => (
                            <Button
                                key={item.path}
                                color="inherit"
                                component={Link}
                                to={item.path}
                                variant={location.pathname === item.path ? 'outlined' : 'text'}
                                sx={{
                                    borderColor: location.pathname === item.path ? 'white' : 'transparent',
                                    color: 'white'
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    )
}

export default Navbar
