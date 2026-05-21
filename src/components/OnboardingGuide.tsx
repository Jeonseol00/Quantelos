import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Activity, Hexagon, Component, ArrowRight, Rocket } from 'lucide-react-native';

interface OnboardingProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Selamat Datang, CFO',
    description: 'Tinggalkan pencatatan kas konvensional. Ambil kendali penuh atas intelijen finansial Anda dengan presisi matematis dan visibilitas total.',
    icon: <Hexagon color="#D0BCFF" size={64} strokeWidth={1} />,
    glowColor: 'rgba(208, 188, 255, 0.2)'
  },
  {
    title: 'Arsitektur Finansial',
    description: 'Petakan arus kas Anda dalam dimensi baru. Algoritma kami memisahkan sinyal dari noise untuk keputusan yang lebih tajam.',
    icon: <Activity color="#4CD7F6" size={64} strokeWidth={1} />,
    glowColor: 'rgba(76, 215, 246, 0.2)'
  },
  {
    title: 'Visibilitas Total',
    description: 'Dari level mikro hingga makro, pantau setiap pergerakan aset Anda dalam satu kokpit digital yang responsif.',
    icon: <Component color="#4EDEA3" size={64} strokeWidth={1} />,
    glowColor: 'rgba(78, 222, 163, 0.2)'
  }
];

export default function OnboardingGuide({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const isLast = currentSlide === slides.length - 1;

  return (
    <View style={styles.container}>
      {/* Ambient Glow Background */}
      <View style={[styles.ambientGlow, { backgroundColor: slides[currentSlide].glowColor }]} />
      
      {/* Top Logo */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Quantelos CFO</Text>
      </View>

      {/* Main Content Carousel */}
      <View style={styles.carouselContainer}>
        <View style={styles.artPlaceholder}>
          <View style={[styles.innerGlow, { backgroundColor: slides[currentSlide].glowColor }]} />
          {slides[currentSlide].icon}
        </View>
        <Text style={styles.title}>{slides[currentSlide].title}</Text>
        <Text style={styles.description}>{slides[currentSlide].description}</Text>
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide && styles.dotActive
              ]}
            />
          ))}
        </View>
        
        <TouchableOpacity 
          style={[styles.button, isLast && styles.buttonAction]} 
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, isLast && styles.buttonTextAction]}>
            {isLast ? 'Mulai Perjalanan' : 'Lanjut'}
          </Text>
          {isLast ? (
            <Rocket color="#131318" size={20} style={{ marginLeft: 8 }} />
          ) : (
            <ArrowRight color="#D0BCFF" size={20} style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'space-between',
  },
  ambientGlow: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: '80%',
    height: '60%',
    borderRadius: 999,
    opacity: 0.6,
    transform: [{ scale: 1.5 }],
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 20,
    zIndex: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#D0BCFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(208, 188, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  artPlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 5,
    overflow: 'hidden',
  },
  innerGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E4E1E9',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: '#958EA0',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  footer: {
    padding: 32,
    paddingBottom: 60,
    zIndex: 10,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 6,
  },
  dotActive: {
    width: 32,
    backgroundColor: '#D0BCFF',
    shadowColor: '#D0BCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  button: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(208, 188, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(208, 188, 255, 0.3)',
  },
  buttonAction: {
    backgroundColor: '#D0BCFF',
    borderColor: '#D0BCFF',
    shadowColor: '#D0BCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  buttonText: {
    color: '#D0BCFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextAction: {
    color: '#131318',
  }
});
