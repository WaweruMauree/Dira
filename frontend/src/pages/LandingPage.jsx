import HeaderSection from '@/components/landing/HeaderSection'
import AboutSection from '@/components/landing/AboutSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import AboutUsSection from '@/components/landing/AboutUsSection'
import ProductCard from '@/components/ProductCard'

export default function LandingPage() {
  return (
    <main>
      <HeaderSection />
      <ProductCard />
      <AboutSection />
      <FeaturesSection />
      <AboutUsSection />
    </main>
  )
}
