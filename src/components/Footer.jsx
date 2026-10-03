import React from 'react'

function Footer() {
  return (
    <footer className="py-16 px-6 bg-charcoal text-white/80">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-8">
          <h2 className="elegant-serif text-3xl md:text-4xl text-white">
            지그시
          </h2>
          
          <nav className="flex justify-center gap-6 md:gap-8 text-sm md:text-base">
            <a href="#products" className="hover:text-white transition-colors">문진</a>
            <a href="#brand" className="hover:text-white transition-colors">브랜드</a>
            <a href="#board" className="hover:text-white transition-colors">게시판</a>
            <a href="#contact" className="hover:text-white transition-colors">문의하기</a>
          </nav>
          
          <div className="space-y-2 text-sm">
            <p>hello@jigusi.com</p>
            <p>문진도 지그시 빛나길 32-7</p>
          </div>
          
          <div className="pt-8 text-xs text-white/60">
            <p>© 2026 지그시</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
