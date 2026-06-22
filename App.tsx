import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, Linking, Animated, Dimensions } from 'react-native';
import Routing from './src/Routing/routing';
import Toast from 'react-native-toast-message';
import DeviceInfo from 'react-native-device-info';

const { width } = Dimensions.get('window');

const FORCE_UPDATE_URL = 'https://server.vydhyo.com/doctorApp/app-version';

function App() {
  const [forceUpdate, setForceUpdate] = useState(false);
  

  // Animation refs for force-update screen
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // const checkVersion = async () => {
  //   try {
  //     // 1. Get current app version code
  // const currentVersion = parseInt(DeviceInfo.getBuildNumber(), 10); // e.g. "5"
  //     // 2. Fetch latest minVersionCode from backend
  //     const res = await fetch(FORCE_UPDATE_URL);
  //     const data = await res.json();
  //     console.log(currentVersion,"currentVersion")
  //     console.log(data,"currentVersion")
  //     console.log(data.androidMinVersionCode,"androidMinVersionCode")
  //     //check based on platform
  //     if (Platform.OS === "android") {
  //       if (currentVersion < data.androidMinVersionCode) {
  //         setForceUpdate(true);
  //       }
  //     }
  //     if (Platform.OS === "ios") {
  //       if (currentVersion < data.iosMinVersionCode) {
  //         setForceUpdate(true);
  //       }
  //     }
  //   } catch (err) {
  //     console.log("Version check failed:", err);
  //   }
  // };



    const openStore = () => {
      //if platform is android open play store else open app store
      if (Platform.OS === "android") {
        Linking.openURL("https://play.google.com/store/apps/details?id=com.vydhyoPartners");
      } else {
        Linking.openURL("https://apps.apple.com/us/app/vydhyo-partners/id6755099565");
      }
  };

  // useEffect(() => {
  //   checkVersion();
  // }, []);

  if (forceUpdate) {
    // start animations when force update screen is shown
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return (
      <View style={styles.container}>
        {/* subtle gradient bg shapes */}
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />

        {/* floating decor */}
        <View style={[styles.floatingCircle, styles.circle1]} />
        <View style={[styles.floatingCircle, styles.circle2]} />
        <View style={[styles.floatingCircle, styles.circle3]} />

        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}> 
            <View style={styles.iconCircle}>
              <View style={styles.iconInner}>
                <Text style={styles.iconText}>🚀</Text>
              </View>
            </View>
            <View style={styles.iconGlow} />
          </Animated.View>

          <Text style={styles.title}>New Update Available!</Text>

          <Text style={styles.subtitle}>
            We've crafted something special for you.{'\n'}
            Update now to unlock the latest features.
          </Text>

          <View style={styles.featuresContainer}>
            {[
              { icon: '⚡', text: 'Lightning-fast performance', color: '#FFD700' },
              { icon: '🛡️', text: 'Enhanced security & stability', color: '#4ECDC4' },
              { icon: '✨', text: 'Exciting new features', color: '#FF6B9D' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.updateButton} onPress={openStore} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Update Now</Text>
              {/* version badge removed */}
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonIcon}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.versionContainer}>
            <View style={styles.versionDot} />
            <Text style={styles.versionText}>This update is required to continue</Text>
          </View>
        </Animated.View>
      </View>
    );
  }




  return (
    <View style={styles.container}>
      <View style={{ flex: 1, width: '100%' }}>
            <Routing />
      </View>
      <Toast/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gradientTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#6366F1',
    opacity: 0.15,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#EC4899',
    opacity: 0.1,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: '#ffffff',
    opacity: 0.03,
  },
  circle1: {
    width: 200,
    height: 200,
    top: 50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    top: '40%',
    left: 30,
  },
  contentContainer: {
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#334155',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#6366F1',
    opacity: 0.2,
    top: -10,
    left: -10,
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600',
    flex: 1,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
    marginRight: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  versionBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  versionBadgeText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  full: {
    flex: 1,
    width: '100%',
  },
  footerVersion: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 20,
  },
  footerVersionText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});

export default App;