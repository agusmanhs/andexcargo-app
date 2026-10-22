import { Config } from '../constants/config';

export interface Slide {
  id: number;
  title: string;
  desc: string;
  image_url: string;
}

export interface TrackingTimeline {
  tanggal: string;
  status: string;
  keterangan: string;
  lokasi: string;
}

export interface TrackingData {
  resi: string;
  status: string;
  tanggal: string;
  pengirim: string;
  penerima: string;
  asal: string;
  tujuan: string;
  layanan: string;
  koli: number | string;
  berat: number | string;
  total_bayar: number;
  history: TrackingTimeline[];
}

export interface Kabupaten {
  id: number;
  kode_kabupaten: string;
  nama_kabupaten: string;
}

export interface Produk {
  id: number;
  nama_produk: string;
  jenis: string;
}

export interface Tarif {
  id: number;
  produk_id: string | number;
  from_kabupaten: string;
  to_kabupaten: string;
  harga: number;
  bagasi?: number;
  berat_min: number;
  harga_min: number;
  estimasi: string;
}

export interface Kantor {
  id: number;
  nama: string;
  alamat: string;
  telepon: string;
  kota: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${Config.API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Config.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const message = errorJson.message || `HTTP ${response.status}: Terjadi kesalahan server`;
      throw new Error(message);
    }

    const json = await response.json();
    return json;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Koneksi timeout. Periksa internet Anda.');
    }
    throw error;
  }
}

export const ApiService = {
  async getSlides(): Promise<Slide[]> {
    const res = await request<{ status: boolean; data: Slide[] }>('/slides');
    return res.data || [];
  },

  async trackResi(resi: string): Promise<TrackingData> {
    const cleanResi = encodeURIComponent(resi.trim());
    const res = await request<{ status: boolean; data: TrackingData; message?: string }>(`/track/${cleanResi}`);
    if (!res.status || !res.data) {
      throw new Error(res.message || 'Nomor resi tidak ditemukan.');
    }
    return res.data;
  },

  async getKabupaten(): Promise<Kabupaten[]> {
    const res = await request<{ status: boolean; data: Kabupaten[] }>('/get-kab');
    return res.data || [];
  },

  async getProduk(): Promise<Produk[]> {
    const res = await request<{ status: boolean; data: Produk[] }>('/get-produk');
    return res.data || [];
  },

  async getTarif(fromKab: string | number, toKab: string | number, produkId: number): Promise<Tarif | null> {
    const res = await request<{ status: boolean; data: Tarif | null; message?: string }>('/get-tarif', {
      method: 'POST',
      body: JSON.stringify({
        from_kab: fromKab,
        to_kab: toKab,
        produk_id: produkId,
      }),
    });
    return res.data;
  },

  async getKantor(): Promise<Kantor[]> {
    const res = await request<{ status: boolean; data: Kantor[] }>('/kantor');
    return res.data || [];
  },
};
