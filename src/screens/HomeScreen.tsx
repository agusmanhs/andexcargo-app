import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Search,
  Calculator,
  MapPin,
  Truck,
  Plane,
  ShieldCheck,
  Clock,
  ArrowRight,
  MessageCircle,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { Config } from '../constants/config';
import { ApiService, Slide } from '../api/client';
import { Header } from '../components/Header';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = width - 32;

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [resiInput, setResiInput] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSlides = async () => {
    try {
      const data = await ApiService.getSlides();
      setSlides(data);
    } catch {
      // Slides fallback gracefully if network offline
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSlides();
    setRefreshing(false);
  };

  const handleTrack = () => {
    const trimmed = resiInput.trim();
    if (!trimmed) {
      Alert.alert('Perhatian', 'Silakan masukkan nomor resi terlebih dahulu.');
      return;
    }
    navigation.navigate('Lacak Resi', { resi: trimmed });
    setResiInput('');
  };

  const handleOpenWhatsApp = () => {
    Linking.openURL(
      `https://wa.me/${Config.HOTLINE_WA}?text=${encodeURIComponent(
        'Halo Customer Service Andex Cargo, saya ingin bertanya tentang layanan pengiriman kargo.'
      )}`
    ).catch(() => {
      Alert.alert('Info', `Hubungi CS Andex di ${Config.HOTLINE_DISPLAY}`);
    });
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />
        }
      >
        {/* HERO SECTION / QUICK TRACK CARD */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Lacak Kiriman Anda</Text>
          <Text style={styles.heroSubtitle}>
            Pantau posisi dan status paket kargo secara realtime
          </Text>

          <View style={styles.trackInputContainer}>
            <Search size={20} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.trackInput}
              placeholder="Masukkan Nomor Resi (misal: ADX...)"
              placeholderTextColor={Colors.textMuted}
              value={resiInput}
              onChangeText={setResiInput}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={handleTrack}
            />
          </View>

          <TouchableOpacity
            style={styles.trackButton}
            onPress={handleTrack}
            activeOpacity={0.85}
          >
            <Text style={styles.trackButtonText}>Lacak Paket</Text>
            <ArrowRight size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* QUICK MENU GRID */}
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Cek Tarif')}
            activeOpacity={0.8}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#e0f2fe' }]}>
              <Calculator size={22} color="#0284c7" />
            </View>
            <Text style={styles.menuItemTitle}>Cek Tarif</Text>
            <Text style={styles.menuItemDesc}>Hitung estimasi ongkir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Cabang')}
            activeOpacity={0.8}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#fef3c7' }]}>
              <MapPin size={22} color="#d97706" />
            </View>
            <Text style={styles.menuItemTitle}>Lokasi Cabang</Text>
            <Text style={styles.menuItemDesc}>Kantor & titik drop</Text>
          </TouchableOpacity>
        </View>

        {/* PROMO & INFORMASI BANNER SLIDER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informasi & Promo</Text>
          <Text style={styles.sectionBadge}>Terbaru</Text>
        </View>

        {slides.length > 0 ? (
          <View style={styles.sliderContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={e => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
                setActiveSlideIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {slides.map(item => (
                <View key={item.id} style={styles.slideCard}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.slideImage}
                    resizeMode="cover"
                  />
                  {(item.title || item.desc) ? (
                    <View style={styles.slideInfo}>
                      {item.title ? <Text style={styles.slideTitle}>{item.title}</Text> : null}
                      {item.desc ? <Text style={styles.slideDesc}>{item.desc}</Text> : null}
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>

            {slides.length > 1 && (
              <View style={styles.paginationDots}>
                {slides.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      activeSlideIndex === i ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.defaultBannerCard}>
            <View style={styles.defaultBannerBadge}>
              <ShieldCheck size={16} color={Colors.accent} />
              <Text style={styles.defaultBannerBadgeText}>Ekspedisi Terpercaya</Text>
            </View>
            <Text style={styles.defaultBannerTitle}>Pengiriman Kargo Aman & Cepat ke Seluruh Indonesia</Text>
            <Text style={styles.defaultBannerSubtitle}>
              Solusi pengiriman logistik darat, laut, dan udara dengan tarif kompetitif dan layanan tepat waktu.
            </Text>
          </View>
        )}

        {/* KEUNGGULAN LAYANAN ANDEX */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Layanan Unggulan</Text>
        </View>

        <View style={styles.servicesContainer}>
          <View style={styles.serviceItem}>
            <View style={[styles.serviceIconBox, { backgroundColor: '#f0fdf4' }]}>
              <Plane size={24} color="#16a34a" />
            </View>
            <View style={styles.serviceTextCol}>
              <Text style={styles.serviceTitle}>Kargo Udara (Express)</Text>
              <Text style={styles.serviceDesc}>
                Pengiriman kilat prioritas untuk paket mendesak ke berbagai bandara tujuan di Nusantara.
              </Text>
            </View>
          </View>

          <View style={styles.serviceItem}>
            <View style={[styles.serviceIconBox, { backgroundColor: '#eff6ff' }]}>
              <Truck size={24} color="#2563eb" />
            </View>
            <View style={styles.serviceTextCol}>
              <Text style={styles.serviceTitle}>Kargo Darat (Reguler)</Text>
              <Text style={styles.serviceDesc}>
                Tarif hemat dan ekonomis untuk muatan besar antar kota dan pulau dengan jaringan luas.
              </Text>
            </View>
          </View>

          <View style={styles.serviceItem}>
            <View style={[styles.serviceIconBox, { backgroundColor: '#fff7ed' }]}>
              <Clock size={24} color="#ea580c" />
            </View>
            <View style={styles.serviceTextCol}>
              <Text style={styles.serviceTitle}>Door-to-Door Service</Text>
              <Text style={styles.serviceDesc}>
                Layanan jemput paket di tempat dan diantar langsung hingga ke alamat penerima.
              </Text>
            </View>
          </View>
        </View>

        {/* CALL TO ACTION WA */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={handleOpenWhatsApp}
          activeOpacity={0.9}
        >
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Butuh Penjemputan atau Info Kargo?</Text>
            <Text style={styles.ctaSubtitle}>
              Hubungi CS Andex Cargo via WhatsApp di {Config.HOTLINE_DISPLAY}
            </Text>
          </View>
          <View style={styles.ctaButton}>
            <MessageCircle size={18} color="#ffffff" />
            <Text style={styles.ctaButtonText}>Hubungi CS</Text>
          </View>
        </TouchableOpacity>

        {/* FOOTER TEXT */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>© 2026 {Config.COMPANY_NAME}. All rights reserved.</Text>
          <Text style={styles.footerSubtext}>Versi 1.0.0 • Mobile Client</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 16,
  },
  trackInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  trackInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    height: 46,
    borderRadius: 10,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  trackButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  menuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  menuItemDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  slideCard: {
    width: SLIDE_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slideImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e2e8f0',
  },
  slideInfo: {
    padding: 12,
  },
  slideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  slideDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.accent,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#cbd5e1',
  },
  defaultBannerCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  defaultBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  defaultBannerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    marginLeft: 6,
  },
  defaultBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  defaultBannerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  servicesContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 20,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceTextCol: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  ctaCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ctaContent: {
    flex: 1,
    marginRight: 12,
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  footerSubtext: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
