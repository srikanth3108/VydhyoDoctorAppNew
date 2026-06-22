import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import {PROVIDER_THEME} from '../../theme/providerTheme';

const {width: W} = Dimensions.get('window');

/** Subtle ink gradient — no large decorative circles */
export default function ProviderAuraBg() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width={W} height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={PROVIDER_THEME.gradient.hero[0]} />
            <Stop offset="100%" stopColor={PROVIDER_THEME.gradient.hero[2]} />
          </LinearGradient>
        </Defs>
        <Rect width={W} height="100%" fill="url(#heroGrad)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
});
