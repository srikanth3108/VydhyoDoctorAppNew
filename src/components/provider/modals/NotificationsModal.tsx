import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {Bell, Wallet, Stethoscope, Radio} from 'lucide-react-native';
import {mockApi, ProviderNotification} from '../../../services/api';
import ProviderBottomSheet from './ProviderBottomSheet';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';

const TYPE_ICON = {
  offer: Radio,
  visit: Stethoscope,
  payout: Wallet,
  system: Bell,
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function NotificationsModal({visible, onClose}: Props) {
  const [items, setItems] = useState<ProviderNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await mockApi.fetchProviderNotifications());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const markRead = async (id: string) => {
    await mockApi.markNotificationRead(id);
    setItems(prev => prev.map(n => (n.id === id ? {...n, read: true} : n)));
  };

  return (
    <ProviderBottomSheet
      visible={visible}
      onClose={onClose}
      title="Notifications"
      subtitle="Live offers, visit updates, and payouts"
      tall>
      {loading ? (
        <ActivityIndicator color={PROVIDER_THEME.jade} style={styles.loader} />
      ) : (
        items.map(n => {
          const Icon = TYPE_ICON[n.type];
          return (
            <TouchableOpacity
              key={n.id}
              style={[styles.row, !n.read && styles.rowUnread]}
              onPress={() => markRead(n.id)}
              activeOpacity={0.88}>
              <View style={[styles.iconWrap, !n.read && styles.iconWrapUnread]}>
                <Icon
                  color={n.read ? PROVIDER_THEME.textSoft : PROVIDER_THEME.jade}
                  size={moderateScale(18)}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.title, !n.read && styles.titleUnread]}>
                  {n.title}
                </Text>
                <Text style={styles.body} numberOfLines={2}>
                  {n.body}
                </Text>
                <Text style={styles.time}>{n.time}</Text>
              </View>
              {!n.read ? <View style={styles.dot} /> : null}
            </TouchableOpacity>
          );
        })
      )}
    </ProviderBottomSheet>
  );
}

const styles = StyleSheet.create({
  loader: {marginVertical: moderateScale(24)},
  row: {
    flexDirection: 'row',
    gap: moderateScale(12),
    padding: moderateScale(14),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    marginBottom: moderateScale(10),
    alignItems: 'flex-start',
  },
  rowUnread: {
    borderColor: PROVIDER_THEME.jade,
    backgroundColor: PROVIDER_THEME.jadeMuted,
  },
  iconWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: PROVIDER_THEME.pearlMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: {backgroundColor: PROVIDER_THEME.pearl},
  rowText: {flex: 1, minWidth: 0},
  title: {fontSize: moderateScale(14), fontWeight: '700', color: PROVIDER_THEME.ink},
  titleUnread: {fontWeight: '800'},
  body: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(4),
    lineHeight: moderateScale(17),
  },
  time: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textSoft,
    marginTop: moderateScale(6),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PROVIDER_THEME.amber,
    marginTop: moderateScale(6),
  },
});
