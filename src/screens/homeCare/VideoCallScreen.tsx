import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  SwitchCamera,
  ArrowLeft,
} from 'lucide-react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ProviderStackParamList} from '../../navigation/types';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {useProviderModal} from '../../context/ProviderModalContext';
import {moderateScale} from '../../utils/responsive';

const {width: W, height: H} = Dimensions.get('window');

type RouteProps = RouteProp<ProviderStackParamList, 'VideoCall'>;
type Nav = NativeStackNavigationProp<ProviderStackParamList, 'VideoCall'>;

type Phase = 'connecting' | 'connected' | 'ended';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VideoCallScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const {patientName, jobId, callType = 'patient'} = route.params;
  const {showEndVideoCall} = useProviderModal();

  const [phase, setPhase] = useState<Phase>('connecting');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [speaker, setSpeaker] = useState(true);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setTimeout(() => setPhase('connected'), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'connected') return;
    const iv = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase === 'connecting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [phase, pulse]);

  const endCall = () => {
    showEndVideoCall(patientName, () => {
      setPhase('ended');
      navigation.goBack();
    });
  };

  const initials = patientName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="vc" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={PROVIDER_THEME.gradient.video[0]} />
            <Stop offset="50%" stopColor={PROVIDER_THEME.gradient.video[1]} />
            <Stop offset="100%" stopColor={PROVIDER_THEME.gradient.video[2]} />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#vc)" />
      </Svg>

      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft color="#FFF" size={22} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topLabel}>
              {callType === 'support' ? 'SUPPORT VIDEO' : 'SECURE PATIENT VIDEO'}
            </Text>
            {jobId ? (
              <Text style={styles.topJob}>Visit {jobId}</Text>
            ) : null}
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>
              {phase === 'connecting' ? 'RINGING' : 'LIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.remote}>
          {phase === 'connecting' ? (
            <Animated.View style={[styles.avatarRing, {transform: [{scale: pulse}]}]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </Animated.View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.patientName}>{patientName}</Text>
          <Text style={styles.phaseText}>
            {phase === 'connecting'
              ? 'Connecting encrypted video…'
              : `Connected · ${formatDuration(seconds)}`}
          </Text>
          {!videoOn && phase === 'connected' ? (
            <Text style={styles.camOff}>Your camera is off</Text>
          ) : null}
        </View>

        <View style={styles.pip}>
          <View style={styles.pipInner}>
            {videoOn ? (
              <Text style={styles.pipYou}>You</Text>
            ) : (
              <VideoOff color="#FFF" size={20} />
            )}
          </View>
          <TouchableOpacity style={styles.pipFlip}>
            <SwitchCamera color="#FFF" size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <Control
            icon={muted ? MicOff : Mic}
            label={muted ? 'Unmute' : 'Mute'}
            active={muted}
            onPress={() => setMuted(!muted)}
          />
          <Control
            icon={videoOn ? Video : VideoOff}
            label={videoOn ? 'Stop' : 'Video'}
            active={!videoOn}
            onPress={() => setVideoOn(!videoOn)}
          />
          <Control
            icon={Volume2}
            label="Speaker"
            active={speaker}
            onPress={() => setSpeaker(!speaker)}
          />
          <TouchableOpacity style={styles.endBtn} onPress={endCall}>
            <PhoneOff color="#FFF" size={26} />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          HIPAA-ready channel · Replace with Agora / WebRTC SDK in production
        </Text>
      </SafeAreaView>
    </View>
  );
}

function Control({
  icon: Icon,
  label,
  onPress,
  active,
}: {
  icon: typeof Mic;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.ctrl} onPress={onPress}>
      <View style={[styles.ctrlIcon, active && styles.ctrlIconOn]}>
        <Icon color="#FFF" size={22} />
      </View>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  safe: {flex: 1},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingTop: moderateScale(8),
  },
  iconBtn: {padding: moderateScale(10)},
  topCenter: {flex: 1, alignItems: 'center'},
  topLabel: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  topJob: {
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {color: '#FFF', fontSize: 10, fontWeight: '800'},
  remote: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(24),
  },
  avatarRing: {
    padding: moderateScale(8),
    borderRadius: 999,
    borderWidth: 2,
    borderColor: PROVIDER_THEME.tealLight,
  },
  avatar: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: 'rgba(45, 212, 191, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: moderateScale(40),
    fontWeight: '800',
    color: '#FFF',
  },
  patientName: {
    fontSize: moderateScale(26),
    fontWeight: '800',
    color: '#FFF',
    marginTop: moderateScale(20),
  },
  phaseText: {
    fontSize: moderateScale(15),
    color: 'rgba(255,255,255,0.7)',
    marginTop: moderateScale(8),
  },
  camOff: {
    marginTop: moderateScale(12),
    color: PROVIDER_THEME.coral,
    fontWeight: '600',
  },
  pip: {
    position: 'absolute',
    right: moderateScale(20),
    top: moderateScale(100),
    width: moderateScale(100),
    height: moderateScale(140),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pipInner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipYou: {color: '#FFF', fontWeight: '700'},
  pipFlip: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: moderateScale(20),
    paddingBottom: moderateScale(16),
    paddingHorizontal: moderateScale(16),
  },
  ctrl: {alignItems: 'center', gap: 6},
  ctrlIcon: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlIconOn: {backgroundColor: 'rgba(255,255,255,0.35)'},
  ctrlLabel: {color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600'},
  endBtn: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: PROVIDER_THEME.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(8),
  },
  hint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.35)',
    fontSize: moderateScale(10),
    paddingBottom: moderateScale(12),
  },
});
