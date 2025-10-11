import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Container } from '@mui/material'
import Navbar from './components/Navbar'
import CardList from './components/CardList'
import Collection from './components/Collection'
import CardDetail from './components/CardDetail'
import Dashboard from './components/Dashboard'

function App() {
    return (
        <Router>
            <Navbar />
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/cards" element={<CardList />} />
                    <Route path="/cards/:id" element={<CardDetail />} />
                    <Route path="/collection" element={<Collection />} />
                </Routes>
            </Container>
        </Router>
    )
}

export default App
