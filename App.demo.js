import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

const theme = {
  colors: {
    charcoalGray: '#1A1A1A',
    leatherBrown: '#8D5B2E',
    antiqueGold: '#C4A57F',
    cream: '#F4F1ED',
  }
};

/**
 * INKED DRAW - Luxury Social Platform Demo
 */
function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.charcoalGray}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.logo}>INKED DRAW</Text>
          <Text style={styles.tagline}>Luxury Social Platform</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Premium Experience</Text>
            <Text style={styles.featureDesc}>
              Sophisticated mobile application for cigar, wine, and beer connoisseurs 
              with leather-bound journal aesthetic
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Private Member's Lounge</Text>
            <Text style={styles.featureDesc}>
              Exclusive atmosphere with deliberate, weighty motion and premium, 
              tactile interactions
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Luxury Design</Text>
            <Text style={styles.featureDesc}>
              Charcoal gray backgrounds, leather brown accents, and antique gold 
              highlights create an upscale experience
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Connoisseur Features</Text>
            <Text style={styles.featureDesc}>
              • Personal collection tracking{'\n'}
              • Social sharing with fellow enthusiasts{'\n'}
              • Premium tasting notes{'\n'}
              • Exclusive member events
            </Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your luxury social platform is ready for demonstration
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.charcoalGray,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.leatherBrown,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.antiqueGold,
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.cream,
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  featureCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.leatherBrown,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.antiqueGold,
    marginBottom: 12,
  },
  featureDesc: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.cream,
    opacity: 0.9,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.antiqueGold,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default App;
