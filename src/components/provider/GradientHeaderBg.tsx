import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect, Circle} from 'react-native-svg';
import {PROVIDER_THEME} from '../../theme/providerTheme';

const {width: W} = Dimensions.get('window');

export default function GradientHeaderBg({height = 200}: {height?: number}) {
  return (
    <View style={[styles.wrap, {height}]} pointerEvents="none">
      <Svg width={W} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="hdr" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={PROVIDER_THEME.gradient.hero[0]} />
            <Stop offset="55%" stopColor={PROVIDER_THEME.gradient.hero[1]} />
            <Stop offset="100%" stopColor={PROVIDER_THEME.gradient.hero[2]} />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={height} fill="url(#hdr)" />
        <Circle cx={W * 0.85} cy={height * 0.2} r={80} fill="rgba(29, 53, 87, 0.06)" />
        <Circle cx={W * 0.1} cy={height * 0.7} r={60} fill="rgba(197, 235, 216, 0.9)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
