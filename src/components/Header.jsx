import React, { useState, useEffect } from 'react'

function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-warm-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-6 py-5 flex justify-between items-center">
        <a 
          href="#top" 
          className="elegant-serif text-2xl md:text-3xl text-charcoal hover:opacity-70 transition-opacity"
        >
          지그시
        </a>
        
        <div className="flex gap-6 md:gap-8 text-sm md:text-base">
          <a href="#products" className="hover:opacity-70 transition-opacity">문진</a>
          <a href="#brand" className="hover:opacity-70 transition-opacity">브랜드</a>
          <a href="#board" className="hover:opacity-70 transition-opacity">게시판</a>
          <a href="#contact" className="hover:opacity-70 transition-opacity">문의하기</a>
        </div>
      </nav>
    </header>
  )
}

export default Header
