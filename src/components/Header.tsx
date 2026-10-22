import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { MessageCircle, Phone } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { Config } from '../constants/config';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showContactAction?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showContactAction = true,
}) => {
  const handleOpenWhatsApp = async () => {
    const url = `https://wa.me/${Config.HOTLINE_WA}?text=${encodeURIComponent(
      'Halo Customer Service Andex Cargo, saya ingin bertanya tentang layanan pengiriman.'
    )}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Info', `Silakan hubungi WhatsApp kami di ${Config.HOTLINE_DISPLAY}`);
      }
    } catch {
      Alert.alert('Info', `Silakan hubungi WhatsApp kami di ${Config.HOTLINE_DISPLAY}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {title ? (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        ) : (
          <View style={styles.titleContainer}>
            <Text style={styles.brandTitle}>AndEX <Text style={styles.brandAccent}>Cargo</Text></Text>
            <Text style={styles.brandTagline}>{Config.TAGLINE}</Text>
          </View>
        )}
      </View>

      {showContactAction && (
        <TouchableOpacity
          style={styles.waButton}
          onPress={handleOpenWhatsApp}
          activeOpacity={0.8}
        >
          <MessageCircle size={16} color="#ffffff" />
          <Text style={styles.waButtonText}>CS WA</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  brandAccent: {
    color: Colors.accent,
  },
  brandTagline: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
    marginTop: 1,
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366', // Official WhatsApp green
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginLeft: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  waButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
});
