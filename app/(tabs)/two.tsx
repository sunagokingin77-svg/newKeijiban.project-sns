import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import dynamic from 'next/dynamic';

// Firebase
import { db, auth, storage } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 【重要】古い import MapComponent は削除済み
const MapComponent = dynamic(() => import('../MapComponent'), { 
  ssr: false,
  loading: () => <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 50}} />
});

const okinawaCenter: [number, number] = [26.48, 127.92];

export default function TabTwoScreen() {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<{lat: number, lng: number, name: string}[]>([]);

  const getPlaceName = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      return data.address.city || data.address.town || data.address.suburb || "指定地点";
    } catch { return "指定地点"; }
  };

  const handleMapClick = async (coords: [number, number]) => {
    const name = await getPlaceName(coords[0], coords[1]);
    setLocations([...locations, { lat: coords[0], lng: coords[1], name }]);
  };

  const handleSave = async () => {
    if (!text || locations.length === 0) return alert('解説と地点を入力してください');
    setLoading(true);
    try {
      let imageUrl = "";
      if (image) {
        const res = await fetch(image);
        const blob = await res.blob();
        const sRef = ref(storage, `posts/${Date.now()}`);
        await uploadBytes(sRef, blob);
        imageUrl = await getDownloadURL(sRef);
      }
      await addDoc(collection(db, 'posts'), {
        text, imageUrl,
        locations: locations.map(l => ({ lat: l.lat, lng: l.lng })),
        locationNames: locations.map(l => l.name),
        createdAt: serverTimestamp(),
        likes: 0
      });
      setText(''); setLocations([]); setImage(null);
      alert('巡礼ルートを公開しました！');
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  const pickImage = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5 });
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  return (
    <View style={styles.container}>
      <View style={styles.layout}>
        <ScrollView style={styles.formSection}>
          <Text style={styles.label}>📝 ルートの解説</Text>
          <TextInput 
            style={styles.input} 
            value={text} 
            onChangeText={setText} 
            multiline 
            placeholder="この聖地の見どころは？"
          />
          
          <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
            {image ? <Image source={{ uri: image }} style={{width:'100%', height:'100%', borderRadius: 8}} /> : (
              <View style={{alignItems:'center'}}>
                <FontAwesome name="camera" size={24} color="#ccc" />
                <Text style={{color:'#999', marginTop: 5}}>写真を追加</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>🚩 経由地点（地図をタップして追加）</Text>
          {locations.map((loc, i) => (
            <View key={i} style={styles.locItem}>
              <Text style={{fontSize:13}}>第{i+1}地点: {loc.name}</Text>
              <TouchableOpacity onPress={() => setLocations(locations.filter((_, idx) => idx !== i))}>
                <FontAwesome name="times-circle" size={18} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>投稿する</Text>}
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.mapSection}>
          <MapComponent 
            location={locations.map(l => [l.lat, l.lng])} 
            setLocation={handleMapClick} 
            okinawaCenter={okinawaCenter} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  layout: { flexDirection: 'row', flex: 1 },
  formSection: { flex: 1, padding: 20 },
  mapSection: { flex: 1.5 },
  label: { fontWeight: 'bold', marginTop: 20, marginBottom: 8, fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, height: 80, textAlignVertical: 'top' },
  imageBtn: { height: 120, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  locItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 8 },
  saveBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});