import React from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Products from '../components/Products'
import Brand from '../components/Brand'
import Board from '../components/Board'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Products />
      <Brand />
      <Board />
      <Contact />
      <Footer />
    </div>
  )
}

export default Home
